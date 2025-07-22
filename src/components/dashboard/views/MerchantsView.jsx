import React, { useEffect, useState } from 'react';
import { TrendingUp, Activity, Calendar, MapPin } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import { getAllOrders, getAllUsers } from '../processors/getProcessor.js';
import dayjs from 'dayjs';

const MerchantsView = () => {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
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

  const ordersArr = Array.isArray(orders) ? orders : [];

  // StatCard: Total Transactions
  const totalTransactions = ordersArr.length;

  // StatCard: Peak Transaction Hours (find the hour with most orders)
  const hourCounts = ordersArr.reduce((acc, order) => {
    if (!order.order_complete_datetime) return acc;
    const hour = dayjs(order.order_complete_datetime).format('HH');
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {});
  const peakHour = Object.keys(hourCounts).length > 0
    ? Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0][0]
    : null;
  const peakHourLabel = peakHour ? `${peakHour}:00 - ${parseInt(peakHour) + 1}:00` : 'N/A';

  // Dine-in vs Takeaway Trend (group by hour)
  const dineInTakeawayData = (() => {
    const byHour = {};
    ordersArr.forEach(order => {
      if (!order.order_complete_datetime) return;
      const hour = dayjs(order.order_complete_datetime).format('HH:00');
      if (!byHour[hour]) byHour[hour] = { time: hour, dineIn: 0, takeaway: 0 };
      if (order.order_type && order.order_type.toLowerCase() === 'dine-in') {
        byHour[hour].dineIn += 1;
      } else if (order.order_type && order.order_type.toLowerCase() === 'takeaway') {
        byHour[hour].takeaway += 1;
      }
    });
    return Object.values(byHour).sort((a, b) => a.time.localeCompare(b.time));
  })();

  // Orders Over Time (by day, per merchant)
  const merchantNames = [...new Set(ordersArr.map(order => order.merchant_name))];
  const allDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const ordersOverTimeData = allDays.map(day => {
    const entry = { day };
    merchantNames.forEach(merchant => {
      entry[merchant] = ordersArr.filter(
        order =>
          order.merchant_name === merchant &&
          dayjs(order.order_complete_datetime).format('ddd') === day
      ).length;
    });
    return entry;
  });
  const lineColors = ['#EF4444', '#6366F1', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#FBBF24', '#0EA5E9', '#F472B6', '#A3E635'];

  // DSGD Earning Methods (from users)
  const usersArr = Array.isArray(users) ? users : [];
  const roundUpCount = usersArr.filter(u => u.user_default_donation_method === 'Round Up').length;
  const forfeitDiscountCount = usersArr.filter(u => u.user_default_donation_method && u.user_default_donation_method.toLowerCase().includes('discount')).length;
  const total = roundUpCount + forfeitDiscountCount;
  const dsgdEarningMethodsData = total > 0 ? [
    { name: 'Round-Up', value: Math.round((roundUpCount / total) * 100), color: '#6366F1' },
    { name: 'Forfeit Discount', value: Math.round((forfeitDiscountCount / total) * 100), color: '#EC4899' }
  ] : [];

  // Orders Over Time Heatmap Data
  const heatmapData = merchantNames.map(merchant => {
    const row = { merchant };
    allDays.forEach(day => {
      row[day] = ordersArr.filter(
        order =>
          order.merchant_name === merchant &&
          dayjs(order.order_complete_datetime).format('ddd') === day
      ).length;
    });
    return row;
  });
  // Find max value for color scaling
  const maxOrders = Math.max(...heatmapData.flatMap(row => allDays.map(day => row[day])));
  // Helper to get color (high-contrast yellow-orange-red scale)
  const getCellColor = value => {
    if (maxOrders === 0) return '#fffbea';
    const intensity = value / maxOrders;
    // Interpolate between yellow (#fffbea), orange (#fbbf24), and red (#b91c1c)
    if (intensity === 0) return '#fffbea';
    if (intensity < 0.5) {
      // yellow to orange
      const t = intensity / 0.5;
      // #fffbea (255,251,234) to #fbbf24 (251,191,36)
      const r = Math.round(255 + (251 - 255) * t);
      const g = Math.round(251 + (191 - 251) * t);
      const b = Math.round(234 + (36 - 234) * t);
      return `rgb(${r},${g},${b})`;
    } else {
      // orange to red
      const t = (intensity - 0.5) / 0.5;
      // #fbbf24 (251,191,36) to #b91c1c (185,28,28)
      const r = Math.round(251 + (185 - 251) * t);
      const g = Math.round(191 + (28 - 191) * t);
      const b = Math.round(36 + (28 - 36) * t);
      return `rgb(${r},${g},${b})`;
    }
  };

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50 min-h-screen">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <StatCard
          title="Total Transactions"
          value={totalTransactions}
          trend=""
          icon={TrendingUp}
          bgGradient="bg-gradient-to-br from-red-500 to-yellow-500"
          iconColor="text-orange-400"
        />
        <StatCard
          title="Peak Transaction Hours"
          value={peakHourLabel}
          icon={Activity}
          bgGradient="bg-gradient-to-br from-purple-500 to-blue-600"
          iconColor="text-amber-400"
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
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2 ml-8">
          <MapPin size={20} className="text-gray-500" />
          <span className="text-gray-700 font-medium">Location:</span>
          <select className="w-48 px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow focus:ring-2 focus:ring-orange-500 focus:border-transparent">
            <option>All Locations</option>
            <option>Downtown</option>
            <option>Westside</option>
            <option>Eastside</option>
            <option>Northside</option>
          </select>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <ChartCard title="Dine-in vs Takeaway Trend">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
            <ResponsiveContainer width="98%" height={320}>
              <LineChart data={dineInTakeawayData}>
                <XAxis dataKey="time" tick={{ fontSize: 12 }} />
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
                  dataKey="dineIn" 
                  name="Dine-in"
                  stroke="#F59E0B" 
                  strokeWidth={3}
                  dot={{ fill: '#F59E0B', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: '#F59E0B', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="takeaway" 
                  name="Takeaway"
                  stroke="#EF4444" 
                  strokeWidth={3}
                  dot={{ fill: '#EF4444', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: '#EF4444', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Orders Over Time (Heatmap)">
          <div style={{ overflowX: 'auto' }}>
            <table className="min-w-full border-collapse text-center">
              <thead>
                <tr>
                  <th className="p-2 bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-700">Merchant</th>
                  {allDays.map(day => (
                    <th key={day} className="p-2 bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-700">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapData.map(row => (
                  <tr key={row.merchant}>
                    <td className="p-2 border border-gray-200 text-xs font-medium text-gray-800 bg-gray-50">{row.merchant}</td>
                    {allDays.map(day => (
                      <td
                        key={day}
                        className="p-2 border border-gray-200 text-xs font-medium"
                        style={{ background: getCellColor(row[day]), color: row[day] > maxOrders * 0.5 ? '#fff' : '#1e293b', transition: 'background 0.3s' }}
                        title={`${row[day]} orders`}
                      >
                        {row[day] > 0 ? row[day] : ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>

      {/* DSGD Earning Methods Chart */}
      <ChartCard title="DSGD Earning Methods: Round-Up vs. Forfeit Discounts">
        <ResponsiveContainer width="100%" height={275}>
          <PieChart>
            <Pie
              data={dsgdEarningMethodsData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={50}
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}%`}
            >
              {dsgdEarningMethodsData.map((entry, index) => (
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
  );
};

export default MerchantsView; 