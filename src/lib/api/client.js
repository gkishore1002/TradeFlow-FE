// src/lib/api/client.js

import { API_BASE_URL } from '../constants';

/**
 * Centralized API Client for all HTTP requests
 * Handles authentication, error handling, and response parsing
 */
class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Get authentication token from localStorage
   */
  getToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  /**
   * Handle unauthorized access (401)
   */
  handleUnauthorized() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('email');
      localStorage.removeItem('first_name');
      localStorage.removeItem('last_name');
      localStorage.removeItem('user_id');
      localStorage.removeItem('avatar_url');
      window.location.href = '/login';
    }
  }

  /**
   * Parse error response
   */
  async handleError(response) {
    try {
      const error = await response.json();
      return new Error(error.error || error.message || `HTTP ${response.status}`);
    } catch {
      return new Error(`HTTP ${response.status}`);
    }
  }

  /**
   * Main request method
   * @param {string} endpoint - API endpoint (e.g., '/api/strategies')
   * @param {object} options - Fetch options
   * @returns {Promise} Response data
   */
  async request(endpoint, options = {}) {
    const token = this.getToken();

    // Check if body is FormData
    const isFormData = options.body instanceof FormData;

    // Build headers
    const headers = {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...options.headers,
    };

    // Build fetch config
    const config = {
      ...options,
      headers,
      credentials: 'include',
      mode: 'cors',
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);

      // Handle 401 Unauthorized
      if (response.status === 401) {
        this.handleUnauthorized();
        return null;
      }

      // Handle other errors
      if (!response.ok) {
        throw await this.handleError(response);
      }

      // Parse and return JSON
      const data = await response.json();
      return data;
    } catch (error) {
      // Re-throw for caller to handle
      throw error;
    }
  }

  /**
   * GET request
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }

  /**
   * PATCH request
   */
  async patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for testing
export default ApiClient;
