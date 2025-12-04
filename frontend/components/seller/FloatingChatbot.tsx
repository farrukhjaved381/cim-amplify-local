"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, X, Bot } from "lucide-react";
import Chatbot from "@/components/seller/Chatbot";

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle button - always visible but changes position when open */}
      <div className={`${isOpen ? 'fixed top-10 right-9 z-[60]' : 'absolute right-2 -top-3'} z-50`}>
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className=" inline-flex items-center justify-center space-x-2 rounded-full bg-teal-500  text-white shadow-lg transition-transform transform px-4 py-2 w-auto h-auto text-base"
        >
          {isOpen ? <X size={18} /> : <><Bot size={20} /><span className="text-xs ">Need Help ?</span></>}
        </Button>
      </div>

      {isOpen && (
        <div className="fixed bottom-16 right-0 z-50 w-full bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col md:max-w-md md:right-8 md:bottom-8 h-fit max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <div className="flex items-center gap-2 text-teal-600 font-semibold">
              <Bot size={18} />
              <span> Industry Selector AI Help</span>
            </div>
            {/* <button
              type="button"
              aria-label="Close chatbot"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <X size={18} />
            </button> */}
            
          </div>
          <Chatbot />
        </div>
      )}
    </>
  );
}