import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Alert,
  Fade,
  Zoom,
} from '@mui/material';
import {
  QrCodeScanner as ScanIcon,
  CameraAlt as CameraIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Report as ReportIcon,
  Share as ShareIcon,
  EmojiEvents as RewardsIcon,
} from '@mui/icons-material';
import ConsumerLayout from './ConsumerLayout';

const ScanPage = () => {
  const [scanMode, setScanMode] = useState('camera'); // 'camera' or 'manual'
  const [scanning, setScanning] = useState(false);
  const [token, setToken] = useState('');
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Start camera
  const startCamera = async () => {
    try {
      setCameraError(false);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScanning(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraError(true);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  // Toggle scan mode
  const toggleScanMode = (mode) => {
    setScanMode(mode);
    if (mode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
  };

  // Handle manual token input
  const handleTokenChange = (e) => {
    setToken(e.target.value);
  };

  // Verify token
  const verifyToken = async () => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock verification result
      // In a real app, this would be an API call to verify the token
      const mockResults = {
        'TOKEN-1-0': {
          status: 'authentic',
          product: {
            name: 'Premium Headphones',
            manufacturer: 'AudioTech Inc.',
            serialNumber: 'SN12345678',
            manufactureDate: '2025-05-15',
            image: 'https://via.placeholder.com/300',
          },
          points: 50,
        },
        'TOKEN-2-0': {
          status: 'suspicious',
          product: {
            name: 'Smart Watch',
            manufacturer: 'TechWear Co.',
            serialNumber: 'SW87654321',
            manufactureDate: '2025-06-20',
            image: 'https://via.placeholder.com/300',
          },
          points: 100,
          warning: 'This product has been verified multiple times in different locations.',
        },
        'TOKEN-3-0': {
          status: 'counterfeit',
          product: {
            name: 'Bluetooth Speaker',
            manufacturer: 'SoundBox Ltd.',
            serialNumber: 'BS11223344',
            manufactureDate: '2025-04-10',
            image: 'https://via.placeholder.com/300',
          },
          points: 200,
          error: 'This product has been identified as counterfeit.',
        },
      };
      
      // Get result based on token or generate a random one
      const tokenToCheck = token || `TOKEN-${Math.floor(Math.random() * 3) + 1}-0`;
      const verificationResult = mockResults[tokenToCheck] || {
        status: Math.random() > 0.7 ? 'counterfeit' : Math.random() > 0.5 ? 'suspicious' : 'authentic',
        product: {
          name: 'Unknown Product',
          manufacturer: 'Unknown Manufacturer',
          serialNumber: 'UNKNOWN',
          manufactureDate: '2025-01-01',
          image: 'https://via.placeholder.com/300',
        },
        points: Math.floor(Math.random() * 100) + 50,
      };
      
      setResult(verificationResult);
      setShowResult(true);
    } catch (error) {
      console.error('Verification error:', error);
      setResult({
        status: 'error',
        error: 'Failed to verify product. Please try again.',
      });
      setShowResult(true);
    } finally {
      setLoading(false);
      stopCamera();
    }
  };

  // Close result dialog
  const handleCloseResult = () => {
    setShowResult(false);
    setResult(null);
    setToken('');
    if (scanMode === 'camera') {
      startCamera();
    }
  };

  // Report counterfeit
  const handleReport = () => {
    // In a real app, this would open a form to report the counterfeit product
    alert('Thank you for reporting this counterfeit product. Our team will investigate.');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <ConsumerLayout title="Scan Product">
      <Box sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            mb: 3,
          }}
        >
          <Typography variant="h5" gutterBottom>
            Verify Product Authenticity
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Scan the QR code on your product or enter the authentication token manually to verify its authenticity.
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Button
              variant={scanMode === 'camera' ? 'contained' : 'outlined'}
              startIcon={<CameraIcon />}
              onClick={() => toggleScanMode('camera')}
              sx={{ mr: 1 }}
            >
              Camera
            </Button>
            <Button
              variant={scanMode === 'manual' ? 'contained' : 'outlined'}
              startIcon={<ScanIcon />}
              onClick={() => toggleScanMode('manual')}
            >
              Manual Entry
            </Button>
          </Box>

          {scanMode === 'camera' ? (
            <Box sx={{ position: 'relative' }}>
              {cameraError ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Unable to access camera. Please check your camera permissions or use manual entry.
                </Alert>
              ) : (
                <>
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      height: 300,
                      bgcolor: 'black',
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}
                  >
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '70%',
                        height: '70%',
                        border: '2px solid',
                        borderColor: 'primary.main',
                        borderRadius: 1,
                        boxShadow: '0 0 0 5000px rgba(0, 0, 0, 0.5)',
                      }}
                    />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                  </Box>
                  <Typography
                    variant="body2"
                    align="center"
                    sx={{ mt: 2, color: 'text.secondary' }}
                  >
                    Position the QR code within the frame
                  </Typography>
                </>
              )}
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Authentication Token"
                variant="outlined"
                value={token}
                onChange={handleTokenChange}
                placeholder="Enter the token printed on your product"
                sx={{ mb: 2 }}
              />
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ScanIcon />}
              onClick={verifyToken}
              disabled={loading || (scanMode === 'manual' && !token)}
              sx={{ px: 4 }}
            >
              {loading ? 'Verifying...' : 'Verify Product'}
            </Button>
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="subtitle1" gutterBottom>
            Why Verify Products?
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Counterfeit products can be dangerous, ineffective, and harmful to the economy. By verifying your products, you:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CheckCircleIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="body2">Ensure your safety and product quality</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CheckCircleIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="body2">Support legitimate businesses</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CheckCircleIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="body2">Earn rewards for each verification</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CheckCircleIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="body2">Help combat counterfeiting</Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Verification Result Dialog */}
      <Dialog
        open={showResult}
        onClose={handleCloseResult}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Zoom}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Verification Result</Typography>
            <IconButton onClick={handleCloseResult} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {result && (
            <>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  mb: 2,
                  mt: 1,
                }}
              >
                <Fade in={true} timeout={800}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor:
                        result.status === 'authentic'
                          ? 'success.light'
                          : result.status === 'suspicious'
                          ? 'warning.light'
                          : 'error.light',
                    }}
                  >
                    {result.status === 'authentic' ? (
                      <CheckCircleIcon sx={{ fontSize: 50, color: 'success.main' }} />
                    ) : result.status === 'suspicious' ? (
                      <WarningIcon sx={{ fontSize: 50, color: 'warning.main' }} />
                    ) : (
                      <ErrorIcon sx={{ fontSize: 50, color: 'error.main' }} />
                    )}
                  </Box>
                </Fade>
              </Box>

              <Typography
                variant="h5"
                align="center"
                color={
                  result.status === 'authentic'
                    ? 'success.main'
                    : result.status === 'suspicious'
                    ? 'warning.main'
                    : 'error.main'
                }
                gutterBottom
              >
                {result.status === 'authentic'
                  ? 'Authentic Product'
                  : result.status === 'suspicious'
                  ? 'Suspicious Product'
                  : 'Counterfeit Product'}
              </Typography>

              {(result.warning || result.error) && (
                <Alert
                  severity={result.status === 'suspicious' ? 'warning' : 'error'}
                  sx={{ mb: 3 }}
                >
                  {result.warning || result.error}
                </Alert>
              )}

              {result.product && (
                <Card
                  elevation={0}
                  sx={{
                    mb: 3,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <CardMedia
                    component="img"
                    height="200"
                    image={result.product.image}
                    alt={result.product.name}
                  />
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {result.product.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Manufacturer: {result.product.manufacturer}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2">
                        Serial Number: {result.product.serialNumber}
                      </Typography>
                      <Typography variant="body2">
                        Manufacture Date: {result.product.manufactureDate}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {result.status === 'authentic' && result.points && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'success.light',
                      color: 'success.contrastText',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <RewardsIcon sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">
                      You earned {result.points} points!
                    </Typography>
                  </Paper>
                </Box>
              )}

              {result.status === 'counterfeit' && (
                <Box sx={{ mb: 3 }}>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<ReportIcon />}
                    fullWidth
                    onClick={handleReport}
                  >
                    Report Counterfeit
                  </Button>
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Tooltip title="Share Result">
                  <IconButton color="primary">
                    <ShareIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResult}>Close</Button>
        </DialogActions>
      </Dialog>
    </ConsumerLayout>
  );
};

export default ScanPage;