// src/app/dashboard/Notifications.jsx
"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const Notifications = () => {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

  // Get access token
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  };

  // Fetch notifications
  const fetchNotifications = useCallback(async (pageNum = 1, filterType = 'all') => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const unreadParam = filterType === 'unread' ? '&unread_only=true' : '';
      const response = await fetch(
        `${API_BASE}/api/notifications?page=${pageNum}&per_page=20${unreadParam}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include',
          mode: 'cors'
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        if (pageNum === 1) {
          setNotifications(data.items || []);
        } else {
          setNotifications(prev => [...prev, ...(data.items || [])]);
        }
        
        // Fetch unread count separately
        fetchUnreadCount();
        
        setTotalPages(data.pagination?.pages || 1);
        setHasMore(data.pagination?.has_next || false);
      } else if (response.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, router]);

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_BASE}/api/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        mode: 'cors'
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  // Initialize
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login');
      return;
    }
    fetchNotifications(1, filter);
  }, [router, filter, fetchNotifications]);

  // Mark as read
  const markAsRead = async (notificationId) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_BASE}/api/notifications/${notificationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        mode: 'cors'
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      setLoading(true);
      const response = await fetch(`${API_BASE}/api/notifications/mark-all-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        mode: 'cors'
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_BASE}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        mode: 'cors'
      });

      if (response.ok) {
        const wasUnread = notifications.find(n => n.id === notificationId)?.is_read === false;
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        setShowDeleteConfirm(null);
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1);
    setNotifications([]);
    fetchNotifications(1, newFilter);
  };

  // Load more
  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage, filter);
    }
  };

  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get notification type badge
  const getTypeBadge = (type) => {
    const badges = {
      trade: { color: 'bg-blue-100 text-blue-800', label: 'Trade' },
      analysis: { color: 'bg-purple-100 text-purple-800', label: 'Analysis' },
      strategy: { color: 'bg-green-100 text-green-800', label: 'Strategy' },
      alert: { color: 'bg-red-100 text-red-800', label: 'Alert' },
      system: { color: 'bg-slate-100 text-slate-800', label: 'System' }
    };
    
    const badge = badges[type] || badges.system;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg sm:rounded-2xl p-4 sm:p-6 border border-blue-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
              <svg className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Notifications
            </h1>
            {unreadCount > 0 && (
              <p className="text-sm text-slate-600 mt-1 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleFilterChange('unread')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Unread
              {unreadCount > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                  filter === 'unread' ? 'bg-white text-blue-600' : 'bg-red-500 text-white'
                }`}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Mark All Read Button */}
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={loading}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Notifications Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-slate-200">
        {loading && page === 1 ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600 text-sm sm:text-base">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">No notifications</h3>
            <p className="text-sm sm:text-base text-slate-600">
              {filter === 'unread' ? "You're all caught up! No unread notifications." : "You don't have any notifications yet."}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block md:hidden divide-y divide-slate-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 ${!notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm font-medium text-slate-900 mb-1 ${!notification.is_read ? 'font-semibold' : ''}`}>
                        {notification.title}
                      </h3>
                      {getTypeBadge(notification.type)}
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse flex-shrink-0 mt-1"></div>
                    )}
                  </div>
                  
                  <p className="text-xs text-slate-600 mb-2 line-clamp-2">
                    {notification.message}
                  </p>
                  
                  <p className="text-xs text-slate-500 mb-3">
                    {formatTime(notification.created_at)}
                  </p>

                  <div className="flex items-center gap-2">
                    {!notification.is_read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded font-medium transition-colors"
                      >
                        Mark read
                      </button>
                    )}
                    <button
                      onClick={() => setShowDeleteConfirm(notification.id)}
                      className="text-xs px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>

                  {showDeleteConfirm === notification.id && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800 mb-2">Delete this notification?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors"
                        >
                          Yes, Delete
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(null)}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {notifications.map((notification) => (
                    <tr
                      key={notification.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        !notification.is_read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        {!notification.is_read ? (
                          <span className="flex items-center gap-2 text-xs font-medium text-blue-600">
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                            Unread
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">Read</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTypeBadge(notification.type)}
                      </td>
                      <td className="px-6 py-4">
                        <p className={`text-sm text-slate-900 ${!notification.is_read ? 'font-semibold' : 'font-medium'}`}>
                          {notification.title}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600 max-w-md line-clamp-2">
                          {notification.message}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-xs text-slate-600">
                          {formatTime(notification.created_at)}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          {!notification.is_read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Mark as read"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (showDeleteConfirm === notification.id) {
                                deleteNotification(notification.id);
                              } else {
                                setShowDeleteConfirm(notification.id);
                              }
                            }}
                            className={`p-2 rounded-lg transition-colors ${
                              showDeleteConfirm === notification.id
                                ? 'bg-red-100 text-red-700'
                                : 'text-red-600 hover:bg-red-50'
                            }`}
                            title={showDeleteConfirm === notification.id ? 'Click again to confirm' : 'Delete'}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          {showDeleteConfirm === notification.id && (
                            <button
                              onClick={() => setShowDeleteConfirm(null)}
                              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                      Load More
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Footer Info */}
            <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 text-center text-xs sm:text-sm text-slate-600">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                <span>Showing {notifications.length} notifications</span>
                <span className="hidden sm:inline">•</span>
                <span>Page {page} of {totalPages}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Notifications;
