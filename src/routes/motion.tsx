import { createFileRoute } from "@tanstack/react-router";
import { MotionPage } from "@/components/settings-pages";
import { pageHead } from "@/components/app-shell";
export const Route = createFileRoute("/motion")({
  head: () =>
    pageHead("Motion controls", "Native Android motion-control capability and availability."),
  component: () => <MotionPage />,
});
