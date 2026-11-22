#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
if [[ "$(id -u)" == 0 ]]; then echo "Do not run the network companion as root." >&2; exit 1; fi
if [[ ! -r /dev/uinput || ! -w /dev/uinput ]]; then echo "First configure /dev/uinput permissions using docs/linux-setup.md, then log out and back in." >&2; exit 1; fi
IP="${1:-}"
if [[ -z "$IP" ]]; then echo "Choose your PC's Wi-Fi or USB tether interface address:"; ip -br -4 address; read -r -p "PC IPv4 address: " IP; fi
if [[ ! "$IP" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then echo "Enter the PC's IPv4 address." >&2; exit 1; fi
BIN="$ROOT/target/release/dualsense-bridge-linux"
if [[ ! -x "$BIN" ]]; then cargo build --release --manifest-path "$ROOT/Cargo.toml"; fi
printf '\nOpen http://%s:8081 on your Android phone, enter the terminal PIN, then test in Steam.\n' "$IP"
echo "HTTP/WS is unencrypted. Use only a trusted private Wi-Fi or USB tether network. Restrict ports 8081 and 8765 to your phone."
DSB_BIND="$IP:8765" DSB_HTTP_BIND="$IP:8081" DSB_ORIGIN="http://$IP:8081" exec "$BIN"
