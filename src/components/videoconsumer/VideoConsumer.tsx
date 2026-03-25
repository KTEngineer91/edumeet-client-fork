import {
	useAppSelector,
	usePeer,
	usePeerConsumers
} from '../../store/hooks';
import { useEffect, useMemo, useState } from 'react';
import { activeSpeakerIdSelector, isMobileSelector } from '../../store/selectors';
import { StateConsumer } from '../../store/slices/consumersSlice';
import FullscreenVideoButton from '../controlbuttons/FullscreenVideoButton';
import WindowedVideoButton from '../controlbuttons/WindowedVideoButton';
import DisplayName from '../displayname/DisplayName';
import MediaControls from '../mediacontrols/MediaControls';
import PeerStatsView from '../rtpquality/PeerStatsView';
import QualityIndicator from '../rtpquality/QualityIndicator';
import VideoBox from '../videobox/VideoBox';
import VideoView from '../videoview/VideoView';
import Volume from '../volume/Volume';
import { getInitialLetter, makeLetterAvatarSrc } from '../../utils/avatarUtils';
import { resolveBreezeshotAvatarUrlFromConfig } from '../../utils/edumeetConfig';

interface VideoConsumerProps {
	consumer: StateConsumer;
	style: Record<'width' | 'height', number>
}

const VideoConsumer = ({ consumer, style }: VideoConsumerProps): JSX.Element => {
	const { peerId, source } = consumer;
	const { micConsumer } = usePeerConsumers(peerId);
	const peer = usePeer(peerId);
	const contain = source === 'screen';

	const isMobile = useAppSelector(isMobileSelector);
	const activeSpeaker = useAppSelector(activeSpeakerIdSelector) === peerId;
	const headless = useAppSelector((state) => state.room.headless);
	const showStats = useAppSelector((state) => state.ui.showStats);

	const pictureUrl = resolveBreezeshotAvatarUrlFromConfig(peer?.picture);
	const initialLetter = getInitialLetter(peer?.displayName || peer?.id);
	const letterAvatarSrc = useMemo(() => makeLetterAvatarSrc(initialLetter), [ initialLetter ]);

	const [ pictureLoaded, setPictureLoaded ] = useState(false);

	useEffect(() => {
		if (!pictureUrl) {
			setPictureLoaded(false);
			
return;
		}

		// Preload to fall back if the image URL is unreachable from this client/server.
		setPictureLoaded(false);
		const img = new Image();

		img.onload = () => setPictureLoaded(true);
		img.onerror = () => {
			// eslint-disable-next-line no-console
			console.log('[edumeet:identity] avatar preload error', {
				peerId,
				pictureUrl,
			});
			setPictureLoaded(false);
		};
		img.src = pictureUrl;
	}, [ pictureUrl ]);

	const avatarSrc = pictureUrl && pictureLoaded ? pictureUrl : letterAvatarSrc;

	return (
		<VideoBox
			activeSpeaker={activeSpeaker}
			order={1}
			width={style.width}
			height={style.height}
			avatarSrc={avatarSrc}
		>
			<VideoView consumer={consumer} contain={contain} />
			{ micConsumer && <Volume consumer={micConsumer} /> }
			{ !headless &&
				<>
					<DisplayName displayName={peer?.displayName} peerId={peerId} />
					<MediaControls
						orientation='horizontal'
						horizontalPlacement='center'
						verticalPlacement='center'
					>
						<FullscreenVideoButton consumerId={consumer.id} toolTipLocation='bottom' />
						{ !isMobile && <WindowedVideoButton consumerId={consumer.id} toolTipLocation='bottom' /> }
					</MediaControls>
					{ !isMobile && showStats && <PeerStatsView consumerId={consumer.id} /> }
					<QualityIndicator />
				</>
			}
		</VideoBox>
	);
};

export default VideoConsumer;
