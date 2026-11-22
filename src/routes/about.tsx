import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "@/components/settings-pages";
import { pageHead } from "@/components/app-shell";
export const Route = createFileRoute("/about")({
  head: () =>
    pageHead(
      "About DualSense Bridge",
      "Product architecture and transparent implementation status.",
    ),
  component: () => <AboutPage />,
});
