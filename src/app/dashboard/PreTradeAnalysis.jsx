'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import CustomDropdown from '@/components/CustomDropdown';
import DeleteModal from '@/components/DeleteModal';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export default function PreTradeAnalysis() {
  const router = useRouter();
  const toastRef = useRef(0);
  const mountedRef = useRef(false);

  // Data
  const [analyses, setAnalyses] = useState([]);
  const [strategies, setStrategies] = useState([]);

  // UI/system
  const [loading, setLoading] = useState(true);
  const [backendConnected, setBackendConnected] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [editingAnalysis, setEditingAnalysis] = useState(null);

  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [analysisToDelete, setAnalysisToDelete] = useState(null);

  // Form
  const [submitting, setSubmitting] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [formData, setFormData] = useState({
    symbol: '',
    current_price: '',
    entry_price: '',
    target_price: '',
    stop_loss: '',
    quantity: '',
    trade_type: 'Long',
    strategy_id: '',
    strategy_name: '',
    technical_analysis: '',
    fundamental_analysis: '',
    confidence_level: 'Medium',
    timeframe: 'Intraday',
    additional_notes: '',
    images: [],
  });

  // Pagination + search
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Options
  const tradeTypeOptions = [
    { value: 'Long', label: 'Long' },
    { value: 'Short', label: 'Short' },
  ];
  const confidenceOptions = [
    { value: 'High', label: 'High' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Low', label: 'Low' },
  ];
  const timeframeOptions = [
    { value: 'Intraday', label: 'Intraday' },
    { value: 'Swing', label: 'Swing' },
    { value: 'Position', label: 'Position' },
    { value: 'Long Term', label: 'Long Term' },
  ];

  // Toast
  const showToast = useCallback((message, type = 'error') => {
    toastRef.current += 1;
    const id = Date.now() + toastRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const getAuthToken = () => {
    if (typeof window !== 'undefined') return localStorage.getItem('access_token');
    return null;
  };

  // API
  const apiCall = useCallback(async (endpoint, options = {}) => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return null;
    }
    const isFormData = options.body instanceof FormData;
    const headers = {
      Authorization: `Bearer ${token}`,
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    };
    const res = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    if (res.status === 401) {
      localStorage.removeItem('access_token');
      router.push('/login');
      return null;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || `HTTP ${res.status}`);
    }
    const data = await res.json().catch(() => null);
    setBackendConnected(true);
    return data;
  }, [router]);

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams({
      page: String(currentPage),
      per_page: String(itemsPerPage),
      sort_by: 'created_at',
      sort_order: 'desc',
    });
    if (searchQuery) params.set('search', searchQuery);
    return params.toString();
  }, [currentPage, itemsPerPage, searchQuery]);

  const loadAnalyses = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildQuery();
      const data = await apiCall(`/api/analyses?${qs}`);
      if (data?.items && Array.isArray(data.items)) {
        setAnalyses(data.items);
        if (data.pagination) {
          setTotalItems(data.pagination.total ?? data.items.length);
          setTotalPages(data.pagination.pages || 1);
        } else {
          setTotalItems(data.items.length);
          setTotalPages(1);
        }
      } else if (Array.isArray(data)) {
        setAnalyses(data);
        setTotalItems(data.length);
        setTotalPages(1);
      } else {
        setAnalyses([]);
        setTotalItems(0);
        setTotalPages(0);
      }
      setError('');
    } catch (err) {
      setAnalyses([]);
      setError(`Failed to load analyses: ${err.message}`);
      showToast(`Failed to load analyses: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [apiCall, buildQuery, showToast]);

  const loadStrategies = useCallback(async () => {
    try {
      const data = await apiCall('/api/strategies?per_page=100');
      if (data?.items) setStrategies(data.items);
      else if (Array.isArray(data)) setStrategies(data);
    } catch {
      // ignore
    }
  }, [apiCall]);

  // Mount once
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }
    loadAnalyses();
    loadStrategies();
  }, [loadAnalyses, loadStrategies, router]);

  // Refetch on filters change
  useEffect(() => {
    if (!mountedRef.current) return;
    loadAnalyses();
  }, [currentPage, searchQuery, loadAnalyses]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchQuery !== searchTerm) {
        setSearchQuery(searchTerm);
        setCurrentPage(1);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [searchTerm, searchQuery]);

  // Form openers
  const openNewAnalysis = () => {
    setEditingAnalysis(null);
    setFormData({
      symbol: '',
      current_price: '',
      entry_price: '',
      target_price: '',
      stop_loss: '',
      quantity: '',
      trade_type: 'Long',
      strategy_id: '',
      strategy_name: '',
      technical_analysis: '',
      fundamental_analysis: '',
      confidence_level: 'Medium',
      timeframe: 'Intraday',
      additional_notes: '',
      images: [],
    });
    setImagePreviews([]);
    setShowForm(true);
  };

  const handleEditAnalysis = (a) => {
    // Only set form values and open modal; do not touch header/UI state
    setEditingAnalysis(a);
    setFormData({
      symbol: a.symbol || '',
      current_price: a.current_price || '',
      entry_price: a.entry_price || '',
      target_price: a.target_price || '',
      stop_loss: a.stop_loss || '',
      quantity: a.quantity || '',
      trade_type: a.trade_type || 'Long',
      strategy_id: a.strategy_id || '',
      strategy_name: a.strategy_name || '',
      technical_analysis: a.technical_analysis || '',
      fundamental_analysis: a.fundamental_analysis || '',
      confidence_level: a.confidence_level || 'Medium',
      timeframe: a.timeframe || 'Intraday',
      additional_notes: a.additional_notes || '',
      images: [],
    });
    setImagePreviews([]);
    setShowForm(true);
  };

  // Inputs
  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      const fileArray = Array.from(files || []);
      setFormData(prev => ({ ...prev, images: fileArray }));
      const previews = [];
      fileArray.forEach(file => {
        if (file.type.startsWith('image/')) {
          const preview = URL.createObjectURL(file);
          previews.push({ file, preview });
        }
      });
      setImagePreviews(previews);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDropdownChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const removeImagePreview = (i) => {
    const newPreviews = imagePreviews.filter((_, idx) => idx !== i);
    const newImages = formData.images.filter((_, idx) => idx !== i);
    if (imagePreviews[i]) URL.revokeObjectURL(imagePreviews[i].preview);
    setImagePreviews(newPreviews);
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const resetForm = () => {
    imagePreviews.forEach(p => URL.revokeObjectURL(p.preview));
    setImagePreviews([]);
    setFormData({
      symbol: '',
      current_price: '',
      entry_price: '',
      target_price: '',
      stop_loss: '',
      quantity: '',
      trade_type: 'Long',
      strategy_id: '',
      strategy_name: '',
      technical_analysis: '',
      fundamental_analysis: '',
      confidence_level: 'Medium',
      timeframe: 'Intraday',
      additional_notes: '',
      images: [],
    });
    setEditingAnalysis(null);
  };

  const handleCancel = () => {
    // Close modal only; do not touch header state
    setShowForm(false);
    setError('');
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.symbol || !formData.current_price || !formData.entry_price ||
        !formData.target_price || !formData.stop_loss || !formData.quantity ||
        !formData.technical_analysis) {
      setError('Please fill in all required fields');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const form = new FormData();
      form.append('symbol', formData.symbol.toUpperCase());
      form.append('current_price', parseFloat(formData.current_price));
      form.append('entry_price', parseFloat(formData.entry_price));
      form.append('target_price', parseFloat(formData.target_price));
      form.append('stop_loss', parseFloat(formData.stop_loss));
      form.append('quantity', parseInt(formData.quantity));
      form.append('trade_type', formData.trade_type);
      form.append('confidence_level', formData.confidence_level);
      form.append('timeframe', formData.timeframe);
      form.append('technical_analysis', formData.technical_analysis);
      if (formData.fundamental_analysis) form.append('fundamental_analysis', formData.fundamental_analysis);
      if (formData.additional_notes) form.append('additional_notes', formData.additional_notes);
      if (formData.strategy_id) form.append('strategy_id', parseInt(formData.strategy_id));
      if (formData.strategy_name) form.append('strategy_name', formData.strategy_name);
      formData.images.forEach(file => form.append('images', file));

      const endpoint = editingAnalysis ? `/api/analyses/${editingAnalysis.id}` : '/api/analyses';
      const method = editingAnalysis ? 'PUT' : 'POST';
      const result = await apiCall(endpoint, { method, body: form });
      if (result) {
        const msg = editingAnalysis ? 'Analysis updated successfully!' : 'Analysis created successfully!';
        setSuccess(msg);
        showToast(msg, 'success');
        setShowForm(false); // close after success
        resetForm();
        await loadAnalyses();
      }
    } catch (err) {
      setError(`Failed to save analysis: ${err.message}`);
      showToast(`Failed to save analysis: ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // View modal helpers
  const normalizeForView = (analysis) => {
    if (!analysis || typeof analysis !== 'object') return null;
    return {
      symbol: analysis.symbol ?? '-',
      current_price: analysis.current_price ?? analysis.currentprice ?? '-',
      entry_price: analysis.entry_price ?? analysis.entryprice ?? '-',
      target_price: analysis.target_price ?? analysis.targetprice ?? '-',
      stop_loss: analysis.stop_loss ?? analysis.stoploss ?? '-',
      quantity: analysis.quantity ?? '-',
      trade_type: analysis.trade_type ?? analysis.tradetype ?? '-',
      confidence_level: analysis.confidence_level ?? analysis.confidencelevel ?? '-',
      timeframe: analysis.timeframe ?? '-',
      technical_analysis: analysis.technical_analysis ?? analysis.technicalanalysis ?? '',
      fundamental_analysis: analysis.fundamental_analysis ?? analysis.fundamentalanalysis ?? '',
      additional_notes: analysis.additional_notes ?? analysis.additionalnotes ?? '',
      created_at: analysis.created_at ?? analysis.createdAt ?? null,
      images: Array.isArray(analysis.images) ? analysis.images : [],
    };
  };

  const handleViewAnalysis = (analysis) => {
    const normalized = normalizeForView(analysis);
    if (!normalized) return;
    setSelectedAnalysis(normalized);
    requestAnimationFrame(() => setShowAnalysisModal(true));
  };

  // Delete
  const requestDeleteAnalysis = (analysis) => {
    setAnalysisToDelete(analysis);
    setDeleteOpen(true);
  };
  const confirmDeleteAnalysis = async () => {
    if (!analysisToDelete) return;
    try {
      setDeleting(true);
      await apiCall(`/api/analyses/${analysisToDelete.id}`, { method: 'DELETE' });
      const msg = 'Analysis deleted successfully!';
      setSuccess(msg);
      showToast(msg, 'success');
      await loadAnalyses();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Failed to delete analysis: ${err.message}`);
      showToast(`Failed to delete analysis: ${err.message}`, 'error');
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
      setAnalysisToDelete(null);
    }
  };
  const cancelDeleteAnalysis = () => {
    setDeleteOpen(false);
    setAnalysisToDelete(null);
  };

  // UI helpers
  const calculateMetrics = (a) => {
    const entry = Number(a.entry_price ?? 0);
    const target = Number(a.target_price ?? 0);
    const stop = Number(a.stop_loss ?? 0);
    const qty = Number(a.quantity ?? 0);
    let profit = 0, loss = 0, rr = 0;
    if ((a.trade_type || 'Long') === 'Long') {
      profit = (target - entry) * qty;
      loss = (entry - stop) * qty;
    } else {
      profit = (entry - target) * qty;
      loss = (stop - entry) * qty;
    }
    if (Math.abs(loss) > 0) rr = profit / Math.abs(loss);
    return {
      potentialProfit: (profit || 0).toFixed(2),
      potentialLoss: Math.abs(loss || 0).toFixed(2),
      riskRewardRatio: (rr || 0).toFixed(2),
    };
  };
  const getConfidenceColor = (c) => c === 'High' ? 'success' : c === 'Medium' ? 'warning' : c === 'Low' ? 'error' : 'default';
  const getTradeTypeColor = (t) => (t || 'Long') === 'Long' ? 'success' : 'error';
  const formatDate = (s) => { try { return new Date(s).toLocaleDateString(); } catch { return 'N/A'; } };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const Toasts = () => (
    <div className="fixed top-4 right-4 z-[10000] space-y-2 p-3 sm:p-0">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`px-3 sm:px-4 py-2 sm:py-3 rounded-lg shadow-lg border-l-4 animate-fade-in text-xs sm:text-sm font-medium ${
            t.type === 'success'
              ? 'bg-green-50 border-green-500 text-green-800'
              : t.type === 'info'
              ? 'bg-blue-50 border-blue-500 text-blue-800'
              : 'bg-red-50 border-red-500 text-red-800'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      <Toasts />

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-black mb-1 sm:mb-2">Pre-Trade Analysis</h1>
            <p className="text-sm sm:text-base text-black">
              <span className="font-semibold text-blue-600">{totalItems}</span> analyses
              {!backendConnected && <span className="text-orange-600 ml-2">⚠️ Offline</span>}
            </p>
          </div>

          {/* The Add button only hides while the form modal is open */}
          {!showForm && (
            <button
              onClick={openNewAnalysis}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="whitespace-nowrap">New Analysis</span>
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mt-4 sm:mt-0">
          <input
            type="text"
            placeholder="Search analyses by symbol or strategy..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white text-sm sm:text-base placeholder-slate-400"
          />
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
          <div className="flex items-start">
            <div className="flex-1 text-green-600 text-sm sm:text-base">{success}</div>
            <button onClick={() => setSuccess('')} className="flex-shrink-0 text-green-600 hover:text-green-800 p-1">✕</button>
          </div>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
          <div className="flex items-start">
            <div className="flex-1 text-red-600 text-sm sm:text-base pr-2">{error}</div>
            <button onClick={() => setError('')} className="flex-shrink-0 text-red-600 hover:text-red-800 p-1">✕</button>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4 overflow-hidden">
          <div className="w-full max-w-4xl bg-white rounded-lg shadow-2xl h-[90vh] flex flex-col overflow-hidden my-4">
            <div className="bg-slate-100 px-4 sm:px-6 py-4 flex justify-between items-center border-b border-slate-200 flex-shrink-0">
              <h2 className="text-lg font-bold text-slate-900">{editingAnalysis ? 'Edit Pre-Trade Analysis' : 'New Pre-Trade Analysis'}</h2>
              <button
                type="button"
                onClick={handleCancel}
                className="text-slate-600 hover:text-slate-900 transition"
                aria-label="Close form"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-4 sm:p-6">
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  {/* Grid 1 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">Symbol *</label>
                      <input
                        type="text"
                        name="symbol"
                        value={formData.symbol}
                        onChange={handleInputChange}
                        placeholder="AAPL"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder-slate-400 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">Current Price *</label>
                      <input
                        type="number"
                        step="0.01"
                        name="current_price"
                        value={formData.current_price}
                        onChange={handleInputChange}
                        placeholder="150.00"
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
                        onChange={handleInputChange}
                        placeholder="151.00"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder-slate-400 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">Target Price *</label>
                      <input
                        type="number"
                        step="0.01"
                        name="target_price"
                        value={formData.target_price}
                        onChange={handleInputChange}
                        placeholder="160.00"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder-slate-400 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">Stop Loss *</label>
                      <input
                        type="number"
                        step="0.01"
                        name="stop_loss"
                        value={formData.stop_loss}
                        onChange={handleInputChange}
                        placeholder="145.00"
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
                        onChange={handleInputChange}
                        placeholder="100"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder-slate-400 bg-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Dropdowns */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <CustomDropdown
                      name="trade_type"
                      label="Trade Type"
                      placeholder="Select trade type..."
                      value={formData.trade_type}
                      onChange={handleDropdownChange}
                      options={tradeTypeOptions}
                      searchable={false}
                    />
                    <CustomDropdown
                      name="confidence_level"
                      label="Confidence"
                      placeholder="Select confidence..."
                      value={formData.confidence_level}
                      onChange={handleDropdownChange}
                      options={confidenceOptions}
                      searchable={false}
                    />
                    <CustomDropdown
                      name="timeframe"
                      label="Timeframe"
                      placeholder="Select timeframe..."
                      value={formData.timeframe}
                      onChange={handleDropdownChange}
                      options={timeframeOptions}
                      searchable={false}
                    />
                  </div>

                  {/* Strategy */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CustomDropdown
                      name="strategy_id"
                      label="Strategy"
                      placeholder="Select strategy..."
                      value={formData.strategy_id}
                      onChange={handleDropdownChange}
                      options={strategies.map(s => ({ value: s.id, label: s.name }))}
                      searchable={false}
                    />
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">Custom Name</label>
                      <input
                        type="text"
                        name="strategy_name"
                        value={formData.strategy_name}
                        onChange={handleInputChange}
                        placeholder="Momentum, Breakout..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder-slate-400 bg-white"
                      />
                    </div>
                  </div>

                  {/* Textareas */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Technical Analysis *</label>
                    <textarea
                      name="technical_analysis"
                      value={formData.technical_analysis}
                      onChange={handleInputChange}
                      placeholder="Chart patterns, indicators..."
                      rows="3"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder-slate-400 bg-white resize-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Fundamental Analysis</label>
                    <textarea
                      name="fundamental_analysis"
                      value={formData.fundamental_analysis}
                      onChange={handleInputChange}
                      placeholder="Earnings, news..."
                      rows="2"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder-slate-400 bg-white resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Additional Notes</label>
                    <textarea
                      name="additional_notes"
                      value={formData.additional_notes}
                      onChange={handleInputChange}
                      placeholder="Any thoughts..."
                      rows="2"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder-slate-400 bg-white resize-none"
                    />
                  </div>

                  {/* Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">Upload Images</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-all">
                      <input
                        type="file"
                        name="images"
                        multiple
                        accept="image/*"
                        onChange={handleInputChange}
                        className="hidden"
                        id="analysis-image-upload"
                      />
                      <label htmlFor="analysis-image-upload" className="cursor-pointer block">
                        <ImageIcon sx={{ fontSize: '2rem', color: '#cbd5e1', marginBottom: '0.5rem' }} />
                        <p className="text-sm text-gray-600 font-medium">Click to upload or drag images here</p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 16MB</p>
                      </label>
                      {formData.images.length > 0 && (
                        <div className="mt-4 text-sm text-green-600 font-medium">
                          ✓ {formData.images.length} image(s) selected
                        </div>
                      )}
                    </div>

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

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-slate-200 mt-6">
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
                      className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        editingAnalysis ? 'Update Analysis' : 'Create Analysis'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List / Empty / Loading */}
      {loading ? (
        <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-white/20">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-slate-600 mt-3 text-sm sm:text-base">Loading analyses...</p>
        </div>
      ) : analyses.length === 0 ? (
        <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-white/20">
          <h3 className="text-base sm:text-lg font-semibold text-black mb-2">No Pre-Trade Analyses</h3>
          <p className="text-sm sm:text-base text-slate-600 mb-6">Start analyzing potential trades before executing them.</p>
          <button
            onClick={openNewAnalysis}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            <span>Create Analysis</span>
          </button>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-white/20 overflow-hidden">
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f1f5f9' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Symbol</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Entry</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Target</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Stop</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>R:R</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Confidence</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Images</TableCell>
                    <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analyses.map((a) => {
                    const m = calculateMetrics(a);
                    return (
                      <TableRow key={a.id} className="hover:bg-slate-50">
                        <TableCell>{a.symbol}</TableCell>
                        <TableCell>
                          <Chip label={a.trade_type} size="small" color={getTradeTypeColor(a.trade_type)} sx={{ fontSize: '0.75rem' }} />
                        </TableCell>
                        <TableCell align="right">{a.entry_price}</TableCell>
                        <TableCell align="right" sx={{ color: '#10b981', fontWeight: 600 }}>{a.target_price}</TableCell>
                        <TableCell align="right" sx={{ color: '#ef4444', fontWeight: 600 }}>{a.stop_loss}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{m.riskRewardRatio}</TableCell>
                        <TableCell>
                          <Chip label={a.confidence_level} size="small" color={getConfidenceColor(a.confidence_level)} sx={{ fontSize: '0.75rem' }} />
                        </TableCell>
                        <TableCell>
                          {a.images?.length > 0 ? (
                            <Chip icon={<ImageIcon sx={{ fontSize: '0.75rem' }} />} label={`${a.images.length}`} size="small" variant="outlined" sx={{ fontSize: '0.75rem' }} />
                          ) : <span className="text-xs text-slate-500">-</span>}
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <Tooltip title="View">
                              <IconButton size="small" onClick={() => handleViewAnalysis(a)} sx={{ color: '#64748b' }}>
                                <VisibilityIcon sx={{ fontSize: '1rem' }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => handleEditAnalysis(a)} sx={{ color: '#2563eb' }}>
                                <EditIcon sx={{ fontSize: '1rem' }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" onClick={() => requestDeleteAnalysis(a)} sx={{ color: '#dc2626' }}>
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
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {analyses.map((a) => {
              const m = calculateMetrics(a);
              return (
                <div key={a.id} className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/30 hover:shadow-xl transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{a.symbol}</h4>
                      <p className="text-xs text-slate-600 mt-1">{formatDate(a.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-900">{m.riskRewardRatio}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mb-3 flex-wrap">
                    <Chip label={a.trade_type} size="small" color={getTradeTypeColor(a.trade_type)} sx={{ fontSize: '0.7rem' }} />
                    <Chip label={a.confidence_level} size="small" color={getConfidenceColor(a.confidence_level)} sx={{ fontSize: '0.7rem' }} />
                    {a.images?.length > 0 && (
                      <Chip
                        icon={<ImageIcon sx={{ fontSize: '0.75rem' }} />}
                        label={`${a.images.length}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-blue-700 font-medium mb-1">Entry</p>
                      <p className="font-bold text-slate-900 text-sm">{a.entry_price}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-green-700 font-medium mb-1">Target</p>
                      <p className="font-bold text-slate-900 text-sm">{a.target_price}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-red-700 font-medium mb-1">Stop</p>
                      <p className="font-bold text-slate-900 text-sm">{a.stop_loss}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Tooltip title="View">
                      <IconButton size="small" onClick={() => handleViewAnalysis(a)} sx={{ flex: 1, color: '#64748b' }}>
                        <VisibilityIcon sx={{ fontSize: '1rem' }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEditAnalysis(a)} sx={{ flex: 1, color: '#2563eb' }}>
                        <EditIcon sx={{ fontSize: '1rem' }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => requestDeleteAnalysis(a)} sx={{ flex: 1, color: '#dc2626' }}>
                        <DeleteIcon sx={{ fontSize: '1rem' }} />
                      </IconButton>
                    </Tooltip>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-white/20">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                  {startItem}-{endItem} of {totalItems}
                </div>
                <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                  <Tooltip title="Previous">
                    <span>
                      <IconButton
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        size="small"
                        sx={{ border: '1px solid #cbd5e1', borderRadius: '0.375rem', color: currentPage === 1 ? '#cbd5e1' : '#64748b' }}
                      >
                        <ChevronLeftIcon sx={{ fontSize: '1.25rem' }} />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <span className="text-xs sm:text-sm text-slate-600 font-semibold">{currentPage}/{totalPages}</span>
                  <Tooltip title="Next">
                    <span>
                      <IconButton
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        size="small"
                        sx={{ border: '1px solid #cbd5e1', borderRadius: '0.375rem', color: currentPage === totalPages ? '#cbd5e1' : '#64748b' }}
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

      {/* View Modal */}
      {showAnalysisModal && selectedAnalysis && (
        <div className="fixed inset-0 z-[10001] bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-100 px-6 py-4 flex justify-between items-center border-b border-slate-200 sticky top-0">
              <h2 className="text-lg font-bold text-slate-900">Analysis - {selectedAnalysis.symbol}</h2>
              <button onClick={() => setShowAnalysisModal(false)} className="text-slate-600 hover:text-slate-900">✕</button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span>Created:</span>
                <span className="font-medium">{selectedAnalysis.created_at ? formatDate(selectedAnalysis.created_at) : 'N/A'}</span>
                <span className="ml-3">Type:</span>
                <span className="font-medium">{selectedAnalysis.trade_type}</span>
                <span className="ml-3">Confidence:</span>
                <span className="font-medium">{selectedAnalysis.confidence_level}</span>
                <span className="ml-3">Timeframe:</span>
                <span className="font-medium">{selectedAnalysis.timeframe}</span>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Price Levels</h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { label: 'Current', value: selectedAnalysis.current_price, bg: 'bg-slate-100' },
                    { label: 'Entry', value: selectedAnalysis.entry_price, bg: 'bg-blue-50' },
                    { label: 'Target', value: selectedAnalysis.target_price, bg: 'bg-green-50' },
                    { label: 'Stop', value: selectedAnalysis.stop_loss, bg: 'bg-red-50' },
                    { label: 'Qty', value: selectedAnalysis.quantity, bg: 'bg-slate-100' },
                  ].map((item, idx) => (
                    <div key={idx} className={`${item.bg} rounded-lg p-3 text-center`}>
                      <p className="text-xs font-medium text-slate-700 mb-1">{item.label}</p>
                      <p className="text-sm font-bold text-slate-900">{item.value ?? '-'}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Risk Reward</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-xs font-medium text-green-700 mb-1">Profit</p>
                    <p className="text-sm font-bold text-green-600">
                      {calculateMetrics(selectedAnalysis).potentialProfit}
                    </p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <p className="text-xs font-medium text-red-700 mb-1">Loss</p>
                    <p className="text-sm font-bold text-red-600">
                      {calculateMetrics(selectedAnalysis).potentialLoss}
                    </p>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-3 text-center">
                    <p className="text-xs font-medium text-indigo-700 mb-1">R:R</p>
                    <p className="text-sm font-bold text-slate-900">
                      {calculateMetrics(selectedAnalysis).riskRewardRatio}
                    </p>
                  </div>
                </div>
              </div>

              {selectedAnalysis.images?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Images ({selectedAnalysis.images.length})</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedAnalysis.images.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="relative group">
                        <img
                          src={url}
                          alt={`Analysis image ${idx + 1}`}
                          className="w-full h-32 sm:h-40 object-cover rounded-lg border border-slate-200 group-hover:opacity-80 transition"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-lg">
                          <span className="text-white text-xs sm:text-sm font-medium">Open</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedAnalysis.technical_analysis && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Technical Analysis</h4>
                  <div className="bg-slate-100 rounded-lg p-4">
                    <p className="text-slate-700 text-sm whitespace-pre-wrap">{selectedAnalysis.technical_analysis}</p>
                  </div>
                </div>
              )}
              {selectedAnalysis.fundamental_analysis && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Fundamental Analysis</h4>
                  <div className="bg-slate-100 rounded-lg p-4">
                    <p className="text-slate-700 text-sm whitespace-pre-wrap">{selectedAnalysis.fundamental_analysis}</p>
                  </div>
                </div>
              )}
              {selectedAnalysis.additional_notes && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Notes</h4>
                  <div className="bg-slate-100 rounded-lg p-4">
                    <p className="text-slate-700 text-sm whitespace-pre-wrap">{selectedAnalysis.additional_notes}</p>
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowAnalysisModal(false)}
                className="w-full px-4 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <DeleteModal
        open={deleteOpen}
        title="Delete Analysis"
        message={
          analysisToDelete
            ? `Are you sure you want to delete analysis "${analysisToDelete.symbol}"? This action cannot be undone.`
            : 'Are you sure you want to delete this analysis? This action cannot be undone.'
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={deleting}
        onConfirm={confirmDeleteAnalysis}
        onCancel={cancelDeleteAnalysis}
      />

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}
