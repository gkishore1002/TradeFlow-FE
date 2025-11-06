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
} from "@mui/icons-material";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export default function PreTradeAnalysis() {
  const router = useRouter();
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

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [backendConnected, setBackendConnected] = useState(false);

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
    additional_notes: ""
  });

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

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
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

  // Build Query Parameters
  const buildParams = () => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      per_page: itemsPerPage.toString(),
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
      setAnalyses([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchQuery, apiCall]);

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

  // Handle Input Change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle Submit
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
      const analysisData = {
        symbol: formData.symbol.toUpperCase(),
        current_price: parseFloat(formData.current_price),
        entry_price: parseFloat(formData.entry_price),
        target_price: parseFloat(formData.target_price),
        stop_loss: parseFloat(formData.stop_loss),
        quantity: parseInt(formData.quantity),
        trade_type: formData.trade_type,
        confidence_level: formData.confidence_level,
        timeframe: formData.timeframe,
        technical_analysis: formData.technical_analysis,
        fundamental_analysis: formData.fundamental_analysis || null,
        additional_notes: formData.additional_notes || null,
        strategy_id: formData.strategy_id ? parseInt(formData.strategy_id) : null,
        strategy_name: formData.strategy_name || null
      };

      if (editingAnalysis) {
        await apiCall(`/api/analyses/${editingAnalysis.id}`, {
          method: 'PUT',
          body: JSON.stringify(analysisData)
        });
        setSuccess('✅ Analysis updated successfully!');
      } else {
        await apiCall('/api/analyses', {
          method: 'POST',
          body: JSON.stringify(analysisData)
        });
        setSuccess('✅ Analysis created successfully!');
      }

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
        additional_notes: ""
      });

      setShowForm(false);
      setEditingAnalysis(null);
      await loadAnalyses();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving analysis:', err);
      setError(`Failed to save analysis: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAnalysis(null);
    setError('');
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
      additional_notes: ""
    });
  };

  const handleViewAnalysis = (analysis) => {
    setSelectedAnalysis(analysis);
    setShowAnalysisModal(true);
  };

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
      additional_notes: analysis.additional_notes || ""
    });
    setShowForm(true);
  };

  const handleDeleteAnalysis = async (id) => {
    if (!window.confirm('Are you sure you want to delete this analysis?')) {
      return;
    }

    try {
      await apiCall(`/api/analyses/${id}`, {
        method: 'DELETE'
      });
      setSuccess('✅ Analysis deleted successfully!');
      await loadAnalyses();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting analysis:', err);
      setError(`Failed to delete analysis: ${err.message}`);
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

  if (loading && analyses.length === 0) {
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-1">Pre Trade Analysis</h1>
              <p className="text-xs sm:text-sm text-slate-600">
                <span className="font-semibold text-blue-600">{totalItems}</span> analyses • 
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
              <span>New Analysis</span>
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

        {/* Form Section */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-4">
              {editingAnalysis ? 'Edit Pre-Trade Analysis' : 'Create New Pre-Trade Analysis'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
                  >
                    <option value="Long">Long</option>
                    <option value="Short">Short</option>
                  </select>
                </div>

                {/* Confidence Level */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Confidence Level</label>
                  <select
                    name="confidence_level"
                    value={formData.confidence_level}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
                  >
                    <option value="Intraday">Intraday</option>
                    <option value="Swing">Swing</option>
                    <option value="Position">Position</option>
                    <option value="Long Term">Long Term</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Strategy */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Strategy</label>
                  <select
                    name="strategy_id"
                    value={formData.strategy_id}
                    onChange={handleInputChange}
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

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : (editingAnalysis ? 'Update' : 'Save')}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Table Section */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {analyses.length === 0 ? (
            <div className="text-center py-12 px-4">
              <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">No Pre-Trade Analyses</h3>
              <p className="text-sm text-slate-600 mb-6">Start analyzing potential trades before executing them.</p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Create Analysis</span>
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>Symbol</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>Type</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>Entry</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>Target</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>Stop</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>R:R</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>Confidence</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px' }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', padding: '16px', textAlign: 'center' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analyses.map((analysis) => {
                        const metrics = calculateMetrics(analysis);
                        const createdDate = formatDate(analysis.created_at);
                        
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
                            <TableCell sx={{ fontSize: '0.75rem', padding: '16px' }}>{createdDate}</TableCell>
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
              <div className="md:hidden divide-y divide-slate-200">
                {analyses.map((analysis) => {
                  const metrics = calculateMetrics(analysis);
                  const createdDate = formatDate(analysis.created_at);
                  
                  return (
                    <div key={analysis.id} className="p-4 hover:bg-slate-50 transition">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900 text-base">{analysis.symbol}</h4>
                          <div className="flex gap-2 mt-2 flex-wrap">
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
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-slate-900">{metrics.riskRewardRatio}:1</div>
                          <p className="text-xs text-slate-600 mt-1">{createdDate}</p>
                        </div>
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
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.5rem',
                  backgroundColor: '#ffffff',
                  borderTop: '1px solid #e2e8f0',
                  flexWrap: 'wrap',
                  gap: '1rem'
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
            </>
          )}
        </div>

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

                {/* Analysis Details */}
                {selectedAnalysis.technical_analysis && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Technical Analysis</h4>
                    <div className="bg-slate-100 rounded-lg p-4">
                      <p className="text-slate-700 text-sm">{selectedAnalysis.technical_analysis}</p>
                    </div>
                  </div>
                )}

                {selectedAnalysis.fundamental_analysis && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Fundamental Analysis</h4>
                    <div className="bg-slate-100 rounded-lg p-4">
                      <p className="text-slate-700 text-sm">{selectedAnalysis.fundamental_analysis}</p>
                    </div>
                  </div>
                )}

                {selectedAnalysis.additional_notes && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Notes</h4>
                    <div className="bg-slate-100 rounded-lg p-4">
                      <p className="text-slate-700 text-sm">{selectedAnalysis.additional_notes}</p>
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
      </div>
    </main>
  );
}
