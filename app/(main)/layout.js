"use client";

import React from "react";
import { useAuth } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import SidebarNav from "@/components/SidebarNav";

const publicRoutes = ["/", "/about", "/contact"];

const isPublicRoute = (pathname) =>
  publicRoutes.some((route) => pathname === route || pathname?.startsWith(`${route}/`));

export const MainLayout = ({ children }) => {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const showSidebar = isSignedIn || !isPublicRoute(pathname);

  return (
    <div className="-mx-4 -my-6 min-h-[calc(100vh-5rem)] md:-mx-6 md:-my-8 lg:-mx-8">
      {showSidebar && <SidebarNav />}
      <main
        className={showSidebar
          ? "min-w-0 px-4 pb-10 lg:px-8 lg:pl-[var(--sidebar-width)]"
          : "min-w-0 px-4 pb-10 lg:px-8"
        }
      >
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
