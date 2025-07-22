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

const API_BASE_URL = getApiBaseUrl();

// Alternative: Direct configuration based on your setup
// Uncomment one of these based on your actual setup:

// Option 1: If React app and API server are on same machine (most common)
// const API_BASE_URL = 'http://localhost:8000/api/v1';

// Option 2: If your API server is running on a specific IP in your local network
// const API_BASE_URL = 'http://192.168.1.XXX:8000/api/v1'; // Replace XXX with actual IP

// Option 3: If you're using Docker or a specific container setup
// const API_BASE_URL = 'http://host.docker.internal:8000/api/v1';

// Generic API error handler
const handleApiResponse = async (response) => {
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
const apiRequest = async (endpoint, options = {}) => {
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

// Test connection function
export const testApiConnection = async () => {
  try {
    console.log(`Testing API connection to: ${API_BASE_URL}`);
    
    // Try a simple health check or users endpoint
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
    });
    
    if (response.ok) {
      console.log('✅ API connection successful');
      return true;
    } else {
      console.error('❌ API connection failed:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ API connection test failed:', error);
    return false;
  }
};

// Users API
export const getAllUsers = async () => {
  try {
    const data = await apiRequest('/users');
    console.log('Users API response:', data);
    
    // Handle different response structures
    let users = [];
    if (Array.isArray(data)) {
      users = data;
    } else if (data.result && Array.isArray(data.result.data)) {
      users = data.result.data;
    } else if (data.data && Array.isArray(data.data)) {
      users = data.data;
    } else if (data.users && Array.isArray(data.users)) {
      users = data.users;
    } else {
      console.warn('Unexpected users API response structure:', data);
      return [];
    }

    // Process and normalize user data structure
    return users.map(user => ({
      id: user.user_id || user._id || user.id,
      user_id: user.user_id,
      username: user.username,
      user_mobile_number: user.user_mobile_number,
      user_email: user.user_email,
      user_allow_dark_mode: user.user_allow_dark_mode,
      user_round_up_pref: user.user_round_up_pref,
      user_discount_donate: user.user_discount_donate,
      user_login_status: user.user_login_status,
      user_gender: user.user_gender,
      password: user.password,
      user_default_donation_method: user.user_default_donation_method,
      tokens: user.tokens,
      // Keep original structure for backward compatibility
      ...user
    }));
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return [];
  }
};

export const getUserById = async (id) => {
  try {
    const data = await apiRequest(`/users/${id}`);
    console.log(`User ${id} API response:`, data);
    
    // Normalize single user data structure
    if (data) {
      return {
        id: data.user_id || data._id || data.id,
        user_id: data.user_id,
        username: data.username,
        user_mobile_number: data.user_mobile_number,
        user_email: data.user_email,
        user_allow_dark_mode: data.user_allow_dark_mode,
        user_round_up_pref: data.user_round_up_pref,
        user_discount_donate: data.user_discount_donate,
        user_login_status: data.user_login_status,
        user_gender: data.user_gender,
        password: data.password,
        user_default_donation_method: data.user_default_donation_method,
        tokens: data.tokens,
        // Keep original structure for backward compatibility
        ...data
      };
    }
    return data;
  } catch (error) {
    console.error(`Failed to fetch user ${id}:`, error);
    return null;
  }
};

export const createUser = async (userData) => {
  try {
    const data = await apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    console.log('Create user API response:', data);
    return data;
  } catch (error) {
    console.error('Failed to create user:', error);
    throw error;
  }
};

export const updateUser = async (id, userData) => {
  try {
    const data = await apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
    console.log(`Update user ${id} API response:`, data);
    return data;
  } catch (error) {
    console.error(`Failed to update user ${id}:`, error);
    throw error;
  }
};

export const deleteUser = async (id) => {
  try {
    const data = await apiRequest(`/users/${id}`, {
      method: 'DELETE',
    });
    console.log(`Delete user ${id} API response:`, data);
    return data;
  } catch (error) {
    console.error(`Failed to delete user ${id}:`, error);
    throw error;
  }
};

// Donations API
export const getAllDonations = async () => {
  try {
    const data = await apiRequest('/donations');
    console.log('Donations API response:', data);
    
    // Handle different response structures
    if (Array.isArray(data)) {
      return data;
    } else if (data.result && Array.isArray(data.result.data)) {
      return data.result.data;
    } else if (data.data && Array.isArray(data.data)) {
      return data.data;
    } else if (data.donations && Array.isArray(data.donations)) {
      return data.donations;
    } else {
      console.warn('Unexpected donations API response structure:', data);
      return [];
    }
  } catch (error) {
    console.error('Failed to fetch donations:', error);
    return [];
  }
};

export const getDonationById = async (id) => {
  try {
    const data = await apiRequest(`/donations/${id}`);
    console.log(`Donation ${id} API response:`, data);
    return data;
  } catch (error) {
    console.error(`Failed to fetch donation ${id}:`, error);
    return null;
  }
};

export const createDonation = async (donationData) => {
  try {
    const data = await apiRequest('/donations', {
      method: 'POST',
      body: JSON.stringify(donationData),
    });
    console.log('Create donation API response:', data);
    return data;
  } catch (error) {
    console.error('Failed to create donation:', error);
    throw error;
  }
};

export const updateDonation = async (id, donationData) => {
  try {
    const data = await apiRequest(`/donations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(donationData),
    });
    console.log(`Update donation ${id} API response:`, data);
    return data;
  } catch (error) {
    console.error(`Failed to update donation ${id}:`, error);
    throw error;
  }
};

export const deleteDonation = async (id) => {
  try {
    const data = await apiRequest(`/donations/${id}`, {
      method: 'DELETE',
    });
    console.log(`Delete donation ${id} API response:`, data);
    return data;
  } catch (error) {
    console.error(`Failed to delete donation ${id}:`, error);
    throw error;
  }
};

// Orders API
export const getAllOrders = async () => {
  try {
    const data = await apiRequest('/orders');
    console.log('Orders API response:', data);
    
    // Handle different response structures
    let orders = [];
    if (Array.isArray(data)) {
      orders = data;
    } else if (data.result && Array.isArray(data.result.data)) {
      orders = data.result.data;
    } else if (data.data && Array.isArray(data.data)) {
      orders = data.data;
    } else if (data.orders && Array.isArray(data.orders)) {
      orders = data.orders;
    } else {
      console.warn('Unexpected orders API response structure:', data);
      return [];
    }

    // Process and normalize order data structure
    return orders.map(order => ({
      id: order.order_id || order._id || order.id,
      order_id: order.order_id,
      order_status: order.order_status,
      order_cost: Number(order.order_cost) || 0,
      total_order_cost: Number(order.total_order_cost) || 0,
      order_type: order.order_type,
      merchant_name: order.merchant_name,
      merchant_location: order.merchant_location,
      order_complete_datetime: order.order_complete_datetime,
      user_id: order.user_id,
      order_tokens: order.order_tokens,
      order_items: order.order_items || [],
      // Keep original structure for backward compatibility
      ...order
    }));
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return [];
  }
};

export const getOrderById = async (id) => {
  try {
    const data = await apiRequest(`/orders/${id}`);
    console.log(`Order ${id} API response:`, data);
    
    // Normalize single order data structure
    if (data) {
      return {
        id: data.order_id || data._id || data.id,
        order_id: data.order_id,
        order_status: data.order_status,
        order_cost: Number(data.order_cost) || 0,
        total_order_cost: Number(data.total_order_cost) || 0,
        order_type: data.order_type,
        merchant_name: data.merchant_name,
        merchant_location: data.merchant_location,
        order_complete_datetime: data.order_complete_datetime,
        user_id: data.user_id,
        order_tokens: data.order_tokens,
        order_items: data.order_items || [],
        // Keep original structure for backward compatibility
        ...data
      };
    }
    return data;
  } catch (error) {
    console.error(`Failed to fetch order ${id}:`, error);
    return null;
  }
};

export const createOrder = async (orderData) => {
  try {
    const data = await apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
    console.log('Create order API response:', data);
    return data;
  } catch (error) {
    console.error('Failed to create order:', error);
    throw error;
  }
};

export const updateOrder = async (id, orderData) => {
  try {
    const data = await apiRequest(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(orderData),
    });
    console.log(`Update order ${id} API response:`, data);
    return data;
  } catch (error) {
    console.error(`Failed to update order ${id}:`, error);
    throw error;
  }
};

export const deleteOrder = async (id) => {
  try {
    const data = await apiRequest(`/orders/${id}`, {
      method: 'DELETE',
    });
    console.log(`Delete order ${id} API response:`, data);
    return data;
  } catch (error) {
    console.error(`Failed to delete order ${id}:`, error);
    throw error;
  }
};

// Utility functions for data processing
export const processUsersData = (users) => {
  if (!Array.isArray(users)) return [];
  
  return users.map(user => ({
    ...user,
    // Ensure consistent ID mapping
    id: user.user_id || user._id || user.id,
    gender: user.user_gender || 'Unknown',
    mobile: user.user_mobile_number,
    email: user.user_email,
    darkMode: user.user_allow_dark_mode,
    roundUpPref: user.user_round_up_pref,
    discountDonate: user.user_discount_donate,
    loginStatus: user.user_login_status,
    defaultDonationMethod: user.user_default_donation_method,
  }));
};

export const processDonationsData = (donations) => {
  if (!Array.isArray(donations)) return [];
  
  return donations.map(donation => ({
    ...donation,
    // Add any data transformations here
    id: donation._id || donation.donation_id,
    amount: Number(donation.donation_amt) || 0,
    dsgd_amount: Number(donation.donation_dsgd_amt) || 0,
    datetime: donation.donation_datetime,
    charity_id: donation.charity_id,
    status: donation.donation_status,
    type: donation.donation_type,
    cause: donation.donation_cause,
    user_id: donation.user_id,
  }));
};

export const processOrdersData = (orders) => {
  if (!Array.isArray(orders)) return [];
  
  return orders.map(order => ({
    ...order,
    // Ensure consistent ID mapping
    id: order.order_id || order._id || order.id,
    cost: Number(order.order_cost) || 0,
    totalCost: Number(order.total_order_cost) || 0,
    status: order.order_status,
    type: order.order_type,
    merchant: order.merchant_name,
    location: order.merchant_location,
    datetime: order.order_complete_datetime,
    userId: order.user_id,
    tokens: order.order_tokens,
    items: order.order_items || [],
  }));
};

// Dashboard specific API calls
export const getDashboardData = async () => {
  try {
    const [users, donations, orders] = await Promise.all([
      getAllUsers(),
      getAllDonations(),
      getAllOrders()
    ]);

    return {
      users: processUsersData(users),
      donations: processDonationsData(donations),
      orders: processOrdersData(orders),
    };
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    return {
      users: [],
      donations: [],
      orders: [],
    };  
  }
};

// Export API base URL for other components if needed
export { API_BASE_URL };