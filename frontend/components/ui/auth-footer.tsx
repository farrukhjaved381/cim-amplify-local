import { Linkedin } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

export default function Footer() {
  const router = useRouter();
  const pathname = usePathname();

  // Helper to handle quick link navigation
  const handleQuickLink = (hash: string) => {
    if (pathname === "/landing") {
      // If already on landing, scroll smoothly
      const el = document.getElementById(hash.replace("#", ""));
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      } else {
        // fallback: set hash, browser will jump
        window.location.hash = hash;
      }
    } else {
      // If not on landing, navigate to landing with hash
      router.push(`/landing${hash}`);
    }
  };

  return (
    <footer className="footer-background py-8 relative" style={{ backgroundColor: '#17252A', minHeight: '220px' }}>
      <div className="container mx-auto px-4 flex flex-col items-center justify-center relative">
        <div className="flex flex-col sm:flex-row justify-center items-center w-full max-w-5xl gap-8 sm:gap-16 md:gap-40">
          {/* Quick Links */}
          <div className="footer-section flex flex-col items-center">
            <h3 className="text-lg font-semibold mb-3" style={{ color: '#3AAFA9' }}>
              QUICK LINKS
            </h3>
            <ul className="space-y-1 text-center">
              <li>
                <a
                  href="https://cimamplify.com/#Benefits"
                  target="_self"
                  rel="noopener noreferrer"
                  className="text-white hover:text-[#229273] transition-colors duration-300 block py-1"
                >
                  Benefits
                </a>
              </li>
              <li>
                <a
                  href="https://cimamplify.com/#How%20it%20Works"
                  target="_self"
                  rel="noopener noreferrer"
                  className="text-white hover:text-[#229273] transition-colors duration-300 block py-1"
                >
                  How it Works
                </a>
              </li>
              <li>
                <a
                  href="https://cimamplify.com/#Guidelines"
                  target="_self"
                  rel="noopener noreferrer"
                  className="text-white hover:text-[#229273] transition-colors duration-300 block py-1"
                >
                  Guidelines
                </a>
              </li>
              <li>
                <a
                  href="https://cimamplify.com/#FAQs"
                  target="_self"
                  rel="noopener noreferrer"
                  className="text-white hover:text-[#229273] transition-colors duration-300 block py-1"
                >
                  FAQs
                </a>
              </li>
              <li>
                <a
                  href="https://cimamplify.com/about"
                  target="_self"
                  rel="noopener noreferrer"
                  className="text-white hover:text-[#229273] cursor-pointer transition-colors duration-300 block py-1"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="https://cimamplify.com/contact"
                  target="_self"
                  rel="noopener noreferrer"
                  className="text-white hover:text-[#229273] cursor-pointer transition-colors duration-300 block py-1"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="footer-section flex flex-col items-center">
            <h3 className="text-lg font-semibold mb-3" style={{ color: '#3AAFA9' }}>
              ACTIONS
            </h3>
            <div className="space-y-1 text-center">
              <div
                onClick={() => router.push("/buyer/register")}
                className="text-white hover:text-[#229273] block py-1 cursor-pointer transition-colors duration-300"
              >
                Buyer registration
              </div>
              <a
                 onClick={() => router.push("/seller/login")}
                target="_self"
                rel="noopener noreferrer"
                className="text-white hover:text-[#229273] block py-1 cursor-pointer transition-colors duration-300"
              >
                Add a Deal
              </a>
              <div
                onClick={() => router.push("/buyer/login")}
                className="text-white hover:text-[#229273] block py-1 cursor-pointer transition-colors duration-300"
              >
                Buyer Login
              </div>
              <a
                href="/seller/login"
                target="_self"
                rel="noopener noreferrer"
                className="text-white hover:text-[#229273] block py-1 cursor-pointer transition-colors duration-300"
              >
                Seller Login
              </a>
            </div>
            <div className="mt-6">
              <a
                href="https://www.linkedin.com/company/cimamplify/"
                className="inline-flex items-center justify-center w-12 h-12 rounded-full text-white border-2 border-white hover:border-[#229273] hover:text-[#229273] transition-all duration-300"
                style={{ backgroundColor: 'transparent' }}
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright - positioned absolutely on desktop, normally on mobile/tablet */}
        <div className="lg:absolute lg:right-4 lg:bottom-4 mt-8 lg:mt-0">
          <p className="text-gray-400 text-sm text-center">
            © 2025 CIM Amplify. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}