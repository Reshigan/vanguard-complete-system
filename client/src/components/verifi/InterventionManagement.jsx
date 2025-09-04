import React, { useState } from 'react';
import { 
  Shield, 
  Plus, 
  Search, 
  Filter, 
  Download,
  Eye,
  Edit,
  Users,
  MapPin,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  Phone,
  Mail,
  Building2,
  Gavel
} from 'lucide-react';

const InterventionManagement = ({ associationData }) => {
  const [activeView, setActiveView] = useState('investigations');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Active investigations
  const investigations = [
    {
      id: 'INV-2024-001',
      title: 'Lagos Counterfeit Network',
      priority: 'critical',
      status: 'active',
      created: '2024-02-01',
      lastUpdate: '2024-02-15',
      assignedTo: 'Detective Sarah Johnson',
      agency: 'SAPS Commercial Crime Unit',
      location: 'Lagos, Nigeria / Johannesburg, SA',
      affectedManufacturers: ['Highland Distillery', 'Cape Wine Co.'],
      estimatedLoss: 2500000,
      evidence: 47,
      suspects: 3,
      description: 'Large-scale counterfeit operation involving multiple SA brands being distributed in West Africa',
      nextAction: 'Coordinate with Nigerian authorities for joint operation',
      dueDate: '2024-02-20'
    },
    {
      id: 'INV-2024-002',
      title: 'Metro Spirits Distribution Anomaly',
      priority: 'high',
      status: 'investigating',
      created: '2024-02-05',
      lastUpdate: '2024-02-14',
      assignedTo: 'Inspector Mike Chen',
      agency: 'SARS Customs Division',
      location: 'Johannesburg, Gauteng',
      affectedManufacturers: ['Johannesburg Spirits'],
      estimatedLoss: 890000,
      evidence: 23,
      suspects: 1,
      description: 'Unusual distribution patterns and pricing anomalies detected in Metro Spirits network',
      nextAction: 'Conduct physical audit of warehouse facilities',
      dueDate: '2024-02-18'
    },
    {
      id: 'INV-2024-003',
      title: 'Cross-Border Smuggling Ring',
      priority: 'medium',
      status: 'evidence-gathering',
      created: '2024-01-28',
      lastUpdate: '2024-02-12',
      assignedTo: 'Agent Lisa Patel',
      agency: 'Border Management Authority',
      location: 'Beitbridge Border Post',
      affectedManufacturers: ['Stellenbosch Wines', 'Durban Breweries'],
      estimatedLoss: 1200000,
      evidence: 15,
      suspects: 2,
      description: 'Suspected smuggling operation moving authentic products without proper documentation',
      nextAction: 'Install additional monitoring equipment at border',
      dueDate: '2024-02-25'
    }
  ];

  // Law enforcement contacts
  const lawEnforcementContacts = [
    {
      name: 'Detective Sarah Johnson',
      agency: 'SAPS Commercial Crime Unit',
      division: 'Intellectual Property Crimes',
      phone: '+27 11 123 4567',
      email: 's.johnson@saps.gov.za',
      location: 'Johannesburg',
      specialization: 'Counterfeit goods, Cross-border crime',
      activeCases: 3,
      successRate: 87
    },
    {
      name: 'Inspector Mike Chen',
      agency: 'SARS Customs Division',
      division: 'Trade Compliance',
      phone: '+27 21 987 6543',
      email: 'm.chen@sars.gov.za',
      location: 'Cape Town',
      specialization: 'Import/Export violations, Tax evasion',
      activeCases: 2,
      successRate: 92
    },
    {
      name: 'Agent Lisa Patel',
      agency: 'Border Management Authority',
      division: 'Contraband Detection',
      phone: '+27 15 555 0123',
      email: 'l.patel@bma.gov.za',
      location: 'Beitbridge',
      specialization: 'Smuggling, Document fraud',
      activeCases: 4,
      successRate: 78
    }
  ];

  // Evidence repository
  const evidenceRepository = [
    {
      id: 'EVD-001',
      caseId: 'INV-2024-001',
      type: 'Digital Evidence',
      description: 'NFC scan logs showing geographic clustering',
      collectedBy: 'AI System',
      collectedDate: '2024-02-01',
      status: 'verified',
      confidentiality: 'restricted'
    },
    {
      id: 'EVD-002',
      caseId: 'INV-2024-001',
      type: 'Physical Evidence',
      description: 'Counterfeit bottles seized from Lagos warehouse',
      collectedBy: 'Nigerian Police',
      collectedDate: '2024-02-08',
      status: 'analysis-pending',
      confidentiality: 'confidential'
    },
    {
      id: 'EVD-003',
      caseId: 'INV-2024-002',
      type: 'Financial Records',
      description: 'Suspicious transaction patterns in Metro Spirits accounts',
      collectedBy: 'SARS Forensics',
      collectedDate: '2024-02-10',
      status: 'verified',
      confidentiality: 'restricted'
    }
  ];

  const [newInvestigation, setNewInvestigation] = useState({
    title: '',
    priority: 'medium',
    location: '',
    assignedTo: '',
    agency: '',
    description: ''
  });

  const filteredInvestigations = investigations.filter(inv =>
    inv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'investigating': return 'bg-purple-100 text-purple-800';
      case 'evidence-gathering': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const createInvestigation = () => {
    const investigation = {
      id: `INV-2024-${String(investigations.length + 1).padStart(3, '0')}`,
      ...newInvestigation,
      status: 'active',
      created: new Date().toISOString().split('T')[0],
      lastUpdate: new Date().toISOString().split('T')[0],
      evidence: 0,
      suspects: 0,
      estimatedLoss: 0
    };
    
    alert(`Investigation ${investigation.id} created successfully!`);
    setShowCreateModal(false);
    setNewInvestigation({
      title: '',
      priority: 'medium',
      location: '',
      assignedTo: '',
      agency: '',
      description: ''
    });
  };

  const renderInvestigations = () => (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search investigations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <button className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </button>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Investigation
        </button>
      </div>

      {/* Investigation Cards */}
      <div className="grid gap-6">
        {filteredInvestigations.map((investigation) => (
          <div key={investigation.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 mr-3">{investigation.id}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(investigation.priority)}`}>
                    {investigation.priority.toUpperCase()}
                  </span>
                  <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(investigation.status)}`}>
                    {investigation.status.replace('-', ' ').toUpperCase()}
                  </span>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">{investigation.title}</h4>
                <p className="text-gray-600 mb-3">{investigation.description}</p>
                <div className="flex items-center text-sm text-gray-500 space-x-4">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {investigation.location}
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {investigation.assignedTo}
                  </div>
                  <div className="flex items-center">
                    <Building2 className="w-4 h-4 mr-1" />
                    {investigation.agency}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedCase(investigation)}
                className="flex items-center px-3 py-1 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4 mr-1" />
                View Details
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">R{(investigation.estimatedLoss / 1000000).toFixed(1)}M</p>
                <p className="text-sm text-gray-500">Est. Loss</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{investigation.evidence}</p>
                <p className="text-sm text-gray-500">Evidence Items</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{investigation.suspects}</p>
                <p className="text-sm text-gray-500">Suspects</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{investigation.affectedManufacturers.length}</p>
                <p className="text-sm text-gray-500">Manufacturers</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Created {new Date(investigation.created).toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Due {new Date(investigation.dueDate).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Next:</span>
                <span className="text-sm font-medium text-gray-900">{investigation.nextAction}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLawEnforcement = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Law Enforcement Contacts</h3>
        <button className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
          <Plus className="w-4 h-4 mr-2" />
          Add Contact
        </button>
      </div>

      <div className="grid gap-6">
        {lawEnforcementContacts.map((contact, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{contact.name}</h4>
                  <p className="text-gray-600">{contact.agency}</p>
                  <p className="text-sm text-gray-500">{contact.division}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                  <Phone className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                  <Mail className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Contact Information</p>
                <div className="mt-1 space-y-1">
                  <div className="flex items-center text-sm">
                    <Phone className="w-4 h-4 text-gray-400 mr-2" />
                    {contact.phone}
                  </div>
                  <div className="flex items-center text-sm">
                    <Mail className="w-4 h-4 text-gray-400 mr-2" />
                    {contact.email}
                  </div>
                  <div className="flex items-center text-sm">
                    <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                    {contact.location}
                  </div>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Specialization</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{contact.specialization}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-xl font-bold text-blue-600">{contact.activeCases}</p>
                  <p className="text-xs text-gray-500">Active Cases</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-xl font-bold text-green-600">{contact.successRate}%</p>
                  <p className="text-xs text-gray-500">Success Rate</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderEvidence = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Evidence Repository</h3>
        <div className="flex items-center space-x-3">
          <button className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </button>
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
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Evidence ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Case</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Description</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Collected By</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody>
              {evidenceRepository.map((evidence, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 px-4 font-mono text-sm text-gray-900">{evidence.id}</td>
                  <td className="py-3 px-4 text-gray-700">{evidence.caseId}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 text-gray-500 mr-2" />
                      {evidence.type}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-700 max-w-xs truncate">{evidence.description}</td>
                  <td className="py-3 px-4 text-gray-700">{evidence.collectedBy}</td>
                  <td className="py-3 px-4 text-gray-700">{new Date(evidence.collectedDate).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      evidence.status === 'verified' ? 'bg-green-100 text-green-800' :
                      evidence.status === 'analysis-pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {evidence.status.replace('-', ' ').toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderCaseDetails = () => {
    if (!selectedCase) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedCase(null)}
            className="text-purple-600 hover:text-purple-800"
          >
            ← Back to Investigations
          </button>
          <div className="flex items-center space-x-3">
            <button className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </button>
            <button className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center mb-2">
                <h2 className="text-2xl font-bold text-gray-900 mr-3">{selectedCase.id}</h2>
                <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getPriorityColor(selectedCase.priority)}`}>
                  {selectedCase.priority.toUpperCase()}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-4">{selectedCase.title}</h3>
              <p className="text-gray-600 mb-4">{selectedCase.description}</p>
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {selectedCase.location}
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {selectedCase.assignedTo}
                </div>
                <div className="flex items-center">
                  <Building2 className="w-4 h-4 mr-1" />
                  {selectedCase.agency}
                </div>
              </div>
            </div>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedCase.status)}`}>
              {selectedCase.status.replace('-', ' ').toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-600">R{(selectedCase.estimatedLoss / 1000000).toFixed(1)}M</p>
              <p className="text-sm text-gray-500">Estimated Loss</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <FileText className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{selectedCase.evidence}</p>
              <p className="text-sm text-gray-500">Evidence Items</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <Users className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-600">{selectedCase.suspects}</p>
              <p className="text-sm text-gray-500">Suspects Identified</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Building2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{selectedCase.affectedManufacturers.length}</p>
              <p className="text-sm text-gray-500">Affected Brands</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Affected Manufacturers</h4>
              <div className="space-y-3">
                {selectedCase.affectedManufacturers.map((manufacturer, index) => (
                  <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Building2 className="w-5 h-5 text-gray-500 mr-3" />
                    <span className="font-medium text-gray-900">{manufacturer}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Case Timeline</h4>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-3 h-3 bg-green-500 rounded-full mt-2 mr-3"></div>
                  <div>
                    <p className="font-medium text-gray-900">Case Created</p>
                    <p className="text-sm text-gray-500">{new Date(selectedCase.created).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 mr-3"></div>
                  <div>
                    <p className="font-medium text-gray-900">Last Update</p>
                    <p className="text-sm text-gray-500">{new Date(selectedCase.lastUpdate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mt-2 mr-3"></div>
                  <div>
                    <p className="font-medium text-gray-900">Next Action Due</p>
                    <p className="text-sm text-gray-500">{new Date(selectedCase.dueDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-start">
              <Clock className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Next Action Required:</p>
                <p className="text-yellow-700">{selectedCase.nextAction}</p>
                <p className="text-sm text-yellow-600 mt-1">Due: {new Date(selectedCase.dueDate).toLocaleDateString()}</p>
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
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Investigation</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Investigation Title</label>
              <input
                type="text"
                value={newInvestigation.title}
                onChange={(e) => setNewInvestigation(prev => ({ ...prev, title: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter investigation title"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={newInvestigation.priority}
                  onChange={(e) => setNewInvestigation(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={newInvestigation.location}
                  onChange={(e) => setNewInvestigation(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Investigation location"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                <select
                  value={newInvestigation.assignedTo}
                  onChange={(e) => setNewInvestigation(prev => ({ ...prev, assignedTo: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select Officer</option>
                  <option value="Detective Sarah Johnson">Detective Sarah Johnson</option>
                  <option value="Inspector Mike Chen">Inspector Mike Chen</option>
                  <option value="Agent Lisa Patel">Agent Lisa Patel</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agency</label>
                <select
                  value={newInvestigation.agency}
                  onChange={(e) => setNewInvestigation(prev => ({ ...prev, agency: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select Agency</option>
                  <option value="SAPS Commercial Crime Unit">SAPS Commercial Crime Unit</option>
                  <option value="SARS Customs Division">SARS Customs Division</option>
                  <option value="Border Management Authority">Border Management Authority</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={newInvestigation.description}
                onChange={(e) => setNewInvestigation(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Detailed description of the investigation"
              />
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
              onClick={createInvestigation}
              disabled={!newInvestigation.title || !newInvestigation.assignedTo || !newInvestigation.agency}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Investigation
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
          { id: 'investigations', name: 'Active Investigations' },
          { id: 'contacts', name: 'Law Enforcement' },
          { id: 'evidence', name: 'Evidence Repository' }
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
      {selectedCase ? renderCaseDetails() :
       activeView === 'investigations' ? renderInvestigations() :
       activeView === 'contacts' ? renderLawEnforcement() :
       renderEvidence()}

      {/* Create Modal */}
      {renderCreateModal()}
    </div>
  );
};

export default InterventionManagement;