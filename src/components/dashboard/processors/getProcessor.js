import { API_BASE_URL, apiRequest, handleApiResponse } from "../../../services/api";

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
    console.log(`User ${id} API response:`, data);
    
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

    // Return raw data with minimal processing - detailed processing in utils
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

