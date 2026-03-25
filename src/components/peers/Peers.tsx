import { Chip, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import {
	useAppDispatch,
	useAppSelector,
} from '../../store/hooks';
import { activeSpeakerIsAudioOnlySelector, audioOnlySessionPeersSelector } from '../../store/selectors';
import VideoBox from '../videobox/VideoBox';
import { uiActions } from '../../store/slices/uiSlice';
import { getInitialLetter, makeLetterAvatarSrc } from '../../utils/avatarUtils';
import { resolveBreezeshotAvatarUrlFromConfig } from '../../utils/edumeetConfig';
import { useEffect, useState } from 'react';

const StyledPeers = styled(Chip)(() => ({
	// Keep audio-only aggregated name styling aligned with `DisplayName`
	// (bottom-left overlay).
	position: 'absolute',
	left: '8px',
	bottom: '8px',
	width: 'auto',
	maxWidth: 'calc(100% - 16px)',
	transform: 'none',
	textAlign: 'left',
	color: 'white',
	'& .MuiChip-label': {
		display: 'block',
		whiteSpace: 'normal',
		textAlign: 'left',
	},
}));

interface PeersProps {
	style: Record<'width' | 'height', number>
}

const Peers = ({ style }: PeersProps): JSX.Element => {
	const dispatch = useAppDispatch();
	const participantListOpen = useAppSelector((state) => state.ui.participantListOpen);
	const openUsersTab = () => dispatch(uiActions.setUi({ participantListOpen: !participantListOpen }));
	const hideNonVideo = useAppSelector((state) => state.settings.hideNonVideo);
	const activeSpeaker = useAppSelector(activeSpeakerIsAudioOnlySelector);
	const headless = useAppSelector((state) => state.room.headless);
	const audioOnlyPeers = useAppSelector(audioOnlySessionPeersSelector);

	const visiblePeerNames = audioOnlyPeers.slice(0, 3);
	const rest = audioOnlyPeers.slice(3);
	const avatarSeed = visiblePeerNames[0]?.displayName || visiblePeerNames[0]?.id || 'Guest';
	const letterAvatarSrc = makeLetterAvatarSrc(getInitialLetter(avatarSeed));

	// Use actual peer picture for the aggregated "audio-only" tile (first peer wins).
	// This ensures we don't fall back to silhouette/letters when a peer has a picture.
	const primaryAudioPeer = audioOnlyPeers[0];
	const pictureUrl = resolveBreezeshotAvatarUrlFromConfig(primaryAudioPeer?.picture);
	const [ pictureLoaded, setPictureLoaded ] = useState(false);

	useEffect(() => {
		if (!pictureUrl) {
			setPictureLoaded(false);
			
			return;
		}

		setPictureLoaded(false);
		const img = new Image();

		img.onload = () => setPictureLoaded(true);
		img.onerror = () => {
			// eslint-disable-next-line no-console
			console.log('[edumeet:identity] audio-only avatar preload error', {
				pictureUrl,
				primaryPeerId: primaryAudioPeer?.id,
			});
			setPictureLoaded(false);
		};

		img.src = pictureUrl;
	}, [ pictureUrl, primaryAudioPeer?.id ]);

	const avatarSrc = pictureUrl && pictureLoaded ? pictureUrl : letterAvatarSrc;

	const combinedPeerName = visiblePeerNames.map((peer) => {
		let displayName = peer.displayName || peer.id;

		if (displayName.length > 10) displayName = `${displayName.substring(0, 10)}...`;

		return displayName;
	}).join(', ');

	return (
		<>
			{ !hideNonVideo && !headless && audioOnlyPeers.length > 0 &&
				<VideoBox
					activeSpeaker={activeSpeaker}
					order={10}
					width={style.width}
					height={style.height}
					avatarSrc={avatarSrc}
				>
					<StyledPeers label={
						<>
							<Typography>
								{ combinedPeerName }
							</Typography>
							<Typography>
								{ rest.length > 0 && `and ${rest.length} more` }
							</Typography>
						</>
					} variant='filled' onClick={ () => openUsersTab() } />
				</VideoBox>
			}
		</>
	);
};

export default Peers;
