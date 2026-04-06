"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Bot } from "lucide-react";
import Chatbot from "@/components/seller/Chatbot";

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle button — inline next to Industry Selector label */}
      <Button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 rounded-full bg-teal-500 text-white shadow-sm px-3 py-1 h-auto text-xs hover:bg-teal-600 transition-colors"
      >
        {isOpen ? <X size={14} /> : <><Bot size={14} /><span>Need Help?</span></>}
      </Button>

      {isOpen && (
        <div className="fixed bottom-16 right-0 z-50 w-full bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col md:max-w-md md:right-8 md:bottom-8 h-fit max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <div className="flex items-center gap-2 text-teal-600 font-semibold text-sm">
              <Bot size={18} />
              <span>Industry Selector AI Help</span>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center rounded-md p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X size={16} />
            </button>
          </div>
          <Chatbot />
        </div>
      )}
    </>
  );
}
