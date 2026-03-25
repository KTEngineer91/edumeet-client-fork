import { useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { fullscreenConsumerSelector } from '../../store/selectors';
import FullscreenVideoButton from '../controlbuttons/FullscreenVideoButton';
import MediaControls from '../mediacontrols/MediaControls';
import VideoBox from '../videobox/VideoBox';
import VideoView from '../videoview/VideoView';
import { getInitialLetter, makeLetterAvatarSrc } from '../../utils/avatarUtils';
import { resolveBreezeshotAvatarUrlFromConfig } from '../../utils/edumeetConfig';

const FullscreenVideo = (): JSX.Element => {
	const consumer = useAppSelector(fullscreenConsumerSelector);
	const peer = useAppSelector((state) => (consumer ? state.peers[consumer.peerId] : undefined));
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
			console.log('[edumeet:identity] avatar preload error (fullscreen)', {
				peerId: consumer?.peerId,
				pictureUrl,
			});
			setPictureLoaded(false);
		};
		img.src = pictureUrl;
	}, [ pictureUrl ]);

	const avatarSrc = pictureUrl && pictureLoaded ? pictureUrl : letterAvatarSrc;

	return (
		<>
			{ consumer && (
				<VideoBox
					position='absolute'
					roundedCorners={false}
					width={'100%'}
					height={'100%'}
					avatarSrc={avatarSrc}
				>
					<VideoView consumer={consumer} contain roundedCorners={false} />
					<MediaControls
						orientation='vertical'
						horizontalPlacement='right'
						verticalPlacement='center'
					>
						<FullscreenVideoButton consumerId={consumer.id} />
					</MediaControls>
				</VideoBox>
			)}
		</>
	);
};

export default FullscreenVideo;