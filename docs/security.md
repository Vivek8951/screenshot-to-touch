# Local pairing security model

## Implemented Linux safeguards

- Explicit bind address; loopback-only by default. LAN exposure requires a deliberate `DSB_BIND` change.
- Exact browser origin allowlist, maximum 4096-byte messages, handshake and pairing timeouts.
- Random temporary six-digit PIN, 120-second expiry, constant-time comparison.
- One controller session at a time; no input accepted before PIN verification and uinput creation.
- Five failed sessions cause a 30-second cooldown and rotate the PIN. Successful clean disconnect rotates it. No PIN or profile data is sent to a cloud service.
- Validation of version, stable device ID, axes, triggers, buttons, hats, finite sensor values and monotonic sequences; malformed messages disconnect and neutralize.
- Six-second inactive-session timeout, input reset on close/error/Ctrl+C and uinput cleanup.
- Browser PIN is memory-only. Do not export it, save it, put it in query strings or include it in diagnostics.

## Limitations; not production security certification

The six-digit PIN is a temporary pairing factor, not encryption or a reusable high-entropy credential. Origin validation is defense in depth, not authentication. An attacker with local network access can deny service to the single-session receiver, and a PIN seen on WS can be intercepted. Global cooldown is basic brute-force mitigation, not comprehensive per-peer intrusion detection. Persistent device trust, explicit PC approval, revoke-device registry and disconnect-all administration are not yet implemented. The companion logs its PIN locally for the operator: keep terminal access private.

The Rust WebSocket listener is WS-only. The companion now also serves an offline React gameplay controller over bounded local HTTP, with only three allowlisted assets and no filesystem paths. `play.sh` deliberately binds HTTP and WS to a selected PC interface and allows its exact HTTP origin. This direct mode avoids HTTPS mixed-content restrictions but is unencrypted: use only a trusted isolated Wi-Fi or USB tether network and restrict ports 8081/8765 to the phone. It is not a substitute for TLS on untrusted networks.

For the hosted HTTPS controller, a WSS reverse proxy and a browser-trusted certificate are still required. TLS termination is not built into the Rust executable. Local-network permissions and certificate installation must be tested on the actual Android browser. Do not disable certificate verification or accept arbitrary origins. Public internet exposure is unsupported; avoid public Wi-Fi and router port forwarding.

Run the network-facing companion as an ordinary user with narrowly scoped uinput access. Never chmod 666 /dev/uinput or run the service as root. uinput grants ability to create input devices; membership in its access group is security-sensitive. A production release needs a dedicated least-privilege service, signed packages, secure trusted-device storage, dedicated watchdog, TLS provisioning, audit and hardware tests.
