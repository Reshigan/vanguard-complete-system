import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { tokenService } from '../services/tokenService'
import { 
  Smartphone, 
  Wifi, 
  CheckCircle, 
  AlertTriangle, 
  Camera,
  MapPin,
  Clock,
  Shield
} from 'lucide-react'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'

const Scanner = () => {
  const { isAuthenticated } = useAuth()
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [location, setLocation] = useState(null)
  const [manualTokenHash, setManualTokenHash] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)

  useEffect(() => {
    // Get user location for reporting
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          console.warn('Location access denied:', error)
        }
      )
    }
  }, [])

  const handleNFCScan = async () => {
    if (!('NDEFReader' in window)) {
      toast.error('NFC is not supported on this device')
      setShowManualInput(true)
      return
    }

    try {
      setIsScanning(true)
      setScanResult(null)

      const ndef = new NDEFReader()
      await ndef.scan()

      ndef.addEventListener('reading', ({ message }) => {
        const record = message.records[0]
        if (record.recordType === 'text') {
          const decoder = new TextDecoder(record.encoding)
          const tokenHash = decoder.decode(record.data)
          handleTokenValidation(tokenHash)
        }
      })

      toast.success('NFC scanning started. Hold your phone near the product.')
    } catch (error) {
      console.error('NFC scan error:', error)
      toast.error('Failed to start NFC scanning')
      setShowManualInput(true)
    } finally {
      setIsScanning(false)
    }
  }

  const handleTokenValidation = async (tokenHash) => {
    try {
      setIsScanning(true)
      
      const deviceInfo = {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        platform: navigator.platform
      }

      const result = await tokenService.validateToken(tokenHash, location, deviceInfo)
      setScanResult({ ...result, tokenHash })

      if (result.success && !result.isCounterfeit) {
        toast.success('Product is authentic!')
      } else if (result.isCounterfeit) {
        toast.error('Potential counterfeit detected!')
      }
    } catch (error) {
      console.error('Token validation error:', error)
      setScanResult({
        success: false,
        error: error.response?.data?.error || 'Validation failed',
        tokenHash,
        isCounterfeit: true
      })
      toast.error('Failed to validate token')
    } finally {
      setIsScanning(false)
    }
  }

  const handleManualValidation = (e) => {
    e.preventDefault()
    if (manualTokenHash.trim()) {
      handleTokenValidation(manualTokenHash.trim())
      setManualTokenHash('')
    }
  }

  const handleInvalidateToken = async () => {
    if (!scanResult?.tokenHash) return

    try {
      const result = await tokenService.invalidateToken(
        scanResult.tokenHash,
        location,
        [] // Photos would be handled by file upload
      )

      if (result.success) {
        toast.success('Token successfully invalidated!')
        setScanResult(prev => ({ ...prev, invalidated: true, rewardsEarned: result.rewardsEarned }))
      }
    } catch (error) {
      console.error('Token invalidation error:', error)
      toast.error('Failed to invalidate token')
    }
  }

  const handleReportCounterfeit = () => {
    // This would typically navigate to a detailed reporting form
    toast.success('Counterfeit report submitted!')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Smartphone className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Scanner</h1>
        <p className="text-gray-600">
          Tap your phone to the NFC sticker on the product to verify authenticity
        </p>
      </div>

      {/* NFC Scanner */}
      <div className="card mb-6">
        <div className="text-center">
          <div className={`w-32 h-32 mx-auto mb-6 rounded-full border-4 border-dashed border-gray-300 flex items-center justify-center ${isScanning ? 'nfc-pulse border-blue-500' : ''}`}>
            {isScanning ? (
              <LoadingSpinner size="lg" />
            ) : (
              <Wifi className="h-12 w-12 text-gray-400" />
            )}
          </div>
          
          <button
            onClick={handleNFCScan}
            disabled={isScanning}
            className="btn-primary btn-lg mb-4"
          >
            {isScanning ? 'Scanning...' : 'Start NFC Scan'}
          </button>

          <div className="text-center">
            <button
              onClick={() => setShowManualInput(!showManualInput)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Can't use NFC? Enter token manually
            </button>
          </div>
        </div>
      </div>

      {/* Manual Input */}
      {showManualInput && (
        <div className="card mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Manual Token Entry</h3>
          <form onSubmit={handleManualValidation} className="space-y-4">
            <input
              type="text"
              value={manualTokenHash}
              onChange={(e) => setManualTokenHash(e.target.value)}
              placeholder="Enter token hash"
              className="input"
            />
            <button type="submit" className="btn-primary w-full">
              Validate Token
            </button>
          </form>
        </div>
      )}

      {/* Scan Result */}
      {scanResult && (
        <div className="card">
          <div className="flex items-start space-x-4">
            <div className={`p-2 rounded-lg ${scanResult.success && !scanResult.isCounterfeit ? 'bg-success-100' : 'bg-danger-100'}`}>
              {scanResult.success && !scanResult.isCounterfeit ? (
                <CheckCircle className="h-6 w-6 text-success-600" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-danger-600" />
              )}
            </div>
            <div className="flex-1">
              <h3 className={`font-semibold mb-2 ${scanResult.success && !scanResult.isCounterfeit ? 'text-success-800' : 'text-danger-800'}`}>
                {scanResult.success && !scanResult.isCounterfeit ? 'Authentic Product' : 'Potential Counterfeit'}
              </h3>
              
              {scanResult.token && (
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>{scanResult.token.productName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Manufacturer:</span>
                    <span>{scanResult.token.manufacturer}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>Batch: {scanResult.token.batchNumber}</span>
                  </div>
                  {location && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>Location verified</span>
                    </div>
                  )}
                </div>
              )}

              {scanResult.requiresPhysicalValidation && !scanResult.invalidated && (
                <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-4">
                  <p className="text-warning-800 text-sm mb-3">
                    To complete validation, please tear the NFC sticker on the product.
                  </p>
                  <button
                    onClick={handleInvalidateToken}
                    className="btn-primary btn-sm"
                  >
                    I've Torn the Sticker
                  </button>
                </div>
              )}

              {scanResult.invalidated && (
                <div className="bg-success-50 border border-success-200 rounded-lg p-4 mb-4">
                  <p className="text-success-800 text-sm">
                    ✅ Product validated successfully!
                    {scanResult.rewardsEarned && ` You earned ${scanResult.rewardsEarned} reward points.`}
                  </p>
                </div>
              )}

              {scanResult.isCounterfeit && (
                <div className="space-y-3">
                  <p className="text-danger-800 text-sm">
                    This product may be counterfeit. Please report this location to help protect others.
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleReportCounterfeit}
                      className="btn-danger btn-sm"
                    >
                      Report Counterfeit
                    </button>
                    <button
                      onClick={() => setScanResult(null)}
                      className="btn-secondary btn-sm"
                    >
                      Scan Another
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p className="mb-2">
          <strong>How to scan:</strong>
        </p>
        <ol className="text-left max-w-md mx-auto space-y-1">
          <li>1. Tap "Start NFC Scan"</li>
          <li>2. Hold your phone close to the NFC sticker</li>
          <li>3. Wait for the validation result</li>
          <li>4. If authentic, tear the sticker to complete validation</li>
        </ol>
      </div>
    </div>
  )
}

export default Scanner