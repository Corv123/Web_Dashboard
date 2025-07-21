import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getExternalCharities } from '../../../services/externalCharityApi';

const CampaignsView = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    getExternalCharities()
      .then(data => {
        setCharities(data);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  // Get unique categories for filter
  const categories = ['All', ...new Set(charities.map(charity => charity.category || charity.category_name || ''))];

  // Filter charities based on category and search query
  const filteredCharities = charities.filter(charity => {
    const matchesCategory = selectedCategory === 'All' || (charity.category || charity.category_name) === selectedCategory;
    const matchesSearch = (charity.name || charity.charity_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (charity.organization || charity.org_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCharityClick = (charityId) => {
    navigate('/donations', { state: { selectedCampaign: charityId } });
  };

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Charity</h1>
        <p className="text-gray-600">View and manage all active charities</p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-500" />
          <span className="text-gray-700 font-medium">Category:</span>
          <select 
            className="w-48 px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 ml-8">
          <Search size={20} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search charities..."
            className="w-64 px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Charities Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading charities...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Website</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCharities.map((charity) => (
                  <tr 
                    key={charity.id || charity.charity_id || charity.org_id} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleCharityClick(charity.id || charity.charity_id || charity.org_id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      {charity.org_img_url ? (
                        <img src={charity.org_img_url} alt={charity.org_name || 'Charity Logo'} className="h-12 w-12 object-contain rounded-full border" />
                      ) : (
                        <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-400">N/A</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{charity.org_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{charity.org_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a href={charity.org_dns_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">
                        {charity.org_dns_url}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignsView; 