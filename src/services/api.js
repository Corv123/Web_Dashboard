// Environment-based API configuration
const getApiBaseUrl = () => {
  // Check if we're in development or production
  if (process.env.NODE_ENV === 'production') {
    // Use your production API URL
    return process.env.REACT_APP_API_BASE_URL || 'https://your-production-domain.com/api/v1';
  } else {
    // For local development, use localhost
    // If your React app and API server are on the same machine
    return process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';
  }
};

export const API_BASE_URL = getApiBaseUrl();

// Alternative: Direct configuration based on your setup
// Uncomment one of these based on your actual setup:

// Option 1: If React app and API server are on same machine (most common)
// const API_BASE_URL = 'http://localhost:8000/api/v1';

// Option 2: If your API server is running on a specific IP in your local network
// const API_BASE_URL = 'http://192.168.1.XXX:8000/api/v1'; // Replace XXX with actual IP

// Option 3: If you're using Docker or a specific container setup
// const API_BASE_URL = 'http://host.docker.internal:8000/api/v1';

// Generic API error handler
export const handleApiResponse = async (response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${response.statusText}. ${errorText}`);
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  return await response.text();
};

// Generic fetch function with error handling and better debugging
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`Making API request to: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      mode: 'cors',
      credentials: 'include', // Include credentials for CORS
      ...options,
    });
    
    return await handleApiResponse(response);
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    console.error(`Full URL was: ${url}`);
    
    // More detailed error information
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('This might be a CORS or network connectivity issue');
      console.error('Make sure your backend server is running and has CORS properly configured');
      console.error('Backend should allow origin: http://localhost:3000');
    }
    
    throw error;
  }
};


