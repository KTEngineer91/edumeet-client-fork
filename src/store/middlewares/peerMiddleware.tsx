import { Middleware } from '@reduxjs/toolkit';
import { signalingActions } from '../slices/signalingSlice';
import { AppDispatch, MiddlewareOptions, RootState } from '../store';
import { peersActions } from '../slices/peersSlice';
import { LobbyPeer, lobbyPeersActions } from '../slices/lobbyPeersSlice';
import { setDisplayName, setPicture, setRaisedHand } from '../actions/meActions';
import { stopMic, stopScreenSharing, stopWebcam } from '../actions/mediaActions';
import { roomSessionsActions } from '../slices/roomSessionsSlice';
import { p2pModeSelector } from '../selectors';
import { Logger } from '../../utils/Logger';
import { hydratePeerProfile, upsertCachedPeerProfile } from '../../utils/peerProfileCache';

const logger = new Logger('PeerMiddleware');

const createPeerMiddleware = ({
	signalingService,
	mediaService,
}: MiddlewareOptions): Middleware => {
	logger.debug('createPeerMiddleware()');

	const middleware: Middleware = ({
		getState,
		dispatch
	}: {
		getState: () => RootState;
		dispatch: AppDispatch,
	}) =>
		(next) => (action) => {
			if (signalingActions.connect.match(action)) {
				signalingService.on('notification', (notification) => {
					try {
						switch (notification.method) {
							case 'newPeer': {
								const {
									id,
									sessionId,
									displayName,
									picture,
									raisedHand,
									raisedHandTimestamp,
									recording,
								} = notification.data;
								const hydratedProfile = hydratePeerProfile(id, { displayName, picture });

								logger.warn(
									'newPeer notification [id:%s, rawName:%s, hydratedName:%s, hasPicture:%s]',
									id,
									displayName || '(empty)',
									hydratedProfile.displayName || '(empty)',
									Boolean(hydratedProfile.picture)
								);

								dispatch(peersActions.addPeer({
									id,
									sessionId,
									displayName: hydratedProfile.displayName,
									picture: hydratedProfile.picture,
									raisedHand,
									raisedHandTimestamp,
									recording,
									transcripts: [],
								}));
								upsertCachedPeerProfile(id, hydratedProfile);

								// Re-broadcast my current profile when someone joins so newcomers
								// receive up-to-date name/picture even if initial join payload is stale.
								const myPeerId = getState().me.id;
								const myDisplayName = (getState().settings.displayName ?? '').trim();
								const myPicture = (getState().me.picture ?? '').trim();

								if (id !== myPeerId) {
									if (myDisplayName) dispatch(setDisplayName(myDisplayName));
									if (myPicture) dispatch(setPicture(myPicture));
								}

								break;
							}

							case 'peerClosed': {
								const { peerId } = notification.data;

								dispatch(peersActions.removePeer({ id: peerId }));

								break;
							}

							case 'changeSessionId': {
								const { peerId, sessionId, oldSessionId } = notification.data;

								dispatch(peersActions.setPeerSessionId({ id: peerId, sessionId, oldSessionId }));

								break;
							}

							case 'changeDisplayName':
							case 'changePicture':
							case 'recording':
							case 'raisedHand': {
								const {
									peerId,
									displayName,
									picture,
									raisedHand,
									raisedHandTimestamp,
									recording,
								} = notification.data;
								const hydratedProfile = hydratePeerProfile(peerId, { displayName, picture });

								logger.warn(
									'%s notification [peerId:%s, rawName:%s, hydratedName:%s, hasPicture:%s]',
									notification.method,
									peerId,
									displayName || '(empty)',
									hydratedProfile.displayName || '(empty)',
									Boolean(hydratedProfile.picture)
								);

								dispatch(
									peersActions.updatePeer({
										id: peerId,
										displayName: hydratedProfile.displayName,
										picture: hydratedProfile.picture,
										raisedHand,
										raisedHandTimestamp,
										recording,
									})
								);
								upsertCachedPeerProfile(peerId, hydratedProfile);

								break;
							}

							case 'parkedPeer': {
								const { peerId } = notification.data;

								dispatch(lobbyPeersActions.addPeer({ id: peerId }));

								break;
							}

							case 'parkedPeers': {
								const { lobbyPeers } = notification.data;

								lobbyPeers?.forEach((peer: LobbyPeer) => {
									dispatch(lobbyPeersActions.addPeer({ ...peer }));
								});

								break;
							}

							case 'lobby:peerClosed': {
								const { peerId } = notification.data;

								dispatch(lobbyPeersActions.removePeer({ id: peerId }));

								break;
							}

							case 'lobby:promotedPeer': {
								const { peerId } = notification.data;

								dispatch(lobbyPeersActions.removePeer({ id: peerId }));

								break;
							}

							case 'lobby:changeDisplayName':
							case 'lobby:changePicture': {
								const { peerId, picture, displayName } = notification.data;

								dispatch(
									lobbyPeersActions.updatePeer({
										id: peerId,
										displayName,
										picture,
									}));
								
								break;
							}

							case 'moderator:lowerHand': {
								dispatch(setRaisedHand(false));

								break;
							}

							case 'moderator:mute': {
								dispatch(stopMic());
								
								break;
							}

							case 'moderator:stopVideo': {
								dispatch(stopWebcam());
								
								break;
							}

							case 'moderator:stopScreenSharing': {
								dispatch(stopScreenSharing());
								
								break;
							}
						}
					} catch (error) {
						logger.error('error on signalService "notification" event [error:%o]', error);
					}
				});
			}

			if (peersActions.addPeer.match(action)) {
				mediaService.addPeerId(action.payload.id);
			}

			if (peersActions.addPeers.match(action)) {
				action.payload.forEach((peer) => {
					mediaService.addPeerId(peer.id);
				});
			}

			if (peersActions.removePeer.match(action)) {
				mediaService.removePeerId(action.payload.id);
			}
			
			if (
				peersActions.addPeer.match(action) ||
				peersActions.addPeers.match(action) ||
				peersActions.removePeer.match(action) ||
				roomSessionsActions.addRoomSession.match(action) ||
				roomSessionsActions.removeRoomSession.match(action) ||
				roomSessionsActions.addRoomSessions.match(action)
			) {
				const oldP2pMode = p2pModeSelector(getState());

				next(action);

				const p2pMode = p2pModeSelector(getState());

				if (oldP2pMode !== p2pMode) {
					mediaService.setP2PMode(p2pMode);
				}

				return;
			}

			return next(action);
		};

	return middleware;
};

export default createPeerMiddleware;
