import { useEffect, useState } from 'react';
import { DollarSign, Users, MapPin, Heart, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import { getAllDonations, getAllOrders, getAllUsers } from '../processors/getProcessor.js';
import dayjs from 'dayjs';
import { chartConfig, timeFormats, ChartGradients, ChartControlsSelector} from '../processors/chartProcessor.js'

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
    
    getAllOrders().then(res => {
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
    
    // Debug each donation
    console.log('Processing donation:', {
      id: donation._id || donation.id,
      raw_donation_amt: donation.donation_amt,
      raw_amount: donation.amount,
      chosen_amount: amount,
      converted_amount: numAmount,
      is_valid: !isNaN(numAmount)
    });
    
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

  // Filter orders by date range
  const filteredOrders = ordersArr.filter(order => {
    if (!order.order_complete_datetime) return false;
    const orderDate = dayjs(order.order_complete_datetime).format('YYYY-MM-DD');
    if (startDate && orderDate < startDate) return false;
    if (endDate && orderDate > endDate) return false;
    return true;
  });

    // UPDATED: Current Week Daily Orders (Line Chart) - GMT+8 timezone
  const ordersOverTimeData = (() => {
    // Get current date in GMT+8
    const now = new Date();
    const gmt8Now = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    
    // For this specific case, if today is 23rd, we want 17-23
    // So we go back 6 days from today to get the start (17th)
    const weekStart = new Date(gmt8Now.getTime() - (6 * 24 * 60 * 60 * 1000));
    weekStart.setHours(0, 0, 0, 0);
    
    // Generate 7 days starting from weekStart
    const days = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(weekStart.getTime() + (i * 24 * 60 * 60 * 1000));
      const dayNumber = dayDate.getDate();
      
      days.push({
        period: dayNumber.toString(),
        date: dayDate,
        amount: 0,
        count: 0
      });
    }
    
    // Group orders by day
    filteredOrders.forEach(order => {
      if (!order.order_complete_datetime) return;
      
      // Convert order date to GMT+8
      const orderDate = new Date(order.order_complete_datetime);
      const orderGmt8 = new Date(orderDate.getTime() + (8 * 60 * 60 * 1000));
      
      // Find which day this order belongs to
      const dayIndex = days.findIndex(day => {
        const dayStart = new Date(day.date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day.date);
        dayEnd.setHours(23, 59, 59, 999);
        
        return orderGmt8 >= dayStart && orderGmt8 <= dayEnd;
      });
      
      if (dayIndex !== -1) {
        days[dayIndex].amount += Number(order.order_cost) || 0;
        days[dayIndex].count += 1;
      }
    });
    
    return days;
  })();


  // Orders by Merchant (Bar Chart)
  const ordersByMerchantData = filteredOrders.reduce((acc, order) => {
    const found = acc.find(item => item.name === order.merchant_name);
    if (found) {
      found.value += Number(order.order_cost);
    } else {
      acc.push({ name: order.merchant_name, value: Number(order.order_cost) });
    }
    return acc;
  }, []);

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

const calculateDonationTrend = () => {
  if (donationsArr.length === 0) return "+0%";
  
  // Use GMT+8 timezone
  const now = new Date();
 const gmt8Now = new Date(now.getTime() + (12 * 60 * 60 * 1000)); // GMT+8 + 4 hours = GMT+12
  console.log(gmt8Now);

  const oneWeekAgo = new Date(gmt8Now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(gmt8Now.getTime() - 14 * 24 * 60 * 60 * 1000);
  
  // This week: from oneWeekAgo to now
  const thisWeekDonations = donationsArr.filter(donation => {
    const dateField = donation.donation_datetime;
    if (!dateField) return false;
    const donationDate = new Date(new Date(dateField).getTime() + (8 * 60 * 60 * 1000));
    return donationDate >= oneWeekAgo && donationDate <= gmt8Now;
  });
  
  // Last week: from two weeks ago to one week ago
  const lastWeekDonations = donationsArr.filter(donation => {
    const dateField = donation.donation_datetime;
    if (!dateField) return false;
    const donationDate = new Date(new Date(dateField).getTime() + (8 * 60 * 60 * 1000));
    return donationDate >= twoWeeksAgo && donationDate < oneWeekAgo;
  });
  
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
  
  // If last week was 0 and this week has donations, show +100%
  if (lastWeekTotal === 0) return thisWeekTotal > 0 ? "+100%" : "+0%";
  
  const percentChange = ((thisWeekTotal - lastWeekTotal) / lastWeekTotal * 100).toFixed(1);
  return `${percentChange >= 0 ? '+' : ''}${percentChange}%`;
};

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

      {/* UPDATED: Charts Row */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <ChartCard title="Orders Over Time">
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
                  name === 'amount' ? 'Revenue' : name
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
              <BarChart data={ordersByMerchantData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                <Bar dataKey="value" fill="url(#gradient2)" radius={[0, 8, 8, 0]} />
                <ChartGradients />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* UPDATED: Charts Row 2 */}
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
                <Bar dataKey="value" fill="url(#gradient3)" radius={[0, 8, 8, 0]} />
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