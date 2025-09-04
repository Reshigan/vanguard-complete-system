import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Download,
  Eye,
  MapPin,
  Calendar,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Truck,
  Factory
} from 'lucide-react';

const BatchManagement = ({ manufacturerData }) => {
  const [activeView, setActiveView] = useState('batches');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Sample batch data
  const batches = [
    {
      id: 'HR-2024-001',
      product: 'Highland Reserve 12yr',
      quantity: 5000,
      created: '2024-01-15',
      status: 'active',
      tokensGenerated: 5000,
      tokensScanned: 3420,
      authenticity: 98.5,
      location: 'Stellenbosch Distillery',
      distributors: ['Premium Liquors', 'City Distributors'],
      alerts: 1
    },
    {
      id: 'HS-2024-002',
      product: 'Highland Single Malt',
      quantity: 3000,
      created: '2024-01-20',
      status: 'active',
      tokensGenerated: 3000,
      tokensScanned: 2890,
      authenticity: 99.1,
      location: 'Cape Town Facility',
      distributors: ['Regional Wines', 'Metro Spirits'],
      alerts: 0
    },
    {
      id: 'HB-2024-003',
      product: 'Highland Blend',
      quantity: 7500,
      created: '2024-01-25',
      status: 'production',
      tokensGenerated: 7500,
      tokensScanned: 2156,
      authenticity: 97.8,
      location: 'Johannesburg Plant',
      distributors: ['Coastal Trading'],
      alerts: 2
    },
    {
      id: 'HP-2024-004',
      product: 'Highland Premium',
      quantity: 2000,
      created: '2024-02-01',
      status: 'completed',
      tokensGenerated: 2000,
      tokensScanned: 1890,
      authenticity: 98.9,
      location: 'Durban Facility',
      distributors: ['Premium Liquors', 'Regional Wines'],
      alerts: 0
    }
  ];

  // Sample token tracking data
  const tokenTracking = [
    {
      tokenId: 'VRF-HR001-A1B2C3',
      batchId: 'HR-2024-001',
      status: 'consumed',
      scannedAt: '2024-02-15 14:30:00',
      location: 'Cape Town, WC',
      distributor: 'Premium Liquors',
      retailer: 'Tops Liquor Store',
      consumer: 'Anonymous'
    },
    {
      tokenId: 'VRF-HR001-D4E5F6',
      batchId: 'HR-2024-001',
      status: 'active',
      scannedAt: null,
      location: 'Johannesburg, GP',
      distributor: 'City Distributors',
      retailer: 'Makro Liquor',
      consumer: null
    },
    {
      tokenId: 'VRF-HS002-G7H8I9',
      batchId: 'HS-2024-002',
      status: 'flagged',
      scannedAt: '2024-02-14 09:15:00',
      location: 'Lagos, Nigeria',
      distributor: 'Unknown',
      retailer: 'Unknown',
      consumer: 'Anonymous'
    }
  ];

  const [newBatch, setNewBatch] = useState({
    product: '',
    quantity: '',
    location: '',
    distributors: []
  });

  const filteredBatches = batches.filter(batch =>
    batch.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.product.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'production': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'flagged': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const createBatch = () => {
    // In a real app, this would call the API
    const batch = {
      id: `${newBatch.product.substring(0, 2).toUpperCase()}-2024-${String(batches.length + 1).padStart(3, '0')}`,
      ...newBatch,
      created: new Date().toISOString().split('T')[0],
      status: 'production',
      tokensGenerated: parseInt(newBatch.quantity),
      tokensScanned: 0,
      authenticity: 100,
      alerts: 0
    };
    
    alert(`Batch ${batch.id} created successfully! ${batch.tokensGenerated} tokens generated.`);
    setShowCreateModal(false);
    setNewBatch({ product: '', quantity: '', location: '', distributors: [] });
  };

  const renderBatchList = () => (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search batches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </button>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Batch
        </button>
      </div>

      {/* Batch Cards */}
      <div className="grid gap-6">
        {filteredBatches.map((batch) => (
          <div key={batch.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 mr-3">{batch.id}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(batch.status)}`}>
                    {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
                  </span>
                  {batch.alerts > 0 && (
                    <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                      {batch.alerts} Alert{batch.alerts > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mb-1">{batch.product}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <Factory className="w-4 h-4 mr-1" />
                  {batch.location}
                  <Calendar className="w-4 h-4 ml-4 mr-1" />
                  {new Date(batch.created).toLocaleDateString()}
                </div>
              </div>
              <button
                onClick={() => setSelectedBatch(batch)}
                className="flex items-center px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4 mr-1" />
                View Details
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{batch.quantity.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total Units</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{batch.tokensScanned.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Scanned</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{batch.authenticity}%</p>
                <p className="text-sm text-gray-500">Authentic</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{batch.distributors.length}</p>
                <p className="text-sm text-gray-500">Distributors</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-sm text-gray-500">
                  <Truck className="w-4 h-4 mr-1" />
                  {batch.distributors.join(', ')}
                </div>
              </div>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(batch.tokensScanned / batch.tokensGenerated) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTokenTracking = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Token Tracking</h3>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search token ID..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Token ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Batch</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Location</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Distributor</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Last Scan</th>
              </tr>
            </thead>
            <tbody>
              {tokenTracking.map((token, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 px-4 font-mono text-sm text-gray-900">{token.tokenId}</td>
                  <td className="py-3 px-4 text-gray-700">{token.batchId}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      token.status === 'consumed' ? 'bg-green-100 text-green-800' :
                      token.status === 'active' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {token.status.charAt(0).toUpperCase() + token.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-700">{token.location}</td>
                  <td className="py-3 px-4 text-gray-700">{token.distributor}</td>
                  <td className="py-3 px-4 text-gray-700">
                    {token.scannedAt ? new Date(token.scannedAt).toLocaleString() : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderBatchDetails = () => {
    if (!selectedBatch) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedBatch(null)}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Batches
          </button>
          <div className="flex items-center space-x-3">
            <button className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedBatch.id}</h2>
              <p className="text-lg text-gray-600 mb-4">{selectedBatch.product}</p>
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <Factory className="w-4 h-4 mr-1" />
                  {selectedBatch.location}
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Created {new Date(selectedBatch.created).toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {selectedBatch.status.charAt(0).toUpperCase() + selectedBatch.status.slice(1)}
                </div>
              </div>
            </div>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedBatch.status)}`}>
              {selectedBatch.status.charAt(0).toUpperCase() + selectedBatch.status.slice(1)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Package className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{selectedBatch.quantity.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Total Units</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <BarChart3 className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{selectedBatch.tokensScanned.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Tokens Scanned</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{selectedBatch.authenticity}%</p>
              <p className="text-sm text-gray-500">Authenticity Rate</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-600">{selectedBatch.alerts}</p>
              <p className="text-sm text-gray-500">Active Alerts</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Distribution Network</h4>
              <div className="space-y-3">
                {selectedBatch.distributors.map((distributor, index) => (
                  <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Truck className="w-5 h-5 text-gray-500 mr-3" />
                    <span className="font-medium text-gray-900">{distributor}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Scan Progress</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Scanned Tokens</span>
                    <span>{selectedBatch.tokensScanned} / {selectedBatch.tokensGenerated}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${(selectedBatch.tokensScanned / selectedBatch.tokensGenerated) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Completion Rate</p>
                    <p className="font-semibold text-gray-900">
                      {((selectedBatch.tokensScanned / selectedBatch.tokensGenerated) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Remaining</p>
                    <p className="font-semibold text-gray-900">
                      {(selectedBatch.tokensGenerated - selectedBatch.tokensScanned).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCreateModal = () => {
    if (!showCreateModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Batch</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
              <select
                value={newBatch.product}
                onChange={(e) => setNewBatch(prev => ({ ...prev, product: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Product</option>
                <option value="Highland Reserve 12yr">Highland Reserve 12yr</option>
                <option value="Highland Single Malt">Highland Single Malt</option>
                <option value="Highland Blend">Highland Blend</option>
                <option value="Highland Premium">Highland Premium</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                value={newBatch.quantity}
                onChange={(e) => setNewBatch(prev => ({ ...prev, quantity: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="5000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Production Location</label>
              <select
                value={newBatch.location}
                onChange={(e) => setNewBatch(prev => ({ ...prev, location: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Location</option>
                <option value="Stellenbosch Distillery">Stellenbosch Distillery</option>
                <option value="Cape Town Facility">Cape Town Facility</option>
                <option value="Johannesburg Plant">Johannesburg Plant</option>
                <option value="Durban Facility">Durban Facility</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={createBatch}
              disabled={!newBatch.product || !newBatch.quantity || !newBatch.location}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Batch
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* View Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
        {[
          { id: 'batches', name: 'Batch Overview' },
          { id: 'tracking', name: 'Token Tracking' }
        ].map((view) => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id)}
            className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors ${
              activeView === view.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {view.name}
          </button>
        ))}
      </div>

      {/* Content */}
      {selectedBatch ? renderBatchDetails() :
       activeView === 'batches' ? renderBatchList() :
       renderTokenTracking()}

      {/* Create Modal */}
      {renderCreateModal()}
    </div>
  );
};

export default BatchManagement;