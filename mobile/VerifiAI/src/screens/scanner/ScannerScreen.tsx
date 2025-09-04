/**
 * Scanner Screen - Advanced QR/Barcode Scanner with AI
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { RNCamera } from 'react-native-camera';
import QRCodeScanner from 'react-native-qrcode-scanner';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import HapticFeedback from 'react-native-haptic-feedback';
import { useNavigation } from '@react-navigation/native';
import { useMutation } from 'react-query';

import { validateProduct } from '../../api/productApi';
import { useAuth } from '../../contexts/AuthContext';
import LoadingOverlay from '../../components/LoadingOverlay';
import ScannerOverlay from '../../components/scanner/ScannerOverlay';
import { playSound } from '../../utils/soundUtils';

const { width, height } = Dimensions.get('window');

const ScannerScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const scannerRef = useRef(null);
  
  const [isScanning, setIsScanning] = useState(true);
  const [flashMode, setFlashMode] = useState(false);
  const [scanAnimation] = useState(new Animated.Value(0));
  const [recentScans, setRecentScans] = useState([]);

  // Validation mutation
  const validateMutation = useMutation(validateProduct, {
    onSuccess: (data) => {
      // Success feedback
      HapticFeedback.trigger('notificationSuccess');
      playSound('success');
      
      // Navigate to result
      navigation.navigate('ValidationResult', { 
        validation: data,
        product: data.product,
      });
    },
    onError: (error) => {
      // Error feedback
      HapticFeedback.trigger('notificationError');
      playSound('error');
      
      Alert.alert(
        'Validation Failed',
        error.message || 'Unable to validate product. Please try again.',
        [
          { 
            text: 'OK', 
            onPress: () => {
              setIsScanning(true);
              scannerRef.current?.reactivate();
            }
          }
        ]
      );
    },
  });

  // Start scan animation
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Handle successful scan
  const onSuccess = useCallback(async (e) => {
    if (!isScanning) return;
    
    setIsScanning(false);
    Vibration.vibrate(100);
    
    // Extract data from QR code
    const scanData = e.data;
    
    try {
      // Parse QR data (could be JSON or simple string)
      let productData;
      try {
        productData = JSON.parse(scanData);
      } catch {
        // Assume it's a product ID
        productData = { productId: scanData };
      }
      
      // Add to recent scans
      setRecentScans(prev => [
        { id: Date.now(), data: productData, timestamp: new Date() },
        ...prev.slice(0, 4)
      ]);
      
      // Validate product
      validateMutation.mutate({
        productId: productData.productId || productData.id,
        qrData: scanData,
        location: user?.location,
        userId: user?.id,
      });
      
    } catch (error) {
      Alert.alert('Invalid QR Code', 'The scanned code is not valid.');
      setIsScanning(true);
      scannerRef.current?.reactivate();
    }
  }, [isScanning, user, validateMutation]);

  // Toggle flash
  const toggleFlash = () => {
    setFlashMode(!flashMode);
    HapticFeedback.trigger('impactLight');
  };

  // Switch to AR scanner
  const openARScanner = () => {
    navigation.navigate('ARScanner');
  };

  // View scan history
  const viewHistory = () => {
    navigation.navigate('History');
  };

  return (
    <View style={styles.container}>
      <QRCodeScanner
        ref={scannerRef}
        onRead={onSuccess}
        flashMode={flashMode ? RNCamera.Constants.FlashMode.torch : RNCamera.Constants.FlashMode.off}
        topContent={
          <View style={styles.topContent}>
            <Text style={styles.title}>Scan Product Code</Text>
            <Text style={styles.subtitle}>
              Position the QR code or barcode within the frame
            </Text>
          </View>
        }
        bottomContent={
          <View style={styles.bottomContent}>
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={toggleFlash}
              >
                <Icon 
                  name={flashMode ? 'flash-on' : 'flash-off'} 
                  size={24} 
                  color="#fff" 
                />
                <Text style={styles.actionButtonText}>Flash</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={openARScanner}
              >
                <Icon name="view-in-ar" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>AR Mode</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={viewHistory}
              >
                <Icon name="history" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>History</Text>
              </TouchableOpacity>
            </View>
            
            {recentScans.length > 0 && (
              <View style={styles.recentScans}>
                <Text style={styles.recentScansTitle}>Recent Scans</Text>
                <View style={styles.recentScansList}>
                  {recentScans.map((scan) => (
                    <TouchableOpacity 
                      key={scan.id}
                      style={styles.recentScanItem}
                      onPress={() => {
                        validateMutation.mutate({
                          productId: scan.data.productId || scan.data.id,
                          qrData: JSON.stringify(scan.data),
                          location: user?.location,
                          userId: user?.id,
                        });
                      }}
                    >
                      <Icon name="qr-code" size={16} color="#666" />
                      <Text style={styles.recentScanText} numberOfLines={1}>
                        {scan.data.productId || scan.data.id || 'Unknown'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        }
        showMarker={false}
        cameraStyle={styles.camera}
        customMarker={
          <ScannerOverlay 
            width={width * 0.7} 
            height={width * 0.7}
            animatedValue={scanAnimation}
          />
        }
      />
      
      {validateMutation.isLoading && (
        <LoadingOverlay message="Validating product..." />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    height: height,
  },
  topContent: {
    flex: 0.2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
  },
  bottomContent: {
    flex: 0.3,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  actionButton: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(30, 142, 62, 0.8)',
    borderRadius: 10,
    minWidth: 80,
  },
  actionButtonText: {
    color: '#fff',
    marginTop: 5,
    fontSize: 12,
  },
  recentScans: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
  },
  recentScansTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  recentScansList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  recentScanItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    gap: 5,
  },
  recentScanText: {
    color: '#fff',
    fontSize: 12,
    maxWidth: 100,
  },
});

export default ScannerScreen;