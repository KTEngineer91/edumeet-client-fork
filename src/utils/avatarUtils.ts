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
