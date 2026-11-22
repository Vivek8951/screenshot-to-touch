import { createFileRoute } from "@tanstack/react-router";
import { DiagnosticsPage } from "@/components/settings-pages";
import { pageHead } from "@/components/app-shell";
export const Route = createFileRoute("/diagnostics")({
  head: () =>
    pageHead(
      "Diagnostics",
      "Inspect real input values, connection status and local packet activity.",
    ),
  component: () => <DiagnosticsPage />,
});
