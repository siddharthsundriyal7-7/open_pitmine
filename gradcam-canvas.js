/**
 * ROCKFALL AI — Grad-CAM Explainable AI Visualizer
 * Real-time canvas blending, jet colormap rendering, and attention mapping.
 */

class GradCamVisualizer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.baseImage = null;
    this.heatData = null; // 2D intensity grid or centroid list
    this.opacity = 0.65;
    this.mode = 'overlay'; // 'overlay', 'split', 'original', 'heatmap'
    this.splitPos = 0.5; // for split comparison
    this.colorMap = 'jet'; // 'jet' or 'turbo'
  }

  // Generate JET colormap RGBA values for a normalized value (0.0 - 1.0)
  static getJetColor(val) {
    val = Math.max(0, Math.min(1, val));
    let r, g, b;

    if (val < 0.125) {
      r = 0;
      g = 0;
      b = 0.5 + 4 * val;
    } else if (val < 0.375) {
      r = 0;
      g = 4 * (val - 0.125);
      b = 1;
    } else if (val < 0.625) {
      r = 4 * (val - 0.375);
      g = 1;
      b = 1 - 4 * (val - 0.375);
    } else if (val < 0.875) {
      r = 1;
      g = 1 - 4 * (val - 0.625);
      b = 0;
    } else {
      r = 1 - 2 * (val - 0.875);
      g = 0;
      b = 0;
    }

    return [
      Math.floor(r * 255),
      Math.floor(g * 255),
      Math.floor(b * 255)
    ];
  }

  // Load an image from Image object, Canvas, or SVG string
  loadImage(source) {
    return new Promise((resolve) => {
      if (typeof source === 'string' && source.trim().startsWith('<svg')) {
        const img = new Image();
        const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        img.onload = () => {
          this.baseImage = img;
          this.render();
          URL.revokeObjectURL(url);
          resolve();
        };
        img.src = url;
      } else if (source instanceof Image || source instanceof HTMLCanvasElement) {
        this.baseImage = source;
        this.render();
        resolve();
      } else if (typeof source === 'string') {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          this.baseImage = img;
          this.render();
          resolve();
        };
        img.onerror = () => {
          console.warn('Failed to load image:', source);
          resolve();
        };
        img.src = source;
      }
    });
  }

  // Set heatmap configuration
  setHeatmap(heatCentroids, riskLevel = 'HIGH') {
    this.heatCentroids = heatCentroids || [];
    this.riskLevel = riskLevel;
    this.render();
  }

  setOpacity(opacity) {
    this.opacity = Math.max(0, Math.min(1, opacity));
    this.render();
  }

  setMode(mode) {
    this.mode = mode;
    this.render();
  }

  setSplitPosition(pos) {
    this.splitPos = Math.max(0, Math.min(1, pos));
    this.render();
  }

  // Main Render Loop
  render() {
    if (!this.canvas) return;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw original rockface image
    if (this.baseImage) {
      ctx.drawImage(this.baseImage, 0, 0, width, height);
    } else {
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, width, height);
    }

    if (this.mode === 'original') {
      return;
    }

    // 2. Generate Grad-CAM offscreen buffer
    const heatCanvas = document.createElement('canvas');
    heatCanvas.width = width;
    heatCanvas.height = height;
    const heatCtx = heatCanvas.getContext('2d');

    // Create normalized intensity field
    const gridW = 60;
    const gridH = 40;
    const intensityMap = new Float32Array(gridW * gridH);

    const centroids = (this.heatCentroids && this.heatCentroids.length > 0)
      ? this.heatCentroids
      : (this.riskLevel === 'HIGH'
          ? [{ x: 0.55, y: 0.45, radius: 0.35, intensity: 0.95 }]
          : [{ x: 0.5, y: 0.5, radius: 0.15, intensity: 0.25 }]);

    for (let gy = 0; gy < gridH; gy++) {
      const normY = gy / gridH;
      for (let gx = 0; gx < gridW; gx++) {
        const normX = gx / gridW;
        let sum = 0;

        for (const c of centroids) {
          const dx = (normX - c.x);
          const dy = (normY - c.y);
          const dist = Math.sqrt(dx * dx + dy * dy);
          const sigma = c.radius || 0.25;
          const val = (c.intensity || 0.8) * Math.exp(-(dist * dist) / (2 * sigma * sigma));
          sum += val;
        }

        intensityMap[gy * gridW + gx] = Math.min(1.0, sum);
      }
    }

    // Draw colormap into heatCtx
    const imgData = heatCtx.createImageData(width, height);
    const data = imgData.data;

    for (let py = 0; py < height; py++) {
      const gy = (py / height) * (gridH - 1);
      const gy0 = Math.floor(gy);
      const gy1 = Math.min(gridH - 1, gy0 + 1);
      const yFrac = gy - gy0;

      for (let px = 0; px < width; px++) {
        const gx = (px / width) * (gridW - 1);
        const gx0 = Math.floor(gx);
        const gx1 = Math.min(gridW - 1, gx0 + 1);
        const xFrac = gx - gx0;

        // Bilinear interpolation
        const i00 = intensityMap[gy0 * gridW + gx0];
        const i10 = intensityMap[gy0 * gridW + gx1];
        const i01 = intensityMap[gy1 * gridW + gx0];
        const i11 = intensityMap[gy1 * gridW + gx1];

        const top = i00 * (1 - xFrac) + i10 * xFrac;
        const btm = i01 * (1 - xFrac) + i11 * xFrac;
        const normVal = top * (1 - yFrac) + btm * yFrac;

        const pixelIdx = (py * width + px) * 4;
        const [r, g, b] = GradCamVisualizer.getJetColor(normVal);

        data[pixelIdx] = r;
        data[pixelIdx + 1] = g;
        data[pixelIdx + 2] = b;
        // Make lower baseline values transparent so subtle areas let rock show through
        data[pixelIdx + 3] = Math.floor(Math.min(255, normVal * 255 * 1.2));
      }
    }

    heatCtx.putImageData(imgData, 0, 0);

    // 3. Composite according to display mode
    if (this.mode === 'heatmap') {
      ctx.drawImage(heatCanvas, 0, 0);
    } else if (this.mode === 'split') {
      const splitX = Math.floor(width * this.splitPos);

      // Left: Original (already drawn), Right: Heatmap overlay
      ctx.save();
      ctx.beginPath();
      ctx.rect(splitX, 0, width - splitX, height);
      ctx.clip();
      ctx.globalAlpha = this.opacity;
      ctx.drawImage(heatCanvas, 0, 0);
      ctx.restore();

      // Divider line
      ctx.save();
      ctx.strokeStyle = '#ff7a00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, height);
      ctx.stroke();

      // Divider handle icon
      ctx.fillStyle = '#ff7a00';
      ctx.beginPath();
      ctx.arc(splitX, height / 2, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#070a0f';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('< >', splitX, height / 2);
      ctx.restore();
    } else {
      // Standard blended overlay
      ctx.save();
      ctx.globalAlpha = this.opacity;
      ctx.drawImage(heatCanvas, 0, 0);
      ctx.restore();
    }

    // 4. Draw Attention Centroid Reticles if High Risk
    if (this.riskLevel === 'HIGH' && this.mode !== 'original') {
      ctx.save();
      for (const c of centroids) {
        if (c.intensity > 0.7) {
          const cx = c.x * width;
          const cy = c.y * height;

          // Technical crosshair
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy, 22, 0, Math.PI * 2);
          ctx.moveTo(cx - 28, cy);
          ctx.lineTo(cx - 12, cy);
          ctx.moveTo(cx + 12, cy);
          ctx.lineTo(cx + 28, cy);
          ctx.moveTo(cx, cy - 28);
          ctx.lineTo(cx, cy - 12);
          ctx.moveTo(cx, cy + 12);
          ctx.lineTo(cx, cy + 28);
          ctx.stroke();

          // Label
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 10px "JetBrains Mono", monospace';
          ctx.fillText(`ZONE α [ACT: ${(c.intensity * 100).toFixed(0)}%]`, cx + 18, cy - 14);
        }
      }
      ctx.restore();
    }
  }
}

window.GradCamVisualizer = GradCamVisualizer;
