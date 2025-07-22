import React, { useEffect, useState } from 'react';
import { DollarSign, Users, MapPin, Heart, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import { getAllDonations, getAllOrders, getAllUsers } from '../../../services/api';
import dayjs from 'dayjs';

const HomeView = () => {
  const [donations, setDonations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    console.log('=== STARTING API CALLS ===');
    
    getAllDonations()
      .then(res => {
        console.log('RAW donations API response:', res);
        console.log('Response type:', typeof res);
        console.log('Is array?', Array.isArray(res));
        
        // Check all possible response structures
        if (res) {
          console.log('Response keys:', Object.keys(res));
          if (res.result) {
            console.log('res.result:', res.result);
            console.log('res.result keys:', Object.keys(res.result));
            if (res.result.data) {
              console.log('res.result.data:', res.result.data);
              console.log('res.result.data is array?', Array.isArray(res.result.data));
            }
          }
          if (res.data) {
            console.log('res.data:', res.data);
            console.log('res.data is array?', Array.isArray(res.data));
          }
        }
        
        const data = Array.isArray(res)
          ? res
          : (res.result && Array.isArray(res.result.data) ? res.result.data : []);
        
        console.log('PROCESSED donations data:', data);
        console.log('PROCESSED data length:', data.length);
        
        setDonations(data);
        
        // Enhanced debugging for donation structure
        if (data.length > 0) {
          console.log('Sample donation structure:', data[0]);
          console.log('Available donation fields:', Object.keys(data[0]));
          console.log('donation_amt value:', data[0].donation_amt);
          console.log('donation_amt type:', typeof data[0].donation_amt);
          
          // Check for different possible field names
          const possibleAmountFields = ['donation_amt', 'amount', 'donation_amount', 'value'];
          possibleAmountFields.forEach(field => {
            if (data[0][field] !== undefined) {
              console.log(`Found ${field}:`, data[0][field], typeof data[0][field]);
            }
          });
          
          // Log all donations to see the actual values
          console.log('All donations with amounts:', data.map(d => ({
            id: d._id || d.id,
            donation_amt: d.donation_amt,
            amount: d.amount,
            donation_amount: d.donation_amount
          })));
        } else {
          console.warn('⚠️ NO DONATIONS FOUND - possible issues:');
          console.warn('1. API endpoint might be wrong');
          console.warn('2. Database might be empty');
          console.warn('3. Response structure might be different');
          console.warn('4. API might be returning an error');
        }
      })
      .catch(error => {
        console.error('❌ DONATIONS API ERROR:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        setDonations([]);
      });
    
    getAllOrders().then(res => {
      const data = Array.isArray(res)
        ? res
        : (res.result && Array.isArray(res.result.data) ? res.result.data : []);
      setOrders(data);
      console.log('orders response:', data);
    });
    
    getAllUsers().then(res => {
      const data = Array.isArray(res)
        ? res
        : (res.result && Array.isArray(res.result.data) ? res.result.data : []);
      setUsers(data);
      console.log('users response:', data);
    });
  }, []);

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

  // Orders Over Time (Line Chart)
  const ordersOverTimeData = filteredOrders.reduce((acc, order) => {
    if (!order.order_complete_datetime) return acc;
    const day = dayjs(order.order_complete_datetime).format('ddd');
    const found = acc.find(item => item.day === day);
    if (found) {
      found.amount += Number(order.order_cost);
    } else {
      acc.push({ day, amount: Number(order.order_cost) });
    }
    return acc;
  }, []);

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

  // Top Merchants by Sales (Bar Chart)
  const topMerchantsData = Array.isArray(ordersByMerchantData)
    ? [...ordersByMerchantData].sort((a, b) => b.value - a.value).slice(0, 5)
    : [];

  // User Gender Distribution (Pie Chart)
  const maleCount = usersArr.filter(u => u.user_gender === 'Male').length;
  const femaleCount = usersArr.filter(u => u.user_gender === 'Female').length;
  const otherCount = usersArr.filter(u => u.user_gender && u.user_gender !== 'Male' && u.user_gender !== 'Female').length;
  
  const pieData = [
    { name: 'Male', value: maleCount, color: '#6366F1' },
    { name: 'Female', value: femaleCount, color: '#EC4899' },
    ...(otherCount > 0 ? [{ name: 'Other', value: otherCount, color: '#10B981' }] : [])
  ].filter(item => item.value > 0);

  // Calculate donation trend based on donation_datetime with enhanced field checking
  const calculateDonationTrend = () => {
    if (donationsArr.length === 0) return "+0%";
    
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const thisWeekDonations = donationsArr.filter(donation => {
      const donationDate = new Date(donation.donation_datetime || donation.created_at || donation.createdAt);
      return donationDate >= oneWeekAgo && donationDate <= now;
    });
    
    const lastWeekDonations = donationsArr.filter(donation => {
      const donationDate = new Date(donation.donation_datetime || donation.created_at || donation.createdAt);
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
    
    if (lastWeekTotal === 0) return thisWeekTotal > 0 ? "+100%" : "+0%";
    
    const percentChange = ((thisWeekTotal - lastWeekTotal) / lastWeekTotal * 100).toFixed(1);
    return `${percentChange >= 0 ? '+' : ''}${percentChange}% from last week`;
  };

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-50 min-h-screen">
      {/* Debug Information - Remove this in production */}
      <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 rounded">
        <h3 className="font-bold">Debug Info:</h3>
        <p>Donations count: {donationsArr.length}</p>
        <p>Total donations calculated: ${totalDonations}</p>
        <p>Sample donation data: {donationsArr.length > 0 ? JSON.stringify(donationsArr[0]) : 'No data'}</p>
        <button 
          onClick={() => {
            console.log('Manual API test...');
            fetch('http://10.0.2.2:8000/api/v1/donations')
              .then(res => {
                console.log('Manual fetch response:', res);
                return res.json();
              })
              .then(data => {
                console.log('Manual fetch data:', data);
              })
              .catch(err => {
                console.error('Manual fetch error:', err);
              });
          }}
          className="ml-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Test API Manually
        </button>
      </div>

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

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <ChartCard title="Orders Over Time">
          <ResponsiveContainer width="100%" height={275}>
            <LineChart data={ordersOverTimeData}>
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: 'none', 
                  borderRadius: '12px', 
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' 
                }} 
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
          <div style={{ width: '100%', height: '330px' }}>
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
                />
                <Bar dataKey="value" fill="url(#gradient2)" radius={[0, 8, 8, 0]} />
                <defs>
                  <linearGradient id="gradient2" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#EF4444" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <ChartCard title="Top Merchants by Sales">
          <div style={{ width: '100%', height: '330px' }}>
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
                />
                <Bar dataKey="value" fill="url(#gradient3)" radius={[0, 8, 8, 0]} />
                <defs>
                  <linearGradient id="gradient3" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#EC4899" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="User Gender Distribution">
          <ResponsiveContainer width="100%" height={330}>
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