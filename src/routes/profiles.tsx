import { createFileRoute } from "@tanstack/react-router";
import { ProfilesPage } from "@/components/settings-pages";
import { pageHead } from "@/components/app-shell";
export const Route = createFileRoute("/profiles")({
  head: () =>
    pageHead("Controller profiles", "Save, customize, import and export local gamepad profiles."),
  component: () => <ProfilesPage />,
});
