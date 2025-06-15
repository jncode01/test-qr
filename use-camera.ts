import { useState, useEffect, useRef } from 'react';
import { QRScanner, QRScanResult } from '@/lib/qr-scanner';

export function useCamera() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentCamera, setCurrentCamera] = useState<'user' | 'environment'>('environment');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QRScanner | null>(null);

  const handleQRScan = (result: QRScanResult) => {
    setIsScanning(false);
    // This will be handled by the parent component
    if (onScan) {
      onScan(result);
    }
  };

  const [onScan, setOnScan] = useState<((result: QRScanResult) => void) | null>(null);

  const initializeCamera = async () => {
    if (!videoRef.current) return;

    try {
      setError(null);
      
      const scanner = new QRScanner(videoRef.current, handleQRScan);
      scannerRef.current = scanner;
      
      await scanner.start(currentCamera);
      
      setHasPermission(true);
      setIsInitialized(true);
      setHasFlash(scanner.hasFlash());
      
    } catch (err) {
      console.error('Camera initialization failed:', err);
      setError('Camera access denied. Please enable camera permissions.');
      setHasPermission(false);
    }
  };

  const startScanning = () => {
    setIsScanning(true);
  };

  const stopScanning = () => {
    setIsScanning(false);
  };

  const toggleFlash = async () => {
    if (!scannerRef.current) return;
    
    try {
      const flashState = await scannerRef.current.toggleFlash();
      setIsFlashOn(flashState);
    } catch (err) {
      console.error('Flash toggle failed:', err);
    }
  };

  const switchCamera = async () => {
    if (!scannerRef.current) return;
    
    try {
      const newCamera = currentCamera === 'user' ? 'environment' : 'user';
      await scannerRef.current.switchCamera();
      setCurrentCamera(newCamera);
    } catch (err) {
      console.error('Camera switch failed:', err);
      setError('Failed to switch camera');
    }
  };

  const cleanup = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current = null;
    }
    setIsInitialized(false);
    setIsScanning(false);
  };

  useEffect(() => {
    return cleanup;
  }, []);

  return {
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
    cleanup,
    setOnScan
  };
}
