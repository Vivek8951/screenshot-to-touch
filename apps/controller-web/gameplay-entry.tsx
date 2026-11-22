import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import { Gamepad2, Maximize2, Minimize2, Unplug } from "lucide-react";
import { BridgeProvider } from "../../src/components/bridge-context";
import { useBridge } from "../../src/components/bridge-state";
import { Gamepad } from "../../src/components/gamepad";
import { Button } from "../../src/components/ui/button";
function Gameplay() {
  const { config, setConfig, connect, disconnect, stats, message, press, input } = useBridge();
  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    const port = Number(
      document.querySelector('meta[name="ws-port"]')?.getAttribute("content") ?? 8765,
    );
    setConfig({ host: location.hostname, port, secure: location.protocol === "https:" });
  }, []);
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
      setFullscreen(Boolean(document.fullscreenElement));
    } catch {
      setFullscreen(!fullscreen);
    }
  };
  const connected = stats.status === "connected" && stats.virtualGamepad;
  return (
    <main className={`gameplay-screen ${fullscreen ? "immersive" : ""}`}>
      <header className="gameplay-header">
        <div className="gameplay-brand">
          <Gamepad2 />
          <strong>DualSense Mobile</strong>
        </div>
        <div className="gameplay-status" role="status">
          {connected ? `${stats.pcName} · ${stats.latency ?? "—"} ms` : "PC gamepad not connected"}
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Full screen"
          title="Full screen"
          onClick={toggleFullscreen}
        >
          {fullscreen ? <Minimize2 /> : <Maximize2 />}
        </Button>
        {connected && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Disconnect"
            title="Disconnect"
            onClick={disconnect}
          >
            <Unplug />
          </Button>
        )}
      </header>
      {!connected && (
        <form
          className="gameplay-pair"
          onSubmit={(e) => {
            e.preventDefault();
            connect();
          }}
        >
          <label htmlFor="pin">PC pairing PIN</label>
          <input
            id="pin"
            aria-label="PC pairing PIN"
            inputMode="numeric"
            autoComplete="off"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="6-digit PIN"
            value={config.pin}
            onChange={(e) => setConfig({ pin: e.target.value.replace(/\D/g, "") })}
            required
          />
          <Button
            type="submit"
            disabled={stats.status === "connecting" || stats.status === "pairing"}
          >
            {stats.status === "connecting" || stats.status === "pairing"
              ? "Connecting…"
              : "Connect gamepad"}
          </Button>
          <span>Trusted local network only · unencrypted HTTP/WS</span>
        </form>
      )}
      {(message || stats.error) && (
        <p className="gameplay-error" role="alert">
          {message || stats.error}
        </p>
      )}
      <section className="gameplay-controls" aria-label="Gameplay controller">
        <Gamepad />
      </section>
      <footer className="gameplay-footer">
        <div className="stick-clicks">
          {(["l3", "r3"] as const).map((name) => (
            <Button
              key={name}
              variant="outline"
              aria-label={`${name.toUpperCase()} stick click`}
              aria-pressed={input.buttons.includes(name)}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                press(name, true);
              }}
              onPointerUp={() => press(name, false)}
              onPointerCancel={() => press(name, false)}
              onLostPointerCapture={() => press(name, false)}
            >
              {name.toUpperCase()}
            </Button>
          ))}
        </div>
        <span>{connected ? "GAMEPAD ACTIVE" : "NO VIRTUAL GAMEPAD · INPUT TEST ONLY"}</span>
        <span>Wi-Fi / USB tethering</span>
      </footer>
    </main>
  );
}
const root = document.getElementById("root");
if (root)
  createRoot(root).render(
    <BridgeProvider>
      <Gameplay />
    </BridgeProvider>,
  );
