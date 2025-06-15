import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useCamera } from '@/hooks/use-camera';
import { QRScanResult } from '@/lib/qr-scanner';
import { 
  Camera, 
  Flashlight, 
  FlipHorizontal, 
  HelpCircle, 
  X, 
  Check, 
  AlertTriangle,
  Loader2,
  QrCode
} from 'lucide-react';

export default function QRScanner() {
  const {
    videoRef,
    isInitialized,
    isScanning,
    hasPermission,
    hasFlash,
    isFlashOn,
    error,
    currentCamera,
    initializeCamera,
    startScanning,
    stopScanning,
    toggleFlash,
    switchCamera,
    setOnScan
  } = useCamera();

  const [showLoading, setShowLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showPermission, setShowPermission] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [scannedData, setScannedData] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleQRDetected = async (result: QRScanResult) => {
    stopScanning();
    setShowLoading(true);
    
    try {
      const response = await fetch('https://jncode01.app.n8n.cloud/webhook/3a1418f7-3e63-4175-ab5f-901ab7567cb4', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qr_data: result.data,
          timestamp: new Date().toISOString(),
          device_info: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            camera: currentCamera
          }
        })
      });

      setShowLoading(false);
      
      if (response.ok) {
        setScannedData(result.data);
        setShowSuccess(true);
      } else {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
    } catch (err) {
      console.error('Failed to send QR data:', err);
      setShowLoading(false);
      setErrorMessage('Failed to send data to server. Please check your connection and try again.');
      setShowError(true);
    }
  };

  useEffect(() => {
    setOnScan(handleQRDetected);
  }, [setOnScan, currentCamera]);

  useEffect(() => {
    if (!hasPermission && !isInitialized) {
      setShowPermission(true);
    }
  }, [hasPermission, isInitialized]);

  const handleScanToggle = () => {
    if (isScanning) {
      stopScanning();
    } else {
      startScanning();
    }
  };

  const handleContinueScanning = () => {
    setShowSuccess(false);
    startScanning();
  };

  const handleRetry = () => {
    setShowError(false);
    startScanning();
  };

  const handleRequestPermission = () => {
    setShowPermission(false);
    initializeCamera();
  };

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      {/* Camera View */}
      <div className="absolute inset-0 bg-black">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          muted
          playsInline
        />
        
        {/* Scanning Overlay */}
        <div className="absolute inset-0 scan-overlay pointer-events-none">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="relative w-64 h-64 border-2 border-white rounded-2xl">
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 w-8 h-8 border-l-4 border-t-4 border-blue-500 rounded-tl-lg"></div>
              <div className="absolute -top-1 -right-1 w-8 h-8 border-r-4 border-t-4 border-blue-500 rounded-tr-lg"></div>
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-l-4 border-b-4 border-blue-500 rounded-bl-lg"></div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-r-4 border-b-4 border-blue-500 rounded-br-lg"></div>
              
              {/* Scanning line */}
              <div className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent ${
                isScanning ? 'animate-scan-line opacity-100' : 'opacity-0'
              }`}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-4 pt-12 z-10">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-semibold">QR Scanner</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 text-white"
            onClick={() => setShowHelp(true)}
          >
            <HelpCircle className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pb-8 z-10">
        <div className="flex flex-col items-center space-y-4">
          {/* Status Text */}
          <div className="text-center text-white">
            <p className="text-lg font-medium mb-1">
              {isScanning ? 'Scanning for QR codes...' : 'Position QR code within frame'}
            </p>
            <p className="text-sm text-gray-300">Make sure the code is well lit and in focus</p>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center space-x-6">
            {/* Flash Toggle */}
            {hasFlash && (
              <Button
                variant="ghost"
                size="icon"
                className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 text-white"
                onClick={toggleFlash}
              >
                <Flashlight className={`w-5 h-5 ${isFlashOn ? 'fill-current' : ''}`} />
              </Button>
            )}

            {/* Scan Button */}
            <Button
              variant="ghost"
              size="icon"
              className="relative w-20 h-20 bg-blue-600 rounded-full hover:bg-blue-700 text-white shadow-lg"
              onClick={handleScanToggle}
              disabled={!isInitialized}
            >
              <div className="absolute inset-0 bg-blue-400 rounded-full animate-pulse-ring"></div>
              {isScanning ? (
                <div className="w-6 h-6 bg-white rounded-sm relative z-10"></div>
              ) : (
                <Camera className="w-6 h-6 relative z-10" />
              )}
            </Button>

            {/* Camera Flip */}
            <Button
              variant="ghost"
              size="icon"
              className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 text-white"
              onClick={switchCamera}
            >
              <FlipHorizontal className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      <Dialog open={showLoading} onOpenChange={setShowLoading}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <div className="text-center py-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Processing QR Code</h3>
            <p className="text-gray-600 text-sm">Sending data to server...</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">QR Code Read Successfully!</h3>
            <p className="text-gray-600 text-sm mb-4">Data has been sent to the server.</p>
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-500 mb-1">Scanned Data:</p>
              <p className="text-sm font-medium text-gray-800 break-all">{scannedData}</p>
            </div>
            <Button onClick={handleContinueScanning} className="w-full">
              Continue Scanning
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Modal */}
      <Dialog open={showError} onOpenChange={setShowError}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Scan Failed</h3>
            <p className="text-gray-600 text-sm mb-4">{errorMessage}</p>
            <Button onClick={handleRetry} variant="destructive" className="w-full">
              Try Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Permission Modal */}
      <Dialog open={showPermission} onOpenChange={setShowPermission}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Camera Access Required</h3>
            <p className="text-gray-600 text-sm mb-4">
              We need access to your camera to scan QR codes. Please allow camera permission when prompted.
            </p>
            <Button onClick={handleRequestPermission} className="w-full">
              Enable Camera
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Help Modal */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-md mx-4 rounded-2xl">
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">How to Scan</h3>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 bg-gray-100 rounded-full hover:bg-gray-200"
                onClick={() => setShowHelp(false)}
              >
                <X className="w-4 h-4 text-gray-600" />
              </Button>
            </div>
            <div className="space-y-4 text-sm text-gray-600">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600">1</span>
                </div>
                <p>Position the QR code within the scanning frame</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600">2</span>
                </div>
                <p>Ensure good lighting and keep the camera steady</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600">3</span>
                </div>
                <p>The QR code will be automatically detected and processed</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
