import { createFileRoute } from "@tanstack/react-router";
import { ConnectionPage } from "@/components/settings-pages";
import { pageHead } from "@/components/app-shell";
export const Route = createFileRoute("/connection")({
  head: () =>
    pageHead(
      "Connection setup",
      "Connect DualSense Mobile to a local PC over Wi-Fi or USB tethering.",
    ),
  component: () => <ConnectionPage />,
});
