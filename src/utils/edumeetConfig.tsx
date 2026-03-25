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

const logger = new Logger('EdumeetConfig');
const loggedResolvedAvatarUrls = new Set<string>();

const edumeetConfig: EdumeetConfig = {
	...defaultEdumeetConfig,
	...window.config,
	theme: { ...defaultEdumeetConfig.theme, ...window.config?.theme }
} as EdumeetConfig;

export function resolveBreezeshotAvatarUrlFromConfig(imageUrl?: string): string {
	const baseUrl = (edumeetConfig as { breezeshotApiBaseUrl?: string }).breezeshotApiBaseUrl;
	const resolved = resolveBreezeshotAvatarUrl(imageUrl, baseUrl);

	// Diagnostics for broken avatars (wrong base URL, missing path, mixed-content, etc.)
	// Logged once per distinct incoming `imageUrl` to avoid console spam.
	const normalizedInput = (imageUrl ?? '').trim();

	if (
		normalizedInput &&
		normalizedInput.startsWith('/uploads/') &&
		!loggedResolvedAvatarUrls.has(normalizedInput)
	) {
		loggedResolvedAvatarUrls.add(normalizedInput);
		// eslint-disable-next-line no-console
		console.log('[edumeet:identity] resolve avatar url', {
			input: normalizedInput,
			baseUrl,
			resolved,
			pageProtocol: window.location.protocol,
		});
	}

	if (resolved && window.location.protocol === 'https:' && resolved.startsWith('http://')) {
		// If the page is HTTPS and the avatar URL is HTTP, browsers block it (mixed-content),
		// which makes avatars appear "missing". Safely upgrade remote BreezeShot URLs to HTTPS,
		// but do NOT touch localhost/127.0.0.1 (local dev might still be served over plain HTTP).
		const isLocalHttp =
			/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(resolved) ||
			/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(resolved);

		logger.warn(
			'Avatar URL mixed-content risk [page:%s, avatar:%s, isLocalHttp:%s, base:%s]',
			window.location.href,
			resolved,
			isLocalHttp,
			baseUrl
		);

		// Ensure we still see this warning even if `debug` namespaces are disabled.
		// eslint-disable-next-line no-console
		console.warn('[edumeet:identity] mixed-content avatar URL', {
			page: window.location.href,
			avatar: resolved,
			isLocalHttp,
		});

		if (!isLocalHttp) return resolved.replace(/^http:\/\//i, 'https://');
	}

	return resolved;
}

export default edumeetConfig;
