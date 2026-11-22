import { render, fireEvent, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BridgeProvider } from "../components/bridge-context";
import { useBridge } from "../components/bridge-state";
function Consumer() {
  const { input, press } = useBridge();
  return (
    <button onClick={() => press("cross", !input.buttons.includes("cross"))}>
      {input.buttons.join(",") || "neutral"}
    </button>
  );
}
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe("shared bridge provider", () => {
  it("shares one context with consumers and preserves inputs across rerenders", () => {
    const view = render(
      <BridgeProvider>
        <Consumer />
      </BridgeProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "neutral" }));
    expect(screen.getByRole("button", { name: "cross" })).toBeDefined();
    view.rerender(
      <BridgeProvider>
        <Consumer />
      </BridgeProvider>,
    );
    expect(screen.getByRole("button", { name: "cross" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "cross" }));
    expect(screen.getByRole("button", { name: "neutral" })).toBeDefined();
  });
});
