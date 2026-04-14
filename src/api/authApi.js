/**
 * NutriAI Authentication API Client
 * Handles all auth-related HTTP requests with token management.
 */

const API_URL = import.meta.env.VITE_API_URL || '/api';

class AuthAPI {
  constructor() {
    this.baseURL = API_URL;
  }

  /**
   * Get stored access token.
   */
  getToken() {
    return localStorage.getItem('nutriai_access_token');
  }

  /**
   * Get stored refresh token.
   */
  getRefreshToken() {
    return localStorage.getItem('nutriai_refresh_token');
  }

  /**
   * Store tokens.
   */
  setTokens(accessToken, refreshToken) {
    localStorage.setItem('nutriai_access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('nutriai_refresh_token', refreshToken);
    }
  }

  /**
   * Clear all tokens.
   */
  clearTokens() {
    localStorage.removeItem('nutriai_access_token');
    localStorage.removeItem('nutriai_refresh_token');
    localStorage.removeItem('nutriai_user');
  }

  /**
   * Make an authenticated API request with auto-refresh.
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Attach access token if available
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      let response = await fetch(url, {
        ...options,
        headers,
      });

      // If 401 and we have a refresh token, try refreshing
      if (response.status === 401 && this.getRefreshToken()) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          headers['Authorization'] = `Bearer ${this.getToken()}`;
          response = await fetch(url, { ...options, headers });
        }
      }

      // Try to parse as JSON, but handle errors if not JSON
      let data = {};
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Handle non-JSON response (like HTML error pages or rate limit messages)
        const text = await response.text();
        data = { error: text || `Server returned ${response.status}` };
      }

      if (!response.ok) {
        // Specific handling for common status codes
        let errorMessage = data.error || data.message || 'Request failed';
        
        if (response.status === 429) {
          errorMessage = 'Too many requests. Please wait a moment before trying again.';
        } else if (response.status === 500) {
          errorMessage = 'Server error. Our team has been notified. Please try again later.';
        } else if (response.status === 404) {
          errorMessage = 'API endpoint not found. Please check your configuration.';
        }

        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
      // If it's already an error with a status, it's a server error we already handled
      if (error.status) throw error;
      
      // Actual fetch failure (DNS, connection refused, CORS)
      console.error('[API Network Error]', error);
      throw new Error('Could not connect to the server. Please check your internet or API URL.');
    }
  }

  /**
   * Refresh the access token.
   */
  async refreshAccessToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`,
        },
      });

      if (!response.ok) {
        this.clearTokens();
        return false;
      }

      const data = await response.json();
      localStorage.setItem('nutriai_access_token', data.access_token);
      return true;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  // ─── Auth Endpoints ─────────────────────────────────────────

  /**
   * Register a new user.
   */
  async register(name, email, password) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    return data;
  }

  /**
   * Login with email and password.
   */
  async login(email, password, rememberMe = false) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, remember_me: rememberMe }),
    });

    if (data.access_token) {
      this.setTokens(data.access_token, data.refresh_token);
      if (data.user) {
        localStorage.setItem('nutriai_user', JSON.stringify(data.user));
      }
    }

    return data;
  }

  /**
   * Authenticate with Google OAuth credential.
   */
  async googleAuth(credential) {
    const data = await this.request('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    });

    if (data.access_token) {
      this.setTokens(data.access_token, data.refresh_token);
      if (data.user) {
        localStorage.setItem('nutriai_user', JSON.stringify(data.user));
      }
    }

    return data;
  }

  /**
   * Verify email OTP.
   */
  async verifyOTP(email, otp) {
    const data = await this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });

    if (data.access_token) {
      this.setTokens(data.access_token, data.refresh_token);
      if (data.user) {
        localStorage.setItem('nutriai_user', JSON.stringify(data.user));
      }
    }

    return data;
  }

  /**
   * Resend OTP.
   */
  async resendOTP(email) {
    return this.request('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  /**
   * Request password reset.
   */
  async forgotPassword(email) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  /**
   * Reset password with token.
   */
  async resetPassword(email, token, newPassword) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, token, new_password: newPassword }),
    });
  }

  /**
   * Get current user profile.
   */
  async getMe() {
    return this.request('/auth/me', { method: 'GET' });
  }

  /**
   * Save profile/biometric data.
   */
  async profileSetup(profileData) {
    const data = await this.request('/auth/profile-setup', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });

    if (data.user) {
      localStorage.setItem('nutriai_user', JSON.stringify(data.user));
    }

    return data;
  }

  /**
   * Update user's selected region.
   */
  async updateRegion(region) {
    const data = await this.request('/auth/update-region', {
      method: 'POST',
      body: JSON.stringify({ region }),
    });

    if (data.user) {
      localStorage.setItem('nutriai_user', JSON.stringify(data.user));
    }

    return data;
  }


  /**
   * Logout.
   */
  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore errors on logout
    } finally {
      this.clearTokens();
    }
  }
}

export const authApi = new AuthAPI();
export default authApi;
