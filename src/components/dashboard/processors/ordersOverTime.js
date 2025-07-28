// ===== ENHANCED ordersOverTime.js with Year and Hour Support =====

import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(isSameOrBefore);
dayjs.extend(utc);
dayjs.extend(timezone);

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

// Helper function to safely get donation amount
const getDonationAmount = (donation) => {
  // Try different possible field names for donation amounts
  const amountField = donation.donation_amt || donation.amount || donation.donation_amount || donation.value;
  
  // Handle Decimal128 format from MongoDB
  if (amountField && typeof amountField === 'object' && amountField.$numberDecimal) {
    return parseFloat(amountField.$numberDecimal) || 0;
  }
  
  // Handle regular number
  const numAmount = Number(amountField);
  return isNaN(numAmount) ? 0 : numAmount;
};

/**
 * Process data over time to generate time-based chart data
 * @param {Array} data - Array of order/donation objects
 * @param {string} startDate - Start date filter (YYYY-MM-DD format)
 * @param {string} endDate - End date filter (YYYY-MM-DD format)
 * @param {string} timeGrouping - Time grouping ('hour', 'day', 'week', 'month', 'year')
 * @param {string} dataType - Type of data ('orders' or 'donations')
 * @param {string} timezone - Timezone for processing (default: 'Asia/Singapore')
 * @returns {Array} Processed chart data
 */
export const processDataOverTime = (data = [], startDate = '', endDate = '', timeGrouping = 'day', dataType = 'orders', timezone = 'Asia/Singapore') => {
  console.log('processDataOverTime called with:', {
    dataCount: data.length,
    startDate,
    endDate,
    timeGrouping,
    dataType,
    timezone
  });

  // Ensure data is an array
  const dataArr = Array.isArray(data) ? data : [];
  
  // Determine the date field based on data type
  const getDateField = (item) => {
    if (dataType === 'donations') {
      return item.donation_datetime || item.created_at || item.date;
    }
    return item.order_complete_datetime || item.created_at || item.date;
  };

  // Determine the value extraction function
  const getValue = dataType === 'donations' ? getDonationAmount : getOrderCost;
  
  // Filter data with valid dates first
  const validData = dataArr.filter(item => {
    const dateField = getDateField(item);
    if (!dateField) {
      console.log(`${dataType} missing date:`, item);
      return false;
    }
    
    const itemDate = dayjs(dateField).tz(timezone);
    if (!itemDate.isValid()) {
      console.log('Invalid date:', dateField);
      return false;
    }
    
    return true;
  });

  console.log('Valid data items:', validData.length);

  // Apply date range filter if specified
  let filteredData = validData;
  if (startDate || endDate) {
    filteredData = validData.filter(item => {
      const itemDate = dayjs(getDateField(item)).tz(timezone).format('YYYY-MM-DD');
      if (startDate && itemDate < startDate) return false;
      if (endDate && itemDate > endDate) return false;
      return true;
    });
    console.log('Date filtered data:', filteredData.length);
  }

  // If no date range is specified, show data from all items
  if (!startDate && !endDate && filteredData.length > 0) {
    // Get date range from actual data
    const dates = filteredData
      .map(item => dayjs(getDateField(item)).tz(timezone))
      .sort((a, b) => a.valueOf() - b.valueOf());
    const earliestDate = dates[0];
    const latestDate = dates[dates.length - 1];
    
    console.log('Data date range:', {
      earliest: earliestDate.format('YYYY-MM-DD HH:mm'),
      latest: latestDate.format('YYYY-MM-DD HH:mm')
    });
  }

  // Generate chart data based on time grouping
  switch (timeGrouping) {
    case 'hour':
      return generateHourlyData(filteredData, startDate, endDate, getDateField, getValue, timezone);
    case 'day':
      return generateDailyData(filteredData, startDate, endDate, getDateField, getValue, timezone);
    case 'week':
      return generateWeeklyData(filteredData, startDate, endDate, getDateField, getValue, timezone);
    case 'month':
      return generateMonthlyData(filteredData, startDate, endDate, getDateField, getValue, timezone);
    case 'year':
      return generateYearlyData(filteredData, startDate, endDate, getDateField, getValue, timezone);
    default:
      return generateDailyData(filteredData, startDate, endDate, getDateField, getValue, timezone);
  }
};

/**
 * Generate hourly chart data
 */
const generateHourlyData = (data, startDate, endDate, getDateField, getValue, timezone) => {
  if (data.length === 0) return [];

  console.log('Generating hourly data for items:', data.length);

  // Determine date range (limit to 7 days max for hourly view to avoid too many data points)
  let rangeStart, rangeEnd;
  
  if (startDate && endDate) {
    rangeStart = dayjs(startDate).tz(timezone);
    rangeEnd = dayjs(endDate).tz(timezone);
    
    // Limit to 7 days for hourly view
    if (rangeEnd.diff(rangeStart, 'day') > 7) {
      rangeEnd = rangeStart.add(7, 'day');
      console.log('Limited hourly view to 7 days');
    }
  } else {
    // Use data range but limit to recent 3 days
    const dates = data
      .map(item => dayjs(getDateField(item)).tz(timezone))
      .sort((a, b) => a.valueOf() - b.valueOf());
    rangeStart = dates[dates.length - 1].subtract(2, 'day').startOf('day');
    rangeEnd = dates[dates.length - 1].endOf('day');
  }

  console.log('Hour range:', {
    start: rangeStart.format('YYYY-MM-DD HH:mm'),
    end: rangeEnd.format('YYYY-MM-DD HH:mm')
  });

  // Generate all hours in range
  const hours = [];
  let currentHour = rangeStart.clone().startOf('hour');
  
  while (currentHour.isSameOrBefore(rangeEnd, 'hour')) {
    hours.push({
      period: currentHour.format('MMM DD HH:mm'),
      date: currentHour.format('YYYY-MM-DD HH:mm'),
      amount: 0,
      count: 0
    });
    currentHour = currentHour.add(1, 'hour');
  }

  console.log('Generated hours:', hours.length);

  // Group data by hour
  data.forEach(item => {
    const itemDate = dayjs(getDateField(item)).tz(timezone);
    const hourKey = itemDate.startOf('hour').format('YYYY-MM-DD HH:mm');
    const hourData = hours.find(hour => hour.date === hourKey);
    
    if (hourData) {
      const itemValue = getValue(item);
      hourData.amount += itemValue;
      hourData.count += 1;
      console.log(`Added item: ${hourKey}, value: ${itemValue}, new total: ${hourData.amount}`);
    }
  });

  console.log('Hourly data generated:', hours);
  return hours;
};

/**
 * Generate daily chart data
 */
const generateDailyData = (data, startDate, endDate, getDateField, getValue, timezone) => {
  if (data.length === 0) return [];

  console.log('Generating daily data for items:', data.length);

  // Determine date range
  let rangeStart, rangeEnd;
  
  if (startDate && endDate) {
    rangeStart = dayjs(startDate).tz(timezone);
    rangeEnd = dayjs(endDate).tz(timezone);
  } else {
    // Use data range
    const dates = data
      .map(item => dayjs(getDateField(item)).tz(timezone))
      .sort((a, b) => a.valueOf() - b.valueOf());
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

  // Group data by day
  data.forEach(item => {
    const itemDate = dayjs(getDateField(item)).tz(timezone);
    const dateStr = itemDate.format('YYYY-MM-DD');
    const dayData = days.find(day => day.date === dateStr);
    
    if (dayData) {
      const itemValue = getValue(item);
      dayData.amount += itemValue;
      dayData.count += 1;
      console.log(`Added item: ${dateStr}, value: ${itemValue}, new total: ${dayData.amount}`);
    }
  });

  console.log('Daily data generated:', days);
  return days;
};

/**
 * Generate weekly chart data
 */
const generateWeeklyData = (data, startDate, endDate, getDateField, getValue, timezone) => {
  if (data.length === 0) return [];

  console.log('Generating weekly data for items:', data.length);

  // Group data by week
  const weeklyData = {};
  
  data.forEach(item => {
    const itemDate = dayjs(getDateField(item)).tz(timezone);
    const weekStart = itemDate.startOf('week');
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
    
    const itemValue = getValue(item);
    weeklyData[weekKey].amount += itemValue;
    weeklyData[weekKey].count += 1;
  });

  const result = Object.values(weeklyData).sort((a, b) => a.date.localeCompare(b.date));
  console.log('Weekly data generated:', result);
  return result;
};

/**
 * Generate monthly chart data
 */
const generateMonthlyData = (data, startDate, endDate, getDateField, getValue, timezone) => {
  if (data.length === 0) return [];

  console.log('Generating monthly data for items:', data.length);

  // Group data by month
  const monthlyData = {};
  
  data.forEach(item => {
    const itemDate = dayjs(getDateField(item)).tz(timezone);
    const monthKey = itemDate.format('YYYY-MM');
    const monthLabel = itemDate.format('MMM YYYY');
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        period: monthLabel,
        date: monthKey,
        amount: 0,
        count: 0
      };
    }
    
    const itemValue = getValue(item);
    monthlyData[monthKey].amount += itemValue;
    monthlyData[monthKey].count += 1;
  });

  const result = Object.values(monthlyData).sort((a, b) => a.date.localeCompare(b.date));
  console.log('Monthly data generated:', result);
  return result;
};

/**
 * Generate yearly chart data
 */
const generateYearlyData = (data, startDate, endDate, getDateField, getValue, timezone) => {
  if (data.length === 0) return [];

  console.log('Generating yearly data for items:', data.length);

  // Group data by year
  const yearlyData = {};
  
  data.forEach(item => {
    const itemDate = dayjs(getDateField(item)).tz(timezone);
    const yearKey = itemDate.format('YYYY');
    const yearLabel = yearKey;
    
    if (!yearlyData[yearKey]) {
      yearlyData[yearKey] = {
        period: yearLabel,
        date: yearKey,
        amount: 0,
        count: 0
      };
    }
    
    const itemValue = getValue(item);
    yearlyData[yearKey].amount += itemValue;
    yearlyData[yearKey].count += 1;
  });

  const result = Object.values(yearlyData).sort((a, b) => a.date.localeCompare(b.date));
  console.log('Yearly data generated:', result);
  return result;
};

/**
 * Get chart configuration based on time grouping and data type
 */
export const getDataOverTimeConfig = (timeGrouping = 'day', dataType = 'orders') => {
  const isOrders = dataType === 'orders';
  const dataTypeName = isOrders ? 'Orders' : 'Donations';
  const yAxisLabel = isOrders ? 'Revenue ($)' : 'Donation Amount ($)';
  
  const configs = {
    hour: {
      title: `${dataTypeName} Over Time (Hourly)`,
      xAxisLabel: 'Hour',
      yAxisLabel,
      tooltipLabel: `Hourly ${isOrders ? 'Revenue' : 'Donations'}`
    },
    day: {
      title: `${dataTypeName} Over Time (Daily)`,
      xAxisLabel: 'Day',
      yAxisLabel,
      tooltipLabel: `Daily ${isOrders ? 'Revenue' : 'Donations'}`
    },
    week: {
      title: `${dataTypeName} Over Time (Weekly)`,
      xAxisLabel: 'Week',
      yAxisLabel,
      tooltipLabel: `Weekly ${isOrders ? 'Revenue' : 'Donations'}`
    },
    month: {
      title: `${dataTypeName} Over Time (Monthly)`,
      xAxisLabel: 'Month',
      yAxisLabel,
      tooltipLabel: `Monthly ${isOrders ? 'Revenue' : 'Donations'}`
    },
    year: {
      title: `${dataTypeName} Over Time (Yearly)`,
      xAxisLabel: 'Year',
      yAxisLabel,
      tooltipLabel: `Yearly ${isOrders ? 'Revenue' : 'Donations'}`
    }
  };
  
  return configs[timeGrouping] || configs.day;
};

// Backward compatibility exports
export const processOrdersOverTime = (orders, startDate, endDate, timeGrouping) => {
  return processDataOverTime(orders, startDate, endDate, timeGrouping, 'orders');
};

export const getOrdersOverTimeConfig = (timeGrouping) => {
  return getDataOverTimeConfig(timeGrouping, 'orders');
};