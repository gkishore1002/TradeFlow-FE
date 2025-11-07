// app/dashboard/PreTradeAnalysis.jsx
"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Image as ImageIcon,
} from "@mui/icons-material";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export default function PreTradeAnalysis() {
  const router = useRouter();
  const toastRef = useRef(0);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [strategies, setStrategies] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [editingAnalysis, setEditingAnalysis] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [backendConnected, setBackendConnected] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    symbol: "",
    current_price: "",
    entry_price: "",
    target_price: "",
    stop_loss: "",
    quantity: "",
    trade_type: "Long",
    strategy_id: "",
    strategy_name: "",
    technical_analysis: "",
    fundamental_analysis: "",
    confidence_level: "Medium",
    timeframe: "Intraday",
    additional_notes: "",
    images: []
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

  // FIXED: API call wrapper with proper FormData + JSON handling
  const apiCall = useCallback(async (endpoint, options = {}) => {
    try {
      const token = getAuthToken();
      
      if (!token) {
        router.push('/login');
        return null;
      }

      // Properly detect FormData
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
        console.error('❌ API Error:', data);
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setBackendConnected(true);
      console.log('✅ API Success:', data);
      return data;
    } catch (error) {
      console.error('API Error:', error);
      setBackendConnected(false);
      throw error;
    }
  }, [router]);

  // Build Query Parameters
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

  // Load Analyses from Backend
  const loadAnalyses = useCallback(async () => {
    try {
      setLoading(true);
      const params = buildParams();
      const data = await apiCall(`/api/analyses?${params}`);
      
      if (data && data.items) {
        setAnalyses(data.items);
        setCurrentPage(data.pagination.page);
        setTotalPages(data.pagination.pages);
        setTotalItems(data.pagination.total);
      } else {
        setAnalyses([]);
      }
      setError('');
    } catch (err) {
      console.error('Error loading analyses:', err);
      setError(`Failed to load analyses: ${err.message}`);
      showToast(`Failed to load analyses: ${err.message}`, 'error');
      setAnalyses([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchQuery, apiCall, showToast]);

  // Load Strategies from Backend
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

  // Initial Load
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }

    loadAnalyses();
    loadStrategies();
  }, [loadAnalyses, loadStrategies, router]);

  // Debounced Search
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm !== searchQuery) {
        setSearchQuery(searchTerm);
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, searchQuery]);

  // Handle Input Change - UPDATED for file uploads
  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file') {
      // Handle image uploads
      const fileArray = Array.from(files || []);
      setFormData(prev => ({
        ...prev,
        images: fileArray
      }));

      // Create previews
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

  // Handle Submit - UPDATED to use FormData
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.symbol || !formData.current_price || !formData.entry_price || 
        !formData.target_price || !formData.stop_loss || !formData.quantity || 
        !formData.technical_analysis) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // UPDATED: Use FormData for image uploads
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
      
      // ADDED: Append images
      console.log('📤 Submitting FormData with:');
      console.log('   - Symbol:', formData.symbol);
      console.log('   - Images:', formData.images.length);
      
      formData.images.forEach(file => {
        form.append('images', file);
      });

      let endpoint = '/api/analyses';
      let method = 'POST';

      if (editingAnalysis) {
        endpoint = `/api/analyses/${editingAnalysis.id}`;
        method = 'PUT';
      }

      const result = await apiCall(endpoint, {
        method,
        body: form
      });

      if (result) {
        const message = editingAnalysis ? 'Analysis updated successfully!' : 'Analysis created successfully!';
        setSuccess(message);
        showToast(message, 'success');
        
        // Reset form
        setFormData({
          symbol: "",
          current_price: "",
          entry_price: "",
          target_price: "",
          stop_loss: "",
          quantity: "",
          trade_type: "Long",
          strategy_id: "",
          strategy_name: "",
          technical_analysis: "",
          fundamental_analysis: "",
          confidence_level: "Medium",
          timeframe: "Intraday",
          additional_notes: "",
          images: []
        });

        imagePreviews.forEach(p => URL.revokeObjectURL(p.preview));
        setImagePreviews([]);
        setEditingAnalysis(null);
        setShowForm(false);
        loadAnalyses();
      }
    } catch (err) {
      console.error('Error saving analysis:', err);
      setError(`Failed to save analysis: ${err.message}`);
      showToast(`Failed to save analysis: ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Cancel
  const handleCancel = () => {
    setShowForm(false);
    setEditingAnalysis(null);
    setError('');
    imagePreviews.forEach(p => URL.revokeObjectURL(p.preview));
    setImagePreviews([]);
    setFormData({
      symbol: "",
      current_price: "",
      entry_price: "",
      target_price: "",
      stop_loss: "",
      quantity: "",
      trade_type: "Long",
      strategy_id: "",
      strategy_name: "",
      technical_analysis: "",
      fundamental_analysis: "",
      confidence_level: "Medium",
      timeframe: "Intraday",
      additional_notes: "",
      images: []
    });
  };

  // Handle View Analysis
  const handleViewAnalysis = (analysis) => {
    setSelectedAnalysis(analysis);
    setShowAnalysisModal(true);
  };

  // Handle Edit Analysis
  const handleEditAnalysis = (analysis) => {
    setEditingAnalysis(analysis);
    setFormData({
      symbol: analysis.symbol || "",
      current_price: analysis.current_price || "",
      entry_price: analysis.entry_price || "",
      target_price: analysis.target_price || "",
      stop_loss: analysis.stop_loss || "",
      quantity: analysis.quantity || "",
      trade_type: analysis.trade_type || "Long",
      strategy_id: analysis.strategy_id || "",
      strategy_name: analysis.strategy_name || "",
      technical_analysis: analysis.technical_analysis || "",
      fundamental_analysis: analysis.fundamental_analysis || "",
      confidence_level: analysis.confidence_level || "Medium",
      timeframe: analysis.timeframe || "Intraday",
      additional_notes: analysis.additional_notes || "",
      images: []
    });
    setImagePreviews([]);
    setShowForm(true);
  };

  // Handle Delete Analysis
  const handleDeleteAnalysis = async (id) => {
    if (!window.confirm('Are you sure you want to delete this analysis?')) {
      return;
    }

    try {
      await apiCall(`/api/analyses/${id}`, {
        method: 'DELETE'
      });
      setSuccess('✅ Analysis deleted successfully!');
      showToast('Analysis deleted successfully!', 'success');
      loadAnalyses();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting analysis:', err);
      setError(`Failed to delete analysis: ${err.message}`);
      showToast(`Failed to delete analysis: ${err.message}`, 'error');
    }
  };

  const calculateMetrics = (analysis) => {
    const entryPrice = analysis.entry_price;
    const targetPrice = analysis.target_price;
    const stopLoss = analysis.stop_loss;
    const quantity = analysis.quantity;
    
    let potentialProfit = 0;
    let potentialLoss = 0;
    let riskRewardRatio = 0;
    
    if (analysis.trade_type === "Long") {
      potentialProfit = (targetPrice - entryPrice) * quantity;
      potentialLoss = (entryPrice - stopLoss) * quantity;
    } else {
      potentialProfit = (entryPrice - targetPrice) * quantity;
      potentialLoss = (stopLoss - entryPrice) * quantity;
    }
    
    if (potentialLoss !== 0) {
      riskRewardRatio = (potentialProfit / Math.abs(potentialLoss)).toFixed(2);
    }
    
    return {
      potentialProfit: potentialProfit.toFixed(2),
      potentialLoss: Math.abs(potentialLoss).toFixed(2),
      riskRewardRatio
    };
  };

  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case "High": return "success";
      case "Medium": return "warning";
      case "Low": return "error";
      default: return "default";
    }
  };

  const getTradeTypeColor = (type) => {
    return type === "Long" ? "success" : "error";
  };

  const formatDate = (dateString) => {
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

  if (loading && analyses.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
        <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-white/20">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-slate-600 mt-3 text-sm sm:text-base">Loading analyses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      <ToastContainer />

      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-black mb-1 sm:mb-2">Pre-Trade Analysis</h1>
            <p className="text-sm sm:text-base text-black">
              <span className="font-semibold text-blue-600">{totalItems}</span> analyses
              {!backendConnected && <span className="text-orange-600 ml-2">⚠️ Offline</span>}
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="whitespace-nowrap">New Analysis</span>
            </button>
          )}
        </div>

        {/* Search Bar */}
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

      {/* Form Section */}
      {showForm && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
          <h3 className="text-lg sm:text-xl font-bold text-black mb-4 sm:mb-6">
            {editingAnalysis ? 'Edit Pre-Trade Analysis' : 'New Pre-Trade Analysis'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Basic Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Symbol */}
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

              {/* Current Price */}
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

              {/* Entry Price */}
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

              {/* Target Price */}
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

              {/* Stop Loss */}
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

              {/* Quantity */}
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

              {/* Trade Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Trade Type</label>
                <select
                  name="trade_type"
                  value={formData.trade_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234b5563' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.5rem center',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="Long">Long</option>
                  <option value="Short">Short</option>
                </select>
              </div>

              {/* Confidence Level */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Confidence</label>
                <select
                  name="confidence_level"
                  value={formData.confidence_level}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234b5563' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.5rem center',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              {/* Timeframe */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Timeframe</label>
                <select
                  name="timeframe"
                  value={formData.timeframe}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234b5563' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.5rem center',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="Intraday">Intraday</option>
                  <option value="Swing">Swing</option>
                  <option value="Position">Position</option>
                  <option value="Long Term">Long Term</option>
                </select>
              </div>
            </div>

            {/* Strategy Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Strategy ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Strategy</label>
                <select
                  name="strategy_id"
                  value={formData.strategy_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234b5563' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.5rem center',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="">Select strategy...</option>
                  {strategies.map(strategy => (
                    <option key={strategy.id} value={strategy.id}>
                      {strategy.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Strategy Name */}
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

            {/* Technical Analysis */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Technical Analysis *</label>
              <textarea
                name="technical_analysis"
                value={formData.technical_analysis}
                onChange={handleInputChange}
                placeholder="Chart patterns, indicators..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder-slate-400 bg-white resize-none"
                required
              />
            </div>

            {/* Fundamental Analysis */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Fundamental Analysis</label>
              <textarea
                name="fundamental_analysis"
                value={formData.fundamental_analysis}
                onChange={handleInputChange}
                placeholder="Earnings, news..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder-slate-400 bg-white resize-none"
              />
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Additional Notes</label>
              <textarea
                name="additional_notes"
                value={formData.additional_notes}
                onChange={handleInputChange}
                placeholder="Any thoughts..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder-slate-400 bg-white resize-none"
              />
            </div>

            {/* Image Upload - FIXED & IMPROVED */}
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
      )}

      {/* Table Section */}
      {analyses.length === 0 ? (
        <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-white/20">
          <svg className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-base sm:text-lg font-semibold text-black mb-2">No Pre-Trade Analyses</h3>
          <p className="text-sm sm:text-base text-slate-600 mb-6">Start analyzing potential trades before executing them.</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Analysis</span>
          </button>
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
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>Type</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>Entry</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>Target</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>Stop</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>R:R</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>Confidence</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>Images</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px', textAlign: 'center' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analyses.map((analysis) => {
                    const metrics = calculateMetrics(analysis);
                    
                    return (
                      <TableRow 
                        key={analysis.id} 
                        hover 
                        sx={{ 
                          '&:hover': { backgroundColor: '#f8fafc' },
                          height: '72px'
                        }}
                      >
                        <TableCell sx={{ fontSize: '0.875rem', fontWeight: 500, padding: '16px' }}>{analysis.symbol}</TableCell>
                        <TableCell sx={{ padding: '16px' }}>
                          <Chip
                            label={analysis.trade_type}
                            size="small"
                            color={getTradeTypeColor(analysis.trade_type)}
                            variant="filled"
                            sx={{ fontSize: '0.75rem' }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.875rem', padding: '16px' }}>₹{analysis.entry_price}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.875rem', color: '#10b981', fontWeight: 600, padding: '16px' }}>₹{analysis.target_price}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.875rem', color: '#ef4444', fontWeight: 600, padding: '16px' }}>₹{analysis.stop_loss}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.875rem', fontWeight: 600, padding: '16px' }}>{metrics.riskRewardRatio}:1</TableCell>
                        <TableCell sx={{ padding: '16px' }}>
                          <Chip
                            label={analysis.confidence_level}
                            size="small"
                            color={getConfidenceColor(analysis.confidence_level)}
                            variant="filled"
                            sx={{ fontSize: '0.75rem' }}
                          />
                        </TableCell>
                        <TableCell sx={{ padding: '16px' }}>
                          {analysis.images && analysis.images.length > 0 ? (
                            <Chip
                              icon={<ImageIcon sx={{ fontSize: '0.75rem' }} />}
                              label={`${analysis.images.length}`}
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
                                onClick={() => handleViewAnalysis(analysis)}
                                sx={{ color: '#64748b' }}
                              >
                                <VisibilityIcon sx={{ fontSize: '1rem' }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => handleEditAnalysis(analysis)}
                                sx={{ color: '#2563eb' }}
                              >
                                <EditIcon sx={{ fontSize: '1rem' }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteAnalysis(analysis.id)}
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
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {analyses.map((analysis) => {
              const metrics = calculateMetrics(analysis);
              
              return (
                <div key={analysis.id} className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/30 hover:shadow-xl transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{analysis.symbol}</h4>
                      <p className="text-xs text-slate-600 mt-1">{formatDate(analysis.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-900">{metrics.riskRewardRatio}:1</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mb-3 flex-wrap">
                    <Chip
                      label={analysis.trade_type}
                      size="small"
                      color={getTradeTypeColor(analysis.trade_type)}
                      variant="filled"
                      sx={{ fontSize: '0.7rem' }}
                    />
                    <Chip
                      label={analysis.confidence_level}
                      size="small"
                      color={getConfidenceColor(analysis.confidence_level)}
                      variant="filled"
                      sx={{ fontSize: '0.7rem' }}
                    />
                    {analysis.images && analysis.images.length > 0 && (
                      <Chip
                        icon={<ImageIcon sx={{ fontSize: '0.75rem' }} />}
                        label={`${analysis.images.length}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-blue-700 font-medium mb-1">Entry</p>
                      <p className="font-bold text-slate-900 text-sm">₹{analysis.entry_price}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-green-700 font-medium mb-1">Target</p>
                      <p className="font-bold text-slate-900 text-sm">₹{analysis.target_price}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-red-700 font-medium mb-1">Stop</p>
                      <p className="font-bold text-slate-900 text-sm">₹{analysis.stop_loss}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-1.5">
                    <Tooltip title="View">
                      <IconButton
                        size="small"
                        onClick={() => handleViewAnalysis(analysis)}
                        sx={{ flex: 1, color: '#64748b' }}
                      >
                        <VisibilityIcon sx={{ fontSize: '1rem' }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleEditAnalysis(analysis)}
                        sx={{ flex: 1, color: '#2563eb' }}
                      >
                        <EditIcon sx={{ fontSize: '1rem' }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteAnalysis(analysis.id)}
                        sx={{ flex: 1, color: '#dc2626' }}
                      >
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
                  {startItem}–{endItem} of {totalItems}
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

      {/* Analysis Detail Modal */}
      {showAnalysisModal && selectedAnalysis && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-100 px-6 py-4 flex justify-between items-center border-b border-slate-200 sticky top-0">
              <h2 className="text-lg font-bold text-slate-900">Analysis - {selectedAnalysis.symbol}</h2>
              <button
                onClick={() => setShowAnalysisModal(false)}
                className="text-slate-600 hover:text-slate-900"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Price Levels */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Price Levels</h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { label: 'Current', value: selectedAnalysis.current_price, bg: 'bg-slate-100' },
                    { label: 'Entry', value: selectedAnalysis.entry_price, bg: 'bg-blue-50' },
                    { label: 'Target', value: selectedAnalysis.target_price, bg: 'bg-green-50' },
                    { label: 'Stop', value: selectedAnalysis.stop_loss, bg: 'bg-red-50' },
                    { label: 'Qty', value: selectedAnalysis.quantity, bg: 'bg-slate-100' }
                  ].map((item, idx) => (
                    <div key={idx} className={`${item.bg} rounded-lg p-3 text-center`}>
                      <p className="text-xs font-medium text-slate-700 mb-1">{item.label}</p>
                      <p className="font-bold text-slate-900 text-sm">₹{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk & Reward */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Risk & Reward</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-xs font-medium text-green-700 mb-1">Profit</p>
                    <p className="font-bold text-green-600 text-sm">₹{calculateMetrics(selectedAnalysis).potentialProfit}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <p className="text-xs font-medium text-red-700 mb-1">Loss</p>
                    <p className="font-bold text-red-600 text-sm">₹{calculateMetrics(selectedAnalysis).potentialLoss}</p>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-3 text-center">
                    <p className="text-xs font-medium text-indigo-700 mb-1">R:R</p>
                    <p className="font-bold text-slate-900 text-sm">{calculateMetrics(selectedAnalysis).riskRewardRatio}:1</p>
                  </div>
                </div>
              </div>

              {/* Images Section */}
              {selectedAnalysis.images && selectedAnalysis.images.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Images ({selectedAnalysis.images.length})</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedAnalysis.images.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative group"
                      >
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

              {/* Technical Analysis */}
              {selectedAnalysis.technical_analysis && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Technical Analysis</h4>
                  <div className="bg-slate-100 rounded-lg p-4">
                    <p className="text-slate-700 text-sm whitespace-pre-wrap">{selectedAnalysis.technical_analysis}</p>
                  </div>
                </div>
              )}

              {/* Fundamental Analysis */}
              {selectedAnalysis.fundamental_analysis && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Fundamental Analysis</h4>
                  <div className="bg-slate-100 rounded-lg p-4">
                    <p className="text-slate-700 text-sm whitespace-pre-wrap">{selectedAnalysis.fundamental_analysis}</p>
                  </div>
                </div>
              )}

              {/* Notes */}
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
