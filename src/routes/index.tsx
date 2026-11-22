import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/dashboard";
import { pageHead } from "@/components/app-shell";
export const Route = createFileRoute("/")({
  head: () => pageHead("DualSense Mobile", "Your local-first phone game controller workspace."),
  component: () => <Dashboard />,
});
