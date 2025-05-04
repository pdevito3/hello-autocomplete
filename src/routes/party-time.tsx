import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/party-time")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello party-time!</div>;
}
