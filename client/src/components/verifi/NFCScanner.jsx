import React, { useState, useEffect } from 'react';
import { VerifiLogo, VerifiBrand } from '../../assets/verifi-brand.jsx';
import { 
  Smartphone, 
  CheckCircle, 
  XCircle, 
  Loader, 
  Wifi, 
  AlertTriangle,
  Calendar,
  MapPin,
  Package
} from 'lucide-react';

const NFCScanner = ({ user, setUser }) => {
  const [scanState, setScanState] = useState('idle'); // idle, scanning, success, error, counterfeit
  const [scanResult, setScanResult] = useState(null);
  const [isNFCSupported, setIsNFCSupported] = useState(true);

  // Simulate NFC availability check
  useEffect(() => {
    // In a real app, this would check for actual NFC support
    const checkNFC = () => {
      if ('NDEFReader' in window) {
        setIsNFCSupported(true);
      } else {
        // For demo purposes, we'll simulate NFC support
        setIsNFCSupported(true);
      }
    };
    checkNFC();
  }, []);

  const handleScan = async () => {
    setScanState('scanning');
    setScanResult(null);

    // Simulate NFC scan process
    try {
      // Simulate scanning delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate different scan results for demo
      const random = Math.random();
      
      if (random < 0.7) {
        // Authentic product
        const result = {
          tokenId: `VRF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          status: 'authentic',
          product: {
            name: 'Premium Whisky',
            brand: 'Highland Reserve',
            batch: 'HR-2024-001',
            bottledDate: '2024-01-15',
            location: 'Stellenbosch, South Africa',
            alcohol: '43%',
            volume: '750ml'
          },
          verification: {
            timestamp: new Date().toISOString(),
            location: 'Cape Town, South Africa',
            previousScans: 0
          }
        };
        
        setScanResult(result);
        setScanState('success');
        
        // Award points
        const pointsEarned = 25;
        setUser(prev => ({
          ...prev,
          points: prev.points + pointsEarned,
          totalScans: prev.totalScans + 1,
          scansToday: prev.scansToday + 1
        }));
        
      } else if (random < 0.9) {
        // Counterfeit product
        const result = {
          tokenId: `VRF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          status: 'counterfeit',
          reason: 'Token already consumed',
          product: {
            name: 'Premium Whisky',
            brand: 'Highland Reserve',
            suspiciousIndicators: [
              'Token scanned 3 times previously',
              'Last scan in different country',
              'Unusual packaging detected'
            ]
          },
          verification: {
            timestamp: new Date().toISOString(),
            location: 'Cape Town, South Africa',
            previousScans: 3,
            lastScanLocation: 'Lagos, Nigeria'
          }
        };
        
        setScanResult(result);
        setScanState('counterfeit');
        
      } else {
        // Error case
        throw new Error('Unable to read NFC tag');
      }
      
    } catch (error) {
      setScanState('error');
      setScanResult({ error: error.message });
    }
  };

  const resetScan = () => {
    setScanState('idle');
    setScanResult(null);
  };

  const reportCounterfeit = () => {
    // In a real app, this would send a report to the backend
    alert('Counterfeit report submitted. You will earn 100 bonus points once verified!');
    setUser(prev => ({
      ...prev,
      counterfeitReports: prev.counterfeitReports + 1
    }));
  };

  const renderScanButton = () => {
    if (scanState === 'scanning') {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-blue-50 rounded-xl border-2 border-blue-200">
          <Loader className="w-16 h-16 text-blue-500 animate-spin mb-4" />
          <p className="text-lg font-medium text-blue-700">Scanning NFC Tag...</p>
          <p className="text-sm text-blue-600 mt-2">Hold your phone near the product</p>
        </div>
      );
    }

    return (
      <button
        onClick={handleScan}
        disabled={!isNFCSupported}
        className="w-full flex flex-col items-center justify-center p-8 bg-green-50 rounded-xl border-2 border-green-200 hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-4">
          <Smartphone className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-xl font-bold text-green-700 mb-2">Tap to Verify</h3>
        <p className="text-green-600 text-center">
          Hold your phone near the NFC sticker on the product to verify authenticity
        </p>
      </button>
    );
  };

  const renderResult = () => {
    if (!scanResult) return null;

    if (scanState === 'success') {
      return (
        <div className="mt-6 p-6 bg-green-50 rounded-xl border border-green-200">
          <div className="flex items-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <h3 className="text-lg font-bold text-green-700">Authentic Product</h3>
              <p className="text-green-600">Verification successful</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white p-3 rounded-lg">
              <div className="flex items-center mb-2">
                <Package className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Product</span>
              </div>
              <p className="font-semibold">{scanResult.product.name}</p>
              <p className="text-sm text-gray-600">{scanResult.product.brand}</p>
            </div>
            
            <div className="bg-white p-3 rounded-lg">
              <div className="flex items-center mb-2">
                <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Bottled</span>
              </div>
              <p className="font-semibold">{new Date(scanResult.product.bottledDate).toLocaleDateString()}</p>
              <p className="text-sm text-gray-600">Batch: {scanResult.product.batch}</p>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg mb-4">
            <div className="flex items-center mb-2">
              <MapPin className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Origin</span>
            </div>
            <p className="font-semibold">{scanResult.product.location}</p>
            <p className="text-sm text-gray-600">{scanResult.product.alcohol} • {scanResult.product.volume}</p>
          </div>
          
          <div className="bg-green-100 p-3 rounded-lg">
            <p className="text-sm font-medium text-green-700">
              ✅ You earned 25 points for this verification!
            </p>
          </div>
          
          <button
            onClick={resetScan}
            className="w-full mt-4 py-2 px-4 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
          >
            Scan Another Product
          </button>
        </div>
      );
    }

    if (scanState === 'counterfeit') {
      return (
        <div className="mt-6 p-6 bg-red-50 rounded-xl border border-red-200">
          <div className="flex items-center mb-4">
            <XCircle className="w-8 h-8 text-red-500 mr-3" />
            <div>
              <h3 className="text-lg font-bold text-red-700">Counterfeit Detected</h3>
              <p className="text-red-600">This product may not be authentic</p>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">Suspicious Indicators:</h4>
            <ul className="space-y-1">
              {scanResult.product.suspiciousIndicators.map((indicator, index) => (
                <li key={index} className="flex items-center text-sm text-red-600">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  {indicator}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-red-100 p-3 rounded-lg mb-4">
            <p className="text-sm font-medium text-red-700">
              ⚠️ Do not consume this product. Report it to help protect others.
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={reportCounterfeit}
              className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              Report Counterfeit
            </button>
            <button
              onClick={resetScan}
              className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Scan Again
            </button>
          </div>
        </div>
      );
    }

    if (scanState === 'error') {
      return (
        <div className="mt-6 p-6 bg-yellow-50 rounded-xl border border-yellow-200">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-8 h-8 text-yellow-500 mr-3" />
            <div>
              <h3 className="text-lg font-bold text-yellow-700">Scan Error</h3>
              <p className="text-yellow-600">Unable to read the NFC tag</p>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">Try these steps:</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Make sure NFC is enabled on your device</li>
              <li>• Hold your phone closer to the NFC sticker</li>
              <li>• Remove any phone case that might interfere</li>
              <li>• Try scanning from different angles</li>
            </ul>
          </div>
          
          <button
            onClick={resetScan}
            className="w-full py-2 px-4 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <VerifiLogo size={48} className="mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Verification</h2>
        <p className="text-gray-600">
          Scan the NFC tag on your product to verify its authenticity
        </p>
      </div>

      {!isNFCSupported && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center">
            <Wifi className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-sm text-red-700">
              NFC is not supported on this device. Please use a device with NFC capability.
            </p>
          </div>
        </div>
      )}

      {renderScanButton()}
      {renderResult()}

      {/* Instructions */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">How to scan:</h4>
        <ol className="space-y-1 text-sm text-gray-600">
          <li>1. Tap the "Tap to Verify" button above</li>
          <li>2. Hold your phone near the NFC sticker on the product</li>
          <li>3. Wait for the verification result</li>
          <li>4. Earn points for each successful scan!</li>
        </ol>
      </div>
    </div>
  );
};

export default NFCScanner;