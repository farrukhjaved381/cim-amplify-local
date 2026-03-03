"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, ButtonProps } from "@/components/ui/button";

interface AnimatedButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
  successText?: string;
  showSuccess?: boolean;
  icon?: React.ReactNode;
  loadingIcon?: React.ReactNode;
}

const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  (
    {
      className,
      children,
      isLoading = false,
      loadingText,
      successText,
      showSuccess = false,
      icon,
      loadingIcon,
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isLoading || disabled) return;
      onClick?.(e);
    };

    return (
      <Button
        ref={ref}
        className={cn(
          "relative overflow-hidden transition-all duration-200",
          "active:scale-[0.98] hover:scale-[1.02]",
          "disabled:pointer-events-none disabled:opacity-70",
          className
        )}
        disabled={disabled || isLoading}
        onClick={handleClick}
        {...props}
      >
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.span
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-center"
            >
              {loadingIcon || (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {loadingText || "Loading..."}
            </motion.span>
          ) : showSuccess ? (
            <motion.span
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center justify-center"
            >
              <motion.svg
                className="mr-2 h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3 }}
              >
                <motion.path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </motion.svg>
              {successText || "Success!"}
            </motion.span>
          ) : (
            <motion.span
              key="default"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center justify-center"
            >
              {icon && <span className="mr-2">{icon}</span>}
              {children}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";

// Action button with specific loading spinner for Pass/Activate actions
interface ActionButtonProps extends Omit<AnimatedButtonProps, "loadingIcon"> {
  actionType?: "pass" | "activate" | "request" | "default";
}

const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ actionType = "default", className, ...props }, ref) => {
    const getLoadingIcon = () => {
      const colorClass =
        actionType === "pass"
          ? "text-red-500"
          : actionType === "activate"
          ? "text-[#3AAFA9]"
          : "text-current";

      return (
        <svg
          className={cn("animate-spin -ml-1 mr-2 h-4 w-4", colorClass)}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      );
    };

    const getButtonStyles = () => {
      switch (actionType) {
        case "pass":
          return "border-red-200 bg-[#E3515333] text-red-500 hover:bg-red-50 disabled:opacity-70";
        case "activate":
          return "border-blue-200 bg-[#3AAFA922] text-[#3AAFA9] hover:bg-[#3AAFA933] disabled:opacity-70";
        case "request":
          return "bg-[#3AAFA9] text-white hover:bg-[#2d8f8a] disabled:opacity-70";
        default:
          return "";
      }
    };

    return (
      <AnimatedButton
        ref={ref}
        className={cn(getButtonStyles(), className)}
        loadingIcon={getLoadingIcon()}
        {...props}
      />
    );
  }
);

ActionButton.displayName = "ActionButton";

export { AnimatedButton, ActionButton };
