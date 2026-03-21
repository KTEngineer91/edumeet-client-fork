#!/usr/bin/env bash
#
# Start all four Edumeet forks for local development (management, media node,
# room server, client). Repos are expected as sibling directories under EDUMEET_BASE
# (default: two levels up from this script → the `edumeet` folder).
#
# Prerequisites:
#   - PostgreSQL running and migrated (yarn migrate in management server)
#   - Room server config/config.json: mediaNodes match MEDIA_SECRET, hostname, port
#   - Client: public/config/config.js from config.example.js; local dev often uses
#     ws/http in signaling code per project docs
#
# Environment (optional):
#   EDUMEET_BASE          Root folder containing *-fork repos (default: auto)
#   PUBLIC_IP             Announced IP for media node (default: primary LAN IP or 127.0.0.1)
#   MEDIA_SECRET          Shared secret; must match room config and media node (default: supersecret)
#   MANAGEMENT_USERNAME   Management API login email (default: edumeet-admin@localhost)
#   MANAGEMENT_PASSWORD     Management API password (default: supersecret)
#   SKIP_FREE_PORTS=1     Do not kill processes listening on 3030, 3000, 8443, 4443 before start
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_BASE="$(cd "${SCRIPT_DIR}/../.." && pwd)"
EDUMEET_BASE="${EDUMEET_BASE:-$DEFAULT_BASE}"

ROOM_SERVER="${EDUMEET_ROOM_SERVER:-${EDUMEET_BASE}/edumeet-room-server-fork}"
MEDIA_NODE="${EDUMEET_MEDIA_NODE:-${EDUMEET_BASE}/edumeet-media-node-fork}"
MANAGEMENT_SERVER="${EDUMEET_MANAGEMENT_SERVER:-${EDUMEET_BASE}/edumeet-management-server-fork}"
CLIENT="${EDUMEET_CLIENT:-${EDUMEET_BASE}/edumeet-client-fork}"

if [[ -z "${PUBLIC_IP:-}" ]]; then
	PUBLIC_IP="$(ipconfig getifaddr en0 2>/dev/null || true)"
	if [[ -z "${PUBLIC_IP}" ]]; then
		PUBLIC_IP="$(ipconfig getifaddr en1 2>/dev/null || true)"
	fi
	if [[ -z "${PUBLIC_IP}" ]]; then
		PUBLIC_IP="127.0.0.1"
	fi
fi

MEDIA_SECRET="${MEDIA_SECRET:-supersecret}"
MANAGEMENT_USERNAME="${MANAGEMENT_USERNAME:-edumeet-admin@localhost}"
MANAGEMENT_PASSWORD="${MANAGEMENT_PASSWORD:-supersecret}"

require_dir() {
	local name="$1" path="$2"
	if [[ ! -d "${path}" ]]; then
		echo "Missing ${name} directory: ${path}" >&2
		echo "Set EDUMEET_BASE or EDUMEET_*_SERVER / EDUMEET_CLIENT to your clone paths." >&2
		exit 1
	fi
}

require_dir "Room server" "${ROOM_SERVER}"
require_dir "Media node" "${MEDIA_NODE}"
require_dir "Management server" "${MANAGEMENT_SERVER}"
require_dir "Client" "${CLIENT}"

free_port_listeners() {
	local port="$1"
	local label="$2"
	local busy
	busy="$(lsof -ti ":${port}" -sTCP:LISTEN 2>/dev/null || true)"
	if [[ -z "${busy}" ]]; then
		return 0
	fi
	echo "Port ${port} (${label}) in use — stopping listener PID(s): $(echo "${busy}" | xargs)"
	lsof -i ":${port}" -sTCP:LISTEN -n -P 2>/dev/null || true
	kill $(echo "${busy}" | xargs) 2>/dev/null || true
}

free_edumeet_ports() {
	if [[ "${SKIP_FREE_PORTS:-}" == "1" ]]; then
		echo "SKIP_FREE_PORTS=1 — not freeing ports 3030, 3000, 8443, 4443."
		return 0
	fi
	if ! command -v lsof >/dev/null 2>&1; then
		echo "lsof not found; cannot free ports. Install Xcode CLI tools or set SKIP_FREE_PORTS=1." >&2
		exit 1
	fi
	echo "Freeing default Edumeet ports (previous dev servers)..."
	free_port_listeners 3030 "management server"
	free_port_listeners 3000 "media node"
	free_port_listeners 8443 "room server"
	free_port_listeners 4443 "Vite client"
	sleep 1
}

free_edumeet_ports

if [[ ! -f "${CLIENT}/public/config/config.js" ]]; then
	echo "Creating ${CLIENT}/public/config/config.js from config.example.js ..."
	cp "${CLIENT}/public/config/config.example.js" "${CLIENT}/public/config/config.js"
fi

if ! command -v yarn >/dev/null 2>&1; then
	echo "yarn is required on PATH." >&2
	exit 1
fi

MGMT_ENTRY="${MANAGEMENT_SERVER}/dist/src/index.js"
if [[ ! -f "${MGMT_ENTRY}" ]]; then
	echo "Building management server (first run)..."
	(cd "${MANAGEMENT_SERVER}" && yarn compile)
fi

pids=()
cleanup() {
	echo ""
	echo "Stopping Edumeet stack..."
	for pid in "${pids[@]}"; do
		if kill -0 "${pid}" 2>/dev/null; then
			kill "${pid}" 2>/dev/null || true
		fi
	done
	wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Edumeet local stack"
echo "  EDUMEET_BASE=${EDUMEET_BASE}"
echo "  PUBLIC_IP=${PUBLIC_IP}  MEDIA_SECRET=(hidden)"
echo "  MANAGEMENT_USERNAME=${MANAGEMENT_USERNAME}"
echo ""

echo "[1/4] Starting management server (http://localhost:3030)..."
(cd "${MANAGEMENT_SERVER}" && yarn start) &
pids+=($!)
sleep 4

echo "[2/4] Starting media node (--ip ${PUBLIC_IP})..."
(cd "${MEDIA_NODE}" && yarn start --ip "${PUBLIC_IP}" --secret "${MEDIA_SECRET}") &
pids+=($!)
sleep 2

echo "[3/4] Starting room server..."
(
	cd "${ROOM_SERVER}"
	export MANAGEMENT_USERNAME MANAGEMENT_PASSWORD
	yarn start
) &
pids+=($!)
sleep 2

echo "[4/4] Starting client (Vite)..."
(cd "${CLIENT}" && yarn start) &
pids+=($!)

echo ""
echo "All processes started. Press Ctrl+C to stop."
echo "Ensure room server config mediaNodes matches host ${PUBLIC_IP}, secret, and port 3000."
echo "Open https://localhost:4443 (accept the Vite dev certificate warning once). Signaling is proxied to the room server on :8443."
echo "Plain HTTP client: VITE_DEV_HTTP=1 yarn start → then use http://localhost:4443"
wait
