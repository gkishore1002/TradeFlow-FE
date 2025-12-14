"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import CustomDropdown from "@/components/CustomDropdown";
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
  Image as ImageIcon,
} from "@mui/icons-material";
import DeleteModal from "@/components/DeleteModal";

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
  const [imagePreviews, setImagePreviews] = useState([]);

  // Pagination and Search State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Trade Form Data - TradeLog FIELDS ONLY
  const [formData, setFormData] = useState({
    symbol: "",
    entry_price: "",
    exit_price: "",
    quantity: "",
    entry_date: "",
    exit_date: "",
    strategy_id: "",
    trading_strategy: "",
    trade_notes: "",
    images: []
  });

  // Delete modal state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [tradeToDelete, setTradeToDelete] = useState(null);

  // Toast notification
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

  // API call wrapper
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

  // Load trades
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
      setError(`Failed to load trades: ${err.message}`);
      showToast(`Failed to load trades: ${err.message}`, 'error');
      setTrades([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchQuery, apiCall, showToast]);

  // Load strategies
  const loadStrategies = useCallback(async () => {
    try {
      const data = await apiCall('/api/strategies?per_page=100');
      if (data && data.items) {
        setStrategies(data.items);
      }
    } catch {
      // non-blocking
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

  // Form change handler
  const handleFormChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === 'file') {
      const fileArray = Array.from(files || []);
      setFormData(prev => ({
        ...prev,
        images: fileArray
      }));

      const previews = [];
      fileArray.forEach(file => {
        if (file.type.startsWith('image/')) {
          const preview = URL.createObjectURL(file);
          previews.push({ file, preview });
        }
      });
      setImagePreviews(previews);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle dropdown change
  const handleDropdownChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Remove image preview
  const removeImagePreview = (index) => {
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    const newImages = formData.images.filter((_, i) => i !== index);

    if (imagePreviews[index]) {
      URL.revokeObjectURL(imagePreviews[index].preview);
    }

    setImagePreviews(newPreviews);
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
  };

  // Submit Form
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Validation
      if (!formData.symbol || !formData.entry_price || !formData.exit_price || !formData.quantity) {
        setError('Please fill in all required fields (Symbol, Entry Price, Exit Price, Quantity)');
        setSubmitting(false);
        return;
      }

      if (!formData.entry_date || !formData.exit_date) {
        setError('Please fill in both Entry and Exit dates');
        setSubmitting(false);
        return;
      }

      // Prepare form data
      const form = new FormData();

      form.append('symbol', formData.symbol.toUpperCase());
      form.append('entry_price', parseFloat(formData.entry_price));
      form.append('exit_price', parseFloat(formData.exit_price));
      form.append('quantity', parseInt(formData.quantity));

      const entryDateObj = new Date(formData.entry_date);
      const exitDateObj = new Date(formData.exit_date);

      form.append('entry_date', entryDateObj.toISOString());
      form.append('exit_date', exitDateObj.toISOString());

      // Handle strategy
      if (formData.strategy_id) {
        form.append('strategy_id', parseInt(formData.strategy_id));
        const selectedStrategy = strategies.find(s => s.id === parseInt(formData.strategy_id));
        if (selectedStrategy) {
          form.append('trading_strategy', selectedStrategy.name);
        }
      } else if (formData.trading_strategy) {
        form.append('trading_strategy', formData.trading_strategy);
      }

      if (formData.trade_notes) {
        form.append('trade_notes', formData.trade_notes);
      }

      formData.images.forEach(file => {
        form.append('images', file);
      });

      let endpoint = '/api/trade-logs';
      let method = 'POST';

      if (editingTrade) {
        endpoint = `/api/trade-logs/${editingTrade.id}`;
        method = 'PUT';
      }

      const result = await apiCall(endpoint, {
        method,
        body: form
      });

      if (result) {
        const message = editingTrade ? 'Trade updated successfully!' : 'Trade created successfully!';
        setSuccess(message);
        showToast(message, 'success');

        setFormData({
          symbol: "",
          entry_price: "",
          exit_price: "",
          quantity: "",
          entry_date: "",
          exit_date: "",
          strategy_id: "",
          trading_strategy: "",
          trade_notes: "",
          images: []
        });

        imagePreviews.forEach(p => URL.revokeObjectURL(p.preview));
        setImagePreviews([]);
        setEditingTrade(null);
        setShowForm(false);

        loadTrades();
      }
    } catch (err) {
      setError(`Failed to submit form: ${err.message}`);
      showToast(`Failed to submit form: ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Close form
  const handleCloseForm = (e) => {
    if (e) e.preventDefault();
    setShowForm(false);
    setEditingTrade(null);
    setError('');
    imagePreviews.forEach(p => URL.revokeObjectURL(p.preview));
    setImagePreviews([]);
    setFormData({
      symbol: "",
      entry_price: "",
      exit_price: "",
      quantity: "",
      entry_date: "",
      exit_date: "",
      strategy_id: "",
      trading_strategy: "",
      trade_notes: "",
      images: []
    });
  };

  // Edit trade
  const handleEditTrade = (trade) => {
    setEditingTrade(trade);

    const formatDateForInput = (dateStr) => {
      if (!dateStr) return '';
      try {
        const date = new Date(dateStr);
        return date.toISOString().split('T')[0];
      } catch {
        return '';
      }
    };

    setFormData({
      symbol: trade.symbol || '',
      entry_price: trade.entry_price || '',
      exit_price: trade.exit_price || '',
      quantity: trade.quantity || '',
      strategy_id: trade.strategy_id || '',
      trading_strategy: trade.trading_strategy || '',
      trade_notes: trade.trade_notes || '',
      entry_date: formatDateForInput(trade.entry_date),
      exit_date: formatDateForInput(trade.exit_date),
      images: []
    });
    setImagePreviews([]);
    setShowForm(true);
  };

  // Delete flow with reusable modal
  const requestDeleteTrade = (trade) => {
    setTradeToDelete(trade);
    setDeleteOpen(true);
  };

  const confirmDeleteTrade = async () => {
    if (!tradeToDelete) return;
    try {
      setDeleting(true);
      await apiCall(`/api/trade-logs/${tradeToDelete.id}`, { method: 'DELETE' });
      setSuccess('✅ Trade deleted successfully!');
      showToast('Trade deleted successfully!', 'success');
      await loadTrades();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Failed to delete trade: ${err.message}`);
      showToast(`Failed to delete trade: ${err.message}`, 'error');
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
      setTradeToDelete(null);
    }
  };

  const cancelDeleteTrade = () => {
    setDeleteOpen(false);
    setTradeToDelete(null);
  };

  // View trade
  const handleViewTrade = (trade) => {
    setSelectedTrade(trade);
    setShowDetail(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN');
  };

  // Toast Container
  const Toasts = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2 p-3 sm:p-0">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg shadow-lg border-l-4 animate-fade-in text-xs sm:text-sm font-medium ${toast.type === "success" ? "bg-green-50 border-green-500 text-green-800" :
            toast.type === "info" ? "bg-blue-50 border-blue-500 text-blue-800" :
              "bg-red-50 border-red-500 text-red-800"
            }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      <Toasts />

      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-black mb-1 sm:mb-2">My Trade Journal</h1>
            <p className="text-sm sm:text-base text-black">
              <span className="font-semibold text-blue-600">{totalItems}</span> trades
              {!backendConnected && <span className="text-orange-600 ml-2">⚠️ Offline</span>}
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#f15f26] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold hover:bg-[#d94e1f] transition-all duration-200 shadow-lg"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="whitespace-nowrap">New Trade</span>
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative mt-4 sm:mt-4">
          <input
            type="text"
            placeholder="Search trades by symbol or strategy..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white text-sm sm:text-base placeholder-slate-400"
          />
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
          <div className="flex items-start">
            <div className="flex-1 text-green-600 text-sm sm:text-base">{success}</div>
            <button
              onClick={() => setSuccess("")}
              className="flex-shrink-0 text-green-600 hover:text-green-800 p-1"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
          <div className="flex items-start">
            <div className="flex-1 text-red-600 text-sm sm:text-base pr-2">{error}</div>
            <button
              onClick={() => setError("")}
              className="flex-shrink-0 text-red-600 hover:text-red-800 p-1"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Loading / Empty / Table */}
      {loading ? (
        <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-white/20">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-slate-600 mt-3 text-sm sm:text-base">Loading trades...</p>
        </div>
      ) : trades.length === 0 ? (
        <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-white/20">
          <svg className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-base sm:text-lg font-semibold text-black mb-2">No trades found</h3>
          <p className="text-sm sm:text-base text-slate-600">Start logging your trades to see them here</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-white/20 overflow-hidden">
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f1f5f9' }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>Symbol</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>Entry Price</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>Exit Price</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>P&L</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>Images</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px', textAlign: 'center' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trades.map(trade => (
                    <TableRow key={trade.id} className="hover:bg-slate-50" sx={{ height: '72px' }}>
                      <TableCell sx={{ fontSize: '0.875rem', fontWeight: 500, padding: '16px' }}>{trade.symbol}</TableCell>
                      <TableCell sx={{ fontSize: '0.875rem', padding: '16px' }}>₹{trade.entry_price}</TableCell>
                      <TableCell sx={{ fontSize: '0.875rem', padding: '16px' }}>₹{trade.exit_price}</TableCell>
                      <TableCell sx={{ padding: '16px' }}>
                        <Chip
                          label={`₹${trade.profit_loss?.toFixed(2) || 0}`}
                          color={(trade.profit_loss || 0) >= 0 ? 'success' : 'error'}
                          size="small"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      </TableCell>
                      <TableCell sx={{ padding: '16px' }}>
                        {trade.images && trade.images.length > 0 ? (
                          <Chip
                            icon={<ImageIcon sx={{ fontSize: '0.75rem' }} />}
                            label={`${trade.images.length}`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.75rem' }}
                          />
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </TableCell>
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
                              sx={{ color: '#f15f26' }}
                            >
                              <EditIcon sx={{ fontSize: '1rem' }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => requestDeleteTrade(trade)}
                              sx={{ color: '#dc2626' }}
                            >
                              <DeleteIcon sx={{ fontSize: '1rem' }} />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {trades.map(trade => (
              <div key={trade.id} className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/30 hover:shadow-xl transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{trade.symbol}</h4>
                    <p className="text-xs text-slate-600 mt-1">{formatDate(trade.entry_date)}</p>
                  </div>
                  <Chip
                    label={`₹${trade.profit_loss?.toFixed(2) || 0}`}
                    color={(trade.profit_loss || 0) >= 0 ? 'success' : 'error'}
                    size="small"
                    sx={{ fontSize: '0.75rem' }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-blue-700 font-medium mb-1">Entry</p>
                    <p className="font-bold text-slate-900 text-sm">₹{trade.entry_price}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-green-700 font-medium mb-1">Exit</p>
                    <p className="font-bold text-slate-900 text-sm">₹{trade.exit_price}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-700 font-medium mb-1">Qty</p>
                    <p className="font-bold text-slate-900 text-sm">{trade.quantity}</p>
                  </div>
                </div>

                {trade.images && trade.images.length > 0 && (
                  <div className="mb-3">
                    <Chip
                      icon={<ImageIcon sx={{ fontSize: '0.75rem' }} />}
                      label={`${trade.images.length} image(s)`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  </div>
                )}

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
                      sx={{ flex: 1, color: '#f15f26' }}
                    >
                      <EditIcon sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      onClick={() => requestDeleteTrade(trade)}
                      sx={{ flex: 1, color: '#dc2626' }}
                    >
                      <DeleteIcon sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-white/20">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                  Page {currentPage} of {totalPages}
                </div>

                <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                  <Tooltip title="Previous">
                    <span>
                      <IconButton
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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

                  <span className="text-xs sm:text-sm text-slate-600 font-semibold">
                    {currentPage}/{totalPages}
                  </span>

                  <Tooltip title="Next">
                    <span>
                      <IconButton
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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
            </div>
          )}
        </>
      )}

      {/* Trade Detail Modal */}
      {showDetail && selectedTrade && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-hidden">
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-2xl h-[90vh] flex flex-col overflow-hidden my-4">
            <div className="bg-slate-100 px-4 sm:px-6 py-4 flex justify-between items-center border-b border-slate-200 flex-shrink-0">
              <h2 className="text-lg font-bold text-slate-900">{selectedTrade.symbol} Trade Details</h2>
              <button
                type="button"
                onClick={() => setShowDetail(false)}
                className="text-slate-600 hover:text-slate-900 transition"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-600">Entry Price</p>
                    <p className="text-lg font-bold text-slate-900">₹{selectedTrade.entry_price}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Exit Price</p>
                    <p className="text-lg font-bold text-slate-900">₹{selectedTrade.exit_price}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Quantity</p>
                    <p className="text-lg font-bold text-slate-900">{selectedTrade.quantity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">P&L</p>
                    <p className={`text-lg font-bold ${(selectedTrade.profit_loss || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{selectedTrade.profit_loss?.toFixed(2) || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Entry Date</p>
                    <p className="text-lg font-bold text-slate-900">{formatDate(selectedTrade.entry_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Exit Date</p>
                    <p className="text-lg font-bold text-slate-900">{formatDate(selectedTrade.exit_date)}</p>
                  </div>
                </div>

                {selectedTrade.trading_strategy && (
                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-2">Strategy</p>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-slate-700">{selectedTrade.trading_strategy}</p>
                    </div>
                  </div>
                )}

                {selectedTrade.images && selectedTrade.images.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-3">Images ({selectedTrade.images.length})</p>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedTrade.images.map((url, idx) => (
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

                {selectedTrade.trade_notes && (
                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-2">Notes</p>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-slate-600 text-sm">{selectedTrade.trade_notes}</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDetail(false)}
                    className="w-full px-4 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trade Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-hidden">
          <div className="w-full max-w-4xl bg-white rounded-lg shadow-2xl h-[90vh] flex flex-col overflow-hidden my-4">
            <div className="bg-slate-100 px-4 sm:px-6 py-4 flex justify-between items-center border-b border-slate-200 flex-shrink-0">
              <h2 className="text-lg font-bold text-slate-900">{editingTrade ? 'Edit Trade' : 'New Trade'}</h2>
              <button
                type="button"
                onClick={handleCloseForm}
                className="text-slate-600 hover:text-slate-900 transition"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-4 sm:p-6">
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
                        placeholder="WIPRO"
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
                    <CustomDropdown
                      name="strategy_id"
                      label="Strategy"
                      placeholder="Select strategy..."
                      value={formData.strategy_id}
                      onChange={handleDropdownChange}
                      options={strategies.map(s => ({ value: s.id, label: s.name }))}
                      searchable={true}
                    />

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">Entry Date *</label>
                      <input
                        type="date"
                        name="entry_date"
                        value={formData.entry_date}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">Exit Date *</label>
                      <input
                        type="date"
                        name="exit_date"
                        value={formData.exit_date}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Trade Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Trade Notes</label>
                    <textarea
                      name="trade_notes"
                      value={formData.trade_notes}
                      onChange={handleFormChange}
                      placeholder="Any notes about this trade..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder-slate-400 bg-white resize-none"
                      rows="3"
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">Upload Images</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-all">
                      <input
                        type="file"
                        name="images"
                        multiple
                        accept="image/*"
                        onChange={handleFormChange}
                        className="hidden"
                        id="trade-image-upload"
                      />
                      <label htmlFor="trade-image-upload" className="cursor-pointer block">
                        <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600 font-medium">Click to upload or drag images here</p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 16MB</p>
                      </label>
                      {formData.images.length > 0 && (
                        <div className="mt-4 text-sm text-green-600 font-medium">
                          ✓ {formData.images.length} image(s) selected
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
                                onClick={() => removeImagePreview(idx)}
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

                  {/* Submit Button */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-slate-200 mt-6">
                    <button
                      type="button"
                      onClick={handleCloseForm}
                      disabled={submitting}
                      className="w-full sm:w-auto px-4 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        editingTrade ? 'Update Trade' : 'Create Trade'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Delete Modal */}
      <DeleteModal
        open={deleteOpen}
        title="Delete Trade"
        message={
          tradeToDelete
            ? `Are you sure you want to delete trade "${tradeToDelete.symbol}"? This action cannot be undone.`
            : 'Are you sure you want to delete this trade? This action cannot be undone.'
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={deleting}
        onConfirm={confirmDeleteTrade}
        onCancel={cancelDeleteTrade}
      />

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
