"use client";

import { usePathname, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { CityProvider } from "@/contexts/CityContext";
import { SearchProvider } from "@/contexts/SearchContext";
import React, { useEffect, useRef } from "react";
import AppInit from "@/components/AppInit";
import NotificationPermissionRequest from "@/components/NotificationPermissionRequest";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

// This is the protected view for the entire /main/** route segment.
// It checks for authentication and shows a loading state.
const ProtectedAppView = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login');
    }
  }, [user, loading, router]);

  // This effect re-triggers the CSS animation on page navigation
  // by removing and re-adding the animation class.
  useEffect(() => {
    const mainEl = mainRef.current;
    if (mainEl) {
      mainEl.classList.remove('animate-page-slide-in-right');
      void mainEl.offsetWidth; // Trigger a reflow
      mainEl.classList.add('animate-page-slide-in-right');
    }
  }, [pathname]);

  if (loading || !user) {
    return (
       <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col" style={{ overflowX: 'hidden' }}>
      <Header />
      <main
        ref={mainRef}
        className={cn(
          "flex-1 container pt-2 pb-24 md:pb-6"
        )}
      >
        <NotificationPermissionRequest />
        {children}
      </main>
      <BottomNav />
    </div>
  );
};


// This is the main layout for the authenticated section of the app.
// It sets up context providers and the protection wrapper.
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <CityProvider>
        <SearchProvider>
          <AppInit />
          <ProtectedAppView>{children}</ProtectedAppView>
        </SearchProvider>
      </CityProvider>
  );
}
