// components/Navbar.jsx
"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import logo from "@/assets/logo.png";
import io from "socket.io-client";

const Navbar = ({
  activeTab,
  toggleSidebar,
  handleLogout,
  isMobile,
  sidebarOpen,
  backendConnected = false,
  setActiveTab
}) => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const menuRef = useRef(null);
  const notificationRef = useRef(null);
  const router = useRouter();

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

  // Get access token
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  };

  // Get user ID
  const getUserId = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('user_id');
    }
    return null;
  };

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_BASE}/api/notifications?per_page=5&sort_order=desc`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        mode: 'cors'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Notifications fetched:', data);
        setNotifications(data.items || []);
        
        // Fetch unread count separately
        fetchUnreadCount();
      }
    } catch (error) {
      console.error('❌ Failed to fetch notifications:', error);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_BASE}/api/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        mode: 'cors'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Unread count:', data.unread_count);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error('❌ Failed to fetch unread count:', error);
    }
  };

  // Initialize WebSocket connection
  useEffect(() => {
    const token = getAuthToken();
    const userId = getUserId();

    if (!token || !userId || !backendConnected) return;

    console.log('🔌 Connecting to WebSocket for notifications...');
    const newSocket = io(API_BASE, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected to navbar');
      newSocket.emit('join', { user_id: parseInt(userId) });
    });

    newSocket.on('joined', (data) => {
      console.log('✅ Joined notification room:', data);
      fetchNotifications();
    });

    newSocket.on('new_notification', (data) => {
      console.log('🔔 New notification received in navbar:', data);
      
      // Add notification to list (keep only latest 5)
      setNotifications(prev => [data, ...prev].slice(0, 5));
      setUnreadCount(prev => prev + 1);

      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(data.title, {
          body: data.message,
          icon: '/logo.png',
          tag: `notification-${data.id}`
        });
      }
    });

    newSocket.on('unread_count', (data) => {
      console.log('📊 Unread count updated:', data.count);
      setUnreadCount(data.count);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected from navbar');
    });

    setSocket(newSocket);

    // Initial fetch
    fetchNotifications();

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      if (newSocket) {
        newSocket.emit('leave', { user_id: parseInt(userId) });
        newSocket.disconnect();
      }
    };
  }, [backendConnected, API_BASE]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle logout
  const handleLogoutClick = () => {
    setProfileMenuOpen(false);
    if (socket) {
      socket.disconnect();
    }
    handleLogout();
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_BASE}/api/notifications/${notificationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        mode: 'cors'
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('❌ Failed to mark notification as read:', error);
    }
  };

  // Navigate to notification link or notifications page
  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    setNotificationMenuOpen(false);
    
    // Navigate to link if exists, otherwise to notifications page
    if (notification.link) {
      // If link is a dashboard tab, use setActiveTab
      const tabMatch = notification.link.match(/\/(dashboard|journal|strategies|analysis|logs|charts|notifications)/);
      if (tabMatch && setActiveTab) {
        setActiveTab(tabMatch[1]);
      } else {
        router.push(notification.link);
      }
    }
  };

  // Navigate to notifications page
  const goToNotifications = () => {
    setNotificationMenuOpen(false);
    if (setActiveTab) {
      setActiveTab('notifications');
    } else {
      router.push('/dashboard');
      // Set active tab after navigation
      setTimeout(() => {
        if (setActiveTab) setActiveTab('notifications');
      }, 100);
    }
  };

  // Format time ago
  const timeAgo = (dateString) => {
    if (!dateString) return 'Unknown';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const seconds = Math.floor((now - date) / 1000);

      if (seconds < 60) return 'Just now';
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
      if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
      return `${Math.floor(seconds / 86400)}d ago`;
    } catch (error) {
      return 'Unknown';
    }
  };

  // Get notification icon with background
  const getNotificationIcon = (type) => {
    const iconConfigs = {
      trade: {
        bgColor: 'bg-blue-100',
        iconColor: 'text-blue-600',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        )
      },
      analysis: {
        bgColor: 'bg-purple-100',
        iconColor: 'text-purple-600',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
      },
      strategy: {
        bgColor: 'bg-green-100',
        iconColor: 'text-green-600',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        )
      },
      alert: {
        bgColor: 'bg-red-100',
        iconColor: 'text-red-600',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
      },
      system: {
        bgColor: 'bg-slate-100',
        iconColor: 'text-slate-600',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )
      }
    };

    const config = iconConfigs[type] || iconConfigs.system;

    return (
      <div className={`w-9 h-9 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0 ${config.iconColor}`}>
        {config.icon}
      </div>
    );
  };

  const menuItems = [
    {
      id: "profile",
      label: "Profile",
      icon: (
        <svg className="w-5 h-5 fill-slate-700" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
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
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
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
          <path d="M17 12h-5v2h5v2l3-3-3-3v2zM16 1H2c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 18H2V3h14v16z" />
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
              {/* Logo Image */}
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

            {/* Live Status */}
            <div className="flex items-center gap-1.5 sm:gap-2 ml-1 sm:ml-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${backendConnected ? 'bg-green-500' : 'bg-orange-500'}`}></div>
              <span className={`text-xs font-semibold whitespace-nowrap ${backendConnected ? 'text-green-600' : 'text-orange-600'}`}>
                {backendConnected ? 'Live' : 'Demo'}
              </span>
            </div>
          </div>

          {/* Right Section - Notifications & Profile */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setNotificationMenuOpen(!notificationMenuOpen)}
                className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Notifications"
                title="Notifications"
              >
                <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                
                {/* Unread Badge */}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-red-600 rounded-full animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notificationMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-[9999] animate-fade-in max-h-[500px] flex flex-col">
                  {/* Header */}
                  <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Notifications</p>
                      {unreadCount > 0 && (
                        <p className="text-xs text-slate-600">{unreadCount} unread</p>
                      )}
                    </div>
                    <button
                      onClick={goToNotifications}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  {/* Notification List */}
                  <div className="overflow-y-auto flex-1">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-sm text-slate-500">No notifications yet</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {notifications.map((notification) => (
                          <button
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`w-full p-4 hover:bg-slate-50 transition-colors text-left ${
                              !notification.is_read ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex gap-3">
                              {/* Icon with background */}
                              <div className="flex-shrink-0">
                                {getNotificationIcon(notification.type)}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className={`text-sm font-medium text-slate-900 ${
                                    !notification.is_read ? 'font-semibold' : ''
                                  }`}>
                                    {notification.title}
                                  </p>
                                  {!notification.is_read && (
                                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1.5 animate-pulse"></div>
                                  )}
                                </div>
                                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                  {timeAgo(notification.created_at)}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-center flex-shrink-0">
                      <button
                        onClick={goToNotifications}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                      >
                        See all notifications →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Menu */}
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

              {/* Profile Dropdown Menu */}
              {profileMenuOpen && (
                <div className="absolute right-3 sm:right-4 md:right-6 lg:right-8 top-full mt-2 w-56 sm:w-64 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-[9999] animate-fade-in">
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
                      <span className="font-semibold text-slate-600">TradeFlow</span> • v2.0
                    </p>
                  </div>
                </div>
              )}
            </div>
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
