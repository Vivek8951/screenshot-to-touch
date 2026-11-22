# Linux companion setup

Target: Ubuntu Linux 26.04. Rust source compiles in this sandbox, but `/dev/uinput`, Android, Steam and GTA V are unavailable here. Commands below are real development instructions, not a tested end-user installer.

## Dependencies

```sh
sudo apt update
sudo apt install build-essential pkg-config libudev-dev cargo rustc
sudo modprobe uinput
rustc --version
```

Use a current Rust toolchain (1.82 or newer; dependencies may require newer stable Rust). If your distribution toolchain is too old, install current stable Rust with the official rustup instructions at https://rustup.rs. Do not blindly execute third-party installation scripts.

## Least-privilege device access

Create a dedicated group and narrowly scoped udev rule:

```sh
sudo groupadd -f dsb-uinput
sudo usermod -aG dsb-uinput "$USER"
printf '%s\n' 'KERNEL=="uinput", SUBSYSTEM=="misc", GROUP="dsb-uinput", MODE="0660", OPTIONS+="static_node=uinput"' | sudo tee /etc/udev/rules.d/70-dualsense-bridge.rules
sudo udevadm control --reload-rules
sudo udevadm trigger --subsystem-match=misc
ls -l /dev/uinput
```

Log out and back in for group membership. If the module must survive restart, configure modules-load using your distribution's normal procedure. Do not launch the companion with sudo. Group membership confers powerful input-injection permissions.

## Build and run

### Direct phone gameplay (recommended for a trusted private network)

After configuring uinput permissions above, from the project root:

```sh
cargo build --release --manifest-path native/linux-companion/Cargo.toml
bash native/linux-companion/play.sh
```

Choose the PC's Wi-Fi or USB-tether IPv4 address shown by the script. It binds both services to that interface and prints `http://PC-IP:8081`. Open that exact address on the phone and enter the terminal PIN. The phone gets the controller directly from Linux; no hosted site, Bun installation, internet or certificate is required at runtime. Use L3/R3 controls for stick clicks, both analog triggers, and fullscreen for gameplay. The active-gamepad status only appears after native uinput creation succeeds.

This HTTP/WS path is **unencrypted**: only use a trusted private network or isolated USB tethering, and restrict TCP ports 8081 and 8765 to the phone. For untrusted networks use properly provisioned TLS, not this shortcut. Browser local-network permissions still vary and require actual Android testing.

The controller is bundled into the Rust executable. To change its React source, run `bun build apps/controller-web/gameplay-entry.tsx --target browser --minify --outfile native/linux-companion/web/gameplay.js` from the project root, then rebuild Rust. The prebuilt bundle is provided so users can build the native executable without Bun.

### Hosted controller development

From the repository root:

```sh
cargo test --manifest-path native/linux-companion/Cargo.toml
cargo build --release --manifest-path native/linux-companion/Cargo.toml
DSB_BIND=127.0.0.1:8765 DSB_ORIGIN=http://localhost:8080 native/linux-companion/target/release/dualsense-bridge-linux
```

This only accepts the local browser. In another terminal, `bun run dev` starts the web application. A successful PIN pair attempts uinput creation; no virtual device is reported until it succeeds. Stop with Ctrl+C; the companion neutralizes/removes the device.

## LAN and USB tethering

`ip -br address` lists the PC's interface addresses. Set `DSB_BIND` explicitly to a reachable PC interface address, optionally `0.0.0.0:8765` on a firewall-restricted test machine. Set `DSB_ORIGIN` to the exact origin used to serve the web controller (scheme, hostname and port, no path). USB tethering still uses an IP network, not serial or charging transport. No automatic tether interface discovery exists yet.

For a local isolated WS test, the web app must be served from an origin/browser that permits WS, without HTTPS mixed-content restrictions. Hosted HTTPS requires TLS as below. Cleartext local development lacks transport encryption; do not call it production-secure.

## WSS for hosted HTTPS

Use a trusted certificate for a hostname resolving to your PC. For example, with Caddy already installed and a certificate trusted by the phone:

```text
pc-controller.example.internal:9443 {
  tls /absolute/path/to/fullchain.pem /absolute/path/to/private-key.pem
  reverse_proxy 127.0.0.1:8765
}
```

`example.internal` is an example, not a provisioned domain. Replace it with your actual hostname and valid certificate paths; do not commit keys. Start the native listener on loopback with `DSB_ORIGIN` equal to the web application's exact HTTPS origin, start Caddy using your configuration, then enter the reachable TLS hostname and port 9443 with WSS enabled on the phone. Configure DNS and firewall deliberately. Certificate provisioning and Android local network behavior are not tested here.

## Background use

The terminal companion runs in the foreground; the browser monitor cannot start/stop it. Launch it through a terminal multiplexer if needed for development. A native tray app, systemd packaging and persistent trusted-device UI are planned, not installed services.
