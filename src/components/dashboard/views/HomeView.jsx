import { useEffect, useState } from 'react';
import { DollarSign, Users, MapPin, Heart, Calendar, Clock, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import { getAllDonations, getAllOrders, getAllUsers } from '../processors/getProcessor.js';
import { processOrdersOverTime, getOrdersOverTimeConfig } from '../processors/ordersOverTime.js';
import dayjs from 'dayjs';
import { chartConfig, ChartGradients, ChartControlsSelector} from '../processors/chartProcessor.js'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

// Extend dayjs with the plugins
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const HomeView = () => {
  const [donations, setDonations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Enhanced dynamic states with better hour/year handling
  const [screenSize, setScreenSize] = useState('medium');
  const [timeGrouping, setTimeGrouping] = useState('day');
  const [topMerchantsLimit, setTopMerchantsLimit] = useState(5);

  // New state for smart date range suggestions
  const [suggestedDateRange, setSuggestedDateRange] = useState({ start: '', end: '' });

  // Enhanced time grouping options with better descriptions
  const timeGroupingOptions = [
    { value: 'hour', label: 'Hourly', icon: Clock, description: 'Last 3 days by hour' },
    { value: 'day', label: 'Daily', icon: Calendar, description: 'Day by day view' },
    { value: 'week', label: 'Weekly', icon: TrendingUp, description: 'Week by week view' },
    { value: 'month', label: 'Monthly', icon: Calendar, description: 'Month by month view' },
    { value: 'year', label: 'Yearly', icon: TrendingUp, description: 'Year by year view' }
  ];

  // Smart date range calculation based on time grouping
  useEffect(() => {
    const now = dayjs();
    let suggestedStart = '';
    let suggestedEnd = '';

    switch (timeGrouping) {
      case 'hour':
        // For hourly: suggest last 2-3 days to avoid too many data points
        suggestedStart = now.subtract(2, 'day').format('YYYY-MM-DD');
        suggestedEnd = now.format('YYYY-MM-DD');
        break;
      case 'day':
        // For daily: suggest last 30 days
        suggestedStart = now.subtract(30, 'day').format('YYYY-MM-DD');
        suggestedEnd = now.format('YYYY-MM-DD');
        break;
      case 'week':
        // For weekly: suggest last 12 weeks (3 months)
        suggestedStart = now.subtract(12, 'week').format('YYYY-MM-DD');
        suggestedEnd = now.format('YYYY-MM-DD');
        break;
      case 'month':
        // For monthly: suggest last 12 months
        suggestedStart = now.subtract(12, 'month').format('YYYY-MM-DD');
        suggestedEnd = now.format('YYYY-MM-DD');
        break;
      case 'year':
        // For yearly: suggest last 5 years or all available data
        suggestedStart = now.subtract(5, 'year').format('YYYY-MM-DD');
        suggestedEnd = now.format('YYYY-MM-DD');
        break;
      default:
        suggestedStart = now.subtract(30, 'day').format('YYYY-MM-DD');
        suggestedEnd = now.format('YYYY-MM-DD');
    }

    setSuggestedDateRange({ start: suggestedStart, end: suggestedEnd });

    // Auto-apply suggested dates if no dates are currently set
    if (!startDate && !endDate) {
      setStartDate(suggestedStart);
      setEndDate(suggestedEnd);
    }
  }, [timeGrouping]);

  // Responsive chart height hook
  useEffect(() => {
    /* Resizer */ 
    const handleResize = () => {
      if (window.innerWidth < 768) setScreenSize('small');
      else if (window.innerWidth < 1024) setScreenSize('medium');
      else setScreenSize('large');
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    /* getProcessor */
    getAllDonations()
      .then(res => {
        const data = Array.isArray(res)
          ? res
          : (res.result && Array.isArray(res.result.data) ? res.result.data : []);
        setDonations(data);
      })
      .catch(error => {
        setDonations([]);
    });
    
    getAllOrders()
      .then(res => {
        const data = Array.isArray(res)
        ? res
        : (res.result && Array.isArray(res.result.data) ? res.result.data : []);
      setOrders(data);
    });
    
    getAllUsers().then(res => {
      const data = Array.isArray(res)
        ? res
        : (res.result && Array.isArray(res.result.data) ? res.result.data : []);
      setUsers(data);
    });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Enhanced chart height calculation based on time grouping
  const getChartHeight = () => {
    const baseHeight = chartConfig.chartHeights[screenSize];
    
    // Adjust height based on time grouping for better visibility
    switch (timeGrouping) {
      case 'hour':
        return Math.max(baseHeight, 350); // Taller for hourly data
      case 'year':
        return Math.max(baseHeight, 300); // Good height for yearly overview
      default:
        return baseHeight;
    }
  };

  // Defensive: Only reduce if array
  const donationsArr = Array.isArray(donations) ? donations : [];
  const ordersArr = Array.isArray(orders) ? orders : [];
  const usersArr = Array.isArray(users) ? users : [];

  // Enhanced calculation with multiple field checks and proper Decimal128 handling
  const totalDonations = donationsArr.reduce((sum, donation) => {
    // Try different possible field names for amount
    let amount = donation.donation_amt || donation.amount || donation.donation_amount || donation.value || 0;
    
    // Handle MongoDB Decimal128 format
    if (amount && typeof amount === 'object' && amount.$numberDecimal) {
      amount = parseFloat(amount.$numberDecimal); // Actually use the parsed value!
    } else {
      amount = Number(amount) || 0; // Convert to number for other formats
    }

    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  // Also fix the DSGD donations calculation
  const totalDsgdDonations = donationsArr.reduce((sum, donation) => {
    let dsgdAmount = donation.donation_dsgd_amt || donation.dsgd_amount || donation.donation_dsgd || 0;
    
    // Handle MongoDB Decimal128 format
    if (dsgdAmount && typeof dsgdAmount === 'object' && dsgdAmount.$numberDecimal) {
      dsgdAmount = parseFloat(dsgdAmount.$numberDecimal);
    } else {
      dsgdAmount = Number(dsgdAmount) || 0;
    }
    
    return sum + (isNaN(dsgdAmount) ? 0 : dsgdAmount);
  }, 0);

  // Calculate unique merchants count
  const uniqueMerchants = [...new Set(ordersArr.map(order => order.merchant_name).filter(Boolean))];

  // Filter orders by date range
  const filteredOrders = ordersArr.filter(order => {
    if (!order.order_complete_datetime) return false;
    const orderDate = dayjs(order.order_complete_datetime).format('YYYY-MM-DD');
    if (startDate && orderDate < startDate) return false;
    if (endDate && orderDate > endDate) return false;
    return true;
  });

// Enhanced donation trend calculation - always compares this week vs last week
const calculateDonationTrend = () => {
  if (donationsArr.length === 0) return "+0%";
  
  const now = dayjs();
  
  // Get current week boundaries (Sunday to Saturday)
  const currentWeekStart = now.startOf('week');
  const currentWeekEnd = now.endOf('week');
  
  // Get previous week boundaries
  const previousWeekStart = now.subtract(1, 'week').startOf('week');
  const previousWeekEnd = now.subtract(1, 'week').endOf('week');
  
  console.log('Week boundaries:', {
    currentWeek: `${currentWeekStart.format('YYYY-MM-DD dddd')} to ${currentWeekEnd.format('YYYY-MM-DD dddd')}`,
    previousWeek: `${previousWeekStart.format('YYYY-MM-DD dddd')} to ${previousWeekEnd.format('YYYY-MM-DD dddd')}`
  });
  
  // Filter donations for current week
  const currentWeekDonations = donationsArr.filter(donation => {
    const dateField = donation.donation_datetime;
    if (!dateField) return false;
    
    const donationDate = dayjs(dateField);
    const isInCurrentWeek = donationDate.isSameOrAfter(currentWeekStart, 'day') && 
                           donationDate.isSameOrBefore(currentWeekEnd, 'day');
    
    if (isInCurrentWeek) {
      console.log('Current week donation:', {
        date: donationDate.format('YYYY-MM-DD dddd'),
        amount: donation.donation_amt
      });
    }
    
    return isInCurrentWeek;
  });
  
  // Filter donations for previous week  
  const previousWeekDonations = donationsArr.filter(donation => {
    const dateField = donation.donation_datetime;
    if (!dateField) return false;
    
    const donationDate = dayjs(dateField);
    const isInPreviousWeek = donationDate.isSameOrAfter(previousWeekStart, 'day') && 
                            donationDate.isSameOrBefore(previousWeekEnd, 'day');
    
    if (isInPreviousWeek) {
      console.log('Previous week donation:', {
        date: donationDate.format('YYYY-MM-DD dddd'),
        amount: donation.donation_amt
      });
    }
    
    return isInPreviousWeek;
  });
  
  // Calculate totals with proper Decimal128 handling
  const calculateTotal = (donations) => donations.reduce((sum, d) => {
    let amount = d.donation_amt || d.amount || d.donation_amount || d.value || 0;
    
    if (amount && typeof amount === 'object' && amount.$numberDecimal) {
      amount = parseFloat(amount.$numberDecimal);
    } else {
      amount = Number(amount) || 0;
    }
    
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  const currentTotal = calculateTotal(currentWeekDonations);
  const previousTotal = calculateTotal(previousWeekDonations);
  
  // Debug: Show sample donation dates to understand the data
  if (donationsArr.length > 0) {
    console.log('Sample donation dates from data:', donationsArr.slice(0, 5).map(d => ({
      date: d.donation_datetime,
      formatted: dayjs(d.donation_datetime).format('YYYY-MM-DD dddd'),
      amount: d.donation_amt
    })));
  }
  
  console.log('Trend calculation results:', {
    currentWeek: `${currentWeekStart.format('YYYY-MM-DD')} to ${currentWeekEnd.format('YYYY-MM-DD')}`,
    previousWeek: `${previousWeekStart.format('YYYY-MM-DD')} to ${previousWeekEnd.format('YYYY-MM-DD')}`,
    currentWeekDonations: currentWeekDonations.length,
    currentTotal: currentTotal.toFixed(2),
    previousWeekDonations: previousWeekDonations.length,
    previousTotal: previousTotal.toFixed(2),
    totalDonationsInData: donationsArr.length
  });
  
  // Calculate percentage change
  if (previousTotal === 0) {
    return currentTotal > 0 ? "+100%" : "+0%";
  }
  
  const percentChange = ((currentTotal - previousTotal) / previousTotal * 100).toFixed(1);
  
  return `${percentChange >= 0 ? '+' : ''}${percentChange}% from last week`;
};

  // UPDATED: Use the new processor for orders over time (pass all orders, not filtered)
  const ordersOverTimeData = processOrdersOverTime(ordersArr, startDate, endDate, timeGrouping);
  const ordersOverTimeConfig = getOrdersOverTimeConfig(timeGrouping);

  // Add this helper function at the top of your HomeView component
  const extractCost = (costField) => {
    if (costField && typeof costField === 'object' && costField.$numberDecimal) {
      return parseFloat(costField.$numberDecimal);
    }
    return Number(costField) || 0;
  };

  // Orders by Merchant (Bar Chart) - FIXED VERSION
  const ordersByMerchantData = filteredOrders
    .reduce((acc, order) => {
      const merchantName = order.merchant_name;
      if (!merchantName) return acc; // Skip orders without merchant name
      
      const found = acc.find(item => item.name === merchantName);
      const cost = extractCost(order.order_cost);
      
      if (found) {
        found.value += cost;
      } else {
        acc.push({ name: merchantName, value: cost });
      }
      return acc;
    }, [])
    .sort((a, b) => b.value - a.value); // Sort by revenue in descending order

  // UPDATED: Dynamic Top Merchants by Sales (Bar Chart)
  const topMerchantsData = Array.isArray(ordersByMerchantData)
    ? [...ordersByMerchantData]
        .sort((a, b) => b.value - a.value)
        .slice(0, topMerchantsLimit === -1 ? ordersByMerchantData.length : topMerchantsLimit)
    : [];

  // UPDATED: Dynamic User Gender Distribution (Pie Chart)
  const genderTypes = ['Male', 'Female', 'Other', 'Prefer not to say', 'Non-binary'];
  const genderCounts = genderTypes.reduce((acc, gender) => {
    const count = usersArr.filter(u => u.user_gender === gender).length;
    if (count > 0) {
      acc.push({
        name: gender,
        value: count,
        color: chartConfig.pieColors[acc.length] || chartConfig.pieColors[0]
      });
    }
    return acc;
  }, []);

  // Handle any remaining gender types not in the predefined list
  const handledGenders = genderTypes;
  const otherGenders = usersArr.filter(u => 
    u.user_gender && !handledGenders.includes(u.user_gender)
  );

  if (otherGenders.length > 0) {
    const otherTypes = [...new Set(otherGenders.map(u => u.user_gender))];
    otherTypes.forEach((gender, index) => {
      const count = usersArr.filter(u => u.user_gender === gender).length;
      genderCounts.push({
        name: gender,
        value: count,
        color: chartConfig.pieColors[(genderCounts.length + index) % chartConfig.pieColors.length]
      });
    });
  }

  const pieData = genderCounts;

  // Quick date range buttons for different time groupings
  const getQuickDateRanges = () => {
    const now = dayjs();
    const ranges = [];

    switch (timeGrouping) {
      case 'hour':
        ranges.push(
          { label: 'Last 6 Hours', start: now.subtract(6, 'hour').format('YYYY-MM-DD'), end: now.format('YYYY-MM-DD') },
          { label: 'Last 24 Hours', start: now.subtract(1, 'day').format('YYYY-MM-DD'), end: now.format('YYYY-MM-DD') },
          { label: 'Last 3 Days', start: now.subtract(3, 'day').format('YYYY-MM-DD'), end: now.format('YYYY-MM-DD') }
        );
        break;
      case 'year':
        ranges.push(
          { label: 'Last 2 Years', start: now.subtract(2, 'year').format('YYYY-MM-DD'), end: now.format('YYYY-MM-DD') },
          { label: 'Last 5 Years', start: now.subtract(5, 'year').format('YYYY-MM-DD'), end: now.format('YYYY-MM-DD') },
          { label: 'All Time', start: '2020-01-01', end: now.format('YYYY-MM-DD') }
        );
        break;
      default:
        ranges.push(
          { label: 'Last 30 Days', start: now.subtract(30, 'day').format('YYYY-MM-DD'), end: now.format('YYYY-MM-DD') },
          { label: 'Last 90 Days', start: now.subtract(90, 'day').format('YYYY-MM-DD'), end: now.format('YYYY-MM-DD') },
          { label: 'This Year', start: now.startOf('year').format('YYYY-MM-DD'), end: now.format('YYYY-MM-DD') }
        );
    }

    return ranges;
  };

  console.log('=== DEBUGGING CHART DATA ===');
  console.log('ordersByMerchantData:', ordersByMerchantData);
  console.log('Length:', ordersByMerchantData.length);
  if (ordersByMerchantData.length > 0) {
    console.log('Max value:', Math.max(...ordersByMerchantData.map(d => d.value)));
    console.log('Sample items:', ordersByMerchantData.slice(0, 3));
  }

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-50 min-h-screen">
      {/* Total Donations Card - Enhanced with time-aware trend */}
      <div className="mb-8">
        <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-emerald-500 to-blue-600" style={{ minHeight: '200px' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="relative p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/80 text-lg font-medium mb-4">Total Donations</p>
                <p className="text-5xl font-bold text-white mb-4">
                  ${totalDonations.toLocaleString()}
                </p>
                <p className="text-green-200 text-lg">{calculateDonationTrend()}</p>
              </div>
              <div className="p-4 rounded-xl text-emerald-400 bg-white/20 backdrop-blur-sm">
                <DollarSign size={40} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Other Stats Cards - Now Dynamic */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={usersArr.length}
          trend="-0.5% from last week"
          icon={Users}
          bgGradient="bg-gradient-to-br from-blue-500 to-purple-600"
          iconColor="text-blue-400"
        />
        <StatCard
          title="Active Merchants"
          value={uniqueMerchants.length}
          subtitle="SIT Foodgle Hub"
          icon={MapPin}
          bgGradient="bg-gradient-to-br from-purple-500 to-red-500"
          iconColor="text-purple-400"
        />
        <StatCard
          title="Total Donations Count"
          value={donationsArr.length}
          subtitle={`${totalDsgdDonations.toLocaleString()} DSGD`}
          icon={Heart}
          bgGradient="bg-gradient-to-br from-red-500 to-orange-500"
          iconColor="text-red-400"
        />
      </div>

      {/* Enhanced Date Range Filter with Time Grouping Awareness */}
      <div className="mb-6 bg-white rounded-2xl shadow-sm p-6">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-gray-500" />
            <span className="text-gray-700 font-medium">Date Range:</span>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2 ml-8">
            <MapPin size={20} className="text-gray-500" />
            <span className="text-gray-700 font-medium">Location:</span>
            <select className="w-48 px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow focus:ring-2 focus:ring-purple-500 focus:border-transparent">
              <option>All Locations</option>
              {uniqueMerchants.map(merchant => (
                <option key={merchant} value={merchant}>{merchant}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Quick Date Range Buttons */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600 flex items-center mr-4">Quick select:</span>
          {getQuickDateRanges().map((range, index) => (
            <button
              key={index}
              onClick={() => {
                setStartDate(range.start);
                setEndDate(range.end);
              }}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {range.label}
            </button>
          ))}
        </div>
        
        {/* Time Grouping Hint */}
        {timeGrouping === 'hour' && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              💡 <strong>Hourly View:</strong> Best for analyzing recent activity. Limited to 7 days maximum for optimal performance.
            </p>
          </div>
        )}
        {timeGrouping === 'year' && (
          <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-700">
              📊 <strong>Yearly View:</strong> Perfect for long-term trend analysis. Shows annual patterns and growth over time.
            </p>
          </div>
        )}
      </div>

      {/* Enhanced Chart Controls Selector */}
      <ChartControlsSelector 
        timeGrouping={timeGrouping}
        setTimeGrouping={setTimeGrouping}
        topMerchantsLimit={topMerchantsLimit}
        setTopMerchantsLimit={setTopMerchantsLimit}
      />

      {/* Charts: Enhanced Orders Over Time and Orders by Merchant */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <ChartCard 
          title={ordersOverTimeConfig.title}
          subtitle={timeGrouping === 'hour' ? 'Real-time activity tracking' : timeGrouping === 'year' ? 'Long-term growth analysis' : ''}
        >
          <ResponsiveContainer width="100%" height={getChartHeight()}>
            <LineChart data={ordersOverTimeData}>
              <XAxis 
                dataKey="period" 
                tick={{ fontSize: 12 }} 
                angle={timeGrouping === 'hour' ? -45 : 0}
                textAnchor={timeGrouping === 'hour' ? 'end' : 'middle'}
                height={timeGrouping === 'hour' ? 80 : 60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: 'none', 
                  borderRadius: '12px', 
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' 
                }}
                formatter={(value, name) => [
                  `$${value.toLocaleString()}`, 
                  ordersOverTimeConfig.tooltipLabel
                ]}
                labelFormatter={(label) => `${ordersOverTimeConfig.xAxisLabel}: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke={timeGrouping === 'hour' ? '#ef4444' : timeGrouping === 'year' ? '#8b5cf6' : '#6366f1'} 
                strokeWidth={timeGrouping === 'year' ? 4 : 3} 
                dot={{ 
                  fill: timeGrouping === 'hour' ? '#ef4444' : timeGrouping === 'year' ? '#8b5cf6' : '#6366f1', 
                  strokeWidth: 2, 
                  r: timeGrouping === 'year' ? 8 : 6 
                }}
                activeDot={{ 
                  r: timeGrouping === 'year' ? 10 : 8, 
                  stroke: timeGrouping === 'hour' ? '#ef4444' : timeGrouping === 'year' ? '#8b5cf6' : '#6366f1', 
                  strokeWidth: 2 
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Orders by Merchant">
          <div style={{ width: '100%', height: `${getChartHeight()}px` }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={ordersByMerchantData} 
                layout="vertical" 
                margin={{ right: 35}}
              >
                <XAxis 
                  type="number" 
                  tick={{ fontSize: 12 }} 
                  domain={[0, (dataMax) => Math.ceil(dataMax * 1.05)]}
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={120} 
                  tick={{ fontSize: 10 }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: 'none', 
                    borderRadius: '12px', 
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' 
                  }}
                  formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
                />
                <Bar 
                  dataKey="value" 
                  fill="#8884d8"
                  radius={[0, 4, 4, 0]}
                  minPointSize={3}
                />
                <ChartGradients />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Charts: Top 5 Merchant by Sales / User Gender Distribution */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <ChartCard title={`Top ${topMerchantsLimit === -1 ? 'All' : topMerchantsLimit} Merchants by Sales`}>
          <div style={{ width: '100%', height: `${getChartHeight()}px` }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topMerchantsData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: 'none', 
                    borderRadius: '12px', 
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' 
                  }}
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="value" fill="#241e8bff" radius={[0, 8, 8, 0]} />
                <ChartGradients />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="User Gender Distribution">
          <ResponsiveContainer width="100%" height={getChartHeight()}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={120}
                innerRadius={60}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: 'none', 
                  borderRadius: '12px', 
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' 
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};

export default HomeView;