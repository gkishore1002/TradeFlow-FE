"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Dropdown from "@/components/ui/Dropdown";
import { Plus, X, Trash2, Eye, Edit2, Calendar, Tag, ChevronLeft, ChevronRight, Search, Image as ImageIcon } from "lucide-react";
import DeleteModal from "@/components/shared/DeleteModal";
import { API_BASE_URL } from "@/lib/constants";
import { formatDate } from "@/lib/utils/format";

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

  // Reusable delete modal state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [strategyToDelete, setStrategyToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [backendConnected, setBackendConnected] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Momentum Trading",
    risk_level: "Low Risk",
    timeframe: "Intraday (1 day)",
    trading_rules: "",
    additional_notes: "",
    images: []
  });

  const categoryOptions = [
    { value: "Momentum Trading", label: "Momentum Trading" },
    { value: "Swing Trading", label: "Swing Trading" },
    { value: "Scalping", label: "Scalping" },
    { value: "Mean Reversion", label: "Mean Reversion" },
    { value: "Breakout", label: "Breakout" }
  ];

  const riskLevelOptions = [
    { value: "Low Risk", label: "Low Risk" },
    { value: "Medium Risk", label: "Medium Risk" },
    { value: "High Risk", label: "High Risk" }
  ];

  const timeframeOptions = [
    { value: "Intraday (1 day)", label: "Intraday (1 day)" },
    { value: "Swing (days-weeks)", label: "Swing (days-weeks)" },
    { value: "Position (weeks-months)", label: "Position (weeks-months)" },
    { value: "Long Term (months-years)", label: "Long Term (months-years)" }
  ];

  const showToast = useCallback((message, type = "error") => {
    toastRef.current += 1;
    const id = Date.now() + toastRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  }, []);

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  };

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
      setBackendConnected(false);
      throw error;
    }
  }, [router]);

  const fetchStrategies = useCallback(async (page = 1, search = "") => {
    try {
      setLoading(true);
      setError("");

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
          setStrategies([]);
        }
      } else {
        setStrategies([]);
      }
    } catch (err) {
      setError(`Failed to load strategies: ${err.message}`);
      showToast(`Failed to load strategies: ${err.message}`, 'error');
      setStrategies([]);
    } finally {
      setLoading(false);
    }
  }, [apiCall, showToast]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }

    fetchStrategies(1, "");
  }, [fetchStrategies, router]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm !== searchQuery) {
        setSearchQuery(searchTerm);
        fetchStrategies(1, searchTerm);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, searchQuery, fetchStrategies]);

  // Pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchStrategies(newPage, searchQuery);
    }
  };

  // Search
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  // Input/file
  const handleInputChange = (e) => {
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
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Dropdown
  const handleDropdownChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Remove preview
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

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Strategy name is required");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const form = new FormData();
      form.append('name', formData.name);
      form.append('category', formData.category);
      form.append('risk_level', formData.risk_level);
      form.append('timeframe', formData.timeframe);

      if (formData.description) form.append('description', formData.description);
      if (formData.trading_rules) form.append('trading_rules', formData.trading_rules);
      if (formData.additional_notes) form.append('additional_notes', formData.additional_notes);

      formData.images.forEach(file => {
        form.append('images', file);
      });

      if (editingStrategy) {
        await apiCall(`/api/strategies/${editingStrategy.id}`, {
          method: "PUT",
          body: form
        });
        setSuccess('✅ Strategy updated successfully!');
        showToast('Strategy updated successfully!', 'success');

      } else {
        await apiCall('/api/strategies', {
          method: "POST",
          body: form
        });
        setSuccess('✅ Strategy created successfully!');
        showToast('Strategy created successfully!', 'success');

      }

      setShowForm(false);
      setEditingStrategy(null);
      setFormData({
        name: "",
        description: "",
        category: "Momentum Trading",
        risk_level: "Low Risk",
        timeframe: "Intraday (1 day)",
        trading_rules: "",
        additional_notes: "",
        images: []
      });
      setImagePreviews([]);

      await fetchStrategies(pagination.page, searchQuery);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Failed to save strategy: ${err.message}`);
      showToast(`Failed to save strategy: ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = (e) => {
    e.preventDefault();
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
      additional_notes: "",
      images: []
    });
    imagePreviews.forEach(p => URL.revokeObjectURL(p.preview));
    setImagePreviews([]);
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
      additional_notes: strategy.additional_notes || "",
      images: []
    });
    setImagePreviews([]);
    setShowForm(true);
  };

  const handleViewStrategy = (strategy) => {
    setSelectedStrategy(strategy);
    setShowStrategyModal(true);
  };

  // Delete flow with reusable modal
  const handleDeleteClick = (strategy) => {
    setStrategyToDelete(strategy);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!strategyToDelete) return;

    try {
      setDeleting(true);
      await apiCall(`/api/strategies/${strategyToDelete.id}`, {
        method: "DELETE"
      });
      setSuccess('✅ Strategy deleted successfully!');
      showToast('Strategy deleted successfully!', 'success');

      await fetchStrategies(pagination.page, searchQuery);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Failed to delete strategy: ${err.message}`);
      showToast(`Failed to delete strategy: ${err.message}`, 'error');
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
      setStrategyToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteOpen(false);
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

  // formatDate imported from @/lib/utils/format

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

  if (loading && strategies.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
        <Toasts />
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
      <Toasts />

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
              className="w-full pl-10 pr-4 py-2.5 sm:py-2 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white text-sm sm:text-base placeholder-slate-400"
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

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-hidden">
          <div className="w-full max-w-4xl bg-white rounded-lg shadow-2xl h-[90vh] flex flex-col overflow-hidden my-4">
            {/* Header */}
            <div className="bg-slate-100 px-4 sm:px-6 py-4 flex justify-between items-center border-b border-slate-200 flex-shrink-0">
              <h2 className="text-lg font-bold text-slate-900">{editingStrategy ? 'Edit Strategy' : 'New Strategy'}</h2>
              <button
                type="button"
                onClick={handleCancel}
                className="text-slate-600 hover:text-slate-900 transition"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 sm:p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Strategy Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Strategy Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., RSI Momentum Strategy"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder-slate-400 bg-white"
                      required
                    />
                  </div>

                  {/* Category, Risk Level, Timeframe */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Dropdown
                      name="category"
                      label="Category *"
                      placeholder="Select category..."
                      value={formData.category}
                      onChange={handleDropdownChange}
                      options={categoryOptions}
                      searchable={false}
                      required={true}
                    />

                    <Dropdown
                      name="risk_level"
                      label="Risk Level *"
                      placeholder="Select risk level..."
                      value={formData.risk_level}
                      onChange={handleDropdownChange}
                      options={riskLevelOptions}
                      searchable={false}
                      required={true}
                    />

                    <Dropdown
                      name="timeframe"
                      label="Timeframe *"
                      placeholder="Select timeframe..."
                      value={formData.timeframe}
                      onChange={handleDropdownChange}
                      options={timeframeOptions}
                      searchable={false}
                      required={true}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Brief description of your strategy..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder-slate-400 bg-white resize-none"
                      rows="3"
                    />
                  </div>

                  {/* Trading Rules */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Trading Rules</label>
                    <textarea
                      name="trading_rules"
                      value={formData.trading_rules}
                      onChange={handleInputChange}
                      placeholder="Entry and exit rules, risk management..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder-slate-400 bg-white resize-none"
                      rows="3"
                    />
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Additional Notes</label>
                    <textarea
                      name="additional_notes"
                      value={formData.additional_notes}
                      onChange={handleInputChange}
                      placeholder="Any additional notes or observations..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder-slate-400 bg-white resize-none"
                      rows="2"
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">
                      Upload Images
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-all">
                      <input
                        type="file"
                        name="images"
                        multiple
                        accept="image/*"
                        onChange={handleInputChange}
                        className="hidden"
                        id="strategy-image-upload"
                      />
                      <label htmlFor="strategy-image-upload" className="cursor-pointer block">
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

                  {/* Buttons */}
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
                        editingStrategy ? 'Update Strategy' : 'Create Strategy'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
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
                          type="button"
                          onClick={() => handleViewStrategy(strategy)}
                          title="View Details"
                          className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-100 rounded-md sm:rounded-lg transition-colors duration-200"
                        >
                          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditStrategy(strategy)}
                          title="Edit Strategy"
                          className="p-1.5 sm:p-2 text-green-600 hover:bg-green-100 rounded-md sm:rounded-lg transition-colors duration-200"
                        >
                          <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          type="button"
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

                    {/* Images Badge */}
                    {strategy.images && strategy.images.length > 0 && (
                      <div className="mb-3 sm:mb-4">
                        <div className="flex items-center gap-1.5 text-xs bg-blue-100 text-blue-700 px-2.5 py-1.5 rounded-full w-fit font-medium">
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>{strategy.images.length} image(s)</span>
                        </div>
                      </div>
                    )}

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
                        type="button"
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
                        type="button"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={!pagination.has_prev}
                        className="flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-500 bg白 border border-gray-300 rounded-md sm:rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                              type="button"
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md sm:rounded-lg ${pageNum === pagination.page
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
                        type="button"
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

      {/* Strategy View Modal */}
      {showStrategyModal && selectedStrategy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowStrategyModal(false)}
          ></div>

          <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col overflow-hidden my-4">
            <div className="bg-slate-100 px-4 sm:px-6 py-4 flex justify-between items-center border-b border-slate-200 flex-shrink-0">
              <h3 className="text-lg sm:text-xl font-bold text-black truncate">{selectedStrategy.name}</h3>
              <button
                type="button"
                onClick={() => setShowStrategyModal(false)}
                className="text-slate-600 hover:text-slate-900 transition"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-4 sm:p-6 space-y-4">
                {/* Strategy Details */}
                <div>
                  <h4 className="text-base sm:text-lg font-semibold text-black mb-3">Strategy Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs sm:text-sm font-semibold text-slate-600 mb-1">Category</p>
                      <p className="text-sm sm:text-base font-medium text-black">{selectedStrategy.category}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs sm:text-sm font-semibold text-slate-600 mb-1">Risk Level</p>
                      <p className={`text-sm sm:text-base font-medium ${getRiskColor(selectedStrategy.risk_level).replace('border', '').replace('bg-', 'text-')}`}>
                        {selectedStrategy.risk_level}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs sm:text-sm font-semibold text-slate-600 mb-1">Timeframe</p>
                      <p className="text-sm sm:text-base font-medium text-black">{selectedStrategy.timeframe}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs sm:text-sm font-semibold text-slate-600 mb-1">Created</p>
                      <p className="text-sm sm:text-base font-medium text-black">{formatDate(selectedStrategy.created_at)}</p>
                    </div>
                  </div>
                </div>

                {/* Images */}
                {selectedStrategy.images && selectedStrategy.images.length > 0 && (
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-black mb-3">Images ({selectedStrategy.images.length})</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedStrategy.images.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative group"
                        >
                          <img
                            src={url}
                            alt={`Strategy image ${idx + 1}`}
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

                {/* Description */}
                {selectedStrategy.description && (
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-black mb-2">Description</h4>
                    <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                      <p className="text-sm sm:text-base text-black leading-relaxed">{selectedStrategy.description}</p>
                    </div>
                  </div>
                )}

                {/* Trading Rules */}
                {selectedStrategy.trading_rules && (
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-black mb-2">Trading Rules</h4>
                    <div className="bg-green-50 rounded-lg p-3 sm:p-4">
                      <p className="text-sm sm:text-base text-black leading-relaxed whitespace-pre-wrap">{selectedStrategy.trading_rules}</p>
                    </div>
                  </div>
                )}

                {/* Additional Notes */}
                {selectedStrategy.additional_notes && (
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-black mb-2">Additional Notes</h4>
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                      <p className="text-sm sm:text-base text-black leading-relaxed whitespace-pre-wrap">{selectedStrategy.additional_notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Delete Modal */}
      <DeleteModal
        open={deleteOpen}
        title="Delete Strategy"
        message={
          strategyToDelete
            ? `Are you sure you want to delete "${strategyToDelete.name}"? This action cannot be undone.`
            : 'Are you sure you want to delete this strategy? This action cannot be undone.'
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

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
