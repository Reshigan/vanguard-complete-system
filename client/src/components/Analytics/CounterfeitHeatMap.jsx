import React, { useState, useEffect, useRef } from 'react';
import { Map, Layers, Filter, Download, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';

const CounterfeitHeatMap = () => {
  const [heatmapData, setHeatmapData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30days');
  const [zoomLevel, setZoomLevel] = useState('country');
  const [selectedRegion, setSelectedRegion] = useState(null);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    fetchHeatmapData();
  }, [timeframe, zoomLevel]);

  useEffect(() => {
    if (heatmapData.length > 0 && mapContainerRef.current) {
      initializeMap();
    }
  }, [heatmapData]);

  const fetchHeatmapData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/analytics/heatmap/counterfeits?timeframe=${timeframe}&zoom=${zoomLevel}`);
      setHeatmapData(response.data.data);
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeMap = () => {
    // In production, integrate with a real mapping library like Mapbox or Google Maps
    // For now, we'll create a simple visualization
    if (!mapContainerRef.current) return;

    // Clear existing content
    mapContainerRef.current.innerHTML = '';

    // Create SVG visualization
    const width = mapContainerRef.current.clientWidth;
    const height = mapContainerRef.current.clientHeight;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.style.background = '#f3f4f6';

    // Create heat points
    heatmapData.forEach((point, index) => {
      const x = zoomLevel === 'country' 
        ? (index * 100 + 50) % width 
        : (point.longitude + 180) * (width / 360);
      const y = zoomLevel === 'country'
        ? Math.floor(index / (width / 100)) * 100 + 50
        : (90 - point.latitude) * (height / 180);

      const intensity = zoomLevel === 'country' ? point.count : point.intensity;
      const radius = Math.min(50, Math.max(20, intensity * 2));
      const opacity = Math.min(0.8, intensity / 100);

      // Create gradient for heat effect
      const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
      gradient.setAttribute('id', `gradient-${index}`);
      
      const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop1.setAttribute('offset', '0%');
      stop1.setAttribute('stop-color', '#ef4444');
      stop1.setAttribute('stop-opacity', opacity);
      
      const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop2.setAttribute('offset', '100%');
      stop2.setAttribute('stop-color', '#ef4444');
      stop2.setAttribute('stop-opacity', '0');
      
      gradient.appendChild(stop1);
      gradient.appendChild(stop2);
      svg.appendChild(gradient);

      // Create circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', radius);
      circle.setAttribute('fill', `url(#gradient-${index})`);
      circle.style.cursor = 'pointer';
      
      // Add interaction
      circle.addEventListener('click', () => {
        setSelectedRegion(point);
      });

      svg.appendChild(circle);

      // Add label for country view
      if (zoomLevel === 'country' && point.country) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dy', '0.3em');
        text.style.fontSize = '12px';
        text.style.fontWeight = 'bold';
        text.style.fill = '#1f2937';
        text.textContent = point.country;
        svg.appendChild(text);
      }
    });

    mapContainerRef.current.appendChild(svg);
  };

  const exportHeatmap = () => {
    // In production, implement actual export functionality
    alert('Exporting heatmap data...');
  };

  const getIntensityColor = (intensity) => {
    if (intensity > 75) return 'text-red-600';
    if (intensity > 50) return 'text-orange-600';
    if (intensity > 25) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Counterfeit Heat Map</h2>
            <p className="text-sm text-gray-500">Geographic distribution of counterfeit reports</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Timeframe Selector */}
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="1year">Last Year</option>
            </select>

            {/* Zoom Level */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setZoomLevel('country')}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  zoomLevel === 'country' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Country
              </button>
              <button
                onClick={() => setZoomLevel('city')}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  zoomLevel === 'city' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                City
              </button>
            </div>

            {/* Actions */}
            <button
              onClick={fetchHeatmapData}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={exportHeatmap}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Download className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Map Container */}
        <div className="flex-1 relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div ref={mapContainerRef} className="w-full h-full" />
              
              {/* Map Controls */}
              <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-2 space-y-2">
                <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                  <ZoomIn className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                  <ZoomOut className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                  <Layers className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Legend */}
              <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4">
                <h3 className="text-sm font-semibold mb-2">Intensity Scale</h3>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-600 rounded-full opacity-80"></div>
                    <span className="text-xs">High (>75 reports)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-orange-600 rounded-full opacity-60"></div>
                    <span className="text-xs">Medium (26-75)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-yellow-600 rounded-full opacity-40"></div>
                    <span className="text-xs">Low (11-25)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-600 rounded-full opacity-20"></div>
                    <span className="text-xs">Minimal (1-10)</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Side Panel */}
        <div className="w-80 bg-white border-l overflow-y-auto">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Hotspot Analysis</h3>
          </div>
          
          {selectedRegion ? (
            <div className="p-4 space-y-4">
              <div>
                <h4 className="font-medium mb-2">
                  {selectedRegion.country || `Location: ${selectedRegion.latitude.toFixed(2)}, ${selectedRegion.longitude.toFixed(2)}`}
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Reports:</span>
                    <span className={`font-semibold ${getIntensityColor(selectedRegion.count || selectedRegion.intensity)}`}>
                      {selectedRegion.count || selectedRegion.intensity}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Risk Level:</span>
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                      High
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Recent Activity</h4>
                <div className="space-y-2">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium">3 new reports today</p>
                    <p className="text-xs text-gray-500">15% increase from yesterday</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium">2 investigations ongoing</p>
                    <p className="text-xs text-gray-500">Started 2 days ago</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Recommended Actions</h4>
                <div className="space-y-2">
                  <button className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                    Deploy Investigation Team
                  </button>
                  <button className="w-full px-3 py-2 bg-gray-200 text-gray-800 rounded-lg text-sm hover:bg-gray-300">
                    Alert Local Authorities
                  </button>
                  <button className="w-full px-3 py-2 bg-gray-200 text-gray-800 rounded-lg text-sm hover:bg-gray-300">
                    Increase Monitoring
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Global Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Reports:</span>
                      <span className="font-semibold">
                        {heatmapData.reduce((sum, point) => sum + (point.count || point.intensity || 0), 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Hotspots:</span>
                      <span className="font-semibold">{heatmapData.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">High Risk Areas:</span>
                      <span className="font-semibold text-red-600">
                        {heatmapData.filter(p => (p.count || p.intensity) > 75).length}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Top Hotspots</h4>
                  <div className="space-y-2">
                    {heatmapData
                      .sort((a, b) => (b.count || b.intensity) - (a.count || a.intensity))
                      .slice(0, 5)
                      .map((point, index) => (
                        <div
                          key={index}
                          className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                          onClick={() => setSelectedRegion(point)}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">
                              {point.country || `Location ${index + 1}`}
                            </span>
                            <span className={`font-semibold ${getIntensityColor(point.count || point.intensity)}`}>
                              {point.count || point.intensity}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-1">Tip</h4>
                  <p className="text-sm text-blue-700">
                    Click on any hotspot to view detailed information and recommended actions.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CounterfeitHeatMap;