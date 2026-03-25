import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { windowedConsumersSelector } from '../../store/selectors';
import VideoBox from '../videobox/VideoBox';
import VideoView from '../videoview/VideoView';
import SeparateWindow from '../separatewindow/SeparateWindow';
import { roomSessionsActions } from '../../store/slices/roomSessionsSlice';
import { useEffect, useMemo, useState } from 'react';
import { StateConsumer } from '../../store/slices/consumersSlice';
import { getInitialLetter, makeLetterAvatarSrc } from '../../utils/avatarUtils';
import { resolveBreezeshotAvatarUrlFromConfig } from '../../utils/edumeetConfig';

interface WindowedConsumerVideoProps {
	consumer: StateConsumer;
}

const WindowedConsumerVideo = ({ consumer }: WindowedConsumerVideoProps): JSX.Element => {
	const contain = useAppSelector((state) => state.settings.videoContainEnabled);
	const peer = useAppSelector((state) => state.peers[consumer.peerId]);
	const pictureUrl = resolveBreezeshotAvatarUrlFromConfig(peer?.picture);
	const initialLetter = getInitialLetter(peer?.displayName || peer?.id);
	const letterAvatarSrc = useMemo(() => makeLetterAvatarSrc(initialLetter), [ initialLetter ]);
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
			console.log('[edumeet:identity] avatar preload error (windowed)', {
				peerId: consumer.peerId,
				pictureUrl,
			});
			setPictureLoaded(false);
		};
		img.src = pictureUrl;
	}, [ pictureUrl ]);

	const avatarSrc = pictureUrl && pictureLoaded ? pictureUrl : letterAvatarSrc;

	return (
		<VideoBox
			roundedCorners={false}
			avatarSrc={avatarSrc}
			sx={{
				display: 'flex',
				width: '100%',
				height: '100%'
			}}
		>
			<VideoView consumer={consumer} contain={contain} roundedCorners={false} />
		</VideoBox>
	);
};

const WindowedVideo = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const sessionId = useAppSelector((state) => state.me.sessionId);
	const consumers = useAppSelector(windowedConsumersSelector);
	const aspectRatio = useAppSelector((state) => state.settings.aspectRatio);

	const [ consumersToRender, setConsumersToRender ] = useState<StateConsumer[]>(consumers);

	useEffect(() => {
		setTimeout(() => setConsumersToRender(consumers), 0);
	}, [ consumers ]);

	return (
		<>
			{ consumersToRender.map((consumer) => (
				<SeparateWindow
					key={consumer.id}
					onClose={() => dispatch(roomSessionsActions.removeWindowedConsumer({ sessionId, consumerId: consumer.id }))}
					aspectRatio={aspectRatio}
				>
					<WindowedConsumerVideo consumer={consumer} />
				</SeparateWindow>
			))}
		</>
	);
};

export default WindowedVideo;