import { createFileRoute } from "@tanstack/react-router";
import { ConnectionPage } from "@/components/settings-pages";
import { pageHead } from "@/components/app-shell";
export const Route = createFileRoute("/pairing")({
  head: () =>
    pageHead("Secure pairing", "Pair your phone using the temporary PIN from your PC companion."),
  component: () => <ConnectionPage pairing />,
});
