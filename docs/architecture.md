# Architecture and implementation boundaries

```text
Android browser touch controller
  -> controller-core (circular normalized input)
  -> input-mapping + local profiles
  -> shared-protocol v1
  -> WebSocket (Wi-Fi / USB tether network)
  -> optional external TLS termination
  -> Linux Rust receiver (PIN, validation, ordering, watchdog)
  -> evdev uinput Xbox-style virtual gamepad
  -> Steam / Proton / GTA V Legacy [hardware verification pending]
```

The supported TanStack web entry remains at repository root, not duplicated in apps/controller-web. All thirteen requested screens have real routes. apps/pc-companion-ui is currently the `/companion` browser monitor, not a standalone native desktop application. packages contain transport-independent processing and schemas; native source is not imported by web code.

Implemented: web pointer controls, independent multi-touch input capture, sticks/triggers/D-pad/touch coordinates, fullscreen, profile mapping/dead zones/curves/inversion/position/size/opacity/save/rename/import/export, browser vibration request, WSS/WS client configuration, pairing/heartbeat/reconnect/reset, diagnostics and Linux WS/uinput source.

Not implemented: native Android APK/NSD/gyro/calibration/background service; integrated Linux TLS and discovery, desktop/tray UI, persistent trusted-device storage/removal; maintained Windows driver; macOS entitlements/backend; game-to-phone rumble, genuine adaptive haptics, direct USB serial/accessory transport; game compatibility verification. Bluetooth is future optional transport. Native Android architecture contracts are provided but not executable adapters.

The browser provider owns a single local connection across routes. Settings are saved explicitly in localStorage because the product requires locally stored settings and no required cloud. PIN is memory-only. No browser API supplies a system virtual controller.

For gameplay the Linux executable also embeds a standalone React controller entry, sharing the existing Gamepad/provider/protocol. A bounded static HTTP listener serves three allowlisted assets. The launch script binds HTTP/WS to a chosen PC interface with an exact origin; the phone opens the printed local address and enters only the PIN. No cloud, remote fonts or hosted WSS setup is needed for this trusted-private-network path. It is unencrypted and not appropriate for public networks. The regular hosted app still requires trusted WSS. The prebundled React asset is shipped with native source for offline operation after installation.
