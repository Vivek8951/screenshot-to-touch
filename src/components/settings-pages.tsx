import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Check,
  Copy,
  Download,
  Fingerprint,
  Gamepad2,
  Info,
  Monitor,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  Usb,
  Wifi,
} from "lucide-react";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { PageHeading, Footer } from "./app-shell";
import { useBridge } from "./bridge-state";
import { ControllerTool } from "./gamepad";
import { Metric } from "./dashboard";
import { BUTTONS } from "../../packages/shared-protocol";
import { defaultProfile, profileSchema, type Profile } from "../../packages/profiles";
const label = (b: string) =>
  ({
    cross: "Cross / A",
    circle: "Circle / B",
    square: "Square / X",
    triangle: "Triangle / Y",
    l1: "L1 / LB",
    r1: "R1 / RB",
    l3: "L3",
    r3: "R3",
    create: "Create / Back",
    options: "Options / Start",
    system: "System",
    touchpad: "Touchpad",
  })[b as "cross"] ?? b;
function Notice({ children, type = "info" }: { children: ReactNode; type?: string }) {
  return <div className={`notice ${type}`}>{children}</div>;
}
function Toggle({
  title,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (on: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="setting-row">
      <div>
        <strong>{title}</strong>
        <small>{description}</small>
      </div>
      <Switch aria-label={title} checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}
function Range({
  title,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  display,
  description,
}: {
  title: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  display?: string;
  description?: string;
}) {
  return (
    <div className="field">
      <div className="field-label">
        <label>{title}</label>
        <output>{display ?? value.toFixed(2)}</output>
      </div>
      <input
        aria-label={title}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {description && <small>{description}</small>}
    </div>
  );
}
export function ConnectionPage({ pairing = false }: { pairing?: boolean }) {
  const { config, setConfig, connect, disconnect, stats, message } = useBridge();
  const connected = stats.status === "connected";
  const pending = stats.status === "connecting" || stats.status === "pairing";
  return (
    <>
      <PageHeading
        eyebrow="LOCAL CONNECTION"
        title={pairing ? "Pair your phone" : "Connect to your PC"}
        subtitle={
          pairing
            ? "A private connection. Only the devices you approve."
            : "One controller protocol. Wi-Fi or USB tethering."
        }
      />
      <div className="settings-layout">
        <div>
          <div className="segment mb-7 w-fit">
            <Button
              variant="ghost"
              className={config.mode === "wifi" ? "selected" : ""}
              onClick={() => {
                disconnect();
                setConfig({ mode: "wifi" });
              }}
            >
              <Wifi />
              Wi-Fi network
            </Button>
            <Button
              variant="ghost"
              className={config.mode === "usb" ? "selected" : ""}
              onClick={() => {
                disconnect();
                setConfig({ mode: "usb" });
              }}
            >
              <Usb />
              USB tethering
            </Button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              connect();
            }}
          >
            <div className="form-grid">
              <div className="field">
                <label htmlFor="pc-host">PC address</label>
                <input
                  id="pc-host"
                  placeholder={config.mode === "usb" ? "e.g. 192.168.42.1" : "e.g. 192.168.1.10"}
                  value={config.host}
                  onChange={(e) => setConfig({ host: e.target.value.trim() })}
                  required
                  autoComplete="off"
                />
              </div>
              <div className="field">
                <label htmlFor="pc-port">Port</label>
                <input
                  id="pc-port"
                  type="number"
                  min="1"
                  max="65535"
                  value={config.port}
                  onChange={(e) => setConfig({ port: Number(e.target.value) })}
                  required
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="pair-pin">Pairing PIN</label>
              <input
                id="pair-pin"
                placeholder="Six-digit PIN from your PC"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                autoComplete="off"
                value={config.pin}
                onChange={(e) => setConfig({ pin: e.target.value.replace(/\D/g, "") })}
                required
              />
              <small>
                The temporary PIN is generated by the native PC companion. It is never saved in this
                browser.
              </small>
            </div>
            <Toggle
              title="Secure WebSocket (WSS)"
              description="Requires a trusted TLS certificate on the companion."
              checked={config.secure}
              onChange={(secure) => setConfig({ secure })}
            />
            <div className="mt-5 mb-5">
              <Notice type="warning">
                {config.secure
                  ? "The hosted controller requires WSS and permission to reach your local network. A local WS-only companion cannot connect to an HTTPS page."
                  : "Unencrypted WS is for a trusted, isolated local network only. This hosted HTTPS page will block it."}
              </Notice>
            </div>
            {(message || stats.error) && <Notice type="error">{message || stats.error}</Notice>}
            {connected && (
              <Notice>
                <strong>Paired with {stats.pcName}.</strong> Virtual gamepad:{" "}
                {stats.virtualGamepad ? "active" : "not available"}.
              </Notice>
            )}
            <div className="form-actions">
              <Button type="submit" disabled={pending || connected}>
                <Fingerprint />
                {pending
                  ? stats.status === "pairing"
                    ? "Validating PIN…"
                    : "Connecting…"
                  : connected
                    ? "Connected"
                    : "Pair & connect"}
              </Button>
              {(pending || connected) && (
                <Button type="button" variant="outline" onClick={disconnect}>
                  Disconnect
                </Button>
              )}
              <Button type="button" variant="outline" asChild>
                <Link to="/diagnostics">
                  <Activity />
                  Diagnostics
                </Link>
              </Button>
            </div>
          </form>
        </div>
        <aside className="aside-section">
          <h3>{config.mode === "wifi" ? "Connect over Wi-Fi" : "Connect over USB tethering"}</h3>
          <ol className="steps">
            <li>
              Start the native companion on your PC. Its address and temporary PIN appear in the
              terminal.
            </li>
            <li>
              {config.mode === "wifi"
                ? "Connect your phone and PC to the same trusted Wi-Fi network."
                : "Connect the USB cable, then enable USB tethering in Android settings. Charging alone is not a controller connection."}
            </li>
            <li>
              Enter the PC’s {config.mode === "wifi" ? "local network" : "tether-network"} address,
              port and pairing PIN.
            </li>
            <li>Pair, then check every input before launching a game.</li>
          </ol>
          <Notice>
            <strong>No internet needed.</strong> Local discovery is planned for the native Android
            app. Browsers use manual IP entry.
          </Notice>
          <Button variant="outline" asChild>
            <Link to="/help">
              <Info />
              Installation & help
            </Link>
          </Button>
        </aside>
      </div>
      <Footer />
    </>
  );
}
export function ProfilesPage() {
  const {
    profile,
    profiles,
    selectProfile,
    addProfile,
    removeProfile,
    updateProfile,
    message,
    setMessage,
  } = useBridge();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const exportProfile = () => {
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${profile.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <>
      <PageHeading
        title="Controller profiles"
        subtitle="A familiar layout for every way you play."
        actions={
          <Button size="sm" onClick={() => setEditing(!editing)}>
            <Plus />
            New profile
          </Button>
        }
      />
      {editing && (
        <form
          className="form-actions mb-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newName.trim()) return;
            addProfile({
              ...profile,
              id: crypto.randomUUID(),
              name: newName.trim(),
              layout: "custom",
            });
            setEditing(false);
            setNewName("");
          }}
        >
          <input
            className="mapping-select max-w-64"
            aria-label="New profile name"
            placeholder="Profile name"
            maxLength={40}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
          <Button type="submit">
            <Plus />
            Create profile
          </Button>
        </form>
      )}
      <div className="profile-grid">
        {profiles.map((p) => (
          <article className={`profile-card ${p.id === profile.id ? "chosen" : ""}`} key={p.id}>
            <Gamepad2 />
            <h3>{p.name}</h3>
            <p>
              {p.layout.toUpperCase()} · {p.frequency} Hz · {Math.round(p.deadzone * 100)}% dead
              zone
            </p>
            <div className="profile-buttons">
              <Button
                size="sm"
                variant={p.id === profile.id ? "default" : "outline"}
                onClick={() => selectProfile(p.id)}
              >
                {p.id === profile.id ? <Check /> : <Gamepad2 />}
                {p.id === profile.id ? "Selected" : "Use profile"}
              </Button>
              {p.layout === "custom" && (
                <Button
                  aria-label={`Delete ${p.name}`}
                  title={`Delete ${p.name}`}
                  variant="ghost"
                  size="icon"
                  onClick={() => removeProfile(p.id)}
                >
                  <Trash2 />
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>
      <div className="settings-layout mt-9">
        <section className="settings-section">
          <h2>Manage {profile.name}</h2>
          <form
            className="form-actions mb-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) {
                updateProfile({ name: name.trim() });
                setName("");
                setMessage("Profile renamed and saved on this device.");
              }
            }}
          >
            <input
              className="mapping-select max-w-64"
              aria-label="Rename profile"
              placeholder="New profile name"
              maxLength={40}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Button variant="outline" type="submit">
              <Save />
              Rename
            </Button>
          </form>
          <div className="form-actions">
            <Button variant="outline" onClick={exportProfile}>
              <Download />
              Export profile
            </Button>
            <Button variant="outline" asChild>
              <label>
                <Upload />
                Import profile
                <input
                  className="hidden"
                  type="file"
                  accept="application/json,.json"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      if (file.size > 100000) throw new Error("Profile file is too large.");
                      const p = profileSchema.parse(JSON.parse(await file.text()));
                      addProfile({ ...p, id: crypto.randomUUID() });
                      setMessage("Profile imported and saved on this device.");
                    } catch {
                      setMessage(
                        "Could not import this file. Choose a valid DualSense Bridge profile JSON.",
                      );
                    }
                    e.target.value = "";
                  }}
                />
              </label>
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                updateProfile(defaultProfile(profile.id, profile.name, profile.layout));
                setMessage("Profile restored to default settings.");
              }}
            >
              <RotateCcw />
              Reset defaults
            </Button>
          </div>
          {message && (
            <div className="mt-5">
              <Notice>{message}</Notice>
            </div>
          )}
        </section>
        <aside className="aside-section">
          <h3>Make it your own</h3>
          <p className="text-xs leading-7 text-muted-foreground">
            Profiles stay on this device. Export a copy to take your setup to another phone.
          </p>
          <div className="form-actions mt-5">
            <Button variant="outline" asChild>
              <Link to="/mapping">
                Button mapping
                <ArrowRight />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/sensitivity">
                Sensitivity
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </aside>
      </div>
      <Footer />
    </>
  );
}
export function SensitivityPage() {
  const { profile, updateProfile } = useBridge();
  return (
    <>
      <PageHeading
        title="Sensitivity & layout"
        subtitle={`Fine-tune the feel of your ${profile.name} profile.`}
      />
      <div className="settings-layout">
        <section className="settings-section">
          <h2>Analog sticks</h2>
          <Range
            title="Stick sensitivity"
            value={profile.sensitivity}
            min={0.2}
            max={2}
            onChange={(sensitivity) => updateProfile({ sensitivity })}
          />
          <Range
            title="Center dead zone"
            value={profile.deadzone}
            min={0}
            max={0.5}
            display={`${Math.round(profile.deadzone * 100)}%`}
            onChange={(deadzone) => updateProfile({ deadzone })}
          />
          <Range
            title="Response curve"
            value={profile.curve}
            min={0.5}
            max={3}
            onChange={(curve) => updateProfile({ curve })}
            description="1.00 is linear. Higher values give finer control near the center."
          />
          <Toggle
            title="Invert X axis"
            description="Reverse horizontal stick movement."
            checked={profile.invertX}
            onChange={(invertX) => updateProfile({ invertX })}
          />
          <Toggle
            title="Invert Y axis"
            description="Reverse vertical stick movement."
            checked={profile.invertY}
            onChange={(invertY) => updateProfile({ invertY })}
          />
          <Toggle
            title="Swap analog sticks"
            description="Exchange the left and right outputs."
            checked={profile.swapSticks}
            onChange={(swapSticks) => updateProfile({ swapSticks })}
          />
          <h2 className="mt-8">Triggers & appearance</h2>
          <Range
            title="Trigger sensitivity"
            value={profile.triggerSensitivity}
            min={0.2}
            max={2}
            onChange={(triggerSensitivity) => updateProfile({ triggerSensitivity })}
          />
          <Range
            title="Button size"
            value={profile.buttonScale}
            min={0.75}
            max={1.25}
            display={`${Math.round(profile.buttonScale * 100)}%`}
            onChange={(buttonScale) => updateProfile({ buttonScale })}
          />
          <Range
            title="Controller opacity"
            value={profile.opacity}
            min={0.4}
            max={1}
            display={`${Math.round(profile.opacity * 100)}%`}
            onChange={(opacity) => updateProfile({ opacity })}
          />
          <Range
            title="Input update frequency"
            value={profile.frequency}
            min={20}
            max={120}
            step={10}
            display={`${profile.frequency} Hz`}
            onChange={(frequency) => updateProfile({ frequency })}
            description="60 Hz balances responsiveness and battery use. Only changed input is sent; heartbeats run separately."
          />
        </section>
        <aside className="aside-section">
          <h3>Profile settings</h3>
          <Notice>
            Changes are saved on this device automatically. Your controller returns to neutral when
            a profile changes.
          </Notice>
          <Button variant="outline" asChild>
            <Link to="/controller">
              <Gamepad2 />
              Test your controls
            </Link>
          </Button>
        </aside>
      </div>
      <Footer />
    </>
  );
}
export function MappingPage() {
  const { profile, updateProfile, press } = useBridge();
  const [moving, setMoving] = useState("cross");
  return (
    <>
      <PageHeading
        title="Button mapping"
        subtitle={`Your controls, your rules. Editing ${profile.name}.`}
      />
      <div className="mapping-grid">
        {BUTTONS.map((b) => (
          <div className="mapping-row" key={b}>
            <span>{label(b)}</span>
            <ArrowRight />
            <select
              className="mapping-select"
              aria-label={`Map ${b}`}
              value={profile.mapping[b] ?? b}
              onChange={(e) => {
                const result = BUTTONS.find((x) => x === e.target.value);
                if (result) updateProfile({ mapping: { ...profile.mapping, [b]: result } });
              }}
            >
              {BUTTONS.map((target) => (
                <option key={target} value={target}>
                  {label(target)}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <section className="settings-section mt-9">
        <h2>Stick clicks</h2>
        <div className="form-actions">
          {(["l3", "r3"] as const).map((b) => (
            <Button
              variant="outline"
              key={b}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                press(b, true);
              }}
              onPointerUp={() => press(b, false)}
              onPointerCancel={() => press(b, false)}
              onLostPointerCapture={() => press(b, false)}
            >
              {b.toUpperCase()} hold test
            </Button>
          ))}
        </div>
      </section>
      <section className="settings-section">
        <h2>Face button positions</h2>
        <div className="field max-w-lg">
          <label>Button</label>
          <select
            aria-label="Reposition button"
            value={moving}
            onChange={(e) => setMoving(e.target.value)}
          >
            {["cross", "circle", "square", "triangle"].map((b) => (
              <option key={b} value={b}>
                {label(b)}
              </option>
            ))}
          </select>
        </div>
        <div className="max-w-lg">
          <Range
            title="Horizontal offset"
            value={profile.positions[moving]?.x ?? 0}
            min={-30}
            max={30}
            step={1}
            display={`${profile.positions[moving]?.x ?? 0}px`}
            onChange={(x) =>
              updateProfile({
                positions: {
                  ...profile.positions,
                  [moving]: { x, y: profile.positions[moving]?.y ?? 0 },
                },
              })
            }
          />
          <Range
            title="Vertical offset"
            value={profile.positions[moving]?.y ?? 0}
            min={-30}
            max={30}
            step={1}
            display={`${profile.positions[moving]?.y ?? 0}px`}
            onChange={(y) =>
              updateProfile({
                positions: {
                  ...profile.positions,
                  [moving]: { x: profile.positions[moving]?.x ?? 0, y },
                },
              })
            }
          />
        </div>
      </section>
      <Button
        variant="outline"
        onClick={() => updateProfile({ mapping: defaultProfile().mapping, positions: {} })}
      >
        <RotateCcw />
        Reset mapping
      </Button>
      <Footer />
    </>
  );
}
export function MotionPage() {
  return (
    <>
      <PageHeading title="Motion controls" subtitle="Precision aiming, with a little movement." />
      <div className="settings-layout">
        <div>
          <Notice type="warning">
            <strong>Native Android support planned.</strong> Gyroscope, accelerometer, calibration
            and gyro aiming are not implemented in this browser controller.
          </Notice>
          <Toggle
            title="Gyro aiming"
            description="Requires the native Android sensor engine."
            checked={false}
            onChange={() => {}}
            disabled
          />
          <Toggle
            title="Accelerometer"
            description="Requires native Android sensor permissions."
            checked={false}
            onChange={() => {}}
            disabled
          />
          <div className="mt-6">
            <Button variant="outline" disabled>
              Calibration · native app required
            </Button>
          </div>
        </div>
        <aside className="aside-section">
          <h3>Designed for Android</h3>
          <p className="text-xs leading-7 text-muted-foreground">
            The shared protocol has optional gyroscope and acceleration fields. Native sensor
            processing, smoothing and calibration are part of the Android milestone.
          </p>
        </aside>
      </div>
      <Footer />
    </>
  );
}
export function HapticsPage() {
  const { profile, updateProfile } = useBridge();
  const [result, setResult] = useState("");
  return (
    <>
      <PageHeading title="Haptic feedback" subtitle="Feel the press. Stay in the game." />
      <div className="settings-layout">
        <div>
          <Toggle
            title="Button vibration"
            description="Short phone vibration when you press a controller button."
            checked={profile.haptics}
            onChange={(haptics) => updateProfile({ haptics })}
          />
          <div className="mt-7">
            <Range
              title="Vibration duration"
              value={profile.vibration}
              min={10}
              max={100}
              step={5}
              display={`${profile.vibration} ms`}
              onChange={(vibration) => updateProfile({ vibration })}
              description="Browser vibration supports duration, not reliable intensity control."
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              const supported =
                typeof navigator.vibrate === "function" && navigator.vibrate(profile.vibration);
              setResult(
                supported
                  ? "Vibration requested. Actual delivery depends on your phone and browser."
                  : "Vibration is unavailable in this browser. Native Android haptics are planned.",
              );
            }}
          >
            Test vibration
          </Button>
          {result && (
            <div className="mt-5">
              <Notice>{result}</Notice>
            </div>
          )}
        </div>
        <aside className="aside-section">
          <h3>Honest haptics</h3>
          <Notice>
            Ordinary phone vibration is not DualSense adaptive haptics. A touchscreen cannot
            reproduce physical adaptive-trigger resistance.
          </Notice>
          <p className="text-xs leading-7 text-muted-foreground">
            Game-to-phone rumble and configurable native vibration intensity are future
            capabilities.
          </p>
        </aside>
      </div>
      <Footer />
    </>
  );
}
export function DiagnosticsPage() {
  const { stats, output, config, reset } = useBridge();
  const [copied, setCopied] = useState(false);
  const entries = [
    ["Connection type", config.mode === "usb" ? "USB TETHERING" : "WI-FI"],
    ["Connection status", stats.status.toUpperCase()],
    ["PC address", config.host ? `${config.host}:${config.port}` : "Not configured"],
    ["Local phone IP", "Unavailable in browser"],
    ["Packets sent", String(stats.sent)],
    ["Messages received", String(stats.received)],
    ["Packet loss", "Not measurable over reliable WebSocket"],
    ["Reconnections", String(stats.reconnects)],
    ["Last received", stats.lastReceived ? new Date(stats.lastReceived).toLocaleTimeString() : "—"],
    ["Virtual gamepad", stats.virtualGamepad ? "Active · companion reported" : "Not created"],
    ["Operating system", "Native companion detection pending"],
  ];
  return (
    <>
      <PageHeading
        title="Connection diagnostics"
        subtitle="Every input. Every packet. Nothing hidden."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(
                  JSON.stringify(
                    {
                      stats: { ...stats, logs: stats.logs },
                      config: { ...config, pin: undefined },
                      output,
                    },
                    null,
                    2,
                  ),
                );
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
          >
            {copied ? <Check /> : <Copy />}
            {copied ? "Copied" : "Copy report"}
          </Button>
        }
      />
      <div className="metrics mb-7">
        <Metric
          label="Round-trip latency"
          icon={<Activity />}
          value={stats.latency === null ? "—" : String(stats.latency)}
          unit="ms"
          caption="Measured using heartbeat"
        />
        <Metric
          label="Packets sent"
          icon={<Upload />}
          value={String(stats.sent)}
          caption="Changed input only"
        />
        <Metric
          label="Received"
          icon={<Download />}
          value={String(stats.received)}
          caption="Valid companion messages"
        />
        <Metric
          label="Reconnects"
          icon={<Wifi />}
          value={String(stats.reconnects)}
          caption="Up to 3 retries per connection"
        />
      </div>
      <div className="settings-layout">
        <section>
          <h2 className="text-sm font-semibold mb-4">Connection details</h2>
          <table className="diagnostic-table">
            <tbody>
              {entries.map(([key, value]) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <aside className="aside-section">
          <h3>Connection log</h3>
          <div className="log-view">
            {stats.logs.length ? (
              stats.logs.map((log, i) => <p key={i}>{log}</p>)
            ) : (
              <p>No connection events yet.</p>
            )}
          </div>
          {stats.error && (
            <div className="mt-4">
              <Notice type="error">{stats.error}</Notice>
            </div>
          )}
        </aside>
      </div>
      <div className="section-heading">
        <span>Controller input tester</span>
        <Button variant="ghost" size="sm" onClick={reset}>
          <RotateCcw />
          Reset inputs
        </Button>
      </div>
      <div className="tester-buttons">
        {BUTTONS.map((b) => (
          <span className={`tester-button ${output.buttons.includes(b) ? "on" : ""}`} key={b}>
            {b.toUpperCase()}
          </span>
        ))}
        <span className={`tester-button ${output.dpad.some((v) => v !== 0) ? "on" : ""}`}>
          D-PAD {output.dpad.join(", ")}
        </span>
        <span className={`tester-button ${output.touch.active ? "on" : ""}`}>
          TOUCH {output.touch.x.toFixed(2)}, {output.touch.y.toFixed(2)}
        </span>
      </div>
      <ControllerTool />
      <Footer />
    </>
  );
}
export function CompanionPage() {
  const { stats, config, disconnect } = useBridge();
  return (
    <>
      <PageHeading
        title="DualSense Bridge PC"
        eyebrow="NATIVE PC COMPANION"
        subtitle="The bridge between your phone and your games."
      />
      <Notice type="warning">
        <strong>This is the browser companion monitor.</strong> Starting a local server, generating
        a PIN and creating a virtual gamepad must happen in the native Linux companion—not this
        page.
      </Notice>
      <div className="metrics mb-8">
        <Metric
          label="Native companion"
          icon={<Monitor />}
          value={stats.status === "connected" ? "Paired" : "Offline"}
          small
          caption={stats.pcName}
        />
        <Metric
          label="Virtual controller"
          icon={<Gamepad2 />}
          value={stats.virtualGamepad ? "Active" : "Not created"}
          small
          success={stats.virtualGamepad}
          caption="Requires access to /dev/uinput"
        />
        <Metric
          label="Connection"
          icon={<Wifi />}
          value={config.mode === "usb" ? "USB" : "Wi-Fi"}
          caption={config.host || "No address configured"}
        />
        <Metric
          label="Incoming inputs"
          icon={<Activity />}
          value={String(stats.sent)}
          caption="Web controller packets sent"
        />
      </div>
      <div className="settings-layout">
        <div>
          <h2 className="text-sm font-semibold mb-4">Native server controls</h2>
          <div className="form-actions mb-5">
            <Button disabled>Start server · native only</Button>
            <Button variant="outline" disabled>
              Stop server · native only
            </Button>
            {stats.status === "connected" && (
              <Button variant="outline" onClick={disconnect}>
                Disconnect phone
              </Button>
            )}
          </div>
          <div className="setting-row">
            <div>
              <strong>Pairing PIN</strong>
              <small>Generated temporarily on your PC. Never hardcoded.</small>
            </div>
            <span className="font-mono text-muted-foreground">— — — — — —</span>
          </div>
          <div className="setting-row">
            <div>
              <strong>Ubuntu Linux 26.04</strong>
              <small>First hardware target · uinput virtual Xbox-style gamepad</small>
            </div>
            <span className="label-chip">HARDWARE UNTESTED</span>
          </div>
          <div className="setting-row">
            <div>
              <strong>Windows / macOS</strong>
              <small>Driver investigation and platform implementation pending</small>
            </div>
            <span className="label-chip">PLANNED</span>
          </div>
        </div>
        <aside className="aside-section">
          <h3>Native setup</h3>
          <Notice>
            Linux companion source and installation instructions are included in the project.
            Hardware detection, Steam and GTA V remain unverified.
          </Notice>
          <Button variant="outline" asChild>
            <Link to="/help">
              <Info />
              Installation guide
            </Link>
          </Button>
        </aside>
      </div>
      <Footer />
    </>
  );
}
export function HelpPage() {
  const items = [
    [
      "Install the Linux companion",
      "Install Rust using your distribution package manager. From native/linux-companion run cargo run --release. Configure /dev/uinput permissions first. The companion prints its temporary PIN and only reports a virtual gamepad after device creation succeeds. See README and docs/linux-setup.md for exact steps.",
    ],
    [
      "Steam does not detect the controller",
      "Confirm that the native companion successfully created /dev/uinput. Open Steam → Settings → Controller and test inputs. If absent, check permissions, the native logs, and whether Steam can access the input device. Hardware detection has not yet been tested in this environment.",
    ],
    [
      "USB tethering address issues",
      "Enable USB tethering in Android settings, then use ip -br address on the PC to find the tethered interface. Enter the PC interface address, not the phone address. A charging-only USB connection does not carry controller inputs.",
    ],
    [
      "Wi-Fi connection or firewall issues",
      "The phone and PC must be on the same trusted LAN. Disable access-point client isolation if needed. Allow the selected TCP port from the phone only. HTTPS-hosted pages require WSS with a browser-trusted certificate and local-network permission.",
    ],
    [
      "Wrong stick or trigger mapping",
      "Reset your profile, test axes in Diagnostics and verify the companion mapping. Sticks normalize to −1…1, triggers to 0…1. Linux maps them to ABS_X/Y, ABS_RX/RY, ABS_Z/RZ and hats to ABS_HAT0X/Y.",
    ],
    [
      "Disconnects or stuck inputs",
      "The browser clears inputs on blur, hidden tabs and disconnect. The native receiver must clear every button and axis on close or heartbeat timeout. Browser background throttling can interrupt play; native Android background support is planned.",
    ],
    [
      "Steam, Proton and GTA V Legacy",
      "Use the manual checklist in docs/hardware-testing.md. First verify Linux device detection, then Steam input, then GTA V Legacy via your configured Proton setup. No GTA V compatibility result has been verified.",
    ],
  ];
  return (
    <>
      <PageHeading
        title="Help & troubleshooting"
        subtitle="Back to playing. One check at a time."
      />
      <div className="settings-layout">
        <div>
          <h2 className="text-sm font-semibold mb-4">First connection checklist</h2>
          <ol className="steps">
            <li>
              Build and run the native companion on Ubuntu after configuring uinput permissions.
            </li>
            <li>Choose Wi-Fi or enable Android USB tethering.</li>
            <li>Pair with the PC address and temporary six-digit PIN.</li>
            <li>Test all buttons, sticks and triggers in Diagnostics.</li>
            <li>Verify the virtual controller in Steam before starting GTA V Legacy.</li>
          </ol>
          <h2 className="text-sm font-semibold mt-8 mb-3">Troubleshooting</h2>
          <div className="help-list">
            {items.map(([title, text]) => (
              <details key={title}>
                <summary>{title}</summary>
                <p>{text}</p>
              </details>
            ))}
          </div>
        </div>
        <aside className="aside-section">
          <h3>Linux quick start</h3>
          <div className="code-block">
            sudo modprobe uinput{"\n"}ip -br address{"\n"}cd native/linux-companion{"\n"}cargo run
            --release
          </div>
          <Notice type="warning">
            Configure uinput access and read the security guide before running. Do not run the
            companion as root or expose it to the internet.
          </Notice>
          <Button variant="outline" asChild>
            <Link to="/connection">
              <Wifi />
              Connection setup
            </Link>
          </Button>
        </aside>
      </div>
      <Footer />
    </>
  );
}
export function AboutPage() {
  return (
    <>
      <PageHeading
        title="DualSense Bridge"
        subtitle="An open, local-first bridge from your phone to PC gaming."
      />
      <div className="settings-layout">
        <div>
          <section className="settings-section">
            <h2>Your phone → your PC → your game</h2>
            <p className="text-sm leading-8 text-muted-foreground">
              DualSense Mobile sends genuine normalized gamepad inputs over Wi-Fi or USB tethering.
              A separate native companion is responsible for creating the operating-system
              controller. This web application cannot create a virtual HID device.
            </p>
          </section>
          <div className="setting-row">
            <div>
              <strong>Web controller & shared protocol</strong>
              <small>Touch inputs, profiles, input tester and paired WebSocket transport</small>
            </div>
            <span className="label-chip live">IMPLEMENTED</span>
          </div>
          <div className="setting-row">
            <div>
              <strong>Linux native companion</strong>
              <small>Source provided · hardware and game compatibility not verified</small>
            </div>
            <span className="label-chip">HARDWARE UNTESTED</span>
          </div>
          <div className="setting-row">
            <div>
              <strong>Android sensors & native haptics</strong>
              <small>Native application interfaces and architecture documented</small>
            </div>
            <span className="label-chip">PLANNED</span>
          </div>
          <div className="setting-row">
            <div>
              <strong>Windows & macOS</strong>
              <small>Platform driver research and implementation required</small>
            </div>
            <span className="label-chip">PLANNED</span>
          </div>
        </div>
        <aside className="aside-section">
          <h3>Built around your privacy</h3>
          <Notice>
            <ShieldCheck size={18} />
            <strong>No required accounts, subscriptions or cloud.</strong> Profiles are stored on
            your device. The temporary pairing PIN is only kept in memory.
          </Notice>
          <p className="text-xs leading-7 text-muted-foreground">
            Independent project. Not affiliated with Sony or PlayStation. DualSense-inspired design;
            no physical PlayStation controller required.
          </p>
          <span className="version">v0.1.0 · Protocol v1</span>
        </aside>
      </div>
      <Footer />
    </>
  );
}
