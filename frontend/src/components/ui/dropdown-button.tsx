"use client";

import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

interface DropdownButtonProps {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
  variant?: "ghost" | "default" | "outline";
  className?: string;
  ariaLabel?: string;
  maxHeight?: number;
}

export function DropdownButton({
  label,
  isOpen,
  onToggle,
  children,
  variant = "ghost",
  className = "",
  ariaLabel,
}: DropdownButtonProps) {
  return (
    <>
      <Button
        variant={variant}
        className={`h-6 flex items-center space-x-2 rounded-lg px-2 py-0  transition-colors duration-150 ${className} 
          
        }`}
        onClick={onToggle}
        aria-label={ariaLabel || label}
      >
        <span className="">{label}</span>
      </Button>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute top-full left-0 mt-2 w-full bg-background/70 backdrop-blur-sm border border-border rounded-lg shadow-xl z-50 max-h-180 overflow-y-auto"
        >
          <div className="p-2">{children}</div>
        </motion.div>
      )}
    </>
  );
}
