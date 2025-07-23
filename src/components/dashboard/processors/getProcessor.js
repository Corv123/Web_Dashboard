import { API_BASE_URL, apiRequest } from "../../../services/api";

// Helper function to safely convert Decimal128 to number
const parseDecimal128 = (value) => {
  if (value === null || value === undefined) return 0;
  
  // Handle Decimal128 object structure
  if (typeof value === 'object' && value.$numberDecimal) {
    return parseFloat(value.$numberDecimal) || 0;
  }
  
  // Handle string representation
  if (typeof value === 'string') {
    return parseFloat(value) || 0;
  }
  
  // Handle regular number
  return Number(value) || 0;
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
    
    // Handle different response structures using helper function
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

    // Return raw data - processing will be done in utils
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
    
    // Return normalized single user data structure
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

// Donations API
export const getAllDonations = async () => {
  try {
    const data = await apiRequest('/donations');
    
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
    return data;
  } catch (error) {
    console.error(`Failed to fetch donation ${id}:`, error);
    return null;
  }
};

// Orders API - UPDATED for Decimal128 support
export const getAllOrders = async () => {
  try {
    const data = await apiRequest('/orders');
    
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

    // Return processed data with proper Decimal128 handling
    return orders.map(order => {
      const processedOrder = {
        order_status: order.order_status,
        order_cost: parseDecimal128(order.order_cost), // Handle legacy field
        total_order_cost: parseDecimal128(order.total_order_cost), // Handle Decimal128
        order_type: order.order_type,
        merchant_name: order.merchant_name,
        merchant_location: order.merchant_location,
        order_complete_datetime: order.order_complete_datetime,
        user_id: order.user_id,
        order_tokens: order.order_tokens,
        order_items: order.order_items || [],
        order_id: order.order_id,
        // Keep original structure for backward compatibility
        ...order
      };
      
      return processedOrder;
    });
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return [];
  }
};