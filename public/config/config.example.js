/**
 * Edumeet App Configuration
 *
 * The configuration documentation is available also:
 * - in the app/README.md file in the source tree
 */

// eslint-disable-next-line
var config = {
	// If enabled QR code will show at the join dialog
	qrCodeEnabled: false,
	// If enabled countdownTimer will be enabled in the room.
	countdownTimerEnabled: false,
	// If enabled a Tooltip will show at the landing page and join dialog bottom
	infoTooltipEnabled: false,
	infoTooltipText: 'Tooltip text',
	infoTooltipLink: '',
	infoTooltipDesc: 'Tooltip desc ... Lorem ipsum',
	// Location of management service.
	managementUrl: 'http://localhost:3030',
	// Base URL for BreezeShot profile images when `imageUrl` is a relative path (`/uploads/...`).
	// Use your local BreezeShot API (e.g. http://localhost:3002) when uploads are not on production.
	breezeshotApiBaseUrl: 'http://localhost:3002',
	// Location of the privacy files.
	imprintUrl: '',
	privacyUrl: '',

	loginImageURL: '',
	// If ability to log in is enabled.
	loginEnabled: true,

	// The development server listening port.
	developmentPort: 8443,

	// The production server listening port.
	productionPort: 443,

	// If the server component runs on a different host than the app you can specify the host name.
	serverHostname: '',

	// Join dialog defaults to ask for media, this can be disabled by setting this to false.
	askForMediaOnJoin: true,

	// Don't show the participant tile if the user has no video
	hideNonVideo: false,

	// The default video camera capture resolution.
	resolution: 'medium',

	// The default video camera capture framerate.
	frameRate: 30,

	// The default screen sharing resolution.
	screenSharingResolution: 'veryhigh',

	// The default screen sharing framerate.
	screenSharingFrameRate: 5,

	// Video aspect ratio.
	aspectRatio: 1.778,

	// Enable or disable simulcast for webcam video.
	simulcast: true,

	// Enable or disable simulcast for screen sharing video.
	simulcastSharing: false,

	// Auto gain control enabled.
	autoGainControl: true,

	// Echo cancellation enabled.
	echoCancellation: true,

	// Noise suppression enabled.
	noiseSuppression: true,

	// The audio sample rate.
	sampleRate: 48000,

	// The audio channels count.
	channelCount: 1,

	// The audio sample size count.
	sampleSize: 16,

	// If OPUS FEC stereo be enabled.
	opusStereo: false,

	// If OPUS DTX should be enabled.
	opusDtx: true,

	// If OPUS FEC should be enabled.
	opusFec: true,

	// The OPUS packet time.
	opusPtime: 20,

	// The OPUS playback rate.
	opusMaxPlaybackRate: 48000,

	// The audio preset
	audioPreset: 'conference',

	// The audio presets.
	audioPresets: {
		'conference': {
			'name': 'Conference audio',
			'autoGainControl': true,
			'echoCancellation': true,
			'noiseSuppression': true,
			'sampleRate': 48000,
			'channelCount': 1,
			'sampleSize': 16,
			'opusStereo': false,
			'opusDtx': true,
			'opusFec': true,
			'opusPtime': 20,
			'opusMaxPlaybackRate': 48000
		},
		'hifi': {
			'name': 'HiFi streaming',
			'autoGainControl': false,
			'echoCancellation': false,
			'noiseSuppression': false,
			'sampleRate': 48000,
			'channelCount': 2,
			'sampleSize': 16,
			'opusStereo': true,
			'opusDtx': false,
			'opusFec': true,
			'opusPtime': 60,
			'opusMaxPlaybackRate': 48000
		}
	},

	// If true, the media control buttons will be shown in separate control bar, not in the ME container.
	buttonControlBar: true,

	// It sets the notifications sounds.
	// Valid keys are: 'parkedPeer', 'parkedPeers', 'raisedHand', 
	// 'chatMessage', 'sendFile', 'newPeer' and 'default'.
	// Not defining a key is equivalent to using the default notification sound.
	// Setting 'play' to null disables the sound notification.
	notificationSounds: {
		'chatMessage': {
			'play': '/sounds/notify-chat.mp3'
		},
		'raisedHand': {
			'play': '/sounds/notify-hand.mp3'
		},
		'finishedCountdownTimer': {
			'play': '/sounds/notify-countdowntimer.mp3'
		},
		'default': {
			'debounce': 5000,
			'play': '/sounds/notify.mp3'
		}
	},

	// The title to show if the logo is not specified.
	title: 'edumeet',

	// If true, a random room name will be generated when the input field is blank;
	// otherwise, it will remain empty and users will have to enter a room name.
	randomizeOnBlank: true,

	// Enable or disable transcription.
	transcriptionEnabled: true,

	// Imprint. If you want to link your imprint, please provide a URL in this variable. If it is empty, no link will be shown.
	imprintUrl: '',

	// Privacy notice. If you want to link your privacy notices, please provide a URL in this variable. If it is empty, no link will be shown.
	privacyUrl: '',

	// Optional: override only what you need. If you omit `theme`, defaults from src/utils/types.tsx apply (fork branding).
	// theme: { logo: '/images/pages/Logo.png', appBarColor: '#313131', ... },

	reduxLoggingEnabled: false
};
