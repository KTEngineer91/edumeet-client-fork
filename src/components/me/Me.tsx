import React, { useEffect, useMemo, useState } from 'react';
import { useAppSelector, useIsActiveSpeaker } from '../../store/hooks';
import { isMobileSelector } from '../../store/selectors';
import DisplayName from '../displayname/DisplayName';
import UnmuteAlert from '../unmutealert/UnmuteAlert';
import VideoBox from '../videobox/VideoBox';
import VideoView from '../videoview/VideoView';
import Volume from '../volume/Volume';
import PeerStatsView from '../rtpquality/PeerStatsView';
import QualityIndicator from '../rtpquality/QualityIndicator';
import { getInitialLetter, makeLetterAvatarSrc } from '../../utils/avatarUtils';
import { resolveBreezeshotAvatarUrlFromConfig } from '../../utils/edumeetConfig';

interface MeProps {
	style: Record<'width' | 'height', number>
}

const Me = ({ style }: MeProps): React.JSX.Element => {
	const mirroredSelfView = useAppSelector((state) => state.settings.mirroredSelfView);
	const displayName = useAppSelector((state) => state.settings.displayName);
	const hideSelfView = useAppSelector((state) => state.settings.hideSelfView);
	const contain = useAppSelector((state) => state.settings.videoContainEnabled);
	const id = useAppSelector((state) => state.me.id);
	const picture = useAppSelector((state) => state.me.picture);
	const isActiveSpeaker = useIsActiveSpeaker(id);
	const isMobile = useAppSelector(isMobileSelector);
	const showStats = useAppSelector((state) => state.ui.showStats);
	const micEnabled = useAppSelector((state) => state.me.micEnabled);
	const webcamEnabled = useAppSelector((state) => state.me.webcamEnabled);

	const pictureUrl = resolveBreezeshotAvatarUrlFromConfig(picture);
	const initialLetter = getInitialLetter(displayName);
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
		img.onerror = () => setPictureLoaded(false);
		img.src = pictureUrl;
	}, [ picture, pictureUrl ]);

	const avatarSrc = pictureUrl && pictureLoaded ? pictureUrl : letterAvatarSrc;

	return (
		<>
			{ !hideSelfView && (
				<VideoBox
					activeSpeaker={isActiveSpeaker}
					order={1}
					width={style.width}
					height={style.height}
					avatarSrc={avatarSrc}
				>
					{ webcamEnabled && <VideoView mirrored={mirroredSelfView} contain={contain} source='webcam' /> }
					{ micEnabled && <Volume me={true} /> }
					{ micEnabled && !isMobile && <UnmuteAlert /> }

					<DisplayName disabled={false} displayName={displayName} isMe />
					{ !isMobile && showStats && <PeerStatsView /> }
					<QualityIndicator />

				</VideoBox>
			)}
		</>
	);
};

export default Me;
