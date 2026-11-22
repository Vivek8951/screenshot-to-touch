import { createFileRoute } from "@tanstack/react-router";
import { HapticsPage } from "@/components/settings-pages";
import { pageHead } from "@/components/app-shell";
export const Route = createFileRoute("/haptics")({
  head: () => pageHead("Haptic feedback", "Configure ordinary phone vibration feedback."),
  component: () => <HapticsPage />,
});
