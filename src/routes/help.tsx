import { createFileRoute } from "@tanstack/react-router";
import { HelpPage } from "@/components/settings-pages";
import { pageHead } from "@/components/app-shell";
export const Route = createFileRoute("/help")({
  head: () =>
    pageHead(
      "Help and troubleshooting",
      "Local connection, uinput setup, Steam and game testing guidance.",
    ),
  component: () => <HelpPage />,
});
