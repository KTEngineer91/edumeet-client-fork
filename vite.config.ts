import { defineConfig, /* splitVendorChunkPlugin */ } from 'vite';
import react from '@vitejs/plugin-react';
import eslint from 'vite-plugin-eslint';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { visualizer } from "rollup-plugin-visualizer";

// basicSsl: https://localhost:4443 works locally (accept browser warning once).
// Proxy forwards /socket.io to the room server on plain HTTP:8443 so the browser never opens wss://localhost:8443 (avoids room-server TLS issues).
// Set VITE_DEV_HTTP=1 for http://localhost:4443 + ws proxy instead (no basicSsl).
const devHttp = process.env.VITE_DEV_HTTP === '1';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react({ babel: { parserOpts: {} } }),
		eslint(),
		viteTsconfigPaths(),
		...(devHttp ? [] : [basicSsl()]),
/* 		splitVendorChunkPlugin(),
 */		visualizer({
			emitFile: false,
			filename: "stats.html",
		})

	],
	server: {
		https: !devHttp,
		port: 4443,
		host: true,
		hmr: {
			path: '/vite/'
		},
		proxy: {
			'/socket.io': {
				target: 'http://127.0.0.1:8443',
				changeOrigin: true,
				ws: true,
			},
		},
	},
	resolve: {
		alias: {
			'webtorrent': 'webtorrent/dist/webtorrent.min.js',
		},
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks(id: string) {
					if (
						id.includes('ortc-p2p')
					) {
						return '@ortc-p2p';
					}
					if (
						id.includes('material-react-table/dist/index.esm.js')
					) {
						return 'material-react-table/dist/index.esm.js';
					}
					if (
						id.includes('x-date-pickers')
					) {
						return 'x-date-pickers';
					}
					if (
						id.includes('@mui')
					) {
						return '@mui';
					}

				},
			},
		},
		outDir: 'build',
	},
});
