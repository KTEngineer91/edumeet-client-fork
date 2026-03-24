// Keep styling aligned with BreezeShot's default initials avatar:
// - backgroundColor: theme.palette.customColors.avatarBg (light mode: #DBDADE)
// - color: theme.palette.text.secondary (rgba(mainColor, 0.68), mainColor = 47,43,61)
const AVATAR_BG = '#DBDADE';
// Use a solid hex in SVG text fill for reliable rendering across browsers.
const AVATAR_FG = '#5F5B6B';
const BREEZESHOT_API_BASE_URL = 'https://api.breezeshot.com';

export const getInitialLetter = (name?: string): string => {
	const value = (name ?? '').trim();

	if (!value) return '?';

	return value.charAt(0).toUpperCase();
};

export const makeLetterAvatarSrc = (letter: string): string => {
	const safeLetter = getInitialLetter(letter);
	const circleRadius = 20; // keep smaller than full canvas, but clearly visible
	const fontSize = 20;

	// Inline SVG as a "picture" so we can use it anywhere an <img> src or CSS background-image is needed.
	const svg = `
		<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
			<circle cx="24" cy="24" r="${circleRadius}" fill="${AVATAR_BG}" />
			<text x="24" y="24" text-anchor="middle" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="${AVATAR_FG}" dominant-baseline="central">
				${safeLetter}
			</text>
		</svg>
	`.trim();

	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export const makeLetterAvatarSrcFromName = (name?: string): string => makeLetterAvatarSrc(getInitialLetter(name));

/** Encode each path segment (handles spaces/special chars in filenames like BreezeShot uploads). */
const encodeUrlPathSegments = (pathname: string): string =>
	pathname
		.split('/')
		.map((seg) => (seg ? encodeURIComponent(seg) : ''))
		.join('/');

export const resolveBreezeshotAvatarUrl = (
	imageUrl?: string,
	baseUrl: string = BREEZESHOT_API_BASE_URL
): string => {
	const value = (imageUrl ?? '').trim();

	if (!value) return '';

	let resolved: string;

	if (value.startsWith('http://') || value.startsWith('https://')) {
		try {
			const u = new URL(value);

			u.pathname = encodeUrlPathSegments(u.pathname);
			resolved = u.toString();
		} catch {
			resolved = encodeURI(value);
		}
	} else {
		const path = value.startsWith('/') ? value : `/${value}`;

		resolved = `${baseUrl.replace(/\/+$/, '')}${encodeUrlPathSegments(path)}`;
	}

	return resolved;
};

/**
 * BreezeShot `User` exposes profile image as `imageUrl` (users.model.ts).
 * validate-token / validate-edumeet-room return that user object as `user`.
 */
export const getBreezeshotUserProfilePicture = (user: unknown): string => {
	if (!user || typeof user !== 'object') return '';

	const u = user as Record<string, unknown>;

	const primary = u.imageUrl;

	if (typeof primary === 'string' && primary.trim()) return primary.trim();

	for (const c of [ u.imageURL, u.image_url, u.picture, u.avatarUrl, u.avatar, u.profileImageUrl ]) {
		if (typeof c === 'string' && c.trim()) return c.trim();
	}

	return '';
};

/**
 * Extract the best available display name from BreezeShot user payloads.
 */
export const getBreezeshotUserDisplayName = (user: unknown): string => {
	if (!user || typeof user !== 'object') return '';

	const u = user as Record<string, unknown>;
	const isPlaceholder = (value?: string): boolean => {
		const name = (value ?? '').trim();

		if (!name) return true;
		if (/^hello\d+$/i.test(name)) return true;
		if (/^guest(?:\s+user)?$/i.test(name)) return true;

		return false;
	};
	const firstString = (...values: unknown[]): string =>
		values.find((value) => typeof value === 'string' && value.trim()) as string || '';
	const nested = [
		u.user,
		u.profile,
		u.attributes,
		u.data,
		typeof u.userData === 'object' ? u.userData : undefined
	].filter((value): value is Record<string, unknown> => Boolean(value && typeof value === 'object'));

	const directPreferred = firstString(
		u.displayName,
		u.display_name,
		u.name,
		u.fullName,
		u.full_name,
		u.firstName,
		u.first_name
	);

	if (directPreferred && !isPlaceholder(directPreferred)) return directPreferred.trim();

	for (const n of nested) {
		const nestedPreferred = firstString(
			n.displayName,
			n.display_name,
			n.name,
			n.fullName,
			n.full_name,
			n.firstName,
			n.first_name
		);

		if (nestedPreferred && !isPlaceholder(nestedPreferred)) return nestedPreferred.trim();
	}

	const first = firstString(u.firstName, u.first_name);
	const last = firstString(u.lastName, u.last_name);
	const combined = `${first.trim()} ${last.trim()}`.trim();

	if (combined) return combined;

	for (const n of nested) {
		const nestedFirst = firstString(n.firstName, n.first_name);
		const nestedLast = firstString(n.lastName, n.last_name);
		const nestedCombined = `${nestedFirst.trim()} ${nestedLast.trim()}`.trim();

		if (nestedCombined) return nestedCombined;
	}

	const directUsername = firstString(u.username, u.userName);

	if (directUsername && !isPlaceholder(directUsername)) return directUsername.trim();

	for (const n of nested) {
		const nestedUsername = firstString(n.username, n.userName);

		if (nestedUsername && !isPlaceholder(nestedUsername)) return nestedUsername.trim();
	}

	return '';
};
