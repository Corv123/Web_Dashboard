import React, { useState, useEffect } from 'react';
import { DollarSign, Users, Heart, Calendar, ArrowLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line } from 'recharts';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import { getAllDonations, getAllUsers, getAllOrders } from '../processors/getProcessor.js';
import { getExternalCharities } from '../../../services/externalCharityApi';
import { useLocation, useNavigate } from 'react-router-dom';
import { chartConfig, ChartGradients } from '../processors/chartProcessor.js';
import dayjs from 'dayjs';

const DonationsView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Enhanced state from location with better fallbacks
  const selectedCampaignId = location.state?.selectedCampaign;
  const charityName = location.state?.charityName;
  const charityInfo = location.state?.charityInfo;

  // State for storing API data
  const [donations, setDonations] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data including charities for better context
        const [donationsRes, usersRes, ordersRes, charitiesRes] = await Promise.all([
          getAllDonations(),
          getAllUsers(),
          getAllOrders(),
          getExternalCharities()
        ]);

        // Handle different response structures like HomeView
        const donationsData = Array.isArray(donationsRes)
          ? donationsRes
          : (donationsRes.result && Array.isArray(donationsRes.result.data) ? donationsRes.result.data : []);
        
        const usersData = Array.isArray(usersRes)
          ? usersRes
          : (usersRes.result && Array.isArray(usersRes.result.data) ? usersRes.result.data : []);
        
        const ordersData = Array.isArray(ordersRes)
          ? ordersRes
          : (ordersRes.result && Array.isArray(ordersRes.result.data) ? ordersRes.result.data : []);

        const charitiesData = Array.isArray(charitiesRes) ? charitiesRes : [];

        setDonations(donationsData);
        setUsers(usersData);
        setOrders(ordersData);
        setCharities(charitiesData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load donation data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Enhanced helper function to extract Decimal128 donation amounts
  const extractDonationAmount = (donation) => {
    const amountField = donation.donation_amt || donation.amount || donation.donation_amount || donation.value;
    
    if (amountField && typeof amountField === 'object' && amountField.$numberDecimal) {
      return parseFloat(amountField.$numberDecimal);
    }
    
    const numAmount = Number(amountField);
    return isNaN(numAmount) ? 0 : numAmount;
  };

  const extractCost = (costField) => {
    if (costField && typeof costField === 'object' && costField.$numberDecimal) {
      return parseFloat(costField.$numberDecimal);
    }
    return Number(costField) || 0;
  };

  // Get charity information for selected campaign
  const getCharityInfo = () => {
    if (!selectedCampaignId) return null;
    
    // First try to use the passed charity info
    if (charityInfo) return charityInfo;
    
    // Otherwise find it in the charities list
    return charities.find(charity => 
      charity.org_id == selectedCampaignId || 
      charity.charity_id == selectedCampaignId || 
      charity.id == selectedCampaignId
    );
  };

  const currentCharity = getCharityInfo();
  const displayCharityName = charityName || currentCharity?.org_name || `Campaign ${selectedCampaignId}`;

  // Defensive: Only reduce if array
  const donationsArr = Array.isArray(donations) ? donations : [];
  const ordersArr = Array.isArray(orders) ? orders : [];
  const usersArr = Array.isArray(users) ? users : [];

  // Enhanced filtering with better ID matching
  const filterDonationsByCharity = (donationsArray, charityId) => {
    if (!charityId) return donationsArray;
    
    return donationsArray.filter(donation => {
      // Try multiple ID field combinations
      const matchesCampaignId = donation.campaign_id == charityId;
      const matchesCharityId = donation.charity_id == charityId;
      const matchesOrgId = donation.org_id == charityId;
      
      return matchesCampaignId || matchesCharityId || matchesOrgId;
    });
  };

  // Apply date filtering if dates are selected
  const applyDateFilter = (donationsArray) => {
    if (!startDate && !endDate) return donationsArray;
    
    return donationsArray.filter(donation => {
      const dateField = donation.donation_datetime || donation.created_at;
      if (!dateField) return true; // Include if no date field
      
      const donationDate = new Date(dateField);
      const start = startDate ? new Date(startDate) : new Date('1900-01-01');
      const end = endDate ? new Date(endDate + 'T23:59:59') : new Date('2100-12-31');
      
      return donationDate >= start && donationDate <= end;
    });
  };

  // Filter donations by charity and date
  let filteredDonations = filterDonationsByCharity(donationsArr, selectedCampaignId);
  filteredDonations = applyDateFilter(filteredDonations);

  console.log('=== FILTERING DEBUG ===');
  console.log('Selected campaign ID:', selectedCampaignId);
  console.log('Total donations:', donationsArr.length);
  console.log('Filtered by charity:', filterDonationsByCharity(donationsArr, selectedCampaignId).length);
  console.log('Filtered by date range:', filteredDonations.length);
  console.log('Current charity info:', currentCharity);

  // Calculate metrics
  const totalDonations = filteredDonations.reduce((sum, donation) => {
    return sum + extractDonationAmount(donation);
  }, 0);

  const uniqueDonors = new Set(filteredDonations.map(d => d.user_id || d.donor_id)).size;
  const activeCharities = selectedCampaignId ? 1 : new Set(donationsArr.map(d => d.charity_id || d.campaign_id)).size;

  // Enhanced donation trend calculation with better error handling
  const calculateDonationTrend = () => {
    if (filteredDonations.length === 0) return "+0%";
    
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    
    const thisMonthDonations = filteredDonations.filter(donation => {
      const dateField = donation.donation_datetime || donation.created_at;
      if (!dateField) return false;
      
      const donationDate = new Date(dateField);
      return donationDate >= thisMonthStart && donationDate <= thisMonthEnd;
    });
    
    const lastMonthDonations = filteredDonations.filter(donation => {
      const dateField = donation.donation_datetime || donation.created_at;
      if (!dateField) return false;
      
      const donationDate = new Date(dateField);
      return donationDate >= lastMonthStart && donationDate <= lastMonthEnd;
    });
    
    const thisMonthTotal = thisMonthDonations.reduce((sum, d) => sum + extractDonationAmount(d), 0);
    const lastMonthTotal = lastMonthDonations.reduce((sum, d) => sum + extractDonationAmount(d), 0);
    
    if (lastMonthTotal === 0) {
      return thisMonthTotal > 0 ? "+100%" : "+0%";
    }
    
    const percentChange = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(1);
    return `${percentChange >= 0 ? '+' : ''}${percentChange}% from last month`;
  };

  // Enhanced donation entries with user info
  const topDonationEntries = filteredDonations
    .map(donation => {
      const user = usersArr.find(u => u.user_id === donation.user_id);
      return {
        name: `Donation #${donation.donation_id || donation.id || 'Unknown'}`,
        value: extractDonationAmount(donation),
        donor: user?.username || donation.donor_name || `User ${donation.user_id || 'Unknown'}`,
        date: donation.donation_datetime || donation.created_at
      };
    })
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Donation types analysis (Direct, Round Up, Discount Donate)
  const directDonations = filteredDonations.filter(d => d.donation_type === 'direct_donation' || !d.donation_type).length;
  const roundUpDonations = filteredDonations.filter(d => d.donation_type === 'round_up').length;
  const discountDonations = filteredDonations.filter(d => d.donation_type === 'discount_donate').length;
  const totalDonationCount = directDonations + roundUpDonations + discountDonations;

  const donationTypes = totalDonationCount > 0 ? [
    {
      name: 'Direct Donation',
      value: Math.round((directDonations / totalDonationCount) * 100),
      color: chartConfig.pieColors[0] || '#8B5CF6'
    },
    {
      name: 'Round Up',
      value: Math.round((roundUpDonations / totalDonationCount) * 100),
      color: chartConfig.pieColors[1] || '#EC4899'
    },
    {
      name: 'Discount Donate',
      value: Math.round((discountDonations / totalDonationCount) * 100),
      color: chartConfig.pieColors[2] || '#F59E0B'
    }
  ] : [
    { name: 'Direct Donation', value: 60, color: chartConfig.pieColors[0] || '#8B5CF6' },
    { name: 'Round Up', value: 25, color: chartConfig.pieColors[1] || '#EC4899' },
    { name: 'Discount Donate', value: 15, color: chartConfig.pieColors[2] || '#F59E0B' }
  ];

  // Donations by location with better location extraction
  const locationDonations = {};
  filteredDonations.forEach(donation => {
    const user = usersArr.find(u => u.user_id === donation.user_id);
    const location = donation.location || donation.donor_location || user?.location || 'Unknown';
    const amount = extractDonationAmount(donation);
    locationDonations[location] = (locationDonations[location] || 0) + amount;
  });

  const donationsByLocation = Object.entries(locationDonations)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }));

  // Donations over time (daily for last 30 days)
  const getDonationTimeline = () => {
    const timeline = {};
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Initialize all dates with 0
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      timeline[dateStr] = 0;
    }

    // Add donation amounts to timeline
    filteredDonations.forEach(donation => {
      const dateField = donation.donation_datetime || donation.created_at;
      if (dateField) {
        const donationDate = new Date(dateField);
        const dateStr = donationDate.toISOString().split('T')[0];
        if (timeline.hasOwnProperty(dateStr)) {
          timeline[dateStr] += extractDonationAmount(donation);
        }
      }
    });

    return Object.entries(timeline)
      .map(([date, amount]) => ({
        date: dayjs(date).format('MMM DD'),
        amount: parseFloat(amount.toFixed(2))
      }))
      .slice(-14); // Show last 14 days
  };

  const timelineData = getDonationTimeline();

  // Top Merchants by Donation Amount (using donation_amt from donations, grouped by merchant_name from orders)
  // 1. Build a map of donation_id to donation_amt for fast lookup
  const donationAmtMap = new Map();
  filteredDonations.forEach(donation => {
    if (donation.donation_id != null && donation.donation_amt != null) {
      donationAmtMap.set(String(donation.donation_id), extractDonationAmount(donation));
    }
  });

  // 2. Filter orders to those with a valid donation_id and a matching donation
  const filteredOrders = ordersArr.filter(order => {
    // Only include orders with a valid donation_id that exists in the donationAmtMap
    if (!order.donation_id || !donationAmtMap.has(String(order.donation_id))) {
      return false;
    }
    // Date filter (if needed)
    if (startDate || endDate) {
      const orderDate = order.order_complete_datetime || order.created_at;
      if (!orderDate) return false;
      const orderDateObj = new Date(orderDate);
      const start = startDate ? new Date(startDate) : new Date('1900-01-01');
      const end = endDate ? new Date(endDate + 'T23:59:59') : new Date('2100-12-31');
      if (orderDateObj < start || orderDateObj > end) return false;
    }
    return true;
  });

  // 3. Group by merchant_name and sum donation_amt
  const merchantsByDonation = filteredOrders.reduce((acc, order) => {
    const merchantName = order.merchant_name || 'Unknown';
    const donationId = String(order.donation_id);
    const donationAmt = donationAmtMap.get(donationId) || 0;
    const found = acc.find(m => m.name === merchantName);
    if (found) {
      found.value += donationAmt;
    } else {
      acc.push({ name: merchantName, value: donationAmt });
    }
    return acc;
  }, []);

  const topMerchantsByDonation = merchantsByDonation
    .filter(m => m.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Share of Donations by Location (merchant_name as location, count of donations per merchant)
  const locationDonationsCount = {};
  filteredOrders.forEach(order => {
    const merchant = order.merchant_name || 'Unknown';
    locationDonationsCount[merchant] = (locationDonationsCount[merchant] || 0) + 1;
  });

  const donationsByLocationCount = Object.entries(locationDonationsCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  // Clear filters function
  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  if (loading) {
    return (
      <div className="p-8 bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading donation data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 min-h-screen">
      {/* Enhanced Header with Back Button */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          {selectedCampaignId && (
            <button
              onClick={() => navigate('/campaigns')}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-600 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50"
            >
              <ArrowLeft size={16} />
              Back to Campaigns
            </button>
          )}
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900">
          {selectedCampaignId ? `Campaign: ${displayCharityName}` : 'Donations Overview'}
        </h1>
        
        <div className="flex items-center gap-4 mt-2">
          <p className="text-gray-600">
            Showing data from {filteredDonations.length} donations
            {(startDate || endDate) && (
              <span className="ml-2 text-sm">
                ({startDate || 'start'} to {endDate || 'end'})
              </span>
            )}
          </p>
          
          {/* Clear filters button */}
          {(startDate || endDate) && (
            <button
              onClick={clearFilters}
              className="text-sm text-purple-600 hover:text-purple-800 underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Charity details if available */}
        {currentCharity && (
          <div className="mt-4 p-4 bg-white rounded-xl shadow-sm">
            <div className="flex items-center gap-4">
              {currentCharity.org_img_url && (
                <img 
                  src={currentCharity.org_img_url} 
                  alt={currentCharity.org_name} 
                  className="h-16 w-16 object-contain rounded-full border"
                />
              )}
              <div>
                <h3 className="font-semibold text-gray-900">{currentCharity.org_name}</h3>
                <p className="text-sm text-gray-600">{currentCharity.org_email}</p>
                {currentCharity.org_dns_url && (
                  <a 
                    href={currentCharity.org_dns_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {currentCharity.org_dns_url}
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <StatCard
          title="Total Donations"
          value={`$${Number(totalDonations).toLocaleString()}`}
          trend={calculateDonationTrend()}
          icon={DollarSign}
          bgGradient="bg-gradient-to-br from-green-500 to-emerald-600"
          iconColor="text-green-400"
        />
        <StatCard
          title="Total Donors"
          value={uniqueDonors.toLocaleString()}
          trend={`${uniqueDonors} unique donors`}
          icon={Users}
          bgGradient="bg-gradient-to-br from-blue-500 to-cyan-600"
          iconColor="text-blue-400"
        />
      </div>

      {/* Enhanced Date Range Filter */}
      <div className="mb-8 flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm">
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
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <ChartCard title="Top Merchants by Donation Amount">
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topMerchantsByDonation} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                  formatter={(value, name, props) => [
                    `$${Number(value).toFixed(2)}`, 
                    'Donation Amount',
                    `Merchant: ${props.payload.name}`
                  ]}
                />
                <Bar 
                  dataKey="value" 
                  fill="#8884d8"
                  radius={[0, 8, 8, 0]} 
                  minPointSize={3}
                />
                <ChartGradients />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Direct vs Split Donations">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={donationTypes}
                cx="50%"
                cy="50%"
                outerRadius={120}
                innerRadius={60}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
                labelLine={false}
              >
                {donationTypes.map((entry, index) => (
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
                formatter={(value) => [`${value}%`, 'Percentage']}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Donations Timeline */}
        <ChartCard title="Donations Timeline (Last 14 Days)">
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: 'none', 
                    borderRadius: '12px', 
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' 
                  }} 
                  formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Donations']}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#8B5CF6" 
                  strokeWidth={3}
                  dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Share of Donations by Location */}
        <ChartCard title="Top Merchants by Donation Count">
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={donationsByLocationCount.length > 0 ? donationsByLocationCount : [
                { name: 'Singapore', value: 12500 },
                { name: 'Malaysia', value: 8000 },
                { name: 'Thailand', value: 4000 }
              ]} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                  type="number" 
                  tick={{ fontSize: 12 }} 
                  domain={[1, (dataMax) => Math.ceil(dataMax)]}
                  allowDecimals={false}
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
                  formatter={(value) => [
                    `${value}`,
                    'Donation Count'
                  ]}
                />
                <Bar 
                  dataKey="value" 
                  fill="#F59E0B"
                  radius={[0, 8, 8, 0]}
                  minPointSize={3}
                />
                <ChartGradients />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default DonationsView;