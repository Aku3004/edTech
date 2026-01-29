import React from "react";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <>
      <div className="flex min-h-svh flex-col items-center justify-center">
        <Outlet />
      </div>
    </>
  );
}
