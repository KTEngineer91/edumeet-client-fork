const AVATAR_COLORS = [ '#0094FF', '#7C8DB5', '#00BFFF', '#FF8A00', '#FF4D6D', '#6C63FF' ];
const AVATAR_FG = '#ffffff';
const BREEZESHOT_API_BASE_URL = 'https://api.breezeshot.com';

export const getInitialLetter = (name?: string): string => {
	const value = (name ?? '').trim();

	if (!value) return '?';

	return value.charAt(0).toUpperCase();
};

export const makeLetterAvatarSrc = (letter: string): string => {
	const safeLetter = getInitialLetter(letter);
	const bg = AVATAR_COLORS[safeLetter.charCodeAt(0) % AVATAR_COLORS.length] ?? AVATAR_COLORS[0];

	// Inline SVG as a "picture" so we can use it anywhere an <img> src or CSS background-image is needed.
	const svg = `
		<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
			<circle cx="24" cy="24" r="24" fill="${bg}" />
			<text x="24" y="28" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="${AVATAR_FG}" dominant-baseline="middle">
				${safeLetter}
			</text>
		</svg>
	`.trim();

	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export const makeLetterAvatarSrcFromName = (name?: string): string => makeLetterAvatarSrc(getInitialLetter(name));

export const resolveBreezeshotAvatarUrl = (
	imageUrl?: string,
	baseUrl: string = BREEZESHOT_API_BASE_URL
): string => {
	const value = (imageUrl ?? '').trim();

	if (!value) return '';

	// Already absolute URL.
	if (value.startsWith('http://') || value.startsWith('https://')) return value;

	if (value.startsWith('/')) return `${baseUrl}${value}`;

	return `${baseUrl}/${value}`;
};
