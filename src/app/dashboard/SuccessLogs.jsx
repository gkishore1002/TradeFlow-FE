// app/dashboard/SuccessLogs.jsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export default function SuccessLogs() {
  const router = useRouter();
  const toastRef = useRef(0);

  // UI state
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Data state
  const [strategies, setStrategies] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Strategy-wise trades state
  const [strategyTrades, setStrategyTrades] = useState([]);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [showTradesModal, setShowTradesModal] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [showTradeDetailModal, setShowTradeDetailModal] = useState(false);

  // Pagination and Search State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Mobile responsive states
  const [isMobile, setIsMobile] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [backendConnected, setBackendConnected] = useState(false);

  const [formData, setFormData] = useState({
    symbol: "",
    entry_price: "",
    exit_price: "",
    quantity: "",
    entry_date: "",
    exit_date: "",
    trading_strategy: "",
    trade_notes: ""
  });

  // Lists and stats
  const [trades, setTrades] = useState([]);
  const [stats, setStats] = useState({
    counts: { success: 0, loss: 0, breakeven: 0 },
    performance: { total_trades: 0, win_rate: 0, loss_rate: 0, total_pnl: 0 }
  });

  // Show toast notification
  const showToast = useCallback((message, type = "error") => {
    toastRef.current += 1;
    const id = Date.now() + toastRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  }, []);

  // Check mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get JWT Token
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  };

  // API Call with JWT
  const apiCall = useCallback(async (endpoint, options = {}) => {
    try {
      const token = getAuthToken();
      
      if (!token) {
        router.push('/login');
        return null;
      }

      const isFormData = options.body instanceof FormData;
      const headers = {
        'Authorization': `Bearer ${token}`,
        ...(!isFormData && { 'Content-Type': 'application/json' }),
        ...options.headers
      };

      console.log(`🔄 API Call: ${endpoint}`);
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        router.push('/login');
        return null;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setBackendConnected(true);
      return data;
    } catch (error) {
      console.error('API Error:', error);
      setBackendConnected(false);
      throw error;
    }
  }, [router]);

  // Fetch strategies
  const fetchStrategies = useCallback(async () => {
    try {
      const data = await apiCall('/api/strategies?per_page=100');
      setStrategies(data.items || data || []);
    } catch (err) {
      console.error('Error fetching strategies:', err);
      showToast('Failed to load strategies', 'error');
    }
  }, [apiCall, showToast]);

  // Fetch strategy-wise trades
  const fetchStrategyWiseTrades = useCallback(async (page = 1, search = '') => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: itemsPerPage.toString(),
        ...(search && { search })
      });

      const data = await apiCall(`/api/trade-logs?${params}`);
      
      if (data?.items) {
        // Group by strategy
        const grouped = {};
        data.items.forEach(trade => {
          const strategyName = trade.trading_strategy || 'Unassigned';
          if (!grouped[strategyName]) {
            grouped[strategyName] = {
              strategy_name: strategyName,
              trades: [],
              total_trades: 0,
              success_trades: 0,
              loss_trades: 0,
              win_rate: 0,
              total_pnl: 0,
              avg_pnl: 0,
              best_trade: 0
            };
          }
          
          const pnl = (trade.exit_price - trade.entry_price) * trade.quantity;
          grouped[strategyName].trades.push(trade);
          grouped[strategyName].total_trades += 1;
          
          if (pnl > 0) {
            grouped[strategyName].success_trades += 1;
            grouped[strategyName].best_trade = Math.max(grouped[strategyName].best_trade, pnl);
          } else if (pnl < 0) {
            grouped[strategyName].loss_trades += 1;
          }
          
          grouped[strategyName].total_pnl += pnl;
        });

        // Calculate stats
        Object.values(grouped).forEach(strategy => {
          strategy.win_rate = strategy.total_trades > 0 
            ? ((strategy.success_trades / strategy.total_trades) * 100).toFixed(1)
            : 0;
          strategy.avg_pnl = strategy.total_trades > 0 
            ? strategy.total_pnl / strategy.total_trades
            : 0;
        });

        setStrategyTrades(Object.values(grouped));
        setCurrentPage(data.pagination?.page || 1);
        setTotalPages(data.pagination?.pages || 1);
        setTotalItems(data.pagination?.total || 0);
      } else {
        setStrategyTrades(data || []);
        setCurrentPage(1);
        setTotalPages(1);
        setTotalItems(data?.length || 0);
      }
    } catch (err) {
      console.error('Error fetching strategy-wise trades:', err);
      setError('Failed to load strategy-wise trades');
      showToast('Failed to load strategy trades', 'error');
    }
  }, [itemsPerPage, apiCall, showToast]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const data = await apiCall('/api/trade-logs/stats');
      if (data) {
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      showToast('Failed to load statistics', 'error');
    }
  }, [apiCall, showToast]);

  // Fetch trade logs
  const fetchTradeLogs = useCallback(async () => {
    try {
      const data = await apiCall('/api/trade-logs?per_page=100');
      setTrades(data.items || data || []);
    } catch (err) {
      console.error('Error fetching trade logs:', err);
      showToast('Failed to load trade logs', 'error');
    }
  }, [apiCall, showToast]);

  // Initial load
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([
          fetchStats(),
          fetchTradeLogs(),
          fetchStrategies(),
          fetchStrategyWiseTrades()
        ]);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchStats, fetchTradeLogs, fetchStrategies, fetchStrategyWiseTrades, router]);

  // Debounced search
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm !== searchQuery) {
        setSearchQuery(searchTerm);
        setCurrentPage(1);
        fetchStrategyWiseTrades(1, searchTerm);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, searchQuery, fetchStrategyWiseTrades]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchStrategyWiseTrades(newPage, searchQuery);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);

    const previews = [];
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const preview = URL.createObjectURL(file);
        previews.push({ file, preview });
      }
    });
    setImagePreviews(previews);
  };

  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    if (imagePreviews[index]) URL.revokeObjectURL(imagePreviews[index].preview);
    setSelectedFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.symbol.trim()) errors.push('Symbol is required');
    if (!formData.entry_price || parseFloat(formData.entry_price) <= 0) errors.push('Valid entry price is required');
    if (!formData.exit_price || parseFloat(formData.exit_price) <= 0) errors.push('Valid exit price is required');
    if (!formData.quantity || parseInt(formData.quantity) <= 0) errors.push('Valid quantity is required');
    if (!formData.entry_date) errors.push('Entry date is required');
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join('. '));
      setSubmitting(false);
      return;
    }

    try {
      const formDataObj = new FormData();
      formDataObj.append('symbol', formData.symbol.toUpperCase());
      formDataObj.append('entry_price', String(parseFloat(formData.entry_price)));
      formDataObj.append('exit_price', String(parseFloat(formData.exit_price)));
      formDataObj.append('quantity', String(parseInt(formData.quantity, 10)));
      formDataObj.append('entry_date', formData.entry_date);

      if (formData.exit_date) formDataObj.append('exit_date', formData.exit_date);
      if (formData.trading_strategy) formDataObj.append('trading_strategy', formData.trading_strategy);
      if (formData.trade_notes) formDataObj.append('trade_notes', formData.trade_notes);

      selectedFiles.forEach((file) => {
        formDataObj.append('screenshots', file);
      });

      await apiCall('/api/trade-logs', {
        method: 'POST',
        body: formDataObj
      });

      setSuccess('✅ Trade log added successfully!');
      showToast('Trade log added successfully!', 'success');

      await Promise.all([
        fetchStats(),
        fetchTradeLogs(),
        fetchStrategyWiseTrades()
      ]);

      setShowForm(false);
      setFormData({
        symbol: "",
        entry_price: "",
        exit_price: "",
        quantity: "",
        entry_date: "",
        exit_date: "",
        trading_strategy: "",
        trade_notes: ""
      });
      imagePreviews.forEach(preview => URL.revokeObjectURL(preview.preview));
      setSelectedFiles([]);
      setImagePreviews([]);

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error adding trade log:', err);
      setError(err.message);
      showToast(`Failed to add trade: ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData({
      symbol: "",
      entry_price: "",
      exit_price: "",
      quantity: "",
      entry_date: "",
      exit_date: "",
      trading_strategy: "",
      trade_notes: ""
    });
    imagePreviews.forEach(preview => URL.revokeObjectURL(preview.preview));
    setSelectedFiles([]);
    setImagePreviews([]);
    setError(null);
  };

  const handleViewStrategyTrades = (strategy) => {
    setSelectedStrategy(strategy);
    setShowTradesModal(true);
  };

  const handleViewTradeDetail = (trade) => {
    setSelectedTrade(trade);
    setShowTradeDetailModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return '-';
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2 p-3 sm:p-0">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg shadow-lg border-l-4 animate-fade-in text-xs sm:text-sm font-medium ${
            toast.type === "success" ? "bg-green-50 border-green-500 text-green-800" :
            toast.type === "info" ? "bg-blue-50 border-blue-500 text-blue-800" :
            "bg-red-50 border-red-500 text-red-800"
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <ToastContainer />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-black">Loading trading logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-8">
      <ToastContainer />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-green-800 font-medium">{success}</p>
          </div>
        </div>
      )}

      {/* Trading Logs Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 lg:p-8 shadow-lg border border-white/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl lg:text-2xl font-bold text-black">Trading Logs</h2>
            <p className="text-black mt-1 text-sm lg:text-base">
              Track and analyze your trading performance
              {!backendConnected && <span className="text-orange-600 ml-2">⚠️ Offline</span>}
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full sm:w-auto px-4 lg:px-6 py-2 lg:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="hidden sm:inline">Add Trade Log</span>
              <span className="sm:hidden">Add</span>
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-slate-50 rounded-xl p-4 lg:p-6 space-y-4">
            <h3 className="text-lg font-semibold text-black mb-4">Add New Trade Log</h3>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Symbol *</label>
                  <input
                    type="text"
                    name="symbol"
                    value={formData.symbol}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                    placeholder="e.g., AAPL, TSLA"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">Entry Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    name="entry_price"
                    value={formData.entry_price}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                    placeholder="150.25"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">Exit Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    name="exit_price"
                    value={formData.exit_price}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                    placeholder="155.80"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                    placeholder="100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">Entry Date *</label>
                  <input
                    type="date"
                    name="entry_date"
                    value={formData.entry_date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">Exit Date</label>
                  <input
                    type="date"
                    name="exit_date"
                    value={formData.exit_date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-black mb-2">Trading Strategy</label>
                <select
                  name="trading_strategy"
                  value={formData.trading_strategy}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
                >
                  <option value="">Select a strategy...</option>
                  {strategies.map((strategy) => (
                    <option key={strategy.id} value={strategy.name}>
                      {strategy.name} ({strategy.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-black mb-2">Screenshots</label>
                <div className="space-y-4">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />

                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          <img
                            src={preview.preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-slate-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                          >
                            ×
                          </button>
                          <p className="text-xs text-black mt-1 truncate">{preview.file.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-black mb-2">Trade Notes</label>
                <textarea
                  name="trade_notes"
                  value={formData.trade_notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white resize-none"
                  placeholder="Trade rationale, lessons learned, observations..."
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  {submitting ? 'Adding...' : 'Add Trade Log'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={submitting}
                  className="w-full sm:w-auto bg-gray-200 hover:bg-gray-300 text-black px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Strategy Performance Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
        <div className="xl:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl p-4 lg:p-6 shadow-lg border border-white/20">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg lg:text-xl font-bold text-black">Strategy Performance</h2>
              <p className="text-black mt-1 text-sm lg:text-base">Performance breakdown by trading strategy</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search strategies by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 bg-white text-black"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {strategyTrades.length === 0 ? (
            <div className="text-center py-8 lg:py-12">
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 lg:w-8 lg:h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-base lg:text-lg font-semibold text-black mb-2">No Strategy Data Yet</h3>
              <p className="text-black text-sm lg:text-base">Add trades with strategies to see performance breakdown</p>
            </div>
          ) : (
            <>
              {/* Mobile Cards View */}
              <div className="block lg:hidden space-y-4">
                {strategyTrades.map((strategy, index) => (
                  <div key={index} className="bg-gradient-to-r from-white to-slate-50 rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-black truncate">{strategy.strategy_name}</h3>
                        <div className="flex items-center space-x-2 text-xs text-black mt-1">
                          <span className="flex items-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                            {strategy.total_trades} total
                          </span>
                          <span className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                            {strategy.success_trades} wins
                          </span>
                        </div>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${
                        strategy.win_rate >= 60 ? 'bg-green-500' :
                        strategy.win_rate >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                      <div>
                        <p className="text-slate-500">Win Rate</p>
                        <p className={`font-bold ${
                          strategy.win_rate >= 60 ? 'text-green-600' :
                          strategy.win_rate >= 40 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {strategy.win_rate}%
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Total P&L</p>
                        <p className={`font-bold ${strategy.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(strategy.total_pnl)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleViewStrategyTrades(strategy)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>View Trades ({strategy.total_trades})</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Desktop Cards View */}
              <div className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 gap-4">
                {strategyTrades.map((strategy, index) => (
                  <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-black mb-2 truncate">{strategy.strategy_name}</h3>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-black">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-200">
                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-1.5"></div>
                            {strategy.total_trades} trades
                          </span>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-200">
                            <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-1.5"></div>
                            {strategy.success_trades} wins
                          </span>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-red-200">
                            <div className="w-1.5 h-1.5 bg-red-600 rounded-full mr-1.5"></div>
                            {strategy.loss_trades} losses
                          </span>
                        </div>
                      </div>
                      <div className={`flex-shrink-0 w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-bold ${
                        strategy.win_rate >= 60 ? 'bg-green-100 text-green-600' :
                        strategy.win_rate >= 40 ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {strategy.win_rate}%
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4 pt-4 border-t border-blue-200">
                      <div className="text-center">
                        <p className="text-xs text-black font-medium mb-1">Total P&L</p>
                        <p className={`text-lg font-bold ${strategy.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(strategy.total_pnl)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-black font-medium mb-1">Avg P&L</p>
                        <p className={`text-lg font-bold ${strategy.avg_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(strategy.avg_pnl || 0)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-black font-medium mb-1">Best Trade</p>
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(strategy.best_trade || 0)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleViewStrategyTrades(strategy)}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>View Trades ({strategy.total_trades})</span>
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Statistics Card */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 lg:p-6 shadow-lg border border-green-200">
            <h3 className="text-base lg:text-lg font-bold text-black mb-4">Overall Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-sm text-black">Total Trades</span>
                <span className="text-xl lg:text-2xl font-bold text-blue-600">{stats.performance?.total_trades || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-sm text-black">Win Rate</span>
                <span className="text-xl lg:text-2xl font-bold text-green-600">{stats.performance?.win_rate?.toFixed(1) || 0}%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-sm text-black">Total P&L</span>
                <span className={`text-xl lg:text-2xl font-bold ${(stats.performance?.total_pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(stats.performance?.total_pnl || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-sm text-black">Winning Trades</span>
                <span className="text-xl lg:text-2xl font-bold text-green-600">{stats.counts?.success || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-sm text-black">Losing Trades</span>
                <span className="text-xl lg:text-2xl font-bold text-red-600">{stats.counts?.loss || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trades Modal */}
      {showTradesModal && selectedStrategy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl lg:text-2xl font-bold text-white">{selectedStrategy.strategy_name}</h2>
                <p className="text-blue-100 text-sm mt-1">{selectedStrategy.total_trades} trades • Win Rate: {selectedStrategy.win_rate}%</p>
              </div>
              <button
                onClick={() => setShowTradesModal(false)}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 lg:p-6">
              {selectedStrategy.trades && selectedStrategy.trades.length > 0 ? (
                <div className="space-y-3 overflow-y-auto max-h-[calc(90vh-140px)]">
                  {selectedStrategy.trades.map((trade, index) => {
                    const pnl = (trade.exit_price - trade.entry_price) * trade.quantity;
                    return (
                      <div 
                        key={index}
                        onClick={() => handleViewTradeDetail(trade)}
                        className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg p-4 border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-bold text-black">{trade.symbol}</h4>
                              <span className={`px-2 py-1 rounded text-xs font-medium text-white ${pnl > 0 ? 'bg-green-600' : 'bg-red-600'}`}>
                                {pnl > 0 ? 'Win' : 'Loss'}
                              </span>
                            </div>
                            <p className="text-sm text-black">
                              Entry: ${trade.entry_price} | Exit: ${trade.exit_price} | Qty: {trade.quantity}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className={`text-lg font-bold ${pnl > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(pnl)}
                            </p>
                            <p className="text-xs text-slate-600">{formatDate(trade.entry_date)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-black">No trades for this strategy</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
