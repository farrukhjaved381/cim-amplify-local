"use client"

import Image from "next/image"
import { useState } from "react"

export function AmplifyVenturesBox() {
  const [acImageError, setAcImageError] = useState(false)
  const [pdsImageError, setPdsImageError] = useState(false)

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      {/* Banner Header */}
      <div className="bg-gradient-to-r from-[#3aafa9] to-[#2a9d8f] rounded-t-lg px-2 py-1.5">
        <p className="text-[10px] font-semibold text-white uppercase tracking-wider text-center">
          Other Amplify Ventures Products
        </p>
      </div>

      {/* Logo Cards Container */}
      <div className="bg-gradient-to-b from-gray-50 to-white border border-t-0 border-gray-200 rounded-b-lg p-2 space-y-2">
        {/* Advisor Chooser Card */}
        <a
          href="https://advisorchooser.com"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-between p-2 rounded-lg bg-white border border-gray-100 transition-all duration-300 hover:shadow-md hover:border-[#3aafa9]/40 hover:scale-[1.02]"
        >
          <div className="flex-1 flex items-center md:justify-center">
            {!acImageError ? (
              <div className="w-[110px] h-[36px] md:w-[150px] md:h-[50px] relative">
                <Image
                  src="/advisor-chooser-logo.png"
                  alt="Advisor Chooser"
                  fill
                  className="object-contain object-left md:object-center"
                  onError={() => setAcImageError(true)}
                />
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded-md bg-gradient-to-br from-[#3aafa9] to-[#2a9d8f] shadow-sm">
                <span className="text-white font-bold text-sm">Advisor Chooser</span>
              </div>
            )}
          </div>
          {/* Arrow indicator - only visible on mobile */}
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 group-hover:bg-[#3aafa9] flex md:hidden items-center justify-center transition-all duration-300 ml-2">
            <svg
              className="w-3 h-3 text-gray-400 group-hover:text-white transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
        </a>

        {/* Private Deal Service Card */}
        <a
          href="https://www.privatedealservice.com"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-between p-2 rounded-lg bg-white border border-gray-100 transition-all duration-300 hover:shadow-md hover:border-[#3aafa9]/40 hover:scale-[1.02]"
        >
          <div className="flex-1 flex items-center md:justify-center">
            {!pdsImageError ? (
              <div className="w-[110px] h-[36px] md:w-[150px] md:h-[50px] relative">
                <Image
                  src="/private-deal-service-logo.png"
                  alt="Private Deal Service"
                  fill
                  className="object-contain object-left md:object-center"
                  onError={() => setPdsImageError(true)}
                />
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded-md bg-gradient-to-br from-slate-700 to-slate-900 shadow-sm">
                <span className="text-white font-bold text-sm">Private Deal Service</span>
              </div>
            )}
          </div>
          {/* Arrow indicator - only visible on mobile */}
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 group-hover:bg-[#3aafa9] flex md:hidden items-center justify-center transition-all duration-300 ml-2">
            <svg
              className="w-3 h-3 text-gray-400 group-hover:text-white transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
        </a>
      </div>
    </div>
  )
}
