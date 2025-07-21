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
    getAllDonations().then(res => {
      const data = Array.isArray(res)
        ? res
        : (res.result && Array.isArray(res.result.data) ? res.result.data : []);
      setDonations(data);
      console.log('donations response:', data);
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
  const ordersArr = Array.isArray(orders) ? orders : [];
  const usersArr = Array.isArray(users) ? users : [];

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
  const pieData = [
    { name: 'Male', value: maleCount, color: '#6366F1' },
    { name: 'Female', value: femaleCount, color: '#EC4899' }
  ];

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-50 min-h-screen">
      {/* Total Donations Card - Prominent */}
      <div className="mb-8">
        <div className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-emerald-500 to-blue-600" style={{ minHeight: '200px' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="relative p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/80 text-lg font-medium mb-4">Total Donations</p>
                <p className="text-5xl font-bold text-white mb-4">$23,450</p>
                <p className="text-green-200 text-lg">+12.5% from last week</p>
              </div>
              <div className="p-4 rounded-xl text-emerald-400 bg-white/20 backdrop-blur-sm">
                <DollarSign size={40} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Other Stats Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Donors"
          value={usersArr.length}
          trend="-0.5% from last week"
          icon={Users}
          bgGradient="bg-gradient-to-br from-blue-500 to-purple-600"
          iconColor="text-blue-400"
        />
        <StatCard
          title="Merchants"
          value={ordersByMerchantData.length}
          subtitle="SIT Foodgle Hub"
          icon={MapPin}
          bgGradient="bg-gradient-to-br from-purple-500 to-red-500"
          iconColor="text-purple-400"
        />
        <StatCard
          title="Charities"
          value="12"
          subtitle="All Active"
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
            <option>Downtown</option>
            <option>Westside</option>
            <option>Eastside</option>
            <option>Northside</option>
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