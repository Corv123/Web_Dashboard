import React, { useState, useEffect } from 'react';
import { DollarSign, Users, Heart, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import { getAllDonations, getAllUsers, getAllOrders } from '../processors/getProcessor.js';
import { useLocation } from 'react-router-dom';
import { chartConfig, ChartGradients } from '../processors/chartProcessor.js';
import dayjs from 'dayjs';

// Mock campaign lookup for demonstration (replace with API lookup as needed)
const campaignNames = {
  1: "Clean Water Initiative",
  2: "Education for All",
  3: "Medical Supplies Drive",
  4: "Food Security Program",
  5: "Shelter for Homeless"
};

const DonationsView = () => {
  const location = useLocation();
  const selectedCampaignId = location.state?.selectedCampaign;
  const campaignTitle = selectedCampaignId ? campaignNames[selectedCampaignId] : null;

  // State for storing API data
  const [donations, setDonations] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Use the same pattern as HomeView
        const [donationsRes, usersRes, ordersRes] = await Promise.all([
          getAllDonations(),
          getAllUsers(),
          getAllOrders()
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

        setDonations(donationsData);
        setUsers(usersData);
        setOrders(ordersData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load donation data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // FIXED: Helper function to extract Decimal128 donation amounts (same as HomeView)
  const extractDonationAmount = (donation) => {
    // First try to get the amount field
    const amountField = donation.donation_amt || donation.amount || donation.donation_amount || donation.value;
    
    // Handle Decimal128 format from MongoDB
    if (amountField && typeof amountField === 'object' && amountField.$numberDecimal) {
      return parseFloat(amountField.$numberDecimal);
    }
    
    // Handle regular number
    const numAmount = Number(amountField);
    return isNaN(numAmount) ? 0 : numAmount;
  };

  // Helper function to extract cost (same as HomeView)
  const extractCost = (costField) => {
    if (costField && typeof costField === 'object' && costField.$numberDecimal) {
      return parseFloat(costField.$numberDecimal);
    }
    return Number(costField) || 0;
  };

  // Defensive: Only reduce if array (same as HomeView)
  const donationsArr = Array.isArray(donations) ? donations : [];
  const ordersArr = Array.isArray(orders) ? orders : [];
  const usersArr = Array.isArray(users) ? users : [];

  // DEBUG: Log the donations data structure
  console.log('=== DEBUGGING DONATIONS DATA ===');
  console.log('Raw donations:', donations);
  console.log('Donations array length:', donationsArr.length);
  if (donationsArr.length > 0) {
    console.log('First donation sample:', donationsArr[0]);
    console.log('Available fields in first donation:', Object.keys(donationsArr[0]));
    console.log('Sample amount extraction:', extractDonationAmount(donationsArr[0]));
  }
  console.log('Selected campaign ID:', selectedCampaignId);

  // Filter data by selected campaign if applicable
  const filteredDonations = selectedCampaignId 
    ? donationsArr.filter(d => d.campaign_id == selectedCampaignId || d.charity_id == selectedCampaignId)
    : donationsArr;

  console.log('Filtered donations length:', filteredDonations.length);

  // FIXED: Use the new helper function for proper Decimal128 handling
  const totalDonations = filteredDonations.reduce((sum, donation) => {
    const amount = extractDonationAmount(donation);
    
    console.log('Processing donation amount:', {
      donation_id: donation.donation_id || donation.id,
      raw_amount_field: donation.donation_amt || donation.amount,
      extracted_amount: amount
    });
    
    return sum + amount;
  }, 0);

  console.log('Final total donations:', totalDonations);
  console.log('Number of donations processed:', filteredDonations.length);

  // Get unique donors count
  const uniqueDonors = new Set(filteredDonations.map(d => d.user_id || d.donor_id)).size;
  console.log('Unique donors:', uniqueDonors);

  // Get active charities count
  const activeCharities = new Set(filteredDonations.map(d => d.charity_id || d.campaign_id)).size || 12;
  console.log('Active charities:', activeCharities);

  // UPDATED: Donation trend calculation for MONTHLY comparison (using the new helper)
  const calculateDonationTrend = () => {
    if (filteredDonations.length === 0) return "+0%";
    
    // Get current date in SGT (GMT+8) - same logic as HomeView but for months
    const now = new Date();
    
    // Calculate date ranges for this month and last month
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    
    console.log('Date ranges for monthly trend:');
    console.log('This month:', thisMonthStart, 'to', thisMonthEnd);
    console.log('Last month:', lastMonthStart, 'to', lastMonthEnd);
    
    // Filter donations for this month
    const thisMonthDonations = filteredDonations.filter(donation => {
      const dateField = donation.donation_datetime || donation.created_at;
      if (!dateField) return false;
      
      const donationDate = new Date(dateField);
      return donationDate >= thisMonthStart && donationDate <= thisMonthEnd;
    });
    
    // Filter donations for last month  
    const lastMonthDonations = filteredDonations.filter(donation => {
      const dateField = donation.donation_datetime || donation.created_at;
      if (!dateField) return false;
      
      const donationDate = new Date(dateField);
      return donationDate >= lastMonthStart && donationDate <= lastMonthEnd;
    });
    
    // Calculate totals using the new helper function
    const thisMonthTotal = thisMonthDonations.reduce((sum, d) => sum + extractDonationAmount(d), 0);
    const lastMonthTotal = lastMonthDonations.reduce((sum, d) => sum + extractDonationAmount(d), 0);
    
    console.log('Month totals:', {
      thisMonthDonations: thisMonthDonations.length,
      thisMonthTotal,
      lastMonthDonations: lastMonthDonations.length,
      lastMonthTotal
    });
    
    // Calculate percentage change
    if (lastMonthTotal === 0) {
      return thisMonthTotal > 0 ? "+100%" : "+0%";
    }
    
    const percentChange = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(1);
    return `${percentChange >= 0 ? '+' : ''}${percentChange}% from last month`;
  };

  // UPDATED: Top donation entries using the new helper
  const topDonationEntries = filteredDonations
    .map(donation => ({
      name: `Donation #${donation.donation_id || donation.id || 'Unknown'}`,
      value: extractDonationAmount(donation),
      donor: donation.donor_name || donation.username || `User ${donation.user_id || 'Unknown'}`
    }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  console.log('Top 3 donation entries:', topDonationEntries);

  // Direct vs Split Donations (same logic as before but improved)
  const directDonations = filteredDonations.filter(d => d.donation_type === 'direct' || !d.donation_type).length;
  const splitDonations = filteredDonations.filter(d => d.donation_type === 'split').length;
  const totalDonationCount = directDonations + splitDonations;
  
  console.log('Donation types:', { directDonations, splitDonations, totalDonationCount });
  
  const donationTypes = totalDonationCount > 0 ? [
    { 
      name: 'Direct', 
      value: Math.round((directDonations / totalDonationCount) * 100), 
      color: chartConfig.pieColors[0] || '#8B5CF6'
    },
    { 
      name: 'Split', 
      value: Math.round((splitDonations / totalDonationCount) * 100), 
      color: chartConfig.pieColors[1] || '#EC4899'
    }
  ] : [
    { name: 'Direct', value: 75, color: chartConfig.pieColors[0] || '#8B5CF6' },
    { name: 'Split', value: 25, color: chartConfig.pieColors[1] || '#EC4899' }
  ];

  // UPDATED: Donations by location using the new helper
  const locationDonations = {};
  filteredDonations.forEach(donation => {
    const location = donation.location || donation.donor_location || donation.user_location || 'Unknown';
    const amount = extractDonationAmount(donation);
    console.log('Location processing:', { location, amount });
    locationDonations[location] = (locationDonations[location] || 0) + amount;
  });

  const donationsByLocation = Object.entries(locationDonations)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }));

  console.log('Donations by location:', donationsByLocation);

  // Fallback data if no location data
  const locationChartData = donationsByLocation.length > 0 ? donationsByLocation : [
    { name: 'Singapore', value: 12500 },
    { name: 'Malaysia', value: 8000 },
    { name: 'Thailand', value: 4000 }
  ];

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
      {/* Campaign Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {campaignTitle ? `Campaign: ${campaignTitle}` : 'Donations Overview'}
        </h1>
        <p className="text-gray-600 mt-2">
          Showing data from {filteredDonations.length} donations
        </p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-6 mb-8">
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
          trend="-1.5% from last week"
          icon={Users}
          bgGradient="bg-gradient-to-br from-blue-500 to-cyan-600"
          iconColor="text-blue-400"
        />
        <StatCard
          title="Active Charities"
          value={activeCharities}
          subtitle="All active"
          icon={Heart}
          bgGradient="bg-gradient-to-br from-pink-500 to-rose-600"
          iconColor="text-pink-400"
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
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <ChartCard title="Top Donation Entries">
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topDonationEntries} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                  formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Donation Amount']}
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

      {/* Share of Donations by Location */}
      <ChartCard title="Share of Donations by Location">
        <div style={{ width: '100%', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={locationChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Donations']}
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
  );
};

export default DonationsView;