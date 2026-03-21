import { resolveBreezeshotAvatarUrl } from './avatarUtils';
import { defaultEdumeetConfig, EdumeetConfig } from './types';

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

export function resolveBreezeshotAvatarUrlFromConfig(imageUrl?: string): string {
	return resolveBreezeshotAvatarUrl(imageUrl, edumeetConfig.breezeshotApiBaseUrl);
}

export default edumeetConfig;