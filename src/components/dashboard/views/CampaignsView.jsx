import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Search, Eye, DollarSign, Users, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getExternalCharities } from '../../../services/externalCharityApi';
import { getAllDonations } from '../processors/getProcessor.js';

const CampaignsView = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [charities, setCharities] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('name'); // name, donations, amount
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [charitiesData, donationsData] = await Promise.all([
          getExternalCharities(),
          getAllDonations()
        ]);
        
        setCharities(charitiesData);
        setDonations(Array.isArray(donationsData) ? donationsData : []);
        
        // Enhanced debugging
        console.log('=== CHARITY-DONATION MAPPING DEBUG ===');
        console.log('Total charities:', charitiesData.length);
        console.log('Total donations:', donationsData.length);
        
        if (charitiesData.length > 0) {
          console.log('Sample charity fields:', Object.keys(charitiesData[0]));
          console.log('Sample charity ID mapping:', {
            id: charitiesData[0].id,
            charity_id: charitiesData[0].charity_id,
            org_id: charitiesData[0].org_id
          });
          console.log('Sample org_sector_type:', charitiesData[0].org_sector_type);
        }
        
        if (donationsData.length > 0) {
          console.log('Sample donation fields:', Object.keys(donationsData[0]));
          console.log('Sample donation charity references:', {
            campaign_id: donationsData[0].campaign_id,
            charity_id: donationsData[0].charity_id,
            org_id: donationsData[0].org_id
          });
        }
        
        setLoading(false);
      } catch (e) {
        setError(e.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper function to extract donation amount (same as DonationsView)
  const extractDonationAmount = (donation) => {
    const amountField = donation.donation_amt || donation.amount || donation.donation_amount || donation.value;
    
    if (amountField && typeof amountField === 'object' && amountField.$numberDecimal) {
      return parseFloat(amountField.$numberDecimal);
    }
    
    const numAmount = Number(amountField);
    return isNaN(numAmount) ? 0 : numAmount;
  };

  // Helper function to get charity category
  const getCharityCategory = (charity) => {
    return charity.org_sector_type || charity.category || charity.category_name || 'Other';
  };

  // Get unique categories for filter - updated to use org_sector_type
  const categories = ['All', ...new Set(charities.map(charity => getCharityCategory(charity)).filter(Boolean))];

  // Helper function to get the correct charity ID that matches donation data
  const getCharityId = (charity) => {
    return charity.org_id || charity.charity_id || charity.id;
  };

  // Enhanced function to get charity statistics
  const getCharityStats = (charityId) => {
    const charityDonations = donations.filter(donation => 
      donation.campaign_id == charityId || 
      donation.charity_id == charityId ||
      donation.org_id == charityId
    );

    const totalAmount = charityDonations.reduce((sum, donation) => {
      return sum + extractDonationAmount(donation);
    }, 0);

    const uniqueDonors = new Set(charityDonations.map(d => d.user_id || d.donor_id)).size;
    const donationCount = charityDonations.length;

    return {
      donationCount,
      totalAmount,
      uniqueDonors,
      hasData: donationCount > 0,
      avgDonation: donationCount > 0 ? totalAmount / donationCount : 0
    };
  };

  // Helper function to check if a charity has donations (simplified version)
  const hasCharityDonations = (charityId) => {
    return donations.some(donation => 
      donation.campaign_id == charityId || 
      donation.charity_id == charityId ||
      donation.org_id == charityId
    );
  };

  // Enhanced filtering and sorting - updated to use org_sector_type
  const getFilteredAndSortedCharities = () => {
    let filtered = charities.filter(charity => {
      const charityCategory = getCharityCategory(charity);
      const matchesCategory = selectedCategory === 'All' || charityCategory === selectedCategory;
      const matchesSearch = (charity.name || charity.charity_name || charity.org_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (charity.organization || charity.org_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    // Add stats to each charity for sorting
    const charitiesWithStats = filtered.map(charity => ({
      ...charity,
      stats: getCharityStats(getCharityId(charity))
    }));

    // Sort based on selected criteria
    charitiesWithStats.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'donations':
          aValue = a.stats.donationCount;
          bValue = b.stats.donationCount;
          break;
        case 'amount':
          aValue = a.stats.totalAmount;
          bValue = b.stats.totalAmount;
          break;
        case 'donors':
          aValue = a.stats.uniqueDonors;
          bValue = b.stats.uniqueDonors;
          break;
        case 'name':
        default:
          aValue = (a.org_name || a.name || '').toLowerCase();
          bValue = (b.org_name || b.name || '').toLowerCase();
          break;
      }
      
      if (sortOrder === 'desc') {
        return typeof aValue === 'string' ? bValue.localeCompare(aValue) : bValue - aValue;
      } else {
        return typeof aValue === 'string' ? aValue.localeCompare(bValue) : aValue - bValue;
      }
    });

    return charitiesWithStats;
  };

  const filteredCharities = getFilteredAndSortedCharities();

  // Calculate summary statistics
  const totalCharities = charities.length;
  const charitiesWithDonations = charities.filter(charity => hasCharityDonations(getCharityId(charity))).length;
  const totalDonationAmount = donations.reduce((sum, donation) => sum + extractDonationAmount(donation), 0);

  const handleCharityClick = (charity) => {
    const charityId = getCharityId(charity);
    const stats = getCharityStats(charityId);
    
    console.log('Navigating to charity:', {
      charity: charity.org_name,
      charityId,
      stats
    });
    
    navigate('/donations', { 
      state: { 
        selectedCampaign: charityId,
        charityName: charity.org_name,
        charityInfo: charity
      } 
    });
  };

  const handleSort = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc'); // Default to desc for numerical values
    }
  };

  if (loading) {
    return (
      <div className="p-8 bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading campaigns...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 min-h-screen">
      {/* Enhanced Header with Summary Stats */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Charity Campaigns</h1>
        <p className="text-gray-600">View and manage all active charity campaigns</p>
        
        {/* Summary Statistics */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Campaigns</p>
                <p className="text-xl font-semibold text-gray-900">{totalCharities}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Raised</p>
                <p className="text-xl font-semibold text-gray-900">${totalDonationAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Campaigns</p>
                <p className="text-xl font-semibold text-gray-900">{charitiesWithDonations}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="mb-8 flex items-center gap-4 flex-wrap bg-white p-4 rounded-xl shadow-sm">
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
            placeholder="Search campaigns..."
            className="w-64 px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-gray-700 font-medium">Sort by:</span>
          <select 
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split('-');
              setSortBy(newSortBy);
              setSortOrder(newSortOrder);
            }}
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="donations-desc">Most Donations</option>
            <option value="donations-asc">Least Donations</option> 
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
            <option value="donors-desc">Most Donors</option>
            <option value="donors-asc">Least Donors</option>
          </select>
        </div>
      </div>

      {/* Enhanced Campaigns Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logo</th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Name
                    {sortBy === 'name' && (
                      <span className="text-purple-500">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('donations')}
                >
                  <div className="flex items-center gap-1">
                    Donations
                    {sortBy === 'donations' && (
                      <span className="text-purple-500">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center gap-1">
                    Total Raised
                    {sortBy === 'amount' && (
                      <span className="text-purple-500">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('donors')}
                >
                  <div className="flex items-center gap-1">
                    Donors
                    {sortBy === 'donors' && (
                      <span className="text-purple-500">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCharities.map((charity) => {
                const charityId = getCharityId(charity);
                const stats = charity.stats;
                const category = getCharityCategory(charity);
                
                return (
                  <tr 
                    key={charityId} 
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      {charity.org_img_url ? (
                        <img 
                          src={charity.org_img_url} 
                          alt={charity.org_name || 'Charity Logo'} 
                          className="h-12 w-12 object-contain rounded-full border" 
                        />
                      ) : (
                        <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-400">
                          {(charity.org_name || 'N')[0].toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{charity.org_name}</div>
                      <div className="text-xs text-gray-500">{category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{charity.org_email}</div>
                      {charity.org_dns_url && (
                        <a 
                          href={charity.org_dns_url.startsWith('http') ? charity.org_dns_url : `https://${charity.org_dns_url}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-xs text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Website
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{stats.donationCount}</div>
                      {stats.avgDonation > 0 && (
                        <div className="text-xs text-gray-500">
                          Avg: ${stats.avgDonation.toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${stats.totalAmount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{stats.uniqueDonors}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCharityClick(charity)}
                          className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                            stats.hasData 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <Eye size={12} />
                          {stats.hasData ? 'View Data' : 'No Data'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredCharities.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No campaigns found matching your criteria.
            </div>
            )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="mt-4 text-sm text-gray-600 text-center">
        Showing {filteredCharities.length} of {totalCharities} campaigns
        {searchQuery && ` matching "${searchQuery}"`}
        {selectedCategory !== 'All' && ` in category "${selectedCategory}"`}
      </div>
    </div>
  );
};

export default CampaignsView;