"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, Info, CheckCircle } from "lucide-react";

type ConfirmDialogVariant = "danger" | "warning" | "info" | "success";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  variant?: ConfirmDialogVariant;
  isLoading?: boolean;
}

const variantStyles: Record<ConfirmDialogVariant, {
  icon: React.ReactNode;
  iconBg: string;
  buttonClass: string;
}> = {
  danger: {
    icon: <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />,
    iconBg: "bg-red-100",
    buttonClass: "bg-red-600 hover:bg-red-700 text-white",
  },
  warning: {
    icon: <AlertTriangle className="h-6 w-6 text-amber-600" aria-hidden="true" />,
    iconBg: "bg-amber-100",
    buttonClass: "bg-amber-600 hover:bg-amber-700 text-white",
  },
  info: {
    icon: <Info className="h-6 w-6 text-blue-600" aria-hidden="true" />,
    iconBg: "bg-blue-100",
    buttonClass: "bg-blue-600 hover:bg-blue-700 text-white",
  },
  success: {
    icon: <CheckCircle className="h-6 w-6 text-green-600" aria-hidden="true" />,
    iconBg: "bg-green-100",
    buttonClass: "bg-green-600 hover:bg-green-700 text-white",
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "danger",
  isLoading = false,
}: ConfirmDialogProps) {
  const [localLoading, setLocalLoading] = React.useState(false);
  const styles = variantStyles[variant];
  const loading = isLoading || localLoading;

  const handleConfirm = async () => {
    setLocalLoading(true);
    try {
      await onConfirm();
    } finally {
      setLocalLoading(false);
    }
  };

  const handleCancel = () => {
    if (loading) return;
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !loading && onOpenChange(isOpen)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${styles.iconBg} flex-shrink-0`}>
              {styles.icon}
            </div>
            <div className="flex-1 pt-1">
              <DialogTitle className="text-lg font-semibold text-gray-900">
                {title}
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm text-gray-600">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="mt-6 flex gap-3 sm:gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 sm:flex-none ${styles.buttonClass} transition-all duration-200`}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook for easier usage
export function useConfirmDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [config, setConfig] = React.useState<Omit<ConfirmDialogProps, "open" | "onOpenChange">>({
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const confirm = React.useCallback(
    (options: Omit<ConfirmDialogProps, "open" | "onOpenChange">) => {
      return new Promise<boolean>((resolve) => {
        setConfig({
          ...options,
          onConfirm: async () => {
            await options.onConfirm();
            setIsOpen(false);
            resolve(true);
          },
          onCancel: () => {
            options.onCancel?.();
            setIsOpen(false);
            resolve(false);
          },
        });
        setIsOpen(true);
      });
    },
    []
  );

  const ConfirmDialogComponent = React.useMemo(
    () => (
      <ConfirmDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        {...config}
      />
    ),
    [isOpen, config]
  );

  return { confirm, ConfirmDialogComponent };
}
