import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/dashboard")({ component: () => <Outlet /> });
