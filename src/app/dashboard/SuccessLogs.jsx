// app/dashboard/SuccessLogs.jsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Image as ImageIcon,
} from "@mui/icons-material";
import { API_BASE_URL } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { calculateProfitLoss, calculateWinRate } from "@/lib/utils/calculations";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

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

          const pnl = calculateProfitLoss(trade.entry_price, trade.exit_price, trade.quantity);
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
          strategy.win_rate = calculateWinRate(strategy.success_trades, strategy.total_trades);
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
      setLoading(false);
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
      const entryDateObj = new Date(formData.entry_date);
      formDataObj.append('entry_date', entryDateObj.toISOString());

      if (formData.exit_date) {
        const exitDateObj = new Date(formData.exit_date);
        formDataObj.append('exit_date', exitDateObj.toISOString());
      }

      if (formData.trading_strategy) {
        formDataObj.append('trading_strategy', formData.trading_strategy);
        // Find strategy ID if available
        const selectedStrategy = strategies.find(s => s.name === formData.trading_strategy);
        if (selectedStrategy) {
          formDataObj.append('strategy_id', String(selectedStrategy.id));
        }
      }

      if (formData.trade_notes) formDataObj.append('trade_notes', formData.trade_notes);

      selectedFiles.forEach((file) => {
        formDataObj.append('images', file);
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

  // Utility functions imported from @/lib/utils

  const getWinRateColor = (winRate) => {
    if (winRate >= 60) return 'success';
    if (winRate >= 40) return 'warning';
    return 'error';
  };

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2 p-3 sm:p-0">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg shadow-lg border-l-4 animate-fade-in text-xs sm:text-sm font-medium ${toast.type === "success" ? "bg-green-50 border-green-500 text-green-800" :
            toast.type === "info" ? "bg-[#f15f26]/10 border-[#f15f26] text-[#f15f26]" :
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
          <LoadingSpinner size="lg" />
          <p className="text-black mt-4">Loading trading logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-8 p-4 sm:p-0">
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
      <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-black">Trading Logs</h2>
            <p className="text-black mt-1 text-sm sm:text-base">
              Track and analyze your trading performance
              {!backendConnected && <span className="text-orange-600 ml-2">⚠️ Offline</span>}
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-[#f15f26] text-white rounded-lg sm:rounded-xl font-semibold hover:bg-[#d94e1f] transition-all duration-200 shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add Trade Log</span>
            </button>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-hidden">
          <div className="w-full max-w-4xl bg-white rounded-lg shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-slate-100 px-4 sm:px-6 py-4 flex justify-between items-center border-b border-slate-200 flex-shrink-0">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">Add New Trade Log</h3>
              <button
                type="button"
                onClick={handleCancel}
                className="text-slate-600 hover:text-slate-900 transition"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 sm:p-6">
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  {/* Form Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">Symbol *</label>
                      <input
                        type="text"
                        name="symbol"
                        value={formData.symbol}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f15f26] text-black bg-white"
                        placeholder="AAPL"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">Entry Price *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        name="entry_price"
                        value={formData.entry_price}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                        placeholder="150.25"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">Exit Price *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        name="exit_price"
                        value={formData.exit_price}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                        placeholder="155.80"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">Quantity *</label>
                      <input
                        type="number"
                        min="1"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                        placeholder="100"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">Entry Date *</label>
                      <input
                        type="date"
                        name="entry_date"
                        value={formData.entry_date}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">Exit Date</label>
                      <input
                        type="date"
                        name="exit_date"
                        value={formData.exit_date}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                      />
                    </div>
                  </div>

                  {/* Strategy */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Trading Strategy</label>
                    <select
                      name="trading_strategy"
                      value={formData.trading_strategy}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234b5563' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.5rem center',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem'
                      }}
                    >
                      <option value="">Select a strategy...</option>
                      {strategies.map((strategy) => (
                        <option key={strategy.id} value={strategy.name}>
                          {strategy.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Images Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">Upload Images</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-all">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="log-image-upload"
                      />
                      <label htmlFor="log-image-upload" className="cursor-pointer block">
                        <ImageIcon sx={{ fontSize: '2rem', color: '#cbd5e1', marginBottom: '0.5rem' }} />
                        <p className="text-sm text-gray-600 font-medium">Click to upload or drag images here</p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 16MB</p>
                      </label>
                      {selectedFiles.length > 0 && (
                        <div className="mt-4 text-sm text-green-600 font-medium">
                          ✓ {selectedFiles.length} image(s) selected
                        </div>
                      )}
                    </div>

                    {/* Image Previews */}
                    {imagePreviews.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold text-slate-700 mb-3">Preview:</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                          {imagePreviews.map((preview, idx) => (
                            <div key={idx} className="relative group">
                              <img
                                src={preview.preview}
                                alt={`Preview ${idx + 1}`}
                                className="w-full h-24 object-cover rounded-lg border border-gray-200 group-hover:opacity-75 transition"
                              />
                              <button
                                type="button"
                                onClick={() => removeFile(idx)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 font-bold"
                              >
                                ×
                              </button>
                              <p className="text-xs text-gray-600 mt-1 truncate">{preview.file.name}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Trade Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Trade Notes</label>
                    <textarea
                      name="trade_notes"
                      value={formData.trade_notes}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white resize-none"
                      placeholder="Trade rationale, lessons learned..."
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={submitting}
                      className="w-full sm:w-auto px-4 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full sm:w-auto px-6 py-2.5 bg-[#f15f26] text-white text-sm font-medium rounded-lg hover:bg-[#d94e1f] transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        'Add Trade Log'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Strategy Performance Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
        <div className="xl:col-span-2 bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-black">Strategy Performance</h2>
              <p className="text-black mt-1 text-xs sm:text-sm">Performance breakdown by trading strategy</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search strategies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f15f26] focus:border-transparent bg-white text-black"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {strategyTrades.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-base sm:text-lg font-semibold text-black mb-2">No Strategy Data Yet</h3>
              <p className="text-black text-xs sm:text-sm">Add trades with strategies to see performance</p>
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="block md:hidden space-y-4">
                {strategyTrades.map((strategy, index) => (
                  <div key={index} className="bg-gradient-to-r from-white to-slate-50 rounded-lg p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-black truncate">{strategy.strategy_name}</h3>
                        <div className="flex items-center space-x-2 text-xs text-black mt-1">
                          <span className="flex items-center">
                            <div className="w-2 h-2 bg-[#f15f26] rounded-full mr-1"></div>
                            {strategy.total_trades} trades
                          </span>
                          <span className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                            {strategy.success_trades} wins
                          </span>
                        </div>
                      </div>
                      <Chip
                        label={`${strategy.win_rate}%`}
                        color={getWinRateColor(strategy.win_rate)}
                        size="small"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    </div>

                    <button
                      onClick={() => handleViewStrategyTrades(strategy)}
                      className="w-full bg-[#f15f26] hover:bg-[#d94e1f] text-white py-2 px-4 rounded-lg font-medium transition-colors text-sm"
                    >
                      View Trades ({strategy.total_trades})
                    </button>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block bg-white/80 backdrop-blur-sm rounded-lg overflow-hidden">
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f1f5f9' }}>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>Strategy</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>Total</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>Wins</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>Losses</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>Win Rate</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>Total P&L</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {strategyTrades.map((strategy, index) => (
                        <TableRow key={index} hover sx={{ height: '72px' }}>
                          <TableCell sx={{ fontSize: '0.875rem', fontWeight: 500, padding: '16px' }}>{strategy.strategy_name}</TableCell>
                          <TableCell align="center" sx={{ fontSize: '0.875rem', padding: '16px' }}>
                            <Chip label={strategy.total_trades} size="small" variant="outlined" sx={{ fontSize: '0.75rem' }} />
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: '0.875rem', color: '#10b981', fontWeight: 600, padding: '16px' }}>
                            {strategy.success_trades}
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: '0.875rem', color: '#ef4444', fontWeight: 600, padding: '16px' }}>
                            {strategy.loss_trades}
                          </TableCell>
                          <TableCell align="right" sx={{ padding: '16px' }}>
                            <Chip
                              label={`${strategy.win_rate}%`}
                              color={getWinRateColor(strategy.win_rate)}
                              size="small"
                              sx={{ fontSize: '0.75rem' }}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.875rem', fontWeight: 600, padding: '16px', color: strategy.total_pnl >= 0 ? '#10b981' : '#ef4444' }}>
                            {formatCurrency(strategy.total_pnl)}
                          </TableCell>
                          <TableCell align="center" sx={{ padding: '16px' }}>
                            <Tooltip title="View Trades">
                              <IconButton
                                size="small"
                                onClick={() => handleViewStrategyTrades(strategy)}
                                sx={{ color: '#f15f26' }}
                              >
                                <VisibilityIcon sx={{ fontSize: '1rem' }} />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </div>
            </>
          )}
        </div>

        {/* Statistics Card */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-green-200">
          <h3 className="text-base sm:text-lg font-bold text-black mb-4">Overall Stats</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <span className="text-xs sm:text-sm text-black">Total Trades</span>
              <span className="text-lg sm:text-2xl font-bold text-[#f15f26]">{stats.performance?.total_trades || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <span className="text-xs sm:text-sm text-black">Win Rate</span>
              <span className="text-lg sm:text-2xl font-bold text-green-600">{stats.performance?.win_rate?.toFixed(1) || 0}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <span className="text-xs sm:text-sm text-black">Total P&L</span>
              <span className={`text-lg sm:text-2xl font-bold ${(stats.performance?.total_pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(stats.performance?.total_pnl || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <span className="text-xs sm:text-sm text-black">Wins</span>
              <span className="text-lg sm:text-2xl font-bold text-green-600">{stats.counts?.success || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <span className="text-xs sm:text-sm text-black">Losses</span>
              <span className="text-lg sm:text-2xl font-bold text-red-600">{stats.counts?.loss || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trades Modal - UPDATED with MUI Table */}
      {showTradesModal && selectedStrategy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 p-4 sm:p-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-white">{selectedStrategy.strategy_name}</h2>
                <p className="text-blue-100 text-xs sm:text-sm mt-1">{selectedStrategy.total_trades} trades • Win Rate: {selectedStrategy.win_rate}%</p>
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

            {/* Modal Content */}
            <div className="p-4 sm:p-6">
              {selectedStrategy.trades && selectedStrategy.trades.length > 0 ? (
                <>
                  {/* Mobile View */}
                  <div className="block md:hidden space-y-3">
                    {selectedStrategy.trades.map((trade, idx) => {
                      const pnl = calculateProfitLoss(trade.entry_price, trade.exit_price, trade.quantity);
                      return (
                        <div
                          key={idx}
                          className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg p-4 border border-slate-200 hover:shadow-md transition-all"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-black">{trade.symbol}</h4>
                                {trade.image_urls && trade.image_urls.length > 0 && (
                                  <Chip
                                    icon={<ImageIcon sx={{ fontSize: '0.75rem' }} />}
                                    label={trade.image_urls.length}
                                    size="small"
                                    sx={{ fontSize: '0.75rem' }}
                                  />
                                )}
                              </div>
                              <p className="text-xs text-slate-600 mt-1">{formatDate(trade.entry_date)}</p>
                            </div>
                            <Chip
                              label={pnl > 0 ? 'Win' : 'Loss'}
                              color={pnl > 0 ? 'success' : 'error'}
                              size="small"
                              sx={{ fontSize: '0.75rem' }}
                            />
                          </div>
                          <div className="text-xs text-black space-y-1">
                            <p>Entry: ₹{trade.entry_price} | Exit: ₹{trade.exit_price}</p>
                            <p>Qty: {trade.quantity} | P&L: <span className={pnl > 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{formatCurrency(pnl)}</span></p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden md:block">
                    <TableContainer component={Paper} elevation={0}>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: '#f1f5f9' }}>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>Symbol</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>Entry</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>Exit</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>Qty</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>P&L</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>Result</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>Images</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedStrategy.trades.map((trade, idx) => {
                            const pnl = calculateProfitLoss(trade.entry_price, trade.exit_price, trade.quantity);
                            return (
                              <TableRow key={idx} className="hover:bg-slate-50" sx={{ height: '72px' }}>
                                <TableCell sx={{ fontSize: '0.875rem', fontWeight: 500, padding: '16px' }}>{trade.symbol}</TableCell>
                                <TableCell align="right" sx={{ fontSize: '0.875rem', padding: '16px' }}>₹{trade.entry_price}</TableCell>
                                <TableCell align="right" sx={{ fontSize: '0.875rem', padding: '16px' }}>₹{trade.exit_price}</TableCell>
                                <TableCell align="right" sx={{ fontSize: '0.875rem', padding: '16px' }}>{trade.quantity}</TableCell>
                                <TableCell align="right" sx={{ fontSize: '0.875rem', fontWeight: 600, padding: '16px', color: pnl >= 0 ? '#10b981' : '#ef4444' }}>
                                  {formatCurrency(pnl)}
                                </TableCell>
                                <TableCell sx={{ padding: '16px' }}>
                                  <Chip
                                    label={pnl > 0 ? 'Win' : pnl < 0 ? 'Loss' : 'Break'}
                                    color={pnl > 0 ? 'success' : pnl < 0 ? 'error' : 'default'}
                                    size="small"
                                    sx={{ fontSize: '0.75rem' }}
                                  />
                                </TableCell>
                                <TableCell sx={{ padding: '16px' }}>
                                  {trade.image_urls && trade.image_urls.length > 0 ? (
                                    <Chip
                                      icon={<ImageIcon sx={{ fontSize: '0.75rem' }} />}
                                      label={trade.image_urls.length}
                                      size="small"
                                      variant="outlined"
                                      sx={{ fontSize: '0.75rem' }}
                                    />
                                  ) : (
                                    <span className="text-xs text-slate-500">-</span>
                                  )}
                                </TableCell>
                                <TableCell align="center" sx={{ padding: '16px' }}>
                                  <Tooltip title="View Details">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleViewTradeDetail(trade)}
                                      sx={{ color: '#f15f26' }}
                                    >
                                      <VisibilityIcon sx={{ fontSize: '1rem' }} />
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-black">No trades for this strategy</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Trade Detail Modal */}
      {showTradeDetailModal && selectedTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="bg-slate-100 px-4 sm:px-6 py-4 flex justify-between items-center border-b border-slate-200 sticky top-0">
              <h2 className="text-lg font-bold text-slate-900">{selectedTrade.symbol} - Trade Details</h2>
              <button
                onClick={() => setShowTradeDetailModal(false)}
                className="text-slate-600 hover:text-slate-900"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              {/* Price Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-blue-700 font-medium mb-1">Entry</p>
                  <p className="font-bold text-slate-900 text-sm">₹{selectedTrade.entry_price}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-green-700 font-medium mb-1">Exit</p>
                  <p className="font-bold text-slate-900 text-sm">₹{selectedTrade.exit_price}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-700 font-medium mb-1">Qty</p>
                  <p className="font-bold text-slate-900 text-sm">{selectedTrade.quantity}</p>
                </div>
                <div className="bg-indigo-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-indigo-700 font-medium mb-1">P&L</p>
                  <p className={`font-bold text-sm ${calculateProfitLoss(selectedTrade.entry_price, selectedTrade.exit_price, selectedTrade.quantity) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(calculateProfitLoss(selectedTrade.entry_price, selectedTrade.exit_price, selectedTrade.quantity))}
                  </p>
                </div>
              </div>

              {/* Images */}
              {selectedTrade.image_urls && selectedTrade.image_urls.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-3">Images ({selectedTrade.image_urls.length})</p>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedTrade.image_urls.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative group"
                      >
                        <img
                          src={url}
                          alt={`Trade image ${idx + 1}`}
                          className="w-full h-40 object-cover rounded-lg border border-slate-200 group-hover:opacity-80 transition"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-lg">
                          <span className="text-white text-sm font-medium">Open</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedTrade.trade_notes && (
                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-2">Notes</p>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-slate-700 text-sm whitespace-pre-wrap">{selectedTrade.trade_notes}</p>
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowTradeDetailModal(false)}
                className="w-full px-4 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition"
              >
                Close
              </button>
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
