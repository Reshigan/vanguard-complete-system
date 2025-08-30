import { useState } from 'react'
import { Heart, AlertTriangle, Phone, ExternalLink, Calculator } from 'lucide-react'

const ResponsibleDrinking = () => {
  const [drinks, setDrinks] = useState(0)
  const [weight, setWeight] = useState('')
  const [gender, setGender] = useState('male')
  const [hours, setHours] = useState(1)

  const calculateBAC = () => {
    if (!weight || drinks === 0) return 0
    
    const weightKg = parseFloat(weight)
    const genderMultiplier = gender === 'male' ? 0.68 : 0.55
    const alcoholGrams = drinks * 14 // Standard drink = 14g alcohol
    
    const bac = (alcoholGrams / (weightKg * genderMultiplier)) - (0.015 * hours)
    return Math.max(0, bac).toFixed(3)
  }

  const getBACStatus = (bac) => {
    if (bac === 0) return { status: 'sober', color: 'text-green-600', message: 'Sober' }
    if (bac < 0.05) return { status: 'low', color: 'text-yellow-600', message: 'Low impairment' }
    if (bac < 0.08) return { status: 'moderate', color: 'text-orange-600', message: 'Moderate impairment' }
    return { status: 'high', color: 'text-red-600', message: 'High impairment - Do not drive' }
  }

  const resources = [
    {
      title: 'National Suicide Prevention Lifeline',
      phone: '988',
      description: 'Free and confidential emotional support 24/7'
    },
    {
      title: 'SAMHSA National Helpline',
      phone: '1-800-662-4357',
      description: 'Treatment referral and information service'
    },
    {
      title: 'Alcoholics Anonymous',
      phone: 'Local chapter',
      description: 'Support groups and recovery programs',
      website: 'https://www.aa.org'
    }
  ]

  const tips = [
    'Eat before and while drinking to slow alcohol absorption',
    'Alternate alcoholic drinks with water or non-alcoholic beverages',
    'Set a limit before you start drinking and stick to it',
    'Never drink and drive - use rideshare, taxi, or designated driver',
    'Avoid drinking games and shots that encourage rapid consumption',
    'Know the signs of alcohol poisoning and when to seek help',
    'If you\'re pregnant, taking medication, or have health conditions, avoid alcohol',
    'Don\'t feel pressured to drink - it\'s okay to say no'
  ]

  const standardDrinks = [
    { type: 'Beer', amount: '12 oz', alcohol: '5% ABV', image: '🍺' },
    { type: 'Wine', amount: '5 oz', alcohol: '12% ABV', image: '🍷' },
    { type: 'Spirits', amount: '1.5 oz', alcohol: '40% ABV', image: '🥃' },
    { type: 'Champagne', amount: '5 oz', alcohol: '12% ABV', image: '🥂' }
  ]

  const bac = calculateBAC()
  const bacStatus = getBACStatus(bac)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="h-8 w-8 text-purple-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Drink Responsibly</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Your health and safety matter. Use these resources and tools to make informed decisions about alcohol consumption.
        </p>
      </div>

      {/* BAC Calculator */}
      <div className="card mb-8">
        <div className="flex items-center space-x-2 mb-4">
          <Calculator className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Blood Alcohol Calculator</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          This is an estimate only. Many factors affect BAC. Never rely solely on this calculator.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of drinks
              </label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setDrinks(Math.max(0, drinks - 1))}
                  className="btn-secondary btn-sm"
                >
                  -
                </button>
                <span className="text-lg font-semibold w-8 text-center">{drinks}</span>
                <button
                  onClick={() => setDrinks(drinks + 1)}
                  className="btn-secondary btn-sm"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Body weight (kg)
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="70"
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="input"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hours since first drink
              </label>
              <input
                type="number"
                value={hours}
                onChange={(e) => setHours(Math.max(0, parseFloat(e.target.value) || 0))}
                min="0"
                step="0.5"
                className="input"
              />
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2 text-gray-900">
                {bac}%
              </div>
              <div className={`text-lg font-semibold mb-2 ${bacStatus.color}`}>
                {bacStatus.message}
              </div>
              {bac > 0.08 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2 text-red-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">Above legal limit</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Standard Drinks Guide */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">What is a Standard Drink?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {standardDrinks.map((drink, index) => (
            <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl mb-2">{drink.image}</div>
              <div className="font-semibold text-gray-900">{drink.type}</div>
              <div className="text-sm text-gray-600">{drink.amount}</div>
              <div className="text-sm text-gray-600">{drink.alcohol}</div>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-600 mt-4">
          Each of these contains approximately 14 grams of pure alcohol and counts as one standard drink.
        </p>
      </div>

      {/* Safety Tips */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Safety Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tips.map((tip, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="bg-green-100 rounded-full p-1 mt-0.5">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              </div>
              <p className="text-sm text-gray-700">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Help Resources */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Get Help</h2>
        <p className="text-gray-600 mb-6">
          If you or someone you know is struggling with alcohol, help is available. These resources provide support, information, and treatment options.
        </p>
        
        <div className="space-y-4">
          {resources.map((resource, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{resource.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-600">{resource.phone}</span>
                  </div>
                </div>
                {resource.website && (
                  <a
                    href={resource.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-800">Emergency</h4>
              <p className="text-sm text-yellow-700">
                If someone is unconscious, vomiting, or showing signs of alcohol poisoning, call emergency services immediately: <strong>911</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResponsibleDrinking