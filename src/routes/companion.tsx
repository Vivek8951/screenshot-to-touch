import { createFileRoute } from "@tanstack/react-router";
import { CompanionPage } from "@/components/settings-pages";
import { pageHead } from "@/components/app-shell";
export const Route = createFileRoute("/companion")({
  head: () => pageHead("PC companion", "Monitor your native companion and virtual gamepad status."),
  component: () => <CompanionPage />,
});
