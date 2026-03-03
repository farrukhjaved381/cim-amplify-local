'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { CheckCircle, Mail, Shield, ArrowRight, Users, Building, Star, Lock } from 'lucide-react';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  name: string;
}

export default function VerifyEmailSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const token = searchParams.get('token');
  const refreshToken = searchParams.get('refreshToken');
  const role = searchParams.get('role');
  const fullNameParam = searchParams.get('fullName');

  useEffect(() => {
    if (token && role) {
      try {
        const decoded: JwtPayload = jwtDecode(token);
        const userId = decoded.sub;

        setUserName(fullNameParam || decoded.name || 'User');
        setUserRole(role);

        localStorage.setItem('token', token);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        localStorage.setItem('userId', userId);
        localStorage.setItem('userRole', role);

        setTimeout(() => setIsLoading(false), 800);
      } catch (error) {
        router.push('/verify-email-failure');
      }
    } else {
      router.push('/verify-email-failure');
    }
  }, [token, role, refreshToken, router]);

  const handleContinue = () => {
    if (userRole === 'buyer') {
      const userId = localStorage.getItem('userId');
      if (userId) {
        router.push(`/buyer/acquireprofile?token=${encodeURIComponent(token as string)}&userId=${encodeURIComponent(userId)}`);
      } else {
        router.push('/verify-email-failure');
      }
    } else if (userRole === 'seller') {
      router.push('/seller/dashboard');
    } else {
      router.push('/login');
    }
  };

  if (!token || !role) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>
        
        {/* Loading Spinner */}
        <div className="relative">
          <div className="w-20 h-20 border-4 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-teal-400 rounded-full animate-spin animate-reverse delay-300"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute -bottom-40 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-float-slow"></div>
        
        {/* Particle Effect */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full animate-twinkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-teal-600/20 to-cyan-600/20 backdrop-blur-sm"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            {/* Success Icon with Advanced Animation */}
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-emerald-500 to-teal-500 backdrop-blur-sm rounded-full mb-8 shadow-2xl shadow-emerald-500/25 animate-success-bounce">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-white animate-check-draw" />
              </div>
              {/* Ripple Effects */}
              <div className="absolute inset-0 rounded-full border-2 border-emerald-400/50 animate-ping"></div>
              <div className="absolute inset-0 rounded-full border-2 border-teal-400/30 animate-ping animation-delay-300"></div>
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-200 to-teal-200 mb-6 animate-text-shimmer bg-300% tracking-tight">
              Email Verification Complete
            </h1>
            <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed animate-fade-in-up">
              Thank you, <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300">{userName}</span>! Your email has been successfully verified.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
        <div className="bg-white/10 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden border border-white/20 shadow-emerald-500/10">
          {/* Glass Morphism Header */}
          <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm px-8 py-8 border-b border-white/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5"></div>
            <div className="flex items-center justify-center relative">
              <div className="transform hover:scale-105 transition-all duration-500 ease-out">
                <img 
                  src="/illustration.png" 
                  alt="CIM Amplify Logo" 
                  className="h-48 w-auto filter drop-shadow-2xl" 
                />
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="px-8 py-8">
            <button
              onClick={handleContinue}
              className="w-full group relative overflow-hidden bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 text-white font-bold py-6 px-8 rounded-2xl shadow-2xl shadow-emerald-500/25 hover:shadow-emerald-400/30 transform hover:scale-[1.02] hover:-translate-y-1 transition-all duration-500 ease-out relative"
            >
              {/* Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-out"></div>
              
              {/* Button Content */}
              <div className="flex items-center justify-center space-x-3 relative z-10">
                <span className="text-xl font-bold tracking-wide">Continue to Your Dashboard</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 group-hover:scale-110 transition-all duration-300" />
              </div>

              {/* Glow Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>
            </button>
          </div>

          {/* Role-specific Content */}
          {userRole === 'buyer' && (
            <div className="px-8 pb-8">
              <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 backdrop-blur-sm rounded-2xl p-8 border border-blue-400/20 shadow-xl shadow-blue-500/10 hover:shadow-blue-400/20 transition-all duration-500 group">
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-200 transition-colors duration-300">Next Steps for Buyers:</h2>
                    <p className="text-white/80 mb-4 leading-relaxed text-lg">
                      Welcome to CIM Amplify! To get started, please complete your acquisition profile. This will help us match you with relevant deals.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {userRole === 'seller' && (
            <div className="px-8 pb-8">
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm rounded-2xl p-8 border border-green-400/20 shadow-xl shadow-green-500/10 hover:shadow-green-400/20 transition-all duration-500 group">
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/25 group-hover:scale-110 transition-transform duration-300">
                      <Building className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-4 group-hover:text-green-200 transition-colors duration-300">Next Steps for Advisors:</h2>
                    <p className="text-white/80 mb-4 leading-relaxed text-lg">
                      Welcome to CIM Amplify! You can now log in to your dashboard to add and manage your deals.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Email Instructions with Enhanced UI */}
          <div className="px-8 pb-8">
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm rounded-2xl p-8 border border-amber-400/20 shadow-xl shadow-amber-500/10">
              <div className="flex items-start space-x-6 mb-8">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/25">
                    <Mail className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                    <Shield className="w-6 h-6 mr-3 text-amber-400" />
                    IMPORTANT: IF YOU FOUND OUR VERIFICATION EMAIL IN YOUR JUNK OR SPAM FOLDER
                  </h2>
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <Shield className="w-6 h-6 mr-3 text-amber-400" />
                    How to Whitelist an Email Address or Domain
                  </h2>
                  <p className="text-white/80 mb-6 leading-relaxed text-lg">
                    Internet service providers sometimes restrict the kinds of emails that come into an organization, especially if they contain links. While that can reduce unwanted emails it can also block emails that a person is expecting or place them in a spam folder. For anyone working in an organization that restricts incoming emails, there are steps that can be taken to ensure you receive emails that you want.
                  </p>
                  <h3 className="font-bold text-white mb-3 text-xl">Whitelist Meaning</h3>
                  <p className="text-white/80 mb-6 leading-relaxed text-lg">
                    Whitelisting an email address means you are adding an address to an approved senders list and telling your email provider that you want messages from an email provider in your inbox. If you're wondering "why am I not receiving emails?" These procedures may help solve that issue.
                  </p>
                  <h3 className="font-bold text-white mb-4 text-xl">How to Whitelist an Email Address or Domain</h3>
                  <p className="text-white/80 mb-8 leading-relaxed text-lg">
                    Every email provider has slightly different steps and whitelisting directions are provided here for several common providers.
                  </p>

                  {/* Gmail Instructions */}
                  <div className="mb-8">
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
                      <h3 className="font-bold text-white mb-4 flex items-center text-lg">
                        <div className="w-8 h-8 bg-red-500/20 rounded-lg mr-3 flex items-center justify-center">
                          <Mail className="w-4 h-4 text-red-400" />
                        </div>
                        How to Whitelist an Email in a Gmail Account on a desktop or laptop computer
                      </h3>
                      <ul className="space-y-3 text-base text-white/70">
                        <li className="flex items-start">
                          <Star className="w-5 h-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                          Click on the settings button (the gear icon in the top-right corner) and click on "See all settings"
                        </li>
                        <li className="flex items-start">
                          <Star className="w-5 h-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                          Click on the tab at the top labeled "Filters and Blocked Addresses"
                        </li>
                        <li className="flex items-start">
                          <Star className="w-5 h-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                          Select "Create a new filter" and enter emails or domains you want to whitelist. To add any emails from Building Wings, Add @amp-ven.com in the From section. (amp-ven.com is the master domain of Amplify Ventures)
                        </li>
                        <li className="flex items-start">
                          <Star className="w-5 h-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                          If you use stars or labels you can add them to mark them as important, mark "Never send to spam" and then then click "Create filter" to approve the filter
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Gmail Mobile Instructions */}
                  <div className="mb-8">
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
                      <h3 className="font-bold text-white mb-4 flex items-center text-lg">
                        <div className="w-8 h-8 bg-red-500/20 rounded-lg mr-3 flex items-center justify-center">
                          <Mail className="w-4 h-4 text-red-400" />
                        </div>
                        How to Whitelist an Email in the Gmail mobile app
                      </h3>
                      <ul className="space-y-3 text-base text-white/70">
                        <li className="flex items-start">
                          <Star className="w-5 h-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                          Open gmail on your cell phone
                        </li>
                        <li className="flex items-start">
                          <Star className="w-5 h-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                          Navigate to the spam or junk folder and click on edit which is usually at the top
                        </li>
                        <li className="flex items-start">
                          <Star className="w-5 h-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                          Click on any messages that aren't spam
                        </li>
                        <li className="flex items-start">
                          <Star className="w-5 h-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                          Select either the "mark" or "move" function and move to inbox.
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Outlook Desktop Instructions */}
                  <div className="mb-8">
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
                      <h3 className="font-bold text-white mb-4 flex items-center text-lg">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg mr-3 flex items-center justify-center">
                          <Mail className="w-4 h-4 text-blue-400" />
                        </div>
                        How to Whitelist an Email in Outlook on a Desktop or Laptop computer
                      </h3>
                      <ul className="space-y-3 text-base text-white/70">
                        <li className="flex items-start">
                          <Star className="w-5 h-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                          Click on "Settings" and then "View all Outlook Settings."
                        </li>
                        <li className="flex items-start">
                          <Star className="w-5 h-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                          Go to "Junk email" and then choose "Safe Senders and Domains" or "Safe Mailing Lists" to select the domain or email you want to add such as
                        </li>
                        <li className="flex items-start">
                          <Star className="w-5 h-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                          Enter the domain name or individual email addresses you want to add. To receive emails from CIM Amplify, enter @amp-ven.com
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Outlook Mobile Instructions */}
                  <div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
                      <h3 className="font-bold text-white mb-4 flex items-center text-lg">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg mr-3 flex items-center justify-center">
                          <Mail className="w-4 h-4 text-blue-400" />
                        </div>
                        How to Whitelist an Email the Outlook mobile app
                      </h3>
                      <ul className="space-y-3 text-base text-white/70">
                        <li className="flex items-start">
                          <Star className="w-5 h-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                          Open the Outlook mobile app
                        </li>
                        <li className="flex items-start">
                          <Star className="w-5 h-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                          Click on the message you want to whitelist
                        </li>
                        <li className="flex items-start">
                          <Star className="w-5 h-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                          Click on the three dots in the right corner
                        </li>
                        <li className="flex items-start">
                          <Star className="w-5 h-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                          Click "Move to focused inbox"
                        </li>
                        <li className="flex items-start">
                          <Star className="w-5 h-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                          A "pop-up" screen will appear, when it does click "Move this and all future messages."
                        </li>
                        <li className="flex items-start">
                          <Star className="w-5 h-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                          If you've followed these steps and are still not receiving emails, it's suggested you contact your IT Department and ask if they can whitelist @amp-ven.com
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white/5 backdrop-blur-sm px-8 py-6 border-t border-white/10">
            <p className="text-center text-base text-white/60">
              © 2026 CIM Amplify. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Spacing */}
      <div className="h-16"></div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(-180deg); }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(90deg); }
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        
        @keyframes success-bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes check-draw {
          0% { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: 0; }
        }
        
        @keyframes text-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
        }
        
        .animate-twinkle {
          animation: twinkle 3s ease-in-out infinite;
        }
        
        .animate-success-bounce {
          animation: success-bounce 2s ease-in-out infinite;
        }
        
        .animate-check-draw {
          animation: check-draw 1s ease-out;
        }
        
        .animate-text-shimmer {
          animation: text-shimmer 3s ease-in-out infinite;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out;
        }
        
        .bg-300\% {
          background-size: 300%;
        }
        
        .animation-delay-300 {
          animation-delay: 0.3s;
        }
      `}</style>
    </div>
  );
}