# DualSense Bridge roadmap

## Current delivery

- [x] Add a directly served local phone gameplay controller and Linux launch script, avoiding hosted HTTPS/WSS setup for trusted-network play.

- [x] Create modular project boundaries and shared protocol.
- [x] Build all requested web pages, touch controller, input tester and local profiles.
- [x] Implement paired WebSocket client and first-class Wi-Fi/USB configuration.
- [x] Provide Linux Rust WebSocket/uinput source and Android/platform interfaces.
- [x] Run automated tests and verify browser interaction and mobile layout.
- [x] Finish security, installation and hardware testing documentation.

## Hardware-dependent milestones

- [ ] Verify Ubuntu uinput device creation, Wi-Fi, USB tethering, Steam and GTA V Legacy. Blocker: Android/Ubuntu gaming hardware is not available in this environment.
- [ ] Native Android sensor/haptic application and packaging. Future milestone; interfaces only in current delivery.
- [ ] Windows and macOS virtual HID backends. Blocker: maintained driver selection, platform entitlements and native test hardware.
