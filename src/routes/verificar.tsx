import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/verificar")({
  component: () => <Navigate to="/" hash="busca" replace />,
});
