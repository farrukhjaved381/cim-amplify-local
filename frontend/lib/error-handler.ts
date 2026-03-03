// Utility for handling and formatting error messages consistently across the application

export interface ErrorResponse {
  message: string;
  status?: number;
  code?: string;
}

export class ErrorHandler {
  /**
   * Extract user-friendly error message from various error formats
   */
  static getErrorMessage(error: any): string {
    // If it's already a string, return it
    if (typeof error === 'string') {
      return error;
    }

    // Check for axios error response
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }

    // Check for direct message property
    if (error?.message) {
      // Don't show technical HTTP status messages to users
      if (error.message.includes('Request failed with status code')) {
        return this.getStatusCodeMessage(error.response?.status);
      }
      
      // Don't show network errors directly
      if (error.message.includes('Network Error')) {
        return 'Network connection error. Please check your internet connection and try again.';
      }
      
      return error.message;
    }

    // Check for HTTP status codes
    if (error?.response?.status) {
      return this.getStatusCodeMessage(error.response.status);
    }

    // Default fallback
    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Get user-friendly message based on HTTP status code
   */
  static getStatusCodeMessage(status: number): string {
    switch (status) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Invalid email or password. Please check your credentials and try again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This resource already exists. Please try with different information.';
      case 422:
        return 'The provided information is invalid. Please check your input.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'Server error. Please try again in a few minutes.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Get specific error messages for authentication
   */
  static getAuthErrorMessage(error: any): string {
    const message = this.getErrorMessage(error);
    
    // Handle specific auth error cases
    if (message.toLowerCase().includes('invalid credentials')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    
    if (message.toLowerCase().includes('email already exists')) {
      return 'An account with this email already exists. Please try logging in instead.';
    }
    
    if (message.toLowerCase().includes('user not found') || message.toLowerCase().includes('no account found')) {
      return 'No account found with this email address. Please check your email or register for a new account.';
    }
    
    if (message.toLowerCase().includes('password')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    
    return message;
  }

  /**
   * Get specific error messages for registration
   */
  static getRegistrationErrorMessage(error: any): string {
    const message = this.getErrorMessage(error);
    
    if (message.toLowerCase().includes('email already exists')) {
      return 'An account with this email already exists. Please try logging in instead.';
    }
    
    if (message.toLowerCase().includes('validation')) {
      return 'Please check your information and ensure all required fields are filled correctly.';
    }
    
    return message;
  }

  /**
   * Get specific error messages for form submissions
   */
  static getFormErrorMessage(error: any): string {
    const message = this.getErrorMessage(error);
    
    if (message.toLowerCase().includes('validation')) {
      return 'Please check your information and ensure all required fields are filled correctly.';
    }
    
    if (message.toLowerCase().includes('required')) {
      return 'Please fill in all required fields.';
    }
    
    return message;
  }

  /**
   * Check if error is a network connectivity issue
   */
  static isNetworkError(error: any): boolean {
    return (
      error?.message?.includes('Network Error') ||
      error?.code === 'NETWORK_ERROR' ||
      error?.code === 'ECONNREFUSED' ||
      !navigator.onLine
    );
  }

  /**
   * Check if error is a server error (5xx)
   */
  static isServerError(error: any): boolean {
    const status = error?.response?.status;
    return status >= 500 && status < 600;
  }

  /**
   * Check if error is a client error (4xx)
   */
  static isClientError(error: any): boolean {
    const status = error?.response?.status;
    return status >= 400 && status < 500;
  }
}

/**
 * Clear all authentication data from storage
 */
export function clearAuthStorage(): void {
  try {
    // Clear sessionStorage
    sessionStorage.removeItem("token")
    sessionStorage.removeItem("refreshToken")
    sessionStorage.removeItem("userId")
    sessionStorage.removeItem("userRole")

    // Clear localStorage
    localStorage.removeItem("token")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("userId")
    localStorage.removeItem("userRole")
  } catch (error) {
    console.error("Error clearing auth storage:", error)
  }
}

/**
 * Get the appropriate login page for a user's role
 */
export function getLoginPageForRole(role: string | null): string {
  switch (role) {
    case "buyer":
      return "/buyer/login"
    case "seller":
      return "/seller/login"
    case "admin":
      return "/admin/login"
    default:
      return "/member-login"
  }
}

/**
 * Handle authentication errors - clears storage and returns login URL
 * Use this when API returns 401 or similar auth errors
 */
export function handleAuthError(): string {
  const userRole = sessionStorage.getItem("userRole") || localStorage.getItem("userRole")
  clearAuthStorage()
  return getLoginPageForRole(userRole)
}

/**
 * Check if a response indicates an authentication error
 */
export function isAuthenticationError(response: Response | null, error?: any): boolean {
  if (response?.status === 401 || response?.status === 403) {
    return true
  }

  if (error) {
    const message = typeof error === 'string' ? error.toLowerCase() : (error.message || '').toLowerCase()
    return (
      message.includes('unauthorized') ||
      message.includes('token') ||
      message.includes('expired') ||
      message.includes('authentication') ||
      message.includes('not authenticated')
    )
  }

  return false
}

/**
 * Wrapper for fetch that automatically handles auth errors
 * Returns the response or redirects to login on auth error
 */
export async function fetchWithAuthErrorHandling(
  url: string,
  options: RequestInit = {},
  router: { push: (url: string) => void }
): Promise<Response | null> {
  try {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token")

    if (!token) {
      const loginPage = handleAuthError()
      router.push(loginPage)
      return null
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.status === 401) {
      const loginPage = handleAuthError()
      router.push(loginPage)
      return null
    }

    return response
  } catch (error) {
    console.error("Fetch error:", error)
    throw error
  }
}

export default ErrorHandler;