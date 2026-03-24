export interface CachedPeerProfile {
	displayName?: string;
	picture?: string;
}

const CACHE_PREFIX = 'edumeet:peerProfileCache:';
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours, temporary cache for active sessions.

interface CacheEnvelope {
	ts: number;
	peers: Record<string, CachedPeerProfile>;
}

const isMeaningfulName = (value?: string): boolean => {
	const name = (value ?? '').trim();

	if (!name) return false;
	if (name === '?') return false;
	if (/^guest(?:\s+user)?$/i.test(name)) return false;
	if (/^hello\d+$/i.test(name)) return false;

	return true;
};

const normalizeName = (value?: string): string | undefined => {
	const name = (value ?? '').trim();

	if (!isMeaningfulName(name)) return undefined;

	return name;
};

const getRoomCacheKey = (): string => {
	try {
		const url = new URL(window.location.href);
		const roomId = url.searchParams.get('roomId') || url.searchParams.get('room') || 'default';

		return `${CACHE_PREFIX}${roomId}`;
	} catch {
		return `${CACHE_PREFIX}default`;
	}
};

const readCache = (): Record<string, CachedPeerProfile> => {
	try {
		const raw = sessionStorage.getItem(getRoomCacheKey());

		if (!raw) return {};

		const parsed = JSON.parse(raw) as CacheEnvelope;

		if (!parsed?.ts || !parsed?.peers) return {};
		if (Date.now() - parsed.ts > CACHE_TTL_MS) {
			sessionStorage.removeItem(getRoomCacheKey());

			return {};
		}

		return parsed.peers;
	} catch {
		return {};
	}
};

const writeCache = (peers: Record<string, CachedPeerProfile>): void => {
	try {
		sessionStorage.setItem(getRoomCacheKey(), JSON.stringify({
			ts: Date.now(),
			peers
		}));
	} catch {
		// Ignore storage quota/availability errors.
	}
};

export const upsertCachedPeerProfile = (peerId: string, profile: CachedPeerProfile): void => {
	if (!peerId) return;

	const cache = readCache();
	const current = cache[peerId] ?? {};
	const nextName = normalizeName(profile.displayName) ?? current.displayName;
	const nextPicture = (profile.picture ?? '').trim() || current.picture;

	cache[peerId] = {
		displayName: nextName,
		picture: nextPicture
	};

	writeCache(cache);
};

export const hydratePeerProfile = (peerId: string, profile: CachedPeerProfile): CachedPeerProfile => {
	if (!peerId) return profile;

	const incomingName = normalizeName(profile.displayName);
	const incomingPicture = (profile.picture ?? '').trim() || undefined;
	const cache = readCache();
	const cached = cache[peerId];

	if (!cached) {
		return {
			displayName: incomingName,
			picture: incomingPicture
		};
	}

	return {
		displayName: incomingName || normalizeName(cached.displayName),
		picture: incomingPicture || cached.picture
	};
};

export const hydratePeerProfiles = <T extends { id: string; displayName?: string; picture?: string }>(peers: T[]): T[] =>
	peers.map((peer) => {
		const hydrated = hydratePeerProfile(peer.id, {
			displayName: peer.displayName,
			picture: peer.picture
		});

		return {
			...peer,
			displayName: hydrated.displayName,
			picture: hydrated.picture
		};
	});
