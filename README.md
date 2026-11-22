# DualSense Bridge

A local-first Android-to-PC gaming controller project. **DualSense Mobile** is the running touch web controller; **DualSense Bridge PC** is a separate native receiver. Wi-Fi and Android USB tethering use the same v1 protocol. No account, subscription, paid API, cloud connection or physical PlayStation controller is required.

## Current status

This is an incremental developer preview, not a finished universal native controller. Web input/settings are implemented and browser-tested. Real Rust Linux uinput receiver source compiles and its unit tests pass. An actual system virtual gamepad, Android device, Steam and GTA V Legacy have not been tested here. Native Android APK, Windows and macOS backends are not implemented. The web monitor never claims it can create a system gamepad.

See [architecture](docs/architecture.md), [protocol](docs/protocol.md), [security model](docs/security.md), [Linux setup](docs/linux-setup.md) and [hardware test checklist](docs/hardware-testing.md).

## Structure

```text
apps/controller-web/          Web boundary documentation (root src is entry)
apps/pc-companion-ui/         Browser monitor boundary documentation
src/routes/                  All 13 TanStack Start content pages
src/components/               Shared web controller, settings and session
packages/shared-protocol/     Versioned JSON schema and types
packages/controller-core/     Analog/trigger/button processing
packages/input-mapping/       Profile-based gamepad mapping
packages/networking/          Paired WebSocket client and heartbeat
packages/profiles/            Validated local profiles
native/linux-companion/       Compilable Rust WS + evdev uinput receiver
native/android-controller/    Kotlin interfaces only; no APK
native/windows-companion/    Planned driver/backend boundary
native/macos-companion/       Planned HID investigation boundary
docs/                         Installation, protocol, security, hardware tests
src/test/                     Web/shared protocol and transport tests
roadmap.md                    Implementation and blocked hardware milestones
```

## Web development

Requirements: Bun and the existing TanStack Start/Vite toolchain. From the repository root:

```sh
bun install
bun run dev
bunx vitest run src/test/controller.test.ts src/test/app-routing.test.tsx
```

Open the URL printed by the development server. `/` is the working controller workspace. Connection setup is `/connection`, profiles `/profiles`, tester `/diagnostics`, and PC monitor `/companion`.

The web application stays in the supported root structure rather than introducing another framework/router. All pure protocol logic is in packages. Browser vibration depends on actual browser support; native sensors and adaptive-trigger resistance are not available.

## Linux development

**Direct gameplay:** after the one-time uinput setup in [Linux setup](docs/linux-setup.md), build the companion and run `bash native/linux-companion/play.sh`. Select your PC's Wi-Fi or USB-tether address. Open the printed `http://PC-IP:8081` on your Android phone, enter the terminal PIN, and test the created gamepad in Steam. The native program serves the real React touch controller locally; no published site or certificate setup is needed for this trusted-network HTTP/WS mode. It is unencrypted—never use it on public/untrusted networks. Actual Android/Steam/GTA V compatibility still needs hardware testing.

```sh
cargo test --manifest-path native/linux-companion/Cargo.toml
cargo build --release --manifest-path native/linux-companion/Cargo.toml
DSB_BIND=127.0.0.1:8765 DSB_ORIGIN=http://localhost:8080 native/linux-companion/target/release/dualsense-bridge-linux
```

Read [Linux setup](docs/linux-setup.md) first for real dependencies, uinput permissions, LAN exposure and TLS. Default listener is loopback-only. The receiver is WS-only; an HTTPS-hosted web controller needs a trusted WSS reverse proxy, not a mixed-content WS connection. Bind to a reachable LAN interface only deliberately with a firewall restricting access to the phone. Do not run as root or expose to the internet.

Native prints a temporary six-digit PIN and rotates/expires it. Input is rejected before pairing. Device creation can fail if uinput is missing or denied; the receiver reports that failure rather than presenting an active gamepad. The terminal application is not a native tray UI or installed background service.

## Wi-Fi and USB tethering

1. Start companion with correct origin/bind/TLS settings and read the temporary PIN.
2. Join a trusted shared Wi-Fi network, or plug USB cable and enable USB tethering in Android settings.
3. Find PC's reachable interface address with `ip -br address`. Charging alone is not a transport. Browsers cannot provide reliable local network discovery.
4. Enter PC address, port and temporary PIN in Connection; choose Wi-Fi or USB tethering. Enable WSS for the hosted HTTPS app and ensure phone certificate trust and local network permission.
5. Pair, open Diagnostics and inspect all inputs. The status becomes virtual-gamepad-active only on a successful native report.
6. Follow [hardware testing](docs/hardware-testing.md) to verify Steam detection and GTA V Legacy, then repeat using the other connection mode.

## Android / Windows / macOS builds

No runnable applications exist for these targets yet. There are no honest build commands to provide. Android has Kotlin platform contracts; Windows needs a maintained signed virtual HID solution (not an unexamined retired driver); macOS requires supported HID mechanisms and entitlement investigation. Their READMEs specify pending platform work.

## Verification

- 20 TypeScript input/protocol/profile/WebSocket tests passed.
- Five Rust Linux mapping/validation/PIN tests passed.
- Root routing test passed.
- Real native WebSocket checks passed for forbidden origins, invalid PINs and truthful missing-uinput errors after valid pairing.
- Browser interaction checks passed for touch-style pointer press/release, analog return-to-center, custom profile persistence, all page metadata and mobile navigation with no observed runtime errors.
- Fake transport unit tests are not real hardware pairing or networking acceptance. Actual uinput/Steam/GTA V support remains untested.

## Reliability and security limitations

Inputs reset on blur, hidden page, profile change and disconnect; Linux resets/removes uinput on session exit and six-second timeout. Inputs send only when changed at configurable 20–120 Hz; heartbeat is independent. WebSocket is reliable/ordered, so network packet loss is not fabricated. WSS client support does not mean certificate provisioning is complete. Persistent trusted credentials, device-revoke management and comprehensive production rate-limiting are future work.

Independent project; not affiliated with Sony/PlayStation. Ordinary phone vibration is not DualSense adaptive haptics. See [roadmap](roadmap.md) for the next actual milestones.
