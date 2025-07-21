import React from 'react';
import { DollarSign, Users, Heart, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import { mockData } from '../../../services/mockData';
import { useLocation } from 'react-router-dom';

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

  const {
    topMerchantsByDonationData,
    donationTypeData,
    donationByLocationData
  } = mockData;

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 min-h-screen">
      {/* Campaign Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {campaignTitle ? `Campaign: ${campaignTitle}` : 'Donations Overview'}
        </h1>
      </div>
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Donations"
          value="$24,500"
          trend="+12.5% from last month"
          icon={DollarSign}
          bgGradient="bg-gradient-to-br from-green-500 to-emerald-600"
          iconColor="text-green-400"
        />
        <StatCard
          title="Total Donors"
          value="1,234"
          trend="-1.5% from last week"
          icon={Users}
          bgGradient="bg-gradient-to-br from-blue-500 to-cyan-600"
          iconColor="text-blue-400"
        />
        <StatCard
          title="Active Charities"
          value="12"
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
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <ChartCard title="Top Merchants by Donation Amount">
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topMerchantsByDonationData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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

        <ChartCard title="Direct vs Split Donations">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={donationTypeData}
                cx="50%"
                cy="50%"
                outerRadius={120}
                innerRadius={60}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
                labelLine={false}
              >
                {donationTypeData.map((entry, index) => (
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

      {/* Share of Donations by Location */}
      <ChartCard title="Share of Donations by Location">
        <div style={{ width: '100%', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={donationByLocationData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
              <Bar dataKey="value" fill="url(#gradient4)" radius={[0, 8, 8, 0]} />
              <defs>
                <linearGradient id="gradient4" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#EF4444" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
};

export default DonationsView; 