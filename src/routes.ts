// routes.js
import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import React from "react";

const Index = lazy(() => import("./pages/Index"));
const AdminLayout = lazy(() => import("./pages/admin/_layout"));
const Admin = lazy(() => import("./pages/admin"));
const Settings = lazy(() => import("./pages/admin/settings"));

export const routes: RouteObject[] = [
  {
    path: "/",
    element: React.createElement(lazy(() => import("./pages/_layout"))),
    children: [
      { index: true, element: React.createElement(Index) },
      { path: "instance/:uuid", element: React.createElement(lazy(() => import("./pages/instance"))) },
    ]
  },
  {
    path: "/admin",
    element: React.createElement(AdminLayout),
    children: [
      { index: true, element: React.createElement(Admin) },
      { path: "settings", element: React.createElement(Settings) },
      { path: "account", element: React.createElement(lazy(() => import("./pages/admin/account"))) },
    ],
  },
  {
    path: "/terminal",
    element: React.createElement(lazy(() => import("./pages/terminal"))),
  },
];
