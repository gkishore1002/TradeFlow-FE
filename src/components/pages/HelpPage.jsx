"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { API_BASE_URL } from "@/lib/constants";

export default function HelpPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);

  const faqs = {
    general: [
      {
        id: 1,
        question: "What is TradeFlow?",
        answer: "TradeFlow is a trading journal and analysis platform to help traders track and improve their trading performance."
      },
      {
        id: 2,
        question: "How do I create a trade entry?",
        answer: "Go to 'My Journal', click 'Add New Trade', and fill in entry price, exit price, quantity, and strategy notes."
      },
      {
        id: 3,
        question: "Can I export my data?",
        answer: "Export functionality is coming in the next update. Currently available for viewing within the platform."
      },
      {
        id: 4,
        question: "Is my data secure?",
        answer: "Yes, all data is encrypted and stored securely with industry-standard security protocols."
      }
    ],
    account: [
      {
        id: 5,
        question: "How do I reset password?",
        answer: "Click profile icon, select 'Profile', then 'Change Password' and follow the instructions."
      },
      {
        id: 6,
        question: "Can I delete my account?",
        answer: "Yes, you can delete your account from profile settings. This action is permanent and cannot be undone."
      },
      {
        id: 7,
        question: "How do I update profile?",
        answer: "Go to 'Profile', click 'Edit Profile', make changes, and click 'Save Changes'."
      }
    ],
    trading: [
      {
        id: 8,
        question: "How do I analyze performance?",
        answer: "View overall statistics on the Dashboard. Visit 'Success Logs' to review individual trades."
      },
      {
        id: 9,
        question: "What strategies can I track?",
        answer: "You can create and track any trading strategy from 'My Strategies' section."
      },
      {
        id: 10,
        question: "How do I use Pre Trade Analysis?",
        answer: "Plan trades before execution. Document setup, entry points, and exit targets."
      }
    ],
    billing: [
      {
        id: 11,
        question: "Is TradeFlow free?",
        answer: "TradeFlow offers a free tier with basic features. Premium features coming soon."
      },
      {
        id: 12,
        question: "What payment methods?",
        answer: "We accept major credit cards and PayPal. Payment integration available with premium launch."
      }
    ]
  };

  const categories = [
    { id: "general", label: "General", icon: "?" },
    { id: "account", label: "Account", icon: "👤" },
    { id: "trading", label: "Trading", icon: "📈" },
    { id: "billing", label: "Billing", icon: "💳" }
  ];

  const contactDetails = [
    {
      id: 1,
      type: "Email",
      value: "support@tradeflow.com",
      href: "mailto:support@tradeflow.com"
    },
    {
      id: 2,
      type: "Response Time",
      value: "Within 24 hours"
    },
    {
      id: 3,
      type: "Availability",
      value: "Mon - Fri, 9 AM - 6 PM"
    }
  ];

  // Get JWT Token
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  };

  // Check backend status by calling an existing endpoint
  const checkBackendStatus = useCallback(async () => {
    try {
      const token = getAuthToken();

      // If no token, backend is not accessible
      if (!token) {
        setBackendConnected(false);
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      // Try to call an endpoint we know exists: /api/auth/profile
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // If we get any response (200, 400, 404, 500, etc), backend is running
      if (response) {
        setBackendConnected(true);
      } else {
        setBackendConnected(false);
      }
    } catch (error) {
      // Silent fail - backend is not responding
      // Don't log errors to console to avoid spam
      setBackendConnected(false);
    }
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileScreen = window.innerWidth < 768;
      setIsMobile(isMobileScreen);
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Check backend connection on mount
    checkBackendStatus();

    // Check backend connection every 30 seconds
    const healthCheckInterval = setInterval(() => {
      checkBackendStatus();
    }, 30000);

    return () => {
      window.removeEventListener('resize', checkMobile);
      clearInterval(healthCheckInterval);
    };
  }, [checkBackendStatus]);

  const filteredFaqs = faqs[selectedCategory];

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("first_name");
    localStorage.removeItem("last_name");
    localStorage.removeItem("email");
    localStorage.removeItem("phone");
    localStorage.removeItem("address");
    setSidebarOpen(false);
    router.push("/login");
  };

  const navigateToDashboard = () => {
    setSidebarOpen(false);
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-blue-50">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
        handleLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          activeTab="help"
          toggleSidebar={toggleSidebar}
          handleLogout={handleLogout}
          isMobile={isMobile}
          sidebarOpen={sidebarOpen}
          backendConnected={backendConnected}
        />

        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumbs */}
            <div className="mb-6 sm:mb-8 flex items-center gap-2 text-xs sm:text-sm">
              <button
                onClick={navigateToDashboard}
                className="text-[#f15f26] hover:text-[#d94e1f] font-medium transition-colors hover:underline"
              >
                Dashboard
              </button>
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-slate-600 font-medium">Help & Support</span>
            </div>

            {/* Main Layout - Two Columns on Desktop, Single Column on Mobile */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Left Sidebar Navigation */}
              <div className="md:col-span-1">
                <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden sticky top-6">
                  <div className="p-3 sm:p-4 space-y-1">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => {
                          setSelectedCategory(category.id);
                          if (isMobile) {
                            setSidebarOpen(false);
                          }
                        }}
                        className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-all text-left text-sm ${selectedCategory === category.id
                          ? 'bg-[#f15f26]/10 border-l-4 border-[#f15f26] text-[#f15f26] font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                          }`}
                      >
                        <svg
                          className={`w-5 h-5 flex-shrink-0 ${selectedCategory === category.id ? 'text-[#f15f26]' : 'text-slate-600'
                            }`}
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          {category.id === "general" && (
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                          )}
                          {category.id === "account" && (
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                          )}
                          {category.id === "trading" && (
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2V17zm4 0h-2V7h2V17zm4 0h-2v-4h2V17z" />
                          )}
                          {category.id === "billing" && (
                            <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-8c0-.55-.45-1-1-1s-1 .45-1 1v7H3V6h14v2c0 .55.45 1 1 1s1-.45 1-1V8c0-.55-.45-1-1-1z" />
                          )}
                        </svg>
                        <span>{category.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Content Area */}
              <div className="md:col-span-3">
                {/* Header Section */}
                <div className="mb-6 sm:mb-8">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-1 sm:mb-2">Help & Support</h1>
                  <p className="text-xs sm:text-sm text-slate-600">Find answers to common questions</p>
                </div>

                {/* FAQs List */}
                <div className="space-y-2 sm:space-y-3 mb-8 sm:mb-10">
                  {filteredFaqs.length > 0 ? (
                    filteredFaqs.map((faq) => (
                      <details
                        key={faq.id}
                        className="group bg-white rounded-lg border border-slate-200 overflow-hidden hover:border-[#f15f26]/50 hover:shadow-sm transition-all duration-300"
                      >
                        <summary className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between font-medium text-slate-800 hover:bg-slate-50 cursor-pointer transition-colors text-xs sm:text-sm md:text-base">
                          <span className="pr-2 text-left">{faq.question}</span>
                          <svg
                            className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 transition-transform duration-300 flex-shrink-0 group-open:rotate-180"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        </summary>
                        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 text-slate-700 border-t border-slate-200 text-xs sm:text-sm leading-relaxed">
                          {faq.answer}
                        </div>
                      </details>
                    ))
                  ) : (
                    <div className="text-center py-8 sm:py-12">
                      <svg className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-2 sm:mb-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                      </svg>
                      <p className="text-slate-600 font-medium text-xs sm:text-sm">No questions found</p>
                    </div>
                  )}
                </div>

                {/* Contact Section - Card Design */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
                  {/* Header */}
                  <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 bg-[#f15f26]">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-white flex items-center gap-2">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12h-8v2h8v-2zm0-3h-8v2h8V11zm0-3H4V6h14v2z" />
                      </svg>
                      Contact Us
                    </h3>
                  </div>

                  {/* Details */}
                  <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 space-y-3 sm:space-y-4">
                    {contactDetails.map((detail, index) => (
                      <div
                        key={detail.id}
                        className={`flex items-start gap-3 ${index !== contactDetails.length - 1 ? 'pb-3 sm:pb-4 border-b border-slate-200' : 'pb-0'
                          }`}
                      >
                        <svg
                          className="w-5 h-5 sm:w-6 sm:h-6 text-[#f15f26] flex-shrink-0 mt-0.5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          {detail.type === "Email" && (
                            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                          )}
                          {detail.type === "Response Time" && (
                            <path d="M11.99 5C6.47 5 2 9.48 2 15s4.47 10 9.99 10C17.52 25 22 20.52 22 15s-4.48-10-10.01-10zM15.5 15.1h-4v4h-1.5v-5.5h5.5v1.5z" />
                          )}
                          {detail.type === "Availability" && (
                            <path d="M11.99 5C6.47 5 2 9.48 2 15s4.47 10 9.99 10C17.52 25 22 20.52 22 15s-4.48-10-10.01-10zM12 20c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
                          )}
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-slate-700">{detail.type}</p>
                          {detail.href ? (
                            <a
                              href={detail.href}
                              className="text-xs sm:text-sm text-[#f15f26] hover:text-[#d94e1f] hover:underline break-all transition-colors"
                            >
                              {detail.value}
                            </a>
                          ) : (
                            <p className="text-xs sm:text-sm text-slate-600">{detail.value}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer Message */}
                  <div className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-[#f15f26]/10 border-t border-slate-200 flex items-start gap-2">
                    <svg className="w-4 h-4 text-[#f15f26] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                    <p className="text-xs sm:text-sm text-slate-700">
                      <span className="font-semibold">Tip:</span> Email us for detailed support. We typically respond within 24 hours.
                    </p>
                  </div>
                </div>

                {/* Info Message */}
                <div className="mt-6 sm:mt-8 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                  <p className="text-green-800 font-medium text-xs sm:text-sm">
                    Found what you're looking for? Great! If you need further assistance, don't hesitate to contact our support team.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        details summary::-webkit-details-marker {
          display: none;
        }

        details > summary {
          list-style: none;
        }
      `}</style>
    </div>
  );
}
