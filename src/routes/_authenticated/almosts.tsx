import { Outlet } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";

// Layout route so /almosts and /almosts/$id can each be full pages.
export const Route = createFileRoute("/_authenticated/almosts")({
  component: () => <Outlet />,
});
