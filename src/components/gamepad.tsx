import { useEffect, useRef, type PointerEvent } from "react";
import {
  Gamepad2,
  Maximize2,
  Minimize2,
  RotateCcw,
  SlidersHorizontal,
  Volume2,
  ShieldCheck,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useBridge } from "./bridge-context";
import { type ButtonName } from "../../packages/shared-protocol";
function PressButton({
  name,
  label,
  className,
  children,
}: {
  name: ButtonName;
  label: string;
  className: string;
  children: React.ReactNode;
}) {
  const { input, press, profile } = useBridge();
  const pointers = useRef(new Set<number>());
  const face = ["cross", "circle", "square", "triangle"].includes(name);
  const position = profile.positions[name];
  const controlStyle = face
    ? {
        transform: `translate(${position?.x ?? 0}px,${position?.y ?? 0}px) scale(${profile.buttonScale})`,
      }
    : undefined;
  const release = (e: PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) press(name, false);
  };
  return (
    <Button
      variant="gamepad"
      aria-label={label}
      aria-pressed={input.buttons.includes(name)}
      title={label}
      style={controlStyle}
      className={`game-control ${className} ${input.buttons.includes(name) ? "pressed" : ""}`}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        pointers.current.add(e.pointerId);
        press(name, true);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          press(name, true);
        }
      }}
      onKeyUp={(e) => {
        if (e.key === " " || e.key === "Enter") press(name, false);
      }}
      onBlur={() => press(name, false)}
    >
      {children}
    </Button>
  );
}
function Stick({ side }: { side: "left" | "right" }) {
  const { input, updateInput } = useBridge();
  const pointer = useRef<number | null>(null);
  const [x, y] = input[side];
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (pointer.current !== e.pointerId) return;
    const box = e.currentTarget.getBoundingClientRect();
    const dx = (e.clientX - box.left - box.width / 2) / (box.width / 2),
      dy = (e.clientY - box.top - box.height / 2) / (box.height / 2);
    const length = Math.max(1, Math.hypot(dx, dy));
    updateInput({ [side]: [dx / length, dy / length] });
  };
  const release = (e: PointerEvent<HTMLDivElement>) => {
    if (pointer.current !== e.pointerId) return;
    pointer.current = null;
    updateInput({ [side]: [0, 0] });
  };
  return (
    <div
      className={`stick ${side} ${x || y ? "active" : ""}`}
      role="slider"
      aria-label={`${side} analog stick`}
      aria-valuemin={-1}
      aria-valuemax={1}
      aria-valuenow={x}
      aria-valuetext={`X ${x.toFixed(2)}, Y ${y.toFixed(2)}`}
      tabIndex={0}
      onPointerDown={(e) => {
        if (pointer.current !== null) return;
        e.preventDefault();
        pointer.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        move(e);
      }}
      onPointerMove={move}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onKeyDown={(e) => {
        const deltas: Record<string, [number, number]> = {
          ArrowUp: [0, -1],
          ArrowDown: [0, 1],
          ArrowLeft: [-1, 0],
          ArrowRight: [1, 0],
        };
        const delta = deltas[e.key];
        if (delta) {
          e.preventDefault();
          updateInput({ [side]: delta });
        }
      }}
      onKeyUp={() => updateInput({ [side]: [0, 0] })}
      onBlur={() => updateInput({ [side]: [0, 0] })}
    >
      <div className="stick-knob" style={{ transform: `translate(${x * 26}%,${y * 26}%)` }} />
      <span className="stick-caption">{side === "left" ? "L" : "R"} ANALOG</span>
    </div>
  );
}
function Dpad() {
  const { input, updateInput } = useBridge();
  const held = useRef(new Map<number, [number, number]>());
  const compute = () => {
    const values = [...held.current.values()];
    const direction = (value: number): -1 | 0 | 1 => (value < 0 ? -1 : value > 0 ? 1 : 0);
    updateInput({
      dpad: [
        direction(values.reduce((a, v) => a + v[0], 0)),
        direction(values.reduce((a, v) => a + v[1], 0)),
      ],
    });
  };
  const directions = [
    ["up", 0, -1, "▴"],
    ["right", 1, 0, "▸"],
    ["down", 0, 1, "▾"],
    ["left", -1, 0, "◂"],
  ] as const;
  return (
    <div className="dpad">
      <div className="dpad-center" />
      {directions.map(([name, x, y, symbol]) => (
        <Button
          variant="gamepad"
          key={name}
          aria-label={`D-pad ${name}`}
          className={`game-control dpad-control dpad-${name} ${(x && input.dpad[0] === x) || (y && input.dpad[1] === y) ? "pressed" : ""}`}
          onPointerDown={(e) => {
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            held.current.set(e.pointerId, [x, y]);
            compute();
          }}
          onPointerUp={(e) => {
            held.current.delete(e.pointerId);
            compute();
          }}
          onPointerCancel={(e) => {
            held.current.delete(e.pointerId);
            compute();
          }}
          onLostPointerCapture={(e) => {
            held.current.delete(e.pointerId);
            compute();
          }}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              updateInput({ dpad: [x, y] });
            }
          }}
          onKeyUp={() => updateInput({ dpad: [0, 0] })}
        >
          {symbol}
        </Button>
      ))}
    </div>
  );
}
export function Gamepad() {
  const { input, profile, updateInput, press, reset } = useBridge();
  useEffect(() => () => reset(), []);
  const touchPointer = useRef<number | null>(null);
  const touch = (e: PointerEvent<HTMLButtonElement>) => {
    if (touchPointer.current !== e.pointerId) return;
    const box = e.currentTarget.getBoundingClientRect();
    updateInput({
      touch: {
        active: true,
        x: Math.max(0, Math.min(1, (e.clientX - box.left) / box.width)),
        y: Math.max(0, Math.min(1, (e.clientY - box.top) / box.height)),
      },
    });
  };
  const releaseTouch = (e: PointerEvent<HTMLButtonElement>) => {
    if (touchPointer.current !== e.pointerId) return;
    touchPointer.current = null;
    updateInput({ touch: { ...input.touch, active: false } });
    press("touchpad", false);
  };
  const symbols =
    profile.layout === "xbox"
      ? { triangle: "Y", circle: "B", cross: "A", square: "X" }
      : { triangle: "△", circle: "○", cross: "×", square: "□" };
  return (
    <div className="gamepad" style={{ opacity: profile.opacity }}>
      <svg
        className="controller-body"
        viewBox="0 0 700 342"
        aria-label="DualSense-inspired controller shell"
      >
        <defs>
          <linearGradient id="shellGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" className="shell-gradient-top" />
            <stop offset="1" className="shell-gradient-bottom" />
          </linearGradient>
        </defs>
        <path
          className="shell-main"
          d="M158 26 C117 21 87 39 69 76 C46 128 20 224 27 289 C31 329 62 336 92 310 L187 234 Q220 241 251 238 L449 238 Q480 241 513 234 L608 310 C638 336 669 329 673 289 C680 224 654 128 631 76 C613 39 583 21 542 26 Q350 45 158 26Z"
        />
        <path
          className="shell-center"
          d="M235 52 Q350 65 465 52 L470 138 C482 169 478 226 450 247 Q350 259 250 247 C222 226 218 169 230 138Z"
        />
        <path className="shell-highlight" d="M235 51 L229 143 M465 51 L471 143" />
        <path
          className="shell-detail"
          d="M154 33 C99 27 76 57 60 106 M546 33 C601 27 624 57 640 106"
        />
        <path
          className="grip-lines"
          d="M56 232 L103 263 M53 245 L95 273 M52 258 L85 280 M644 232 L597 263 M647 245 L605 273 M648 258 L615 280"
        />
      </svg>
      {(["left", "right"] as const).map((side) => {
        const name = side === "left" ? "l2" : "r2";
        return (
          <div key={side} className={`trigger-group ${side}`}>
            <label htmlFor={`${name}-trigger`}>{name.toUpperCase()}</label>
            <input
              id={`${name}-trigger`}
              aria-label={`${name.toUpperCase()} pressure`}
              type="range"
              min="0"
              max="100"
              value={input[name] * 100}
              onChange={(e) => updateInput({ [name]: Number(e.target.value) / 100 })}
              onPointerUp={() => updateInput({ [name]: 0 })}
              onPointerCancel={() => updateInput({ [name]: 0 })}
              onBlur={() => updateInput({ [name]: 0 })}
            />
            <span className="trigger-value">{Math.round(input[name] * 100)}%</span>
          </div>
        );
      })}
      <PressButton name="l1" label="L1 shoulder" className="shoulder left">
        L1
      </PressButton>
      <PressButton name="r1" label="R1 shoulder" className="shoulder right">
        R1
      </PressButton>
      <Button
        variant="gamepad"
        className={`game-control touchpad ${input.touch.active ? "pressed" : ""}`}
        aria-label="Touchpad"
        onPointerDown={(e) => {
          if (touchPointer.current !== null) return;
          e.preventDefault();
          touchPointer.current = e.pointerId;
          e.currentTarget.setPointerCapture(e.pointerId);
          touch(e);
          press("touchpad", true);
        }}
        onPointerMove={touch}
        onPointerUp={releaseTouch}
        onPointerCancel={releaseTouch}
        onLostPointerCapture={releaseTouch}
      >
        <span>TOUCHPAD</span>
      </Button>
      <PressButton name="create" label="Create" className="center-button create-button">
        ≡
      </PressButton>
      <PressButton name="options" label="Options" className="center-button options-button">
        ☰
      </PressButton>
      <Dpad />
      {(["triangle", "circle", "cross", "square"] as const).map((name) => (
        <PressButton
          key={name}
          name={name}
          label={`${name} face button`}
          className={`face-button face-${name}`}
        >
          <span className="symbol">{symbols[name]}</span>
        </PressButton>
      ))}
      <Stick side="left" />
      <Stick side="right" />
      <div className="speaker-detail" />
      <PressButton name="system" label="System button" className="system-button">
        <Gamepad2 />
      </PressButton>
      <div className="mic-detail" />
    </div>
  );
}
export function ControllerTool() {
  const { profile, profiles, selectProfile, reset, stats, fullScreen, setFullScreen } = useBridge();
  const fullscreen = async () => {
    if (fullScreen) {
      if (document.fullscreenElement) await document.exitFullscreen();
      setFullScreen(false);
    } else {
      setFullScreen(true);
      try {
        await document.documentElement.requestFullscreen();
      } catch {
        /* Layout-only fullscreen remains usable on unsupported browsers. */
      }
    }
  };
  return (
    <section className="controller-tool">
      <div className="tool-top">
        <div className="tool-title">
          <Gamepad2 />
          Controller workspace{" "}
          <span className="label-chip">{profile.layout === "xbox" ? "XBOX" : "DUALSENSE"}</span>
        </div>
        <div className="tool-actions">
          <select
            aria-label="Active controller profile"
            value={profile.id}
            onChange={(e) => selectProfile(e.target.value)}
          >
            {profiles.map((p) => (
              <option value={p.id} key={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <Button
            variant="ghost"
            size="icon"
            className="icon-tool"
            title="Reset all inputs"
            aria-label="Reset all inputs"
            onClick={reset}
          >
            <RotateCcw />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="icon-tool"
            title={fullScreen ? "Exit full screen" : "Full screen"}
            aria-label={fullScreen ? "Exit full screen" : "Full screen"}
            onClick={fullscreen}
          >
            {fullScreen ? <Minimize2 /> : <Maximize2 />}
          </Button>
        </div>
      </div>
      <div className="controller-stage">
        <div className="stage-label">
          <span /> {stats.status === "connected" ? "LIVE INPUT" : "LOCAL INPUT TEST"}
        </div>
        <Gamepad />
        <div className="stage-note">
          <ShieldCheck size={11} />
          {stats.virtualGamepad ? "Virtual gamepad active" : "Native gamepad not connected"}
        </div>
      </div>
      <div className="tool-bottom">
        <div className="tool-bottom-left">
          <Link to="/haptics" className={`mini-state ${profile.haptics ? "enabled" : ""}`}>
            <Volume2 />
            Haptics {profile.haptics ? "on" : "off"}
          </Link>
          <span className="mini-state hide-mobile">{profile.frequency} Hz input rate</span>
          <span className="mini-state">Dead zone {Math.round(profile.deadzone * 100)}%</span>
        </div>
        <Link to="/sensitivity" className="mini-state">
          <SlidersHorizontal /> Customize controls
        </Link>
      </div>
    </section>
  );
}
