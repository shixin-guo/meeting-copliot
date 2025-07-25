"use client";

import { useState, useRef, useEffect } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";

export function ChartsDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    // Add a small delay before closing to prevent flickering
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 100);
  };

  const handleMouseEnterDrawer = () => {
    // Clear timeout when entering the drawer
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleMouseLeaveDrawer = () => {
    setIsOpen(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Trigger area in bottom-left corner */}
      <div
        ref={triggerRef}
        className="fixed bottom-0 left-0 w-24 h-24 z-40 cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          background:
            "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)",
          backdropFilter: "blur(8px)",
          borderTopRightRadius: "12px",
        }}
      >
        {/* Optional: Add a subtle indicator */}
        <div className="absolute bottom-4 left-4 text-xs text-muted-foreground opacity-60">
          📊 Analytics
        </div>
      </div>

      {/* Drawer that slides in from the left */}
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent
          className="h-full max-h-none w-100"
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
            right: "auto",
            transform: isOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.3s ease-in-out",
          }}
          onMouseEnter={handleMouseEnterDrawer}
          onMouseLeave={handleMouseLeaveDrawer}
        >
          <DrawerHeader>
            <DrawerTitle>Analytics Dashboard</DrawerTitle>
            <DrawerDescription>Detailed sentiment and business analysis charts</DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 overflow-auto p-4 space-y-6">
            <div className="text-center text-muted-foreground py-8">
              <p>All analytics have been moved to the Management Bar</p>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
