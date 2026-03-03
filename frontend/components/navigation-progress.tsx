"use client";

import React, { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Custom event for programmatic navigation
const NAVIGATION_START_EVENT = "navigation-progress-start";

// Export function to trigger navigation progress from anywhere
export function triggerNavigationProgress() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(NAVIGATION_START_EVENT));
  }
}

function NavigationProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Reset progress when navigation completes
  useEffect(() => {
    setIsNavigating(false);
    setProgress(100);

    const timeout = setTimeout(() => {
      setProgress(0);
    }, 200);

    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

  // Animate progress while navigating
  useEffect(() => {
    if (!isNavigating) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        const increment = Math.random() * 10;
        return Math.min(prev + increment, 90);
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isNavigating]);

  // Listen for custom navigation start events (for router.push)
  useEffect(() => {
    const handleNavigationStart = () => {
      setIsNavigating(true);
      setProgress(10);
    };

    window.addEventListener(NAVIGATION_START_EVENT, handleNavigationStart);
    return () => window.removeEventListener(NAVIGATION_START_EVENT, handleNavigationStart);
  }, []);

  // Listen for click events on links
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");

      if (link) {
        const href = link.getAttribute("href");
        // Only trigger for internal navigation
        if (href && href.startsWith("/") && !href.startsWith("//")) {
          // Don't trigger for same page
          if (href !== pathname) {
            setIsNavigating(true);
            setProgress(10);
          }
        }
      }

      // Also check for buttons that might trigger navigation
      const button = target.closest("button");
      if (button) {
        // Check if button has data-navigate attribute
        const navigateTo = button.getAttribute("data-navigate");
        if (navigateTo && navigateTo !== pathname) {
          setIsNavigating(true);
          setProgress(10);
        }
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname]);

  if (progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 transition-all duration-200 ease-out shadow-lg shadow-teal-500/50"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transition: progress === 100 ? "opacity 200ms, width 200ms" : "width 200ms",
        }}
      />
    </div>
  );
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  );
}
