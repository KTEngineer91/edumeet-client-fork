import edumeetConfig from './edumeetConfig';

/**
 * Function to create the url for the signaling server.
 * 
 * @param peerId - The id of this client.
 * @param roomId - The id of the room.
 * @param tenantId - The id of the tenant.
 * @param token - The token of the user.
 * @returns {string} The url of the signaling server.
 */
export const getSignalingUrl = (peerId: string, roomId: string, tenantId: string | undefined, token: string | undefined): string => {
	const websocketPath = (edumeetConfig as { websocketPath?: string }).websocketPath || '';

	let tenantParam = '';
	let tokenParam = '';

	if (tenantId) tenantParam = `&tenantId=${tenantId}`;
	if (token) tokenParam = `&token=${token}`;

	// Dev + Vite: connect to same origin (port 4443); vite.config proxy forwards /socket.io → room server :8443.
	// Production: use config host + port (room server URL).
	if (import.meta.env.DEV && typeof window !== 'undefined') {
		const override = (edumeetConfig as { signalingWebSocketScheme?: 'ws' | 'wss' }).signalingWebSocketScheme;

		const base =
			override === 'ws' || override === 'wss'
				? `${override}://${window.location.hostname}:${window.location.port || (window.location.protocol === 'https:' ? '443' : '80')}`
				: window.location.origin.replace(/^http/, 'ws');

		return `${base}${websocketPath}/?peerId=${peerId}&roomId=${roomId}${tenantParam}${tokenParam}`;
	}

	const hostname = edumeetConfig.serverHostname || window.location.hostname;
	const port = import.meta.env.PROD ? edumeetConfig.productionPort : edumeetConfig.developmentPort;
	const override = (edumeetConfig as { signalingWebSocketScheme?: 'ws' | 'wss' }).signalingWebSocketScheme;
	const scheme =
		override ?? (typeof window !== 'undefined' && window.location.protocol === 'http:' ? 'ws' : 'wss');

	return `${scheme}://${hostname}:${port}${websocketPath}/?peerId=${peerId}&roomId=${roomId}${tenantParam}${tokenParam}`;
};

export class SocketTimeoutError extends Error {
	constructor(message: string) {
		super(message);

		this.name = 'SocketTimeoutError';
		this.stack = (new Error(message)).stack;
	}
}
