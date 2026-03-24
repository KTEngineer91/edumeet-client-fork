/**
 * Peer identity / avatar diagnostics (plain console, not the `debug` package).
 * Uses console.log so messages show under default DevTools levels (not hidden as "Warnings").
 */
export const avatarDebug = (message: string, payload?: unknown): void => {
	// eslint-disable-next-line no-console
	console.log(`[edumeet:identity] ${message}`, payload ?? '');
};
