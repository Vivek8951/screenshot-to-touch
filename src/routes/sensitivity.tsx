import { createFileRoute } from "@tanstack/react-router";
import { SensitivityPage } from "@/components/settings-pages";
import { pageHead } from "@/components/app-shell";
export const Route = createFileRoute("/sensitivity")({
  head: () =>
    pageHead(
      "Sensitivity settings",
      "Tune stick dead zones, curves, triggers and controller appearance.",
    ),
  component: () => <SensitivityPage />,
});
