import { useState, useEffect } from 'react'
import { 
  Package, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Download,
  Upload
} from 'lucide-react'

const Products = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setProducts([
        {
          id: 1,
          name: 'Castle Lager 750ml',
          sku: 'CL-750-001',
          category: 'Beer',
          manufacturer: 'South African Breweries',
          activeTokens: 12450,
          totalTokens: 15000,
          validations: 8234,
          authenticityRate: 96.5,
          status: 'active',
          lastUpdated: '2024-08-25'
        },
        {
          id: 2,
          name: 'Black Label 750ml',
          sku: 'BL-750-001',
          category: 'Beer',
          manufacturer: 'South African Breweries',
          activeTokens: 10230,
          totalTokens: 12000,
          validations: 6543,
          authenticityRate: 94.2,
          status: 'active',
          lastUpdated: '2024-08-24'
        },
        {
          id: 3,
          name: 'Savanna Dry 500ml',
          sku: 'SD-500-001',
          category: 'Cider',
          manufacturer: 'Distell Group',
          activeTokens: 8765,
          totalTokens: 10000,
          validations: 5432,
          authenticityRate: 95.8,
          status: 'active',
          lastUpdated: '2024-08-23'
        },
        {
          id: 4,
          name: 'Klipdrift Brandy 750ml',
          sku: 'KD-750-001',
          category: 'Spirits',
          manufacturer: 'Distell Group',
          activeTokens: 6543,
          totalTokens: 8000,
          validations: 3456,
          authenticityRate: 93.1,
          status: 'active',
          lastUpdated: '2024-08-22'
        },
        {
          id: 5,
          name: 'Amarula Cream 750ml',
          sku: 'AM-750-001',
          category: 'Liqueur',
          manufacturer: 'Distell Group',
          activeTokens: 5432,
          totalTokens: 6000,
          validations: 2890,
          authenticityRate: 97.2,
          status: 'active',
          lastUpdated: '2024-08-21'
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const handleAddProduct = (e) => {
    e.preventDefault()
    // Handle add product logic
    setShowAddModal(false)
  }

  const handleDeleteProduct = (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter(p => p.id !== productId))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-600">Manage your product catalog and NXT Tags</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="btn-secondary flex items-center space-x-2">
            <Upload className="h-4 w-4" />
            <span>Import</span>
          </button>
          <button className="btn-secondary flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          <option value="Beer">Beer</option>
          <option value="Wine">Wine</option>
          <option value="Spirits">Spirits</option>
          <option value="Cider">Cider</option>
          <option value="Liqueur">Liqueur</option>
        </select>
        <button className="btn-secondary flex items-center space-x-2">
          <Filter className="h-4 w-4" />
          <span>More Filters</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NXT Tags
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Validations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Authenticity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {product.activeTokens.toLocaleString()} / {product.totalTokens.toLocaleString()}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(product.activeTokens / product.totalTokens) * 100}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <BarChart3 className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{product.validations.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {product.authenticityRate >= 95 ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                      )}
                      <span className={`text-sm font-medium ${
                        product.authenticityRate >= 95 ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {product.authenticityRate}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => setSelectedProduct(product)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Product</h2>
            <form onSubmit={handleAddProduct}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Beer">Beer</option>
                    <option value="Wine">Wine</option>
                    <option value="Spirits">Spirits</option>
                    <option value="Cider">Cider</option>
                    <option value="Liqueur">Liqueur</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of NXT Tags
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">{selectedProduct.name}</h2>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">SKU</p>
                <p className="font-medium">{selectedProduct.sku}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Category</p>
                <p className="font-medium">{selectedProduct.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Manufacturer</p>
                <p className="font-medium">{selectedProduct.manufacturer}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-medium capitalize">{selectedProduct.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Active NXT Tags</p>
                <p className="font-medium">{selectedProduct.activeTokens.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total NXT Tags</p>
                <p className="font-medium">{selectedProduct.totalTokens.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Validations</p>
                <p className="font-medium">{selectedProduct.validations.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Authenticity Rate</p>
                <p className="font-medium">{selectedProduct.authenticityRate}%</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button className="btn-secondary">Edit Product</button>
              <button className="btn-primary">View Analytics</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Products