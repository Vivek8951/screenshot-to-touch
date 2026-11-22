# Hardware acceptance checklist — all pending

Record phone model, Android/browser version, Ubuntu/kernel version, network configuration, certificate trust, Steam version and Proton version. Never mark success without observing the result.

1. Build/run companion as unprivileged user; verify uinput permissions and useful errors when denied.
2. Pair with temporary PIN: incorrect and expired PIN must fail; unpaired input must fail.
3. Connect phone/PC through the same Wi-Fi network, trusted WSS certificate and actual browser local-network permission.
4. Verify uinput device exists only after successful pairing. Inspect Linux event values (`evtest` if installed).
5. Test left stick full circle, right stick full circle, central dead zone, sensitivity/curve, inversion and swap.
6. Press/release all face, shoulder, create, options, system, touchpad-click and stick-click buttons; test opposing inputs and multitouch.
7. Test L2/R2 gradually from 0 to 100%, together with face buttons and stick movement. Lift finger: trigger neutralizes.
8. Verify every D-pad direction and diagonals. Check touch coordinates in diagnostics; Linux coordinate mapping is not implemented.
9. Open Steam Settings → Controller. Confirm actual virtual-device detection.
10. Run Steam's input test; verify all controls, analog range and neutral return. Capture actual results.
11. Launch GTA V Legacy with the user's configured Proton version. Test driving, aiming, camera, menus and button prompts. Record failures; do not claim compatibility merely because Steam detects a device.
12. Repeat steps 3–11 with USB cable and Android USB tethering enabled, using PC tether-network address.
13. While holding inputs, disconnect cable, disable Wi-Fi, close browser, stop native process and force heartbeat timeout. Confirm no stuck button and controller removal.
14. Verify reconnection and new PIN entry; verify malformed packets and a second unauthorized phone cannot control inputs.
15. Test portrait, landscape, fullscreen, device rotation, screen sleep, 20/60/120 Hz and mobile browser background throttling.
16. Windows/macOS and native Android sensors/haptics require their implementations before acceptance testing.

Current observed results: web pointer press/release, analog return-to-center, local profile persistence, route rendering, mobile navigation and automated protocol/transport/Linux mapping tests pass in the sandbox. None of steps requiring Android/Ubuntu uinput/Steam/GTA V has been executed.
