import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Calculator, 
  Clock, 
  AlertTriangle, 
  Info, 
  Phone,
  MapPin,
  User,
  Scale,
  Wine,
  Beer,
  Coffee
} from 'lucide-react';

const ResponsibleDrinking = () => {
  const [activeTab, setActiveTab] = useState('calculator');
  const [bacData, setBacData] = useState({
    weight: '',
    gender: 'male',
    drinks: [],
    timeStarted: null
  });
  const [currentBAC, setCurrentBAC] = useState(0);

  // Standard drink definitions (South African standards)
  const standardDrinks = {
    beer: { name: 'Beer (340ml)', alcohol: 5, volume: 340, units: 1.4 },
    wine: { name: 'Wine (125ml)', alcohol: 12, volume: 125, units: 1.2 },
    spirits: { name: 'Spirits (25ml)', alcohol: 40, volume: 25, units: 1.0 },
    cider: { name: 'Cider (340ml)', alcohol: 4.5, volume: 340, units: 1.2 }
  };

  // BAC calculation (Widmark formula)
  const calculateBAC = () => {
    if (!bacData.weight || bacData.drinks.length === 0) {
      setCurrentBAC(0);
      return;
    }

    const weight = parseFloat(bacData.weight);
    const genderConstant = bacData.gender === 'male' ? 0.68 : 0.55;
    
    let totalAlcohol = 0;
    const now = new Date();
    
    bacData.drinks.forEach(drink => {
      const drinkTime = new Date(drink.timestamp);
      const hoursElapsed = (now - drinkTime) / (1000 * 60 * 60);
      
      // Calculate alcohol content in grams
      const alcoholGrams = (drink.volume * drink.alcohol / 100) * 0.789;
      
      // Apply metabolism rate (0.015% per hour)
      const metabolizedAlcohol = Math.max(0, alcoholGrams - (hoursElapsed * 0.015 * weight * genderConstant));
      totalAlcohol += metabolizedAlcohol;
    });

    const bac = (totalAlcohol / (weight * genderConstant)) * 100;
    setCurrentBAC(Math.max(0, bac));
  };

  useEffect(() => {
    calculateBAC();
  }, [bacData]);

  const addDrink = (drinkType) => {
    const drink = standardDrinks[drinkType];
    const newDrink = {
      id: Date.now(),
      ...drink,
      timestamp: new Date().toISOString(),
      type: drinkType
    };

    setBacData(prev => ({
      ...prev,
      drinks: [...prev.drinks, newDrink],
      timeStarted: prev.timeStarted || new Date().toISOString()
    }));
  };

  const removeDrink = (drinkId) => {
    setBacData(prev => ({
      ...prev,
      drinks: prev.drinks.filter(drink => drink.id !== drinkId)
    }));
  };

  const getBACStatus = (bac) => {
    if (bac < 0.02) return { level: 'safe', color: 'green', text: 'Safe to drive' };
    if (bac < 0.05) return { level: 'caution', color: 'yellow', text: 'Caution advised' };
    if (bac < 0.08) return { level: 'impaired', color: 'orange', text: 'Legally impaired' };
    return { level: 'dangerous', color: 'red', text: 'Dangerous level' };
  };

  const renderBACCalculator = () => {
    const status = getBACStatus(currentBAC);
    
    return (
      <div className="space-y-6">
        {/* Personal Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight (kg)
              </label>
              <div className="relative">
                <Scale className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={bacData.weight}
                  onChange={(e) => setBacData(prev => ({ ...prev, weight: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="70"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={bacData.gender}
                  onChange={(e) => setBacData(prev => ({ ...prev, gender: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Current BAC */}
        <div className={`bg-${status.color}-50 rounded-lg border border-${status.color}-200 p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {currentBAC.toFixed(3)}%
              </h3>
              <p className="text-sm text-gray-600">Current BAC</p>
            </div>
            <div className={`px-3 py-1 bg-${status.color}-100 text-${status.color}-800 rounded-full text-sm font-medium`}>
              {status.text}
            </div>
          </div>
          
          {currentBAC > 0.05 && (
            <div className="bg-red-100 border border-red-200 rounded-lg p-3">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                <p className="text-sm text-red-700 font-medium">
                  You are over the legal limit for driving in South Africa (0.05%)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Add Drinks */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Drinks</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(standardDrinks).map(([key, drink]) => (
              <button
                key={key}
                onClick={() => addDrink(key)}
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {key === 'beer' && <Beer className="w-5 h-5 text-amber-500 mr-2" />}
                {key === 'wine' && <Wine className="w-5 h-5 text-purple-500 mr-2" />}
                {key === 'spirits' && <Coffee className="w-5 h-5 text-brown-500 mr-2" />}
                {key === 'cider' && <Beer className="w-5 h-5 text-yellow-500 mr-2" />}
                <div className="text-left">
                  <p className="font-medium text-gray-900">{drink.name}</p>
                  <p className="text-xs text-gray-500">{drink.alcohol}% • {drink.units} units</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Drinks List */}
        {bacData.drinks.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Drinks</h3>
            <div className="space-y-2">
              {bacData.drinks.map((drink) => (
                <div key={drink.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{drink.name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(drink.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <button
                    onClick={() => removeDrink(drink.id)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDrinkGuide = () => (
    <div className="space-y-6">
      {/* Standard Drinks Guide */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Standard Drinks in South Africa</h3>
        <div className="grid gap-4">
          {Object.entries(standardDrinks).map(([key, drink]) => (
            <div key={key} className="flex items-center p-4 border border-gray-100 rounded-lg">
              {key === 'beer' && <Beer className="w-8 h-8 text-amber-500 mr-4" />}
              {key === 'wine' && <Wine className="w-8 h-8 text-purple-500 mr-4" />}
              {key === 'spirits' && <Coffee className="w-8 h-8 text-brown-500 mr-4" />}
              {key === 'cider' && <Beer className="w-8 h-8 text-yellow-500 mr-4" />}
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{drink.name}</h4>
                <p className="text-sm text-gray-600">
                  {drink.alcohol}% alcohol • {drink.volume}ml • {drink.units} standard units
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legal Limits */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Legal Limits in South Africa</h3>
        <div className="space-y-3">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
            <span className="text-blue-800">
              <strong>Driving:</strong> 0.05% BAC or 0.24mg per 1000ml of breath
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
            <span className="text-blue-800">
              <strong>Professional drivers:</strong> 0.02% BAC
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
            <span className="text-blue-800">
              <strong>Under 21:</strong> Zero tolerance policy
            </span>
          </div>
        </div>
      </div>

      {/* Health Guidelines */}
      <div className="bg-green-50 rounded-lg border border-green-200 p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-4">Health Guidelines</h3>
        <div className="space-y-3">
          <div className="flex items-start">
            <Heart className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
            <div>
              <p className="font-medium text-green-800">Low-risk drinking limits:</p>
              <p className="text-sm text-green-700">
                Men: No more than 3 units per day, 21 per week<br/>
                Women: No more than 2 units per day, 14 per week
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <Clock className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
            <div>
              <p className="font-medium text-green-800">Alcohol-free days:</p>
              <p className="text-sm text-green-700">
                Have at least 2 alcohol-free days per week
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderResources = () => (
    <div className="space-y-6">
      {/* Emergency Contacts */}
      <div className="bg-red-50 rounded-lg border border-red-200 p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-4">Emergency Contacts</h3>
        <div className="space-y-3">
          <div className="flex items-center">
            <Phone className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <p className="font-medium text-red-800">Emergency Services</p>
              <p className="text-red-700">10111 or 112</p>
            </div>
          </div>
          <div className="flex items-center">
            <Phone className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <p className="font-medium text-red-800">Poison Information Centre</p>
              <p className="text-red-700">0861 555 777</p>
            </div>
          </div>
        </div>
      </div>

      {/* Support Organizations */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Support Organizations</h3>
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-semibold text-gray-900">Alcoholics Anonymous South Africa</h4>
            <p className="text-sm text-gray-600 mb-2">
              Support groups and meetings across South Africa
            </p>
            <p className="text-blue-600">www.aasouthafrica.org.za</p>
          </div>
          
          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="font-semibold text-gray-900">SANCA (South African National Council on Alcoholism)</h4>
            <p className="text-sm text-gray-600 mb-2">
              Treatment and prevention services
            </p>
            <p className="text-green-600">011 892 3829</p>
          </div>
          
          <div className="border-l-4 border-purple-500 pl-4">
            <h4 className="font-semibold text-gray-900">LifeLine South Africa</h4>
            <p className="text-sm text-gray-600 mb-2">
              24/7 counselling and crisis support
            </p>
            <p className="text-purple-600">0861 322 322</p>
          </div>
        </div>
      </div>

      {/* Safe Transport Options */}
      <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-4">Safe Transport Options</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center p-3 bg-white rounded-lg border border-yellow-200">
            <MapPin className="w-5 h-5 text-yellow-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Uber</p>
              <p className="text-sm text-gray-600">Available nationwide</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-white rounded-lg border border-yellow-200">
            <MapPin className="w-5 h-5 text-yellow-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Bolt</p>
              <p className="text-sm text-gray-600">Major cities</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-white rounded-lg border border-yellow-200">
            <Phone className="w-5 h-5 text-yellow-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Local Taxi Services</p>
              <p className="text-sm text-gray-600">Check local directories</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-white rounded-lg border border-yellow-200">
            <Heart className="w-5 h-5 text-yellow-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Designated Driver</p>
              <p className="text-sm text-gray-600">Plan ahead</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
        {[
          { id: 'calculator', name: 'BAC Calculator', icon: Calculator },
          { id: 'guide', name: 'Drink Guide', icon: Info },
          { id: 'resources', name: 'Resources', icon: Heart }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'calculator' && renderBACCalculator()}
      {activeTab === 'guide' && renderDrinkGuide()}
      {activeTab === 'resources' && renderResources()}

      {/* Disclaimer */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-1">Important Disclaimer:</p>
            <p>
              This BAC calculator is for educational purposes only and should not be used to determine 
              fitness to drive. BAC can vary based on many factors. Always err on the side of caution 
              and never drink and drive.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponsibleDrinking;