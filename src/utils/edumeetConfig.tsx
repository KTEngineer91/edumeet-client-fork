import { resolveBreezeshotAvatarUrl } from './avatarUtils';
import { defaultEdumeetConfig, EdumeetConfig } from './types';
import { Logger } from './Logger';

declare module '@mui/material/styles' {
	interface Theme {
		backgroundImage?: string;
		background?: string;
		appBarColor: string;
		appBarFloating: boolean;
		logo: string;
		activeSpeakerBorder: string;
		videoBackroundColor: string;
		videoAvatarImage: string;
		roundedness: number;
		sideContentItemColor?: string;
		sideContentItemDarkColor?: string;
		sideContainerBackgroundColor?: string;
	}

	interface ThemeOptions {
		backgroundImage?: string;
		background?: string;
		appBarColor?: string;
		appBarFloating?: boolean;
		logo?: string;
		activeSpeakerBorder?: string;
		videoBackroundColor?: string;
		videoAvatarImage?: string;
		roundedness?: number;
		sideContentItemColor?: string;
		sideContentItemDarkColor?: string;
		sideContainerBackgroundColor?: string;
	}
}

declare global {
	interface Window {
		config?: Partial<EdumeetConfig>;
	}
}

const edumeetConfig = {
	...defaultEdumeetConfig,
	...window.config,
	theme: { ...defaultEdumeetConfig.theme, ...window.config?.theme }
};
const logger = new Logger('EdumeetConfig');

export function resolveBreezeshotAvatarUrlFromConfig(imageUrl?: string): string {
	const resolved = resolveBreezeshotAvatarUrl(imageUrl, edumeetConfig.breezeshotApiBaseUrl);

	if (
		resolved &&
		window.location.protocol === 'https:' &&
		resolved.startsWith('http://')
	) {
		logger.warn(
			'Avatar URL mixed-content risk [page:%s, avatar:%s, base:%s]',
			window.location.href,
			resolved,
			edumeetConfig.breezeshotApiBaseUrl
		);
	}

	return resolved;
}

export default edumeetConfig;