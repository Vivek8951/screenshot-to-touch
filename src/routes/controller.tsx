import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/dashboard";
import { pageHead } from "@/components/app-shell";
export const Route = createFileRoute("/controller")({
  head: () =>
    pageHead("Touch controller", "Multi-touch sticks, gamepad buttons and analog triggers."),
  component: () => <Dashboard controllerOnly />,
});
