import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Gamepad2,
  LayoutDashboard,
  Wifi,
  Fingerprint,
  Layers3,
  SlidersHorizontal,
  Activity,
  Monitor,
  CircleHelp,
  Info,
  ChevronRight,
  Bell,
  Menu,
  X,
  Radio,
  Usb,
  Move3d,
  Vibrate,
  ArrowRightLeft,
  Shield,
  UserRound,
} from "lucide-react";
import { Button } from "./ui/button";
import { useBridge } from "./bridge-context";
const primary = [
  ["/", "Overview", LayoutDashboard],
  ["/controller", "Controller", Gamepad2],
  ["/connection", "Connection", Wifi],
  ["/pairing", "Pairing", Fingerprint],
] as const;
const controls = [
  ["/profiles", "Profiles", Layers3],
  ["/mapping", "Button mapping", ArrowRightLeft],
  ["/sensitivity", "Sensitivity", SlidersHorizontal],
  ["/motion", "Motion controls", Move3d],
  ["/haptics", "Haptic feedback", Vibrate],
] as const;
const system = [
  ["/diagnostics", "Diagnostics", Activity],
  ["/companion", "PC companion", Monitor],
] as const;
export function AppShell({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState(false);
  const { location } = useRouterState();
  const { stats } = useBridge();
  const all = [
    ...primary,
    ...controls,
    ...system,
    ["/help", "Help & support", CircleHelp],
    ["/about", "About", Info],
  ] as const;
  const current = all.find(([path]) => path === location.pathname)?.[1] ?? "Overview";
  const nav = (items: typeof primary | typeof controls | typeof system) =>
    items.map(([path, label, Icon]) => (
      <Link
        key={path}
        to={path}
        onClick={() => setMenu(false)}
        className={`nav-link ${location.pathname === path ? "active" : ""}`}
      >
        <Icon />
        {label}
      </Link>
    ));
  return (
    <div className="app-shell">
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <Link to="/" className="brand">
          <Gamepad2 />
          <span>
            DualSense<small>BRIDGE</small>
          </span>
        </Link>
        <div className="nav-caption">WORKSPACE</div>
        {nav(primary)}
        <div className="nav-caption mt-6">CONTROLLER</div>
        {nav(controls)}
        <div className="nav-caption mt-6">SYSTEM</div>
        {nav(system)}
        <div className="sidebar-bottom">
          <Link to="/help" className={`nav-link ${location.pathname === "/help" ? "active" : ""}`}>
            <CircleHelp />
            Help & support
          </Link>
          <Link
            to="/about"
            className={`nav-link ${location.pathname === "/about" ? "active" : ""}`}
          >
            <Info />
            About DualSense Bridge
          </Link>
          <div className="system-status">
            <strong>
              <span className={`status-dot ${stats.status === "connected" ? "connected" : ""}`} />
              {stats.status === "connected" ? "PC connected" : "Local-first. Always."}
            </strong>
            v0.1.0 · Developer preview
          </div>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="topbar">
          <div className="breadcrumb">
            <Button
              variant="ghost"
              size="icon"
              className="mobile-menu"
              aria-label={menu ? "Close navigation" : "Open navigation"}
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <Menu />}
            </Button>
            <span>Workspace</span>
            <ChevronRight size={12} />
            <strong>{current}</strong>
          </div>
          <div className="top-actions">
            <span className="version">BETA v0.1</span>
            <Button
              variant="ghost"
              size="icon"
              title="Connection diagnostics"
              aria-label="Connection diagnostics"
              asChild
            >
              <Link to="/diagnostics">
                <Bell size={16} />
              </Link>
            </Button>
            <div className="avatar" title="No account required">
              <UserRound size={14} />
            </div>
          </div>
        </header>
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
export function PageHeading({
  title,
  subtitle,
  eyebrow = "YOUR GAMING WORKSPACE",
  actions,
}: {
  title: string;
  subtitle: string;
  eyebrow?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {actions && <div className="heading-actions">{actions}</div>}
    </div>
  );
}
export function ConnectionStrip() {
  const { config, setConfig, stats, disconnect } = useBridge();
  const connected = stats.status === "connected";
  return (
    <div className="connection-strip">
      <div className="connection-icon">
        {config.mode === "wifi" ? <Wifi size={17} /> : <Usb size={17} />}
      </div>
      <div>
        <strong>{connected ? stats.pcName : "No PC connected"}</strong>
        <p>{connected ? `${config.host}:${config.port}` : "Connect your PC to start playing"}</p>
      </div>
      <div className="strip-end">
        <div className="segment">
          <Button
            variant="ghost"
            className={config.mode === "wifi" ? "selected" : ""}
            onClick={() => {
              if (config.mode !== "wifi") {
                disconnect();
                setConfig({ mode: "wifi" });
              }
            }}
          >
            <Wifi size={12} />
            Wi-Fi
          </Button>
          <Button
            variant="ghost"
            className={config.mode === "usb" ? "selected" : ""}
            onClick={() => {
              if (config.mode !== "usb") {
                disconnect();
                setConfig({ mode: "usb" });
              }
            }}
          >
            <Usb size={12} />
            USB
          </Button>
        </div>
        {connected ? (
          <Button size="sm" variant="outline" onClick={disconnect}>
            Disconnect
          </Button>
        ) : (
          <Button size="sm" asChild>
            <Link to="/connection">
              <Radio size={13} />
              <span className="connect-label">Connect PC</span>
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-left">
        <span>
          <Shield />
          Private by design
        </span>
        <span>No account. No cloud.</span>
      </div>
      <span>DUALSENSE BRIDGE · LOCAL-FIRST GAMING</span>
    </footer>
  );
}
export function pageHead(title: string, description: string) {
  return {
    meta: [
      { title: `${title} — DualSense Bridge` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} — DualSense Bridge` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
}
