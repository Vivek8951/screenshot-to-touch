import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowUpRight,
  ArrowRight,
  Gauge,
  Gamepad2,
  Layers3,
  SlidersHorizontal,
  Timer,
  Wifi,
} from "lucide-react";
import { Button } from "./ui/button";
import { PageHeading, ConnectionStrip, Footer } from "./app-shell";
import { ControllerTool } from "./gamepad";
import { useBridge } from "./bridge-state";
export function Dashboard({ controllerOnly = false }: { controllerOnly?: boolean }) {
  const { output, stats, profile } = useBridge();
  return (
    <>
      <PageHeading
        title="DualSense Mobile"
        subtitle="Your phone. Your controller. Your next great session."
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link to="/profiles">
                <Layers3 />
                <span className="desktop-label">My profiles</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/sensitivity">
                <SlidersHorizontal />
                <span className="desktop-label">Customize</span>
              </Link>
            </Button>
          </>
        }
      />
      <ConnectionStrip />
      <ControllerTool />
      <div className="section-heading">
        <span>{controllerOnly ? "Live controller inputs" : "Session overview"}</span>
        <Link to="/diagnostics">
          View diagnostics <ArrowUpRight />
        </Link>
      </div>
      <div className="metrics">
        <Metric
          label="Connection latency"
          icon={<Timer />}
          value={stats.latency === null ? "—" : String(stats.latency)}
          unit="ms"
          caption={
            stats.status === "connected"
              ? "Measured round-trip latency"
              : "Waiting for PC connection"
          }
        />
        <Metric
          label="Input activity"
          icon={<Activity />}
          value={String(output.buttons.length + Number(output.l2 > 0) + Number(output.r2 > 0))}
          unit="active"
          caption={`${stats.sent} packets sent to companion`}
        />
        <Metric
          label="Active profile"
          icon={<Gamepad2 />}
          value={profile.layout === "xbox" ? "Xbox" : "DualSense"}
          small
          caption={`${profile.name} · ${profile.frequency} Hz`}
        />
        <Metric
          label="Virtual gamepad"
          icon={<Wifi />}
          value={stats.virtualGamepad ? "Active" : "Offline"}
          small
          success={stats.virtualGamepad}
          caption={
            stats.virtualGamepad ? "Reported by native companion" : "Native companion required"
          }
        />
      </div>
      <div className="section-heading">
        <span>Analog input monitor</span>
        <Link to="/mapping">
          Edit mapping <ArrowRight />
        </Link>
      </div>
      <div className="metrics">
        <Axis label="Left stick" x={output.left[0]} y={output.left[1]} />
        <Axis label="Right stick" x={output.right[0]} y={output.right[1]} />
        <Metric
          label="L2 trigger"
          icon={<Gauge />}
          value={String(Math.round(output.l2 * 100))}
          unit="%"
          caption="Analog pressure"
          progress={output.l2}
        />
        <Metric
          label="R2 trigger"
          icon={<Gauge />}
          value={String(Math.round(output.r2 * 100))}
          unit="%"
          caption="Analog pressure"
          progress={output.r2}
        />
      </div>
      <Footer />
    </>
  );
}
export function Metric({
  label,
  icon,
  value,
  unit,
  caption,
  small = false,
  success = false,
  progress,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  unit?: string;
  caption: string;
  small?: boolean;
  success?: boolean;
  progress?: number;
}) {
  return (
    <div className="metric">
      <div className="metric-top">
        <span>{label}</span>
        {icon}
      </div>
      <div className={`metric-value ${success ? "success" : ""} ${small ? "text-lg" : ""}`}>
        {value}
        {unit && <small>{unit}</small>}
      </div>
      <div className="metric-caption">{caption}</div>
      {progress !== undefined && (
        <div className="axis-track">
          <i style={{ width: `${progress * 100}%` }} />
        </div>
      )}
    </div>
  );
}
function Axis({ label, x, y }: { label: string; x: number; y: number }) {
  return (
    <div className="metric">
      <div className="metric-top">
        <span>{label}</span>
        <Gamepad2 />
      </div>
      <div className="metric-value text-base">
        {x.toFixed(2)}
        <small>X</small> {y.toFixed(2)}
        <small>Y</small>
      </div>
      <div className="metric-caption">Normalized output · −1 to +1</div>
      <div className="axis-track">
        <i style={{ width: `${(x + 1) * 50}%` }} />
      </div>
    </div>
  );
}
