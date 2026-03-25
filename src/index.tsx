import React, { useEffect, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Route, createBrowserRouter, createRoutesFromElements, RouterProvider } from 'react-router-dom';
import { RawIntlProvider } from 'react-intl';
import './index.css';
import debug from 'debug';
import { persistor, store, mediaService, fileService, ServiceContext } from './store/store';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { supportedBrowsers, deviceInfo, browserInfo } from './utils/deviceInfo';
import edumeetConfig from './utils/edumeetConfig';
import { intl } from './utils/intlManager';
import { useAppDispatch } from './store/hooks';
import { setLocale } from './store/actions/localeActions';
import { CssBaseline } from '@mui/material';
import { Logger } from './utils/Logger';

const ErrorBoundary = lazy(() => import('./views/errorboundary/ErrorBoundary'));
const App = lazy(() => import('./App'));
// const LandingPage = lazy(() => import('./views/landingpage/LandingPage'));
const UnsupportedBrowser = lazy(() => import('./views/unsupported/UnsupportedBrowser'));

// `Logger` uses the `debug` package; it is otherwise silent in production.
// Enable our app namespaces everywhere so identity/avatar issues produce logs.
if (import.meta.env.VITE_APP_DEBUG === '*') {
	debug.enable('*');
} else {
	debug.enable('edumeet-client:*');
}

// eslint-disable-next-line no-console
console.log('[edumeet] Client started — filter console by: edumeet  or  edumeet:identity');

// Helpful even if the console is filtered/hidden: lets us verify the bundle is running.
// eslint-disable-next-line no-console
try {
	(window as Window & { __edumeetIdentityStarted?: number }).__edumeetIdentityStarted = Date.now();
} catch {
	// ignore
}

try {
	document.documentElement.setAttribute('data-edumeet-identity-started', '1');
} catch {
	// ignore
}
const logger = new Logger('index.tsx');
const theme = createTheme(edumeetConfig.theme);
const device = deviceInfo();
const unsupportedBrowser = !browserInfo.satisfies(supportedBrowsers);
const webrtcUnavailable = !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.RTCPeerConnection;

// Detect the base url we are hosted on
const basename = window.location.pathname.split('/')
	.slice(0, -1)
	.join('/');

logger.debug('Starting app [baseUrl:%s]', basename);

const router = createBrowserRouter(
	createRoutesFromElements(
		<>
			{/* <Route path='/' element={<Suspense><LandingPage /></Suspense>} errorElement={<Suspense><ErrorBoundary /></Suspense>} /> */}
			<Route path='/' element={<Suspense><App /></Suspense>} errorElement={<Suspense><ErrorBoundary /></Suspense>} />
		</>
	), { basename }
);

/**
 * Return either the app or the unsupported browser page
 * based on feature detection.
 * 
 * @returns {JSX.Element} Either the app or the unsupported browser page
 */
const RootComponent = (): React.JSX.Element => {
	const dispatch = useAppDispatch();

	useEffect(() => {
		dispatch(setLocale());
	}, []);

	if (unsupportedBrowser || webrtcUnavailable) {
		logger.error('Your browser is not supported [deviceInfo:%o]', device);

		return (<Suspense><UnsupportedBrowser platform={device.platform} webrtcUnavailable /></Suspense>);
	} else {
		return (<RouterProvider router={router} />);
	}
};

const container = document.getElementById('edumeet');
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(container!);

root.render(
	<>
		<CssBaseline />
		<Provider store={store}>
			<PersistGate persistor={persistor}>
				<ThemeProvider theme={theme}>
					<RawIntlProvider value={intl}>
						<ServiceContext.Provider value={{ mediaService, fileService }}>
							<RootComponent />
						</ServiceContext.Provider>
					</RawIntlProvider>
				</ThemeProvider>
			</PersistGate>
		</Provider>
	</>
);
