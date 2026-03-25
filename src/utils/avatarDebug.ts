/**
 * Always-on avatar/identity diagnostics.
 * Filter console for: `edumeet:identity`
 */
export const avatarDebug = (message: string, payload?: unknown): void => {
	// eslint-disable-next-line no-console
	console.log(`[edumeet:identity] ${message}`, payload ?? '');
};
