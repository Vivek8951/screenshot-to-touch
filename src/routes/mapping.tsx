import { createFileRoute } from "@tanstack/react-router";
import { MappingPage } from "@/components/settings-pages";
import { pageHead } from "@/components/app-shell";
export const Route = createFileRoute("/mapping")({
  head: () =>
    pageHead("Button mapping", "Remap gamepad controls and adjust face button positions."),
  component: () => <MappingPage />,
});
