// app/dashboard/MyJournal.jsx
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
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export default function MyJournal() {
  const router = useRouter();
  const toastRef = useRef(0);
  
  // State management
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [strategies, setStrategies] = useState([]);
  const [editingTrade, setEditingTrade] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [backendConnected, setBackendConnected] = useState(false);

  // Pagination and Search State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    symbol: "",
    entry_price: "",
    exit_price: "",
    quantity: "",
    trade_type: "Long",
    strategy_id: "",
    strategy_used: "",
    entry_reason: "",
    exit_reason: "",
    emotions: "",
    lessons_learned: "",
    tags: "",
    notes: "",
    entry_date: "",
    exit_date: "",
    screenshots: []
  });

  const showToast = useCallback((message, type = "error") => {
    toastRef.current += 1;
    const id = Date.now() + toastRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  }, []);

  // Get JWT Token
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  };

  // API call wrapper with JWT
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
        ...(options.headers || {})
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

  // Build query parameters
  const buildParams = () => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      per_page: itemsPerPage.toString(),
      sort_by: 'created_at',
      sort_order: 'desc',
      ...(searchQuery && { search: searchQuery })
    });
    return params;
  };

  // Load trades with pagination and search
  const loadTrades = useCallback(async () => {
    try {
      setLoading(true);
      const params = buildParams();
      const data = await apiCall(`/api/trade-logs?${params}`);
      
      if (data && data.items) {
        setTrades(data.items);
        setCurrentPage(data.pagination.page);
        setTotalPages(data.pagination.pages);
        setTotalItems(data.pagination.total);
      } else {
        setTrades([]);
      }
      setError('');
    } catch (err) {
      console.error('Error loading trades:', err);
      setError(`Failed to load trades: ${err.message}`);
      setTrades([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchQuery, apiCall]);

  // Load strategies
  const loadStrategies = useCallback(async () => {
    try {
      const data = await apiCall('/api/strategies?per_page=100');
      if (data && data.items) {
        setStrategies(data.items);
      }
    } catch (err) {
      console.error('Error loading strategies:', err);
    }
  }, [apiCall]);

  // Initial load
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }

    loadTrades();
    loadStrategies();
  }, [loadTrades, loadStrategies, router]);

  // Debounced search
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm !== searchQuery) {
        setSearchQuery(searchTerm);
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, searchQuery]);

  // Form handlers
  const handleFormChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file') {
      setFormData(prev => ({
        ...prev,
        screenshots: Array.from(files)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Submit Form
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Validation
      if (!formData.symbol || !formData.entry_price || !formData.exit_price || 
          !formData.quantity || !formData.entry_reason || !formData.exit_reason) {
        setError('Please fill in all required fields');
        setSubmitting(false);
        return;
      }

      // Prepare form data
      const form = new FormData();
      
      // Add all fields
      form.append('symbol', formData.symbol.toUpperCase());
      form.append('entry_price', parseFloat(formData.entry_price));
      form.append('exit_price', parseFloat(formData.exit_price));
      form.append('quantity', parseInt(formData.quantity));
      form.append('entry_date', formData.entry_date || new Date().toISOString());
      form.append('exit_date', formData.exit_date || new Date().toISOString());
      form.append('trading_strategy', formData.strategy_used);
      form.append('trade_notes', formData.entry_reason + ' | ' + formData.exit_reason);
      
      if (formData.strategy_id) {
        form.append('strategy_id', parseInt(formData.strategy_id));
      }
      if (formData.emotions) form.append('emotions', formData.emotions);
      if (formData.lessons_learned) form.append('lessons_learned', formData.lessons_learned);
      if (formData.tags) form.append('tags', formData.tags);
      if (formData.notes) form.append('notes', formData.notes);

      // Add screenshots
      formData.screenshots.forEach(file => {
        form.append('screenshots', file);
      });

      let endpoint = '/api/trade-logs';
      let method = 'POST';

      if (editingTrade) {
        endpoint = `/api/trade-logs/${editingTrade.id}`;
        method = 'PUT';
      }

      await apiCall(endpoint, {
        method,
        body: form
      });

      setSuccess(`✅ Trade ${editingTrade ? 'updated' : 'created'} successfully!`);
      showToast(`Trade ${editingTrade ? 'updated' : 'created'} successfully!`, 'success');
      
      // Reset form
      setFormData({
        symbol: "",
        entry_price: "",
        exit_price: "",
        quantity: "",
        trade_type: "Long",
        strategy_id: "",
        strategy_used: "",
        entry_reason: "",
        exit_reason: "",
        emotions: "",
        lessons_learned: "",
        tags: "",
        notes: "",
        entry_date: "",
        exit_date: "",
        screenshots: []
      });
      setShowForm(false);
      setEditingTrade(null);
      
      await loadTrades();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(`Failed to save trade: ${err.message}`);
      showToast(`Failed to save trade: ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTrade = (trade) => {
    setEditingTrade(trade);
    setFormData({
      symbol: trade.symbol || "",
      entry_price: trade.entry_price || "",
      exit_price: trade.exit_price || "",
      quantity: trade.quantity || "",
      trade_type: "Long",
      strategy_id: trade.strategy_id || "",
      strategy_used: trade.trading_strategy || "",
      entry_reason: trade.trade_notes?.split(' | ')[0] || "",
      exit_reason: trade.trade_notes?.split(' | ')[1] || "",
      emotions: "",
      lessons_learned: "",
      tags: "",
      notes: "",
      entry_date: trade.entry_date || "",
      exit_date: trade.exit_date || "",
      screenshots: []
    });
    setShowForm(true);
  };

  const handleViewTrade = (trade) => {
    setSelectedTrade(trade);
    setShowDetail(true);
  };

  const handleDeleteTrade = async (tradeId) => {
    if (!window.confirm('Are you sure you want to delete this trade?')) {
      return;
    }

    try {
      await apiCall(`/api/trade-logs/${tradeId}`, {
        method: 'DELETE'
      });
      setSuccess('✅ Trade deleted successfully!');
      showToast('Trade deleted successfully!', 'success');
      await loadTrades();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Failed to delete trade: ${err.message}`);
      showToast(`Failed to delete trade: ${err.message}`, 'error');
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTrade(null);
    setError('');
    setFormData({
      symbol: "",
      entry_price: "",
      exit_price: "",
      quantity: "",
      trade_type: "Long",
      strategy_id: "",
      strategy_used: "",
      entry_reason: "",
      exit_reason: "",
      emotions: "",
      lessons_learned: "",
      tags: "",
      notes: "",
      entry_date: "",
      exit_date: "",
      screenshots: []
    });
  };

  const calculatePnL = (entry, exit, qty, type) => {
    const entry_val = parseFloat(entry) || 0;
    const exit_val = parseFloat(exit) || 0;
    const qty_val = parseFloat(qty) || 0;
    
    if (type === 'Long') {
      return (exit_val - entry_val) * qty_val;
    } else {
      return (entry_val - exit_val) * qty_val;
    }
  };

  const calculateFormPnL = () => {
    if (formData.entry_price && formData.exit_price && formData.quantity) {
      return calculatePnL(formData.entry_price, formData.exit_price, formData.quantity, formData.trade_type);
    }
    return 0;
  };

  const getStatusColor = (pnl) => {
    if (pnl > 0) return '#10b981';
    if (pnl < 0) return '#ef4444';
    return '#64748b';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      });
    } catch {
      return 'N/A';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return '';
    }
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Toast Container
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

  // Loading state
  if (loading && trades.length === 0) {
    return (
      <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-auto bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg p-6 sm:p-8 shadow-sm animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-auto bg-slate-50">
      <ToastContainer />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-1">My Trading Journal</h1>
              <p className="text-xs sm:text-sm text-slate-600">
                <span className="font-semibold text-blue-600">{totalItems}</span> trades • 
                Page <span className="font-semibold text-blue-600">{currentPage}</span> of <span className="font-semibold text-blue-600">{totalPages}</span>
                {!backendConnected && <span className="text-orange-600 ml-2">⚠️ Offline Mode</span>}
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition flex items-center justify-center gap-2 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>New Trade</span>
            </button>
          </div>

          {success && (
            <div className="mb-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-xs sm:text-sm">
              {success}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs sm:text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by symbol, strategy..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 bg-white text-black"
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Table Section */}
        {trades.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm text-center py-8 sm:py-12 px-3 sm:px-4">
            <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No Trades Found</h3>
            <p className="text-sm text-slate-600 mb-6">Start tracking your trading journey by adding your first trade.</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Trade</span>
            </button>
          </div>
        ) : (
          <>
            {/* Desktop MUI Table */}
            <div className="hidden md:block">
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>Symbol</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>Entry</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>Exit</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>Qty</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>P&L</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px', textAlign: 'center' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {trades.map((trade) => {
                      const pnl = calculatePnL(trade.entry_price, trade.exit_price, trade.quantity, 'Long');
                      const createdDate = formatDate(trade.created_at || trade.entry_date);
                      const createdTime = formatTime(trade.created_at || trade.entry_date);
                      
                      return (
                        <TableRow 
                          key={trade.id} 
                          hover 
                          sx={{ 
                            '&:hover': { backgroundColor: '#f8fafc' },
                            height: '72px'
                          }}
                        >
                          <TableCell sx={{ fontSize: '0.875rem', fontWeight: 500, padding: '16px' }}>{trade.symbol}</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.875rem', padding: '16px' }}>₹{(trade.entry_price || 0).toFixed(2)}</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.875rem', padding: '16px' }}>₹{(trade.exit_price || 0).toFixed(2)}</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.875rem', padding: '16px' }}>{trade.quantity}</TableCell>
                          <TableCell align="right" sx={{ fontSize: '0.875rem', fontWeight: 600, color: getStatusColor(pnl || 0), padding: '16px' }}>
                            ₹{(pnl || 0).toFixed(2)}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', padding: '16px' }}>{createdDate} {createdTime}</TableCell>
                          <TableCell sx={{ padding: '16px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                              <Tooltip title="View">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewTrade(trade)}
                                  sx={{ color: '#64748b' }}
                                >
                                  <VisibilityIcon sx={{ fontSize: '1rem' }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditTrade(trade)}
                                  sx={{ color: '#2563eb' }}
                                >
                                  <EditIcon sx={{ fontSize: '1rem' }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteTrade(trade.id)}
                                  sx={{ color: '#dc2626' }}
                                >
                                  <DeleteIcon sx={{ fontSize: '1rem' }} />
                                </IconButton>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Desktop Pagination */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#ffffff',
                  padding: '1.5rem',
                  borderTop: '1px solid #e2e8f0',
                  borderRadius: '0 0 8px 8px'
                }}>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#64748b',
                    fontWeight: 500
                  }}>
                    {startItem}–{endItem} of {totalItems}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Tooltip title="Previous">
                      <span>
                        <IconButton
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          size="small"
                          sx={{
                            border: '1px solid #cbd5e1',
                            borderRadius: '0.375rem',
                            color: currentPage === 1 ? '#cbd5e1' : '#64748b'
                          }}
                        >
                          <ChevronLeftIcon sx={{ fontSize: '1.25rem' }} />
                        </IconButton>
                      </span>
                    </Tooltip>

                    <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>
                      {currentPage}/{totalPages}
                    </span>

                    <Tooltip title="Next">
                      <span>
                        <IconButton
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          size="small"
                          sx={{
                            border: '1px solid #cbd5e1',
                            borderRadius: '0.375rem',
                            color: currentPage === totalPages ? '#cbd5e1' : '#64748b'
                          }}
                        >
                          <ChevronRightIcon sx={{ fontSize: '1.25rem' }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-200 bg-white rounded-lg shadow-sm overflow-hidden">
              {trades.map((trade) => {
                const pnl = calculatePnL(trade.entry_price, trade.exit_price, trade.quantity, 'Long');
                const createdDate = formatDate(trade.created_at || trade.entry_date);
                
                return (
                  <div key={trade.id} className="p-4 hover:bg-slate-50 transition">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 text-base">{trade.symbol}</h4>
                        <p className="text-xs text-slate-600 mt-1">{createdDate}</p>
                      </div>
                      <div className="text-right font-bold text-sm" style={{ color: getStatusColor(pnl || 0) }}>
                        ₹{(pnl || 0).toFixed(2)}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-blue-50 rounded-lg p-2.5 text-center">
                        <p className="text-xs text-blue-700 font-medium mb-0.5">Entry</p>
                        <p className="font-bold text-slate-900 text-sm">₹{(trade.entry_price || 0).toFixed(2)}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-2.5 text-center">
                        <p className="text-xs text-green-700 font-medium mb-0.5">Exit</p>
                        <p className="font-bold text-slate-900 text-sm">₹{(trade.exit_price || 0).toFixed(2)}</p>
                      </div>
                      <div className="bg-slate-100 rounded-lg p-2.5 text-center">
                        <p className="text-xs text-slate-700 font-medium mb-0.5">Qty</p>
                        <p className="font-bold text-slate-900 text-sm">{trade.quantity}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <Tooltip title="View">
                        <IconButton
                          size="small"
                          onClick={() => handleViewTrade(trade)}
                          sx={{ flex: 1, color: '#64748b' }}
                        >
                          <VisibilityIcon sx={{ fontSize: '1rem' }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleEditTrade(trade)}
                          sx={{ flex: 1, color: '#2563eb' }}
                        >
                          <EditIcon sx={{ fontSize: '1rem' }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteTrade(trade.id)}
                          sx={{ flex: 1, color: '#dc2626' }}
                        >
                          <DeleteIcon sx={{ fontSize: '1rem' }} />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </div>
                );
              })}

              {/* Mobile Pagination */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  backgroundColor: '#f8fafc',
                  borderTop: '1px solid #e2e8f0'
                }}>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#64748b',
                    fontWeight: 500
                  }}>
                    {startItem}–{endItem} of {totalItems}
                  </div>

                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      style={{
                        padding: '0.375rem 0.5rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '0.25rem',
                        backgroundColor: currentPage === 1 ? '#f1f5f9' : '#ffffff',
                        color: currentPage === 1 ? '#cbd5e1' : '#64748b',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <ChevronLeftIcon sx={{ fontSize: '1rem' }} />
                    </button>

                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      style={{
                        padding: '0.375rem 0.5rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '0.25rem',
                        backgroundColor: currentPage === totalPages ? '#f1f5f9' : '#ffffff',
                        color: currentPage === totalPages ? '#cbd5e1' : '#64748b',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <ChevronRightIcon sx={{ fontSize: '1rem' }} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Trade Detail Modal */}
        {showDetail && selectedTrade && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="bg-slate-100 px-6 py-4 flex justify-between items-center border-b border-slate-200 sticky top-0">
                <h2 className="text-lg font-bold text-slate-900">Trade - {selectedTrade.symbol}</h2>
                <button
                  onClick={() => setShowDetail(false)}
                  className="text-slate-600 hover:text-slate-900 transition"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-100 rounded-lg p-4 text-center">
                    <p className="text-xs font-medium text-slate-600 mb-1">Symbol</p>
                    <p className="font-bold text-slate-900">{selectedTrade.symbol}</p>
                  </div>
                  <div className="bg-slate-100 rounded-lg p-4 text-center">
                    <p className="text-xs font-medium text-slate-600 mb-1">Entry</p>
                    <p className="font-bold text-slate-900">₹{(selectedTrade.entry_price || 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-slate-100 rounded-lg p-4 text-center">
                    <p className="text-xs font-medium text-slate-600 mb-1">Exit</p>
                    <p className="font-bold text-slate-900">₹{(selectedTrade.exit_price || 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-slate-100 rounded-lg p-4 text-center">
                    <p className="text-xs font-medium text-slate-600 mb-1">Qty</p>
                    <p className="font-bold text-slate-900">{selectedTrade.quantity}</p>
                  </div>
                </div>

                {selectedTrade.trade_notes && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Notes</h4>
                    <div className="bg-slate-100 rounded-lg p-4">
                      <p className="text-slate-700 text-sm">{selectedTrade.trade_notes}</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setShowDetail(false)}
                  className="w-full px-4 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Trade Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-white rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="bg-slate-100 px-6 py-4 flex justify-between items-center border-b border-slate-200 sticky top-0">
                <h2 className="text-lg font-bold text-slate-900">{editingTrade ? 'Edit Trade' : 'New Trade'}</h2>
                <button
                  onClick={handleCloseForm}
                  className="text-slate-600 hover:text-slate-900 transition"
                >
                  ✕
                </button>
              </div>

              <div className="p-6">
                <form onSubmit={handleSubmitForm} className="space-y-4">
                  {/* Basic Trade Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">Symbol *</label>
                      <input
                        type="text"
                        name="symbol"
                        value={formData.symbol}
                        onChange={handleFormChange}
                        placeholder="INFY"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder-slate-400 bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">Entry Price *</label>
                      <input
                        type="number"
                        step="0.01"
                        name="entry_price"
                        value={formData.entry_price}
                        onChange={handleFormChange}
                        placeholder="1500.00"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder-slate-400 bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">Exit Price *</label>
                      <input
                        type="number"
                        step="0.01"
                        name="exit_price"
                        value={formData.exit_price}
                        onChange={handleFormChange}
                        placeholder="1550.00"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder-slate-400 bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">Quantity *</label>
                      <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleFormChange}
                        placeholder="10"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder-slate-400 bg-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Strategy & Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">Strategy</label>
                      <select
                        name="strategy_id"
                        value={formData.strategy_id}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
                      >
                        <option value="">Select strategy...</option>
                        {strategies.map(strategy => (
                          <option key={strategy.id} value={strategy.id}>
                            {strategy.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">Entry Date</label>
                      <input
                        type="date"
                        name="entry_date"
                        value={formData.entry_date}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">Exit Date</label>
                      <input
                        type="date"
                        name="exit_date"
                        value={formData.exit_date}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
                      />
                    </div>
                  </div>

                  {/* Entry & Exit Reasons */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Entry Reason *</label>
                    <textarea
                      name="entry_reason"
                      value={formData.entry_reason}
                      onChange={handleFormChange}
                      placeholder="Why did you enter this trade?"
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder-slate-400 bg-white resize-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Exit Reason *</label>
                    <textarea
                      name="exit_reason"
                      value={formData.exit_reason}
                      onChange={handleFormChange}
                      placeholder="Why did you exit this trade?"
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder-slate-400 bg-white resize-none"
                      required
                    />
                  </div>

                  {/* P&L Display */}
                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#f1f5f9',
                    borderRadius: '0.5rem',
                    textAlign: 'center',
                    border: calculateFormPnL() > 0 ? '2px solid #10b981' : calculateFormPnL() < 0 ? '2px solid #ef4444' : '2px solid #cbd5e1'
                  }}>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>Estimated P&L</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: getStatusColor(calculateFormPnL()) }}>
                      ₹{calculateFormPnL().toFixed(2)}
                    </p>
                  </div>

                  {/* Form Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-slate-200">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                    >
                      {submitting ? 'Saving...' : (editingTrade ? 'Update Trade' : 'Save Trade')}
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseForm}
                      className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
