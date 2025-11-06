// app/dashboard/MyStrategies.jsx
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Trash2, Eye, Edit2, Calendar, Tag, AlertTriangle, ChevronLeft, ChevronRight, Search } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export default function MyStrategies() {
  const router = useRouter();
  const toastRef = useRef(0);

  const [strategies, setStrategies] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    pages: 0,
    has_prev: false,
    has_next: false
  });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingStrategy, setEditingStrategy] = useState(null);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [strategyToDelete, setStrategyToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [backendConnected, setBackendConnected] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Momentum Trading",
    risk_level: "Low Risk",
    timeframe: "Intraday (1 day)",
    trading_rules: "",
    additional_notes: ""
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

  // Fetch strategies from backend with pagination
  const fetchStrategies = useCallback(async (page = 1, search = "") => {
    try {
      setLoading(true);
      setError("");

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '20',
        sort_by: 'created_at',
        sort_order: 'desc'
      });

      if (search.trim()) {
        params.append('search', search.trim());
      }

      const data = await apiCall(`/api/strategies?${params.toString()}`);

      // Handle paginated response
      if (data && typeof data === 'object') {
        if (data.items && Array.isArray(data.items)) {
          setStrategies(data.items);
          if (data.pagination) {
            setPagination(data.pagination);
          }
        } else if (Array.isArray(data)) {
          setStrategies(data);
          setPagination({
            page: 1,
            per_page: data.length,
            total: data.length,
            pages: 1,
            has_prev: false,
            has_next: false
          });
        } else {
          console.warn('Unexpected API response format:', data);
          setStrategies([]);
        }
      } else {
        setStrategies([]);
      }
    } catch (err) {
      console.error("Error fetching strategies:", err);
      setError(`Failed to load strategies: ${err.message}`);
      showToast(`Failed to load strategies: ${err.message}`, 'error');
      setStrategies([]);
    } finally {
      setLoading(false);
    }
  }, [apiCall, showToast]);

  // Initial load
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }

    fetchStrategies(1, "");
  }, [fetchStrategies, router]);

  // Debounced search
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm !== searchQuery) {
        setSearchQuery(searchTerm);
        fetchStrategies(1, searchTerm);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, searchQuery, fetchStrategies]);

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchStrategies(newPage, searchQuery);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Strategy name is required");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const strategyData = {
        name: formData.name,
        description: formData.description || null,
        category: formData.category,
        risk_level: formData.risk_level,
        timeframe: formData.timeframe,
        trading_rules: formData.trading_rules || null,
        additional_notes: formData.additional_notes || null
      };

      if (editingStrategy) {
        // Update existing strategy
        await apiCall(`/api/strategies/${editingStrategy.id}`, {
          method: "PUT",
          body: JSON.stringify(strategyData)
        });
        setSuccess('✅ Strategy updated successfully!');
        showToast('Strategy updated successfully!', 'success');
      } else {
        // Create new strategy
        await apiCall('/api/strategies', {
          method: "POST",
          body: JSON.stringify(strategyData)
        });
        setSuccess('✅ Strategy created successfully!');
        showToast('Strategy created successfully!', 'success');
      }

      // Reset form
      setShowForm(false);
      setEditingStrategy(null);
      setFormData({
        name: "",
        description: "",
        category: "Momentum Trading",
        risk_level: "Low Risk",
        timeframe: "Intraday (1 day)",
        trading_rules: "",
        additional_notes: ""
      });

      // Refresh list
      await fetchStrategies(pagination.page, searchQuery);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error("Error saving strategy:", err);
      setError(`Failed to save strategy: ${err.message}`);
      showToast(`Failed to save strategy: ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingStrategy(null);
    setError("");
    setFormData({
      name: "",
      description: "",
      category: "Momentum Trading",
      risk_level: "Low Risk",
      timeframe: "Intraday (1 day)",
      trading_rules: "",
      additional_notes: ""
    });
  };

  const handleEditStrategy = (strategy) => {
    setEditingStrategy(strategy);
    setFormData({
      name: strategy.name || "",
      description: strategy.description || "",
      category: strategy.category || "Momentum Trading",
      risk_level: strategy.risk_level || "Low Risk",
      timeframe: strategy.timeframe || "Intraday (1 day)",
      trading_rules: strategy.trading_rules || "",
      additional_notes: strategy.additional_notes || ""
    });
    setShowForm(true);
  };

  const handleViewStrategy = (strategy) => {
    setSelectedStrategy(strategy);
    setShowStrategyModal(true);
  };

  const handleDeleteClick = (strategy) => {
    setStrategyToDelete(strategy);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!strategyToDelete) return;

    try {
      setError("");
      await apiCall(`/api/strategies/${strategyToDelete.id}`, {
        method: "DELETE"
      });
      setSuccess('✅ Strategy deleted successfully!');
      showToast('Strategy deleted successfully!', 'success');
      await fetchStrategies(pagination.page, searchQuery);
      setShowDeleteModal(false);
      setStrategyToDelete(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error("Error deleting strategy:", err);
      setError(`Failed to delete strategy: ${err.message}`);
      showToast(`Failed to delete strategy: ${err.message}`, 'error');
      setShowDeleteModal(false);
      setStrategyToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setStrategyToDelete(null);
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case "Low Risk":
        return "text-green-600 bg-green-100 border-green-200";
      case "Medium Risk":
        return "text-yellow-600 bg-yellow-100 border-yellow-200";
      case "High Risk":
        return "text-red-600 bg-red-100 border-red-200";
      default:
        return "text-gray-600 bg-gray-100 border-gray-200";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "N/A";
    }
  };

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

  if (loading && strategies.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <ToastContainer />
        <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg border border-white/20">
          <div className="animate-pulse">
            <div className="h-6 sm:h-8 bg-slate-200 rounded w-1/2 sm:w-1/3 mb-3 sm:mb-4"></div>
            <div className="h-3 sm:h-4 bg-slate-200 rounded w-3/4 sm:w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      <ToastContainer />

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-black mb-1 sm:mb-2">My Trading Strategies</h1>
              <p className="text-sm sm:text-base text-black">
                <span className="font-semibold text-blue-600">{pagination.total}</span> strategies
                {!backendConnected && <span className="text-orange-600 ml-2">⚠️ Offline</span>}
              </p>
            </div>

            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="whitespace-nowrap">New Strategy</span>
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search strategies..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2.5 sm:py-2 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white text-sm sm:text-base"
            />
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>

          {/* Results Info */}
          {!loading && (
            <div className="text-xs sm:text-sm text-gray-600">
              Showing {strategies.length} of {pagination.total} strategies
              {searchTerm && (
                <span> matching "{searchTerm}"</span>
              )}
            </div>
          )}
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
              <X className="w-4 h-4" />
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
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-black">
              {editingStrategy ? 'Edit Strategy' : 'Create New Strategy'}
            </h2>
            <button
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Strategy Name */}
              <div className="sm:col-span-2 sm:col-span-1">
                <label className="block text-sm font-semibold text-black mb-2">
                  Strategy Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white text-sm sm:text-base"
                  placeholder="e.g., RSI Momentum Strategy"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white text-sm sm:text-base"
                  required
                >
                  <option value="Momentum Trading">Momentum Trading</option>
                  <option value="Swing Trading">Swing Trading</option>
                  <option value="Scalping">Scalping</option>
                  <option value="Mean Reversion">Mean Reversion</option>
                  <option value="Breakout">Breakout</option>
                </select>
              </div>

              {/* Risk Level */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Risk Level *
                </label>
                <select
                  name="risk_level"
                  value={formData.risk_level}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white text-sm sm:text-base"
                  required
                >
                  <option value="Low Risk">Low Risk</option>
                  <option value="Medium Risk">Medium Risk</option>
                  <option value="High Risk">High Risk</option>
                </select>
              </div>

              {/* Timeframe */}
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Timeframe *
                </label>
                <select
                  name="timeframe"
                  value={formData.timeframe}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white text-sm sm:text-base"
                  required
                >
                  <option value="Intraday (1 day)">Intraday (1 day)</option>
                  <option value="Swing (days-weeks)">Swing (days-weeks)</option>
                  <option value="Position (weeks-months)">Position (weeks-months)</option>
                  <option value="Long Term (months-years)">Long Term (months-years)</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white text-sm sm:text-base resize-none"
                placeholder="Brief description of your strategy..."
              />
            </div>

            {/* Trading Rules */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Trading Rules
              </label>
              <textarea
                name="trading_rules"
                value={formData.trading_rules}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white text-sm sm:text-base resize-none"
                placeholder="Entry and exit rules, risk management..."
              />
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Additional Notes
              </label>
              <textarea
                name="additional_notes"
                value={formData.additional_notes}
                onChange={handleInputChange}
                rows="2"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white text-sm sm:text-base resize-none"
                placeholder="Any additional notes or observations..."
              />
            </div>

            {/* Form Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 sm:py-2 rounded-lg sm:rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 text-sm sm:text-base disabled:opacity-50"
              >
                {submitting ? 'Saving...' : (editingStrategy ? 'Update Strategy' : 'Create Strategy')}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="w-full sm:flex-1 bg-gray-100 text-black py-3 sm:py-2 rounded-lg sm:rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Strategies Grid */}
      {!showForm && (
        <>
          {strategies.length === 0 && !loading ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg border border-white/20 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-black mb-2">
                {searchTerm ? 'No strategies found' : 'No strategies yet'}
              </h3>
              <p className="text-sm sm:text-base text-black mb-4">
                {searchTerm 
                  ? `No strategies match "${searchTerm}". Try adjusting your search.`
                  : 'Create your first trading strategy to get started'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 text-sm sm:text-base"
                >
                  Create Strategy
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {strategies.map((strategy) => (
                  <div 
                    key={strategy.id}
                    className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-white/30 hover:shadow-xl transition-all duration-300 group"
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="flex-1 min-w-0 pr-2">
                        <h3 className="text-base sm:text-lg font-bold text-slate-800 truncate mb-1">
                          {strategy.name}
                        </h3>
                        <div className="flex items-center space-x-1 sm:space-x-2 mb-2">
                          <Tag className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />
                          <span className="text-xs sm:text-sm text-slate-600 truncate">{strategy.category}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
                        <button
                          onClick={() => handleViewStrategy(strategy)}
                          title="View Details"
                          className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-100 rounded-md sm:rounded-lg transition-colors duration-200"
                        >
                          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => handleEditStrategy(strategy)}
                          title="Edit Strategy"
                          className="p-1.5 sm:p-2 text-green-600 hover:bg-green-100 rounded-md sm:rounded-lg transition-colors duration-200"
                        >
                          <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(strategy)}
                          title="Delete Strategy"
                          className="p-1.5 sm:p-2 text-red-600 hover:bg-red-100 rounded-md sm:rounded-lg transition-colors duration-200"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Risk Level & Date */}
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <span className={`${getRiskColor(strategy.risk_level)} text-xs sm:text-xs px-2 sm:px-3 py-1 rounded-full font-medium border text-center`}>
                        {strategy.risk_level}
                      </span>
                      <div className="flex items-center space-x-1 text-xs text-slate-500">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{formatDate(strategy.created_at)}</span>
                      </div>
                    </div>

                    {/* Timeframe */}
                    <div className="mb-3 sm:mb-4">
                      <p className="text-xs sm:text-sm text-slate-600">
                        <span className="font-medium">Timeframe:</span> <span className="truncate">{strategy.timeframe}</span>
                      </p>
                    </div>

                    {/* Description Preview */}
                    {strategy.description && (
                      <div className="mb-3 sm:mb-4">
                        <p className="text-xs sm:text-sm text-slate-700 line-clamp-2">
                          {strategy.description}
                        </p>
                      </div>
                    )}

                    {/* Card Footer */}
                    <div className="pt-3 sm:pt-4 border-t border-slate-200">
                      <button
                        onClick={() => handleViewStrategy(strategy)}
                        className="w-full text-blue-600 hover:text-blue-700 font-medium text-xs sm:text-sm transition-colors duration-200 py-1"
                      >
                        View Full Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg border border-white/20">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                    <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                      Page {pagination.page} of {pagination.pages}
                    </div>

                    <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={!pagination.has_prev}
                        className="flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md sm:rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                        <span className="hidden sm:inline">Previous</span>
                      </button>

                      <div className="flex items-center space-x-1">
                        {[...Array(Math.min(3, pagination.pages))].map((_, i) => {
                          let pageNum;
                          if (pagination.pages <= 3) {
                            pageNum = i + 1;
                          } else if (pagination.page <= 2) {
                            pageNum = i + 1;
                          } else if (pagination.page >= pagination.pages - 1) {
                            pageNum = pagination.pages - 2 + i;
                          } else {
                            pageNum = pagination.page - 1 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md sm:rounded-lg ${
                                pageNum === pagination.page
                                  ? 'text-blue-600 bg-blue-50 border border-blue-300'
                                  : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={!pagination.has_next}
                        className="flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md sm:rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 sm:ml-1" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && strategyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={cancelDelete}
          ></div>

          <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md p-4 sm:p-6 mx-4">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">Delete Strategy</h3>
              <p className="text-sm sm:text-base text-slate-600 mb-4 sm:mb-6">
                Are you sure you want to delete <strong>"{strategyToDelete.name}"</strong>? 
                This action cannot be undone.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={cancelDelete}
                  className="w-full sm:flex-1 px-4 py-2.5 sm:py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="w-full sm:flex-1 px-4 py-2.5 sm:py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors duration-200 text-sm sm:text-base"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Strategy View Modal */}
      {showStrategyModal && selectedStrategy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-400/30 backdrop-blur-sm"
            onClick={() => setShowStrategyModal(false)}
          ></div>

          <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden mx-4">
            <div className="bg-slate-50 p-4 sm:p-6 border-b border-slate-200">
              <div className="flex items-start justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1 min-w-0 pr-4">
                  <h3 className="text-lg sm:text-2xl font-bold text-black truncate">{selectedStrategy.name}</h3>
                  <span className={`${getRiskColor(selectedStrategy.risk_level)} text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full font-semibold border self-start sm:self-center flex-shrink-0`}>
                    {selectedStrategy.risk_level}
                  </span>
                </div>
                <button
                  onClick={() => setShowStrategyModal(false)}
                  className="flex-shrink-0 text-gray-500 hover:text-gray-700 p-1 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)] space-y-4 sm:space-y-6">
              <div>
                <h4 className="text-base sm:text-lg font-semibold text-black mb-3">Strategy Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs sm:text-sm font-semibold text-slate-600 mb-1">Category</p>
                    <p className="text-sm sm:text-base font-medium text-black">{selectedStrategy.category}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs sm:text-sm font-semibold text-slate-600 mb-1">Timeframe</p>
                    <p className="text-sm sm:text-base font-medium text-black">{selectedStrategy.timeframe}</p>
                  </div>
                </div>
              </div>

              {selectedStrategy.description && (
                <div>
                  <h4 className="text-base sm:text-lg font-semibold text-black mb-2">Description</h4>
                  <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                    <p className="text-sm sm:text-base text-black leading-relaxed">{selectedStrategy.description}</p>
                  </div>
                </div>
              )}

              {selectedStrategy.trading_rules && (
                <div>
                  <h4 className="text-base sm:text-lg font-semibold text-black mb-2">Trading Rules</h4>
                  <div className="bg-green-50 rounded-lg p-3 sm:p-4">
                    <p className="text-sm sm:text-base text-black leading-relaxed whitespace-pre-wrap">{selectedStrategy.trading_rules}</p>
                  </div>
                </div>
              )}

              {selectedStrategy.additional_notes && (
                <div>
                  <h4 className="text-base sm:text-lg font-semibold text-black mb-2">Additional Notes</h4>
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                    <p className="text-sm sm:text-base text-black leading-relaxed whitespace-pre-wrap">{selectedStrategy.additional_notes}</p>
                  </div>
                </div>
              )}

              <div className="pt-3 mt-4 border-t border-slate-200">
                <div className="text-xs sm:text-sm text-slate-600">
                  <span className="font-semibold">Created:</span> {formatDate(selectedStrategy.created_at)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
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
