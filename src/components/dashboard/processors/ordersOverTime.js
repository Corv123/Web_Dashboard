// ===== UPDATED ordersOverTime.js =====

import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
dayjs.extend(isSameOrBefore);

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

// Helper function to safely get order cost (prioritize total_order_cost)
const getOrderCost = (order) => {
  // Prioritize total_order_cost since it's the Decimal128 field
  if (order.total_order_cost !== undefined && order.total_order_cost !== null) {
    return parseDecimal128(order.total_order_cost);
  }
  
  // Fallback to order_cost for backward compatibility
  if (order.order_cost !== undefined && order.order_cost !== null) {
    return parseDecimal128(order.order_cost);
  }
  
  return 0;
};

/**
 * Process orders data to generate time-based chart data
 * @param {Array} orders - Array of order objects
 * @param {string} startDate - Start date filter (YYYY-MM-DD format)
 * @param {string} endDate - End date filter (YYYY-MM-DD format)
 * @param {string} timeGrouping - Time grouping ('day', 'week', 'month')
 * @returns {Array} Processed chart data
 */
export const processOrdersOverTime = (orders = [], startDate = '', endDate = '', timeGrouping = 'day') => {
  console.log('processOrdersOverTime called with:', {
    ordersCount: orders.length,
    startDate,
    endDate,
    timeGrouping
  });

  // Ensure orders is an array
  const ordersArr = Array.isArray(orders) ? orders : [];
  
  // Filter orders with valid dates first
  const validOrders = ordersArr.filter(order => {
    if (!order.order_complete_datetime) {
      console.log('Order missing date:', order);
      return false;
    }
    
    const orderDate = dayjs(order.order_complete_datetime);
    if (!orderDate.isValid()) {
      console.log('Invalid date:', order.order_complete_datetime);
      return false;
    }
    
    return true;
  });

  console.log('Valid orders:', validOrders.length);

  // Apply date range filter if specified
  let filteredOrders = validOrders;
  if (startDate || endDate) {
    filteredOrders = validOrders.filter(order => {
      const orderDate = dayjs(order.order_complete_datetime).format('YYYY-MM-DD');
      if (startDate && orderDate < startDate) return false;
      if (endDate && orderDate > endDate) return false;
      return true;
    });
    console.log('Date filtered orders:', filteredOrders.length);
  }

  // If no date range is specified, show data from all orders
  if (!startDate && !endDate && filteredOrders.length > 0) {
    // Get date range from actual data
    const dates = filteredOrders.map(order => dayjs(order.order_complete_datetime)).sort((a, b) => a.valueOf() - b.valueOf());
    const earliestDate = dates[0];
    const latestDate = dates[dates.length - 1];
    
    console.log('Data date range:', {
      earliest: earliestDate.format('YYYY-MM-DD'),
      latest: latestDate.format('YYYY-MM-DD')
    });
  }

  // Generate chart data based on time grouping
  switch (timeGrouping) {
    case 'day':
      return generateDailyData(filteredOrders, startDate, endDate);
    case 'week':
      return generateWeeklyData(filteredOrders, startDate, endDate);
    case 'month':
      return generateMonthlyData(filteredOrders, startDate, endDate);
    default:
      return generateDailyData(filteredOrders, startDate, endDate);
  }
};

/**
 * Generate daily chart data - UPDATED for Decimal128
 */
const generateDailyData = (orders, startDate, endDate) => {
  if (orders.length === 0) return [];

  console.log('Generating daily data for orders:', orders.length);

  // Determine date range
  let rangeStart, rangeEnd;
  
  if (startDate && endDate) {
    rangeStart = dayjs(startDate);
    rangeEnd = dayjs(endDate);
  } else {
    // Use data range
    const dates = orders.map(order => dayjs(order.order_complete_datetime)).sort((a, b) => a.valueOf() - b.valueOf());
    rangeStart = dates[0];
    rangeEnd = dates[dates.length - 1];
    
    // If it's the same day, extend the range to show more context
    if (rangeStart.isSame(rangeEnd, 'day')) {
      rangeStart = rangeStart.subtract(3, 'day');
      rangeEnd = rangeEnd.add(3, 'day');
    }
  }

  console.log('Date range:', {
    start: rangeStart.format('YYYY-MM-DD'),
    end: rangeEnd.format('YYYY-MM-DD')
  });

  // Generate all days in range
  const days = [];
  let currentDay = rangeStart.clone();
  
  while (currentDay.isSameOrBefore(rangeEnd, 'day')) {
    days.push({
      period: currentDay.format('MMM DD'),
      date: currentDay.format('YYYY-MM-DD'),
      amount: 0,
      count: 0
    });
    currentDay = currentDay.add(1, 'day');
  }

  console.log('Generated days:', days.length);

  // Group orders by day - UPDATED to use getOrderCost helper
  orders.forEach(order => {
    const orderDate = dayjs(order.order_complete_datetime);
    const orderDateStr = orderDate.format('YYYY-MM-DD');
    const dayData = days.find(day => day.date === orderDateStr);
    
    if (dayData) {
      const orderCost = getOrderCost(order);
      dayData.amount += orderCost;
      dayData.count += 1;
      console.log(`Added order: ${orderDateStr}, cost: ${orderCost}, new total: ${dayData.amount}`);
      console.log('Order cost details:', {
        order_id: order.order_id,
        total_order_cost: order.total_order_cost,
        order_cost: order.order_cost,
        parsed_cost: orderCost
      });
    } else {
      console.log(`No matching day found for order date: ${orderDateStr}`);
    }
  });

  // Return all days in range if date range is specified, otherwise show all days with context
  const result = days;
  
  console.log('Daily data generated:', result);
  return result;
};

/**
 * Generate weekly chart data - UPDATED for Decimal128
 */
const generateWeeklyData = (orders, startDate, endDate) => {
  if (orders.length === 0) return [];

  console.log('Generating weekly data for orders:', orders.length);

  // Group orders by week
  const weeklyData = {};
  
  orders.forEach(order => {
    const orderDate = dayjs(order.order_complete_datetime);
    const weekStart = orderDate.startOf('week');
    const weekKey = weekStart.format('YYYY-MM-DD');
    const weekLabel = `${weekStart.format('MMM DD')} - ${weekStart.endOf('week').format('MMM DD')}`;
    
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = {
        period: weekLabel,
        date: weekKey,
        amount: 0,
        count: 0
      };
    }
    
    const orderCost = getOrderCost(order);
    weeklyData[weekKey].amount += orderCost;
    weeklyData[weekKey].count += 1;
  });

  const result = Object.values(weeklyData).sort((a, b) => a.date.localeCompare(b.date));
  console.log('Weekly data generated:', result);
  return result;
};

/**
 * Generate monthly chart data - UPDATED for Decimal128
 */
const generateMonthlyData = (orders, startDate, endDate) => {
  if (orders.length === 0) return [];

  console.log('Generating monthly data for orders:', orders.length);

  // Group orders by month
  const monthlyData = {};
  
  orders.forEach(order => {
    const orderDate = dayjs(order.order_complete_datetime);
    const monthKey = orderDate.format('YYYY-MM');
    const monthLabel = orderDate.format('MMM YYYY');
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        period: monthLabel,
        date: monthKey,
        amount: 0,
        count: 0
      };
    }
    
    const orderCost = getOrderCost(order);
    monthlyData[monthKey].amount += orderCost;
    monthlyData[monthKey].count += 1;
  });

  const result = Object.values(monthlyData).sort((a, b) => a.date.localeCompare(b.date));
  console.log('Monthly data generated:', result);
  return result;
};

/**
 * Get chart configuration based on time grouping
 */
export const getOrdersOverTimeConfig = (timeGrouping = 'day') => {
  const configs = {
    day: {
      title: 'Orders Over Time (Daily)',
      xAxisLabel: 'Day',
      yAxisLabel: 'Revenue ($)',
      tooltipLabel: 'Daily Revenue'
    },
    week: {
      title: 'Orders Over Time (Weekly)',
      xAxisLabel: 'Week',
      yAxisLabel: 'Revenue ($)',
      tooltipLabel: 'Weekly Revenue'
    },
    month: {
      title: 'Orders Over Time (Monthly)',
      xAxisLabel: 'Month',
      yAxisLabel: 'Revenue ($)',
      tooltipLabel: 'Monthly Revenue'
    }
  };
  
  return configs[timeGrouping] || configs.day;
};
