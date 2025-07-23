import { useEffect, useState } from 'react';
import { DollarSign, Users, MapPin, Heart, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import { getAllDonations, getAllOrders, getAllUsers } from '../processors/getProcessor.js';
import { processOrdersOverTime, getOrdersOverTimeConfig } from '../processors/ordersOverTime.js';
import dayjs from 'dayjs';
import { chartConfig, ChartGradients, ChartControlsSelector} from '../processors/chartProcessor.js'

const HomeView = () => {
  const [donations, setDonations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // New dynamic states
  const [screenSize, setScreenSize] = useState('medium');
  const [timeGrouping, setTimeGrouping] = useState('day');
  const [topMerchantsLimit, setTopMerchantsLimit] = useState(5);

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
  const getChartHeight = () => chartConfig.chartHeights[screenSize];

  // Defensive: Only reduce if array
  const donationsArr = Array.isArray(donations) ? donations : [];
  const ordersArr = Array.isArray(orders) ? orders : [];
  const usersArr = Array.isArray(users) ? users : [];

  // Enhanced calculation with multiple field checks and debugging
  const totalDonations = donationsArr.reduce((sum, donation) => {
    // Try different possible field names for amount
    const amount = donation.donation_amt || donation.amount || donation.donation_amount || donation.value || 0;
    const numAmount = Number(amount);
    
    return sum + (isNaN(numAmount) ? 0 : numAmount);
  }, 0);

  // Add debugging for the total
  console.log('Final total donations:', totalDonations);
  console.log('Number of donations processed:', donationsArr.length);

  // Calculate total DSGD donations with enhanced field checking
  const totalDsgdDonations = donationsArr.reduce((sum, donation) => {
    const dsgdAmount = donation.donation_dsgd_amt || donation.dsgd_amount || donation.donation_dsgd || 0;
    const numDsgdAmount = Number(dsgdAmount);
    return sum + (isNaN(numDsgdAmount) ? 0 : numDsgdAmount);
  }, 0);

  // Calculate unique merchants count
  const uniqueMerchants = [...new Set(ordersArr.map(order => order.merchant_name).filter(Boolean))];
/*
  // Donation analytics with enhanced field checking
  const donationsByType = donationsArr.reduce((acc, donation) => {
    const type = donation.donation_type || 'Unknown';
    const amount = donation.donation_amt || donation.amount || donation.donation_amount || donation.value || 0;
    const numAmount = Number(amount);
    acc[type] = (acc[type] || 0) + (isNaN(numAmount) ? 0 : numAmount);
    return acc;
  }, {});

  const donationsByCause = donationsArr.reduce((acc, donation) => {
    const cause = donation.donation_cause || 'Unknown';
    const amount = donation.donation_amt || donation.amount || donation.donation_amount || donation.value || 0;
    const numAmount = Number(amount);
    acc[cause] = (acc[cause] || 0) + (isNaN(numAmount) ? 0 : numAmount);
    return acc;
  }, {});

  const completedDonations = donationsArr.filter(d => d.donation_status === 'completed').length;
  const pendingDonations = donationsArr.filter(d => d.donation_status !== 'completed').length;
*/
  // Filter orders by date range
  const filteredOrders = ordersArr.filter(order => {
    if (!order.order_complete_datetime) return false;
    const orderDate = dayjs(order.order_complete_datetime).format('YYYY-MM-DD');
    if (startDate && orderDate < startDate) return false;
    if (endDate && orderDate > endDate) return false;
    return true;
  });

// =========================
// top padding - Donation Trend
// =========================
const calculateDonationTrend = () => {
  if (donationsArr.length === 0) return "+0%";
  
  // Get current date in SGT (GMT+8)
  const now = new Date();
  const currentSGT = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  
  // Calculate date ranges for this week and last week
  // This week: July 17-23, 2025
  // Last week: July 10-16, 2025
  const thisWeekStart = new Date('2025-07-17T00:00:00+08:00');
  const thisWeekEnd = new Date('2025-07-23T23:59:59+08:00');
  const lastWeekStart = new Date('2025-07-10T00:00:00+08:00');
  const lastWeekEnd = new Date('2025-07-16T23:59:59+08:00');
  
  console.log('Date ranges:');
  console.log('This week:', thisWeekStart, 'to', thisWeekEnd);
  console.log('Last week:', lastWeekStart, 'to', lastWeekEnd);
  
  // Filter donations for this week
  const thisWeekDonations = donationsArr.filter(donation => {
    const dateField = donation.donation_datetime;
    if (!dateField) return false;
    
    // Parse the donation date
    const donationDate = new Date(dateField);
    
    console.log('Checking donation:', {
      original_date: dateField,
      parsed_date: donationDate,
      is_this_week: donationDate >= thisWeekStart && donationDate <= thisWeekEnd
    });
    
    return donationDate >= thisWeekStart && donationDate <= thisWeekEnd;
  });
  
  // Filter donations for last week  
  const lastWeekDonations = donationsArr.filter(donation => {
    const dateField = donation.donation_datetime;
    if (!dateField) return false;
    
    const donationDate = new Date(dateField);
    
    console.log('Checking donation for last week:', {
      original_date: dateField,
      parsed_date: donationDate,
      is_last_week: donationDate >= lastWeekStart && donationDate <= lastWeekEnd
    });
    
    return donationDate >= lastWeekStart && donationDate <= lastWeekEnd;
  });
  
  // Calculate totals
  const thisWeekTotal = thisWeekDonations.reduce((sum, d) => {
    const amount = d.donation_amt || d.amount || d.donation_amount || d.value || 0;
    const numAmount = Number(amount);
    return sum + (isNaN(numAmount) ? 0 : numAmount);
  }, 0);
  
  const lastWeekTotal = lastWeekDonations.reduce((sum, d) => {
    const amount = d.donation_amt || d.amount || d.donation_amount || d.value || 0;
    const numAmount = Number(amount);
    return sum + (isNaN(numAmount) ? 0 : numAmount);
  }, 0);
  
  console.log('Week totals:', {
    thisWeekDonations: thisWeekDonations.length,
    thisWeekTotal,
    lastWeekDonations: lastWeekDonations.length,
    lastWeekTotal
  });
  
  // Calculate percentage change
  if (lastWeekTotal === 0) {
    return thisWeekTotal > 0 ? "+100%" : "+0%";
  }
  
  const percentChange = ((thisWeekTotal - lastWeekTotal) / lastWeekTotal * 100).toFixed(1);
  return `${percentChange >= 0 ? '+' : ''}${percentChange}%`;
};

// =========================
// 1st chart - Orders Over Time
// =========================

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

// =======================
// Orders by Merchant
// =======================

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

  console.log('=== DEBUGGING CHART DATA ===');
  console.log('ordersByMerchantData:', ordersByMerchantData);
  console.log('Length:', ordersByMerchantData.length);
  if (ordersByMerchantData.length > 0) {
    console.log('Max value:', Math.max(...ordersByMerchantData.map(d => d.value)));
    console.log('Sample items:', ordersByMerchantData.slice(0, 3));
  }


  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-50 min-h-screen">
      {/* Total Donations Card - Now Dynamic */}
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

      {/* Date Range Filter */}
      <div className="mb-8 flex items-center gap-4">
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

      {/* NEW: Chart Controls Selector */}
      <ChartControlsSelector 
        timeGrouping={timeGrouping}
        setTimeGrouping={setTimeGrouping}
        topMerchantsLimit={topMerchantsLimit}
        setTopMerchantsLimit={setTopMerchantsLimit}
      />

      {/* Charts: Orders Over Time and Orders by Merchant */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <ChartCard title={ordersOverTimeConfig.title}>
          <ResponsiveContainer width="100%" height={getChartHeight()}>
            <LineChart data={ordersOverTimeData}>
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
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
              />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#6366f1" 
                strokeWidth={3} 
                dot={{ fill: '#6366f1', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#6366f1', strokeWidth: 2 }}
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