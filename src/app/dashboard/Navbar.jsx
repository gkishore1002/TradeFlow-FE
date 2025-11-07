// components/Navbar.jsx
"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import logo from "@/assets/logo.png";

const Navbar = ({ 
  activeTab, 
  toggleSidebar, 
  handleLogout,     
  isMobile,
  sidebarOpen,
  backendConnected = false
}) => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const router = useRouter();

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle logout
  const handleLogoutClick = () => {
    setProfileMenuOpen(false);
    handleLogout();
  };

  const menuItems = [
    {
      id: "profile",
      label: "Profile",
      icon: (
        <svg className="w-5 h-5 fill-slate-700" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      ),
      action: () => {
        router.push("/pages/profile");
        setProfileMenuOpen(false);
      }
    },
    {
      id: "help",
      label: "Help & Support",
      icon: (
        <svg className="w-5 h-5 fill-slate-700" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
      ),
      action: () => {
        router.push("/pages/help");
        setProfileMenuOpen(false);
      }
    },
    {
      id: "logout",
      label: "Logout",
      icon: (
        <svg className="w-5 h-5 fill-red-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17 12h-5v2h5v2l3-3-3-3v2zM16 1H2c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 18H2V3h14v16z"/>
        </svg>
      ),
      action: () => {
        handleLogoutClick();
      },
      isDanger: true
    }
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200 relative z-30">
      {/* Top Bar */}
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-2">
        <div className="flex items-center justify-between gap-2 sm:gap-3 md:gap-4">
          {/* Left Section - Hamburger, Logo & Status */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0">
            {/* Hamburger Menu Button */}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0"
              aria-label="Toggle Menu"
            >
              {sidebarOpen ? (
                <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* Logo & App Name */}
            <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
              {/* Logo Image - Increased Size with Negative Margin */}
              <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 flex-shrink-0 -my-2 sm:-my-2.5 md:-my-3">
                <Image
                  src={logo}
                  alt="TradeFlow Logo"
                  width={80}
                  height={80}
                  priority
                  className="w-full h-full object-contain"
                />
              </div>

              {/* App Name with Gradient */}
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent whitespace-nowrap hidden sm:block">
                TradeFlow
              </h2>
            </div>

            {/* Live Status - Next to Logo & App Name */}
            <div className="flex items-center gap-1.5 sm:gap-2 ml-1 sm:ml-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${backendConnected ? 'bg-green-500' : 'bg-orange-500'}`}></div>
              <span className={`text-xs font-semibold whitespace-nowrap ${backendConnected ? 'text-green-600' : 'text-orange-600'}`}>
                {backendConnected ? 'Live' : 'Demo'}
              </span>
            </div>
          </div>

          {/* Right Section - Profile Avatar Only */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0" ref={menuRef}>
            {/* Profile Avatar Button */}
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-blue-600 text-white font-bold text-sm sm:text-base flex items-center justify-center hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex-shrink-0"
              aria-label="Profile Menu"
              title="Profile"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {profileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 sm:w-64 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-[9999] animate-fade-in">
                {/* Header */}
                <div className="px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
                  <p className="text-sm font-semibold text-slate-900">Menu</p>
                </div>

                {/* Status Info */}
                <div className="px-4 sm:px-5 py-2 sm:py-3 bg-slate-50 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${backendConnected ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                    <span className={`text-xs font-medium ${backendConnected ? 'text-green-600' : 'text-orange-600'}`}>
                      {backendConnected ? '✅ Connected' : '⚠️ Demo Mode'}
                    </span>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  {menuItems.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={item.action}
                      className={`w-full flex items-center gap-3 px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-medium transition-colors duration-200 ${
                        item.isDanger
                          ? 'text-red-600 hover:bg-red-50'
                          : 'text-slate-700 hover:bg-slate-50'
                      } ${index < menuItems.length - 1 ? 'border-b border-slate-100' : ''}`}
                    >
                      <span className="flex-shrink-0">
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-4 sm:px-5 py-2 sm:py-3 bg-slate-50 border-t border-slate-200 text-center">
                  <p className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-600">TradeFlow</span> • v1.0
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.25s ease-out;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
