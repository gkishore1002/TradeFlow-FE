// components/Sidebar.jsx
"use client";
import React, { useEffect } from "react";
import { useRouter, usePathname } from 'next/navigation';
import Image from "next/image";
import logo from "@/assets/logo.png";

const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  sidebarOpen, 
  setSidebarOpen, 
  isMobile,
  handleLogout
}) => {
  const menuItems = [
    {
      id: "dashboard",
      name: "Dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z"></path>
        </svg>
      )
    },
    {
      id: "journal",
      name: "My Journal",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
        </svg>
      )
    },
    {
      id: "strategies",
      name: "My Strategies",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a1 1 0 01-1-1V9a1 1 0 011-1h1a2 2 0 100-4H4a1 1 0 01-1-1V4a1 1 0 011-1h3a1 1 0 011 1v1a2 2 0 002-2z"></path>
        </svg>
      )
    },
    {
      id: "analysis",
      name: "Pre Trade Analysis",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
        </svg>
      )
    },
    {
      id: "logs",
      name: "Success Logs",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      )
    }
  ];

  const router = useRouter();
  const pathname = usePathname();

  // Auto-close sidebar on pathname change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  const handleNavigation = (item) => {
    // Update active tab
    if (typeof setActiveTab === 'function') {
      setActiveTab(item.id);
    }

    // Close sidebar immediately before navigation
    setSidebarOpen(false);

    // Navigate
    try {
      if (pathname !== '/dashboard') {
        router.push(`/dashboard?tab=${item.id}`);
      } else {
        router.replace(`/dashboard?tab=${item.id}`);
      }
    } catch (e) {
      console.error('Navigation error:', e);
    }
  };

  const handleLogoClick = () => {
    if (typeof setActiveTab === 'function') {
      setActiveTab('dashboard');
    }

    // Close sidebar immediately before navigation
    setSidebarOpen(false);

    try {
      router.push('/dashboard?tab=dashboard');
    } catch (e) {
      console.error('Navigation error:', e);
    }
  };

  const handleLogoutClick = () => {
    // Close sidebar immediately before logout
    setSidebarOpen(false);
    
    // Call logout handler
    if (typeof handleLogout === 'function') {
      handleLogout();
    }
  };

  return (
    <>
      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full z-50 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        w-64 bg-white shadow-2xl
      `}>
        <div className="p-4 lg:p-6 h-full flex flex-col overflow-y-auto">
          {/* Header with Logo and Close Button */}
          <div className="flex items-center justify-between mb-6 lg:mb-8">
            {/* Logo Section */}
            <button
              onClick={handleLogoClick}
              className="flex items-center gap-2.5 lg:gap-3 transition-all duration-300 flex-1 hover:opacity-80"
            >
              {/* Logo Image */}
              <div className="w-10 h-10 lg:w-12 lg:h-12 flex-shrink-0">
                <Image
                  src={logo}
                  alt="TradeFlow Logo"
                  width={48}
                  height={48}
                  priority
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-lg lg:text-xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent whitespace-nowrap">
                TradeFlow
              </h1>
            </button>

            {/* Close Button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-auto p-2 rounded-lg hover:bg-slate-100 transition-colors duration-200 flex-shrink-0"
              aria-label="Close Sidebar"
            >
              <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-slate-200 to-transparent mb-4"></div>

          {/* Navigation */}
          <nav className="space-y-2 flex-1">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
                className={`w-full flex items-center justify-start space-x-3 px-3 py-2 lg:px-4 lg:py-3 rounded-xl transition-all duration-200 ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                {item.icon}
                <span className="font-medium text-sm lg:text-base">{item.name}</span>
              </button>
            ))}
          </nav>

          {/* Footer Section with Logout */}
          <div className="pt-4 border-t border-slate-200 mt-4">
            <button 
              onClick={handleLogoutClick}
              className="w-full flex items-center justify-start space-x-3 px-3 py-2 lg:px-4 lg:py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
              <span className="font-medium text-sm lg:text-base">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
