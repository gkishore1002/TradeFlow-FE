// src/app/dashboard/page.jsx
"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import MyStrategies from "./MyStrategies";
import MyJournal from "./MyJournal";
import PreTradeAnalysis from "./PreTradeAnalysis";
import SuccessLogs from "./SuccessLogs";
import Charts from "./Charts";
import Notifications from "./Notifications";


// Enhanced Success/Loss Ratio Card Component
const SuccessLossRatioCard = ({ stats, className }) => {
  const totalTrades = (stats.success || 0) + (stats.loss || 0);
  const successRatio = totalTrades > 0 ? ((stats.success || 0) / totalTrades) * 100 : 0;
  const lossRatio = totalTrades > 0 ? ((stats.loss || 0) / totalTrades) * 100 : 0;

  return (
    <div className={`bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl border border-white/40 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <div>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent">
            Performance Overview
          </h2>
          <p className="text-slate-600 mt-1 text-xs sm:text-sm lg:text-base">Success vs Loss Analysis</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-2 text-xs sm:text-sm text-slate-500">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span>Live Data</span>
        </div>
      </div>

      {/* Enhanced Visual Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* Circular Progress Chart */}
        <div className="flex items-center justify-center">
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="45" fill="none" stroke="url(#successGradient)" strokeWidth="8"
                strokeDasharray={`${(successRatio * 283) / 100} 283`}
                strokeLinecap="round" className="transition-all duration-1000 ease-in-out"
              />
              <circle
                cx="50" cy="50" r="45" fill="none" stroke="url(#lossGradient)" strokeWidth="8"
                strokeDasharray={`${(lossRatio * 283) / 100} 283`}
                strokeDashoffset={`-${(successRatio * 283) / 100}`}
                strokeLinecap="round" className="transition-all duration-1000 ease-in-out"
              />
              <defs>
                <linearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="lossGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#dc2626" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-center">
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-slate-800">{totalTrades}</p>
                <p className="text-xs text-slate-500 font-medium">Total Trades</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="space-y-3 sm:space-y-4">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg sm:rounded-2xl p-3 sm:p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-green-700">Winning Trades</p>
                  <p className="text-xs text-green-600">{successRatio.toFixed(1)}% success rate</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg sm:text-2xl font-bold text-green-700">{stats.success || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg sm:rounded-2xl p-3 sm:p-4 border border-red-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-red-700">Losing Trades</p>
                  <p className="text-xs text-red-600">{lossRatio.toFixed(1)}% loss rate</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg sm:text-2xl font-bold text-red-700">{stats.loss || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 pt-4 sm:pt-6 border-t border-slate-200">
        <div className="text-center p-2 sm:p-0">
          <p className="text-xs text-slate-600 mb-1">Win Rate</p>
          <p className="text-base sm:text-lg lg:text-xl font-bold text-green-600">{successRatio.toFixed(1)}%</p>
        </div>
        <div className="text-center p-2 sm:p-0">
          <p className="text-xs text-slate-600 mb-1">Loss Rate</p>
          <p className="text-base sm:text-lg lg:text-xl font-bold text-red-600">{lossRatio.toFixed(1)}%</p>
        </div>
        <div className="text-center p-2 sm:p-0">
          <p className="text-xs text-slate-600 mb-1">Total P&L</p>
          <p className={`text-base sm:text-lg lg:text-xl font-bold ${(stats.totalPnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${(stats.totalPnl || 0).toFixed(2)}
          </p>
        </div>
        <div className="text-center p-2 sm:p-0">
          <p className="text-xs text-slate-600 mb-1">Avg P&L</p>
          <p className="text-base sm:text-lg lg:text-xl font-bold text-slate-800">
            ${totalTrades > 0 ? ((stats.totalPnl || 0) / totalTrades).toFixed(0) : '0'}
          </p>
        </div>
      </div>
    </div>
  );
};


// Enhanced Recent Trades Table Component
const RecentTradesTable = ({ trades, formatCurrency }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const sortedTrades = useMemo(() => {
    if (!sortConfig.key) return trades;

    return [...trades].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [trades, sortConfig]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getStatusColor = (profitLoss) => {
    if (profitLoss > 0) return 'text-green-600';
    if (profitLoss < 0) return 'text-red-600';
    return 'text-slate-600';
  };

  const getStatusBadgeColor = (profitLoss) => {
    if (profitLoss > 0) return "bg-green-100 text-green-800";
    if (profitLoss < 0) return "bg-red-100 text-red-800";
    return "bg-yellow-100 text-yellow-800";
  };

  if (trades.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 lg:p-12">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-1 sm:mb-2">No Recent Trades</h3>
          <p className="text-xs sm:text-sm text-slate-600">Start by adding your first trade to see it here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-slate-100 p-3 sm:p-4 md:p-6 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <div>
            <h3 className="text-base sm:text-lg lg:text-2xl font-bold text-slate-900">
              Recent Trades
            </h3>
            <p className="text-xs sm:text-sm lg:text-base text-slate-600 mt-1">
              Latest {trades.length} trading activities
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden">
        <div className="divide-y divide-slate-200">
          {sortedTrades.map((trade, index) => (
            <div key={trade.id || index} className="p-3 sm:p-4 hover:bg-slate-50 transition">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 text-base">{trade.symbol || 'N/A'}</h4>
                  <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(trade.profit_loss || 0)}`}>
                    {(trade.profit_loss || 0) > 0 ? 'Win' : (trade.profit_loss || 0) < 0 ? 'Loss' : 'Breakeven'}
                  </span>
                </div>
                <div className={`text-right font-bold text-sm flex-shrink-0 ml-2 ${getStatusColor(trade.profit_loss || 0)}`}>
                  {formatCurrency(trade.profit_loss || 0)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs mb-3">
                <div>
                  <p className="text-slate-600 text-xs">Entry Price</p>
                  <p className="font-semibold text-slate-900">${(trade.entry_price || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-slate-600 text-xs">Exit Price</p>
                  <p className="font-semibold text-slate-900">${(trade.exit_price || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-slate-600 text-xs">Quantity</p>
                  <p className="font-semibold text-slate-900">{trade.quantity || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-600 text-xs">Date</p>
                  <p className="font-semibold text-slate-900">{formatDate(trade.entry_date || trade.created_at)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-left font-semibold text-slate-800 text-xs sm:text-sm">Symbol</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-right font-semibold text-slate-800 text-xs sm:text-sm">Entry Price</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-right font-semibold text-slate-800 text-xs sm:text-sm">Exit Price</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-right font-semibold text-slate-800 text-xs sm:text-sm">Quantity</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-right font-semibold text-slate-800 text-xs sm:text-sm">P&L</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-left font-semibold text-slate-800 text-xs sm:text-sm">Result</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-left font-semibold text-slate-800 text-xs sm:text-sm">Date</th>
            </tr>
          </thead>
          <tbody>
            {sortedTrades.map((trade, index) => (
              <tr key={trade.id || index} className="border-b border-slate-200 hover:bg-slate-50 transition">
                <td className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-slate-900 text-xs sm:text-sm">{trade.symbol || 'N/A'}</td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 text-right text-slate-600 text-xs sm:text-sm">${(trade.entry_price || 0).toFixed(2)}</td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 text-right text-slate-600 text-xs sm:text-sm">${(trade.exit_price || 0).toFixed(2)}</td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 text-right text-slate-600 text-xs sm:text-sm">{trade.quantity || 'N/A'}</td>
                <td className={`px-4 sm:px-6 py-3 sm:py-4 text-right font-semibold text-xs sm:text-sm ${getStatusColor(trade.profit_loss || 0)}`}>
                  {formatCurrency(trade.profit_loss || 0)}
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4">
                  <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(trade.profit_loss || 0)}`}>
                    {(trade.profit_loss || 0) > 0 ? 'Win' : (trade.profit_loss || 0) < 0 ? 'Loss' : 'Breakeven'}
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-600 text-xs sm:text-sm">{formatDate(trade.entry_date || trade.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="bg-slate-100 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs sm:text-sm text-slate-600 gap-2">
          <span>Showing {trades.length} recent trades</span>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <span className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Profitable: {trades.filter(t => (t.profit_loss || 0) > 0).length}
            </span>
            <span className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
              Losses: {trades.filter(t => (t.profit_loss || 0) < 0).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};


export default function Dashboard() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [toasts, setToasts] = useState([]);
  const toastIdCounter = useRef(0);
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

  const showToast = useCallback((message, type = "error") => {
    toastIdCounter.current += 1;
    const id = Date.now() + toastIdCounter.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  }, []);

  const [stats, setStats] = useState({
    total_trades: 0,
    win_rate: 0,
    totalPnl: 0,
    success: 0,
    loss: 0
  });
  const [recentTrades, setRecentTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [backendConnected, setBackendConnected] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get access token from localStorage
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  };

  // ⭐ FIXED API CALL FUNCTION
  const apiCall = useCallback(async (endpoint, options = {}) => {
    try {
      const token = getAuthToken();

      if (!token) {
        console.log('❌ No token found, redirecting to login');
        router.push('/login');
        return null;
      }

      const fetchOptions = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        credentials: 'include',  // ⭐ CRITICAL: Include credentials
        mode: 'cors',             // ⭐ CRITICAL: Enable CORS
        ...options,
      };

      console.log(`🔄 API Call: ${API_BASE}${endpoint}`);
      
      const response = await fetch(`${API_BASE}${endpoint}`, fetchOptions);

      console.log(`📊 Response Status: ${response.status}`);

      if (response.status === 401) {
        console.log('❌ 401: Token expired or invalid');
        localStorage.removeItem('access_token');
        showToast("Session expired. Please login again.", "error");
        router.push('/login');
        return null;
      }

      if (response.status === 404) {
        console.error(`❌ 404: Endpoint not found - ${endpoint}`);
        console.error(`Full URL: ${API_BASE}${endpoint}`);
        throw new Error(`Endpoint not found: ${endpoint}`);
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error(`❌ API Error: ${response.status}`, errorText);
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Data received from ${endpoint}`);
      setBackendConnected(true);
      return data;
    } catch (error) {
      console.error(`❌ API call failed:`, error);
      setBackendConnected(false);
      
      if (error.message.includes('Failed to fetch')) {
        showToast("Cannot connect to backend. Check if server is running.", "error");
      }
      
      throw error;
    }
  }, [API_BASE, router, showToast]);

  // ⭐ FIXED LOAD DASHBOARD DATA FUNCTION
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Loading dashboard data...');

      // Fetch stats
      try {
        console.log('📊 Fetching: /api/trade-logs/stats');
        const statsData = await apiCall('/api/trade-logs/stats');
        
        if (statsData && statsData.performance) {
          console.log('✅ Stats loaded:', statsData);
          setStats({
            total_trades: statsData.performance.total_trades || 0,
            win_rate: statsData.performance.win_rate || 0,
            totalPnl: statsData.performance.total_pnl || 0,
            success: statsData.counts?.success || 0,
            loss: statsData.counts?.loss || 0
          });
        } else {
          console.warn('⚠️ Unexpected stats structure:', statsData);
        }
      } catch (err) {
        console.error('❌ Stats fetch failed:', err);
        // Continue even if stats fail
      }

      // Fetch recent trades
      try {
        console.log('📋 Fetching: /api/trade-logs');
        const tradesData = await apiCall('/api/trade-logs?per_page=8&sort_by=created_at&sort_order=desc');
        
        if (tradesData && tradesData.items && Array.isArray(tradesData.items)) {
          console.log(`✅ Loaded ${tradesData.items.length} trades`);
          setRecentTrades(tradesData.items);
        } else {
          console.warn('⚠️ Unexpected trades structure:', tradesData);
          setRecentTrades([]);
        }
      } catch (err) {
        console.error('❌ Trades fetch failed:', err);
        setRecentTrades([]);
      }

      setLastUpdate(new Date().toLocaleTimeString());
      showToast("Dashboard loaded successfully", "success");
      
    } catch (error) {
      console.error('❌ Dashboard load error:', error);
      setError(error.message);
      showToast("Failed to load dashboard", "error");
    } finally {
      setLoading(false);
    }
  }, [apiCall, showToast]);

  useEffect(() => {
    // Load user data from localStorage
    const storedEmail = localStorage.getItem('email');
    const storedFirstName = localStorage.getItem('first_name');
    const storedLastName = localStorage.getItem('last_name');
    const token = getAuthToken();

    if (!token) {
      router.push('/login');
      return;
    }

    if (storedEmail) setEmail(storedEmail);
    if (storedFirstName) setFirstName(storedFirstName);
    if (storedLastName) setLastName(storedLastName);

    // Load dashboard data
    loadDashboardData();
  }, [router, loadDashboardData]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("email");
    localStorage.removeItem("first_name");
    localStorage.removeItem("last_name");
    localStorage.removeItem("user_id");
    localStorage.removeItem("avatar_url");
    showToast("Logged out successfully", "success");
    setTimeout(() => {
      router.push("/login");
    }, 1000);
  };

  const handleManualRefresh = () => {
    showToast("Refreshing data...", "info");
    loadDashboardData();
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(value || 0);
  };

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2 p-3 sm:p-0">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg shadow-lg border-l-4 animate-fade-in text-xs sm:text-sm ${
            toast.type === "success" ? "bg-green-50 border-green-500 text-green-800" :
            toast.type === "info" ? "bg-blue-50 border-blue-500 text-blue-800" :
            "bg-red-50 border-red-500 text-red-800"
          }`}
        >
          <div className="flex items-center space-x-2">
            {toast.type === "success" && (
              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      ))}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        if (loading) {
          return (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 sm:h-16 w-12 sm:w-16 border-b-2 border-blue-600"></div>
              <div className="mt-4 text-sm sm:text-base text-slate-600 text-center px-4">Loading dashboard data...</div>
            </div>
          );
        }

        return (
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 border border-blue-100">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <span className="text-white text-base sm:text-lg lg:text-2xl font-bold">{firstName.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-slate-800">Welcome, {firstName}!</h1>
                    <p className="text-slate-600 mt-0.5 sm:mt-1 text-xs sm:text-base truncate">
                      {backendConnected ? "Ready to make profitable trades today?" : "Connecting to backend..."}
                    </p>
                    {lastUpdate && (
                      <div className="text-xs text-slate-500 mt-1 flex items-center space-x-1">
                        <div className={`w-2 h-2 ${backendConnected ? 'bg-green-500' : 'bg-orange-500'} rounded-full animate-pulse`}></div>
                        <span>Last updated: {lastUpdate}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={handleManualRefresh}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
                    disabled={loading}
                  >
                    <svg className={`w-3 h-3 sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    <span className="hidden sm:inline">{loading ? 'Refreshing...' : 'Refresh'}</span>
                    <span className="sm:hidden">{loading ? '...' : 'Refresh'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-600 text-xs sm:text-sm font-medium">Total Trades</p>
                    <p className="text-lg sm:text-2xl font-bold text-slate-800 mt-1">{stats.total_trades}</p>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-600 text-xs sm:text-sm font-medium">Success Rate</p>
                    <p className="text-lg sm:text-2xl font-bold text-green-600 mt-1">{stats.win_rate.toFixed(1)}%</p>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6 border border-slate-200 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-600 text-xs sm:text-sm font-medium">P&L</p>
                    <p className={`text-lg sm:text-2xl font-bold mt-1 ${stats.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(stats.totalPnl)}
                    </p>
                  </div>
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ml-3 ${stats.totalPnl >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    <svg className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ${stats.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Success/Loss Ratio Card */}
            <SuccessLossRatioCard stats={stats} />

            {/* Recent Trades Table */}
            <RecentTradesTable
              trades={recentTrades}
              formatCurrency={formatCurrency}
            />
          </div>
        );

      case "journal":
        return <MyJournal />;
      case "strategies":
        return <MyStrategies />;
      case "analysis":
        return <PreTradeAnalysis />;
      case "logs":
        return <SuccessLogs />;
      case "charts":
        return <Charts />;
      case "notifications":
        return <Notifications />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <ToastContainer />

      {/* Sidebar Component */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
        handleLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Navbar Component */}
        <Navbar
          firstName={firstName}
          activeTab={activeTab}
          toggleSidebar={toggleSidebar}
          handleLogout={handleLogout}
          backendConnected={backendConnected}
          isMobile={isMobile}
          sidebarOpen={sidebarOpen}
          setActiveTab={setActiveTab}
        />

        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-auto">
          {renderContent()}
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
      `}</style>
    </div>
  );
}
