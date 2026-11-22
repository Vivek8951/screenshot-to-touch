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
  it("works on local HTTP where crypto.randomUUID is unavailable", () => {
    vi.spyOn(crypto, "randomUUID").mockImplementation(() => {
      throw new Error("Not a secure context");
    });
    localStorage.removeItem("dsb-device-id");
    render(
      <BridgeProvider>
        <Consumer />
      </BridgeProvider>,
    );
    expect(localStorage.getItem("dsb-device-id")).toMatch(/^[a-f0-9]{32}$/);
    fireEvent.click(screen.getByRole("button", { name: "neutral" }));
    expect(screen.getByRole("button", { name: "cross" })).toBeDefined();
  });
  it("keeps the controller usable when local storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Storage blocked");
    });
    render(
      <BridgeProvider>
        <Consumer />
      </BridgeProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "neutral" }));
    expect(screen.getByRole("button", { name: "cross" })).toBeDefined();
  });
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
