import jsQR from 'jsqr';

export interface QRScanResult {
  data: string;
  location?: {
    topLeftCorner: { x: number; y: number };
    topRightCorner: { x: number; y: number };
    bottomLeftCorner: { x: number; y: number };
    bottomRightCorner: { x: number; y: number };
  };
}

export class QRScanner {
  private video: HTMLVideoElement;
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private stream: MediaStream | null = null;
  private animationId: number | null = null;
  private onScan: (result: QRScanResult) => void;
  private isScanning = false;
  private currentFacingMode: 'user' | 'environment' = 'environment';

  constructor(video: HTMLVideoElement, onScan: (result: QRScanResult) => void) {
    this.video = video;
    this.onScan = onScan;
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d')!;
  }

  async start(facingMode: 'user' | 'environment' = 'environment'): Promise<void> {
    try {
      this.currentFacingMode = facingMode;
      
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      this.video.srcObject = this.stream;
      await this.video.play();
      
      this.isScanning = true;
      this.scan();
    } catch (error) {
      console.error('Failed to start camera:', error);
      throw error;
    }
  }

  stop(): void {
    this.isScanning = false;
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  async switchCamera(): Promise<void> {
    const newFacingMode = this.currentFacingMode === 'user' ? 'environment' : 'user';
    await this.start(newFacingMode);
  }

  async toggleFlash(): Promise<boolean> {
    if (!this.stream) return false;

    const track = this.stream.getVideoTracks()[0];
    const capabilities = track.getCapabilities();

    if (capabilities.torch) {
      const constraints = track.getConstraints();
      const currentTorch = constraints.torch || false;
      
      await track.applyConstraints({
        torch: !currentTorch
      });
      
      return !currentTorch;
    }

    return false;
  }

  hasFlash(): boolean {
    if (!this.stream) return false;
    
    const track = this.stream.getVideoTracks()[0];
    const capabilities = track.getCapabilities();
    
    return !!capabilities.torch;
  }

  private scan(): void {
    if (!this.isScanning) return;

    if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
      this.canvas.width = this.video.videoWidth;
      this.canvas.height = this.video.videoHeight;
      
      this.context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
      
      const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      
      if (code) {
        this.onScan({
          data: code.data,
          location: code.location
        });
        return;
      }
    }

    this.animationId = requestAnimationFrame(() => this.scan());
  }
}
