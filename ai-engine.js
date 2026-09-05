/**
 * ROCKFALL AI — AI Risk Analysis Engine (EfficientNet-B0 + Grad-CAM Simulation)
 * Performs feature extraction, risk classification, probability computation,
 * and geotechnical explanation generation.
 */

class RockfallAIEngine {
  constructor() {
    this.modelSpec = window.ROCKFALL_DATA.modelInfo;
    this.isProcessing = false;
  }

  /**
   * Run inference on an image source (Image, Canvas, or Data URL)
   * @param {Object} options - { imageSource, deviceId, source, location, title }
   */
  async analyze(options = {}) {
    this.isProcessing = true;
    const startTime = performance.now();

    // 1. Simulate CUDA GPU preprocessing & forward pass (approx 400-800ms for realistic tactical feedback)
    await new Promise(r => setTimeout(r, 650));

    let risk = 'HIGH';
    let confidence = 96.4;
    let highRiskProb = 96.4;
    let lowRiskProb = 3.6;
    let heatCentroids = [];
    let indicators = {};
    let geologicalSummary = '';

    // If a preset sample is passed or identified, use its geological profile
    if (options.sampleId) {
      const preset = window.ROCKFALL_DATA.samples.find(s => s.id === options.sampleId);
      if (preset) {
        risk = preset.risk;
        confidence = preset.confidence;
        highRiskProb = preset.highRiskProb;
        lowRiskProb = preset.lowRiskProb;
        heatCentroids = preset.heatCentroids;
        indicators = preset.indicators;
        geologicalSummary = preset.geologicalSummary;
      }
    } else if (options.imageElement) {
      // Dynamic pixel analysis of user-uploaded image
      const analysis = this._analyzePixelData(options.imageElement);
      risk = analysis.risk;
      confidence = analysis.confidence;
      highRiskProb = analysis.highRiskProb;
      lowRiskProb = analysis.lowRiskProb;
      heatCentroids = analysis.heatCentroids;
      indicators = analysis.indicators;
      geologicalSummary = analysis.geologicalSummary;
    } else {
      // Default to high risk showcase if unspecified
      risk = 'HIGH';
      confidence = 95.7;
      highRiskProb = 95.7;
      lowRiskProb = 4.3;
      heatCentroids = [
        { x: 0.58, y: 0.42, radius: 0.3, intensity: 0.94 },
        { x: 0.42, y: 0.65, radius: 0.25, intensity: 0.86 }
      ];
      indicators = {
        fracturedStructure: true,
        discontinuityPatterns: true,
        fragmentedSurface: true,
        blockSeparation: true,
        uniformAppearance: false,
        lowComplexity: false
      };
      geologicalSummary = 'Prominent structural discontinuities and fracture networks detected across the scan face. Model attention strongly correlates with potential planar separation zones along the bench profile.';
    }

    const elapsed = Math.round(performance.now() - startTime);
    const cudaLatency = `${(36 + Math.random() * 8).toFixed(1)} ms`;

    this.isProcessing = false;

    return {
      risk,
      confidence,
      highRiskProb,
      lowRiskProb,
      heatCentroids,
      indicators,
      geologicalSummary,
      cudaLatency,
      totalPipelineMs: elapsed,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      deviceId: options.deviceId || 'CAM-01',
      source: options.source || 'CAMERA',
      location: options.location || 'Mine Perimeter Pit Wall',
      title: options.title || 'Rockface Structural Scan'
    };
  }

  /**
   * Fast edge & contrast heuristic on user image to derive realistic Grad-CAM hotspots
   */
  _analyzePixelData(img) {
    const offCanvas = document.createElement('canvas');
    offCanvas.width = 112; // resized for fast heuristic
    offCanvas.height = 112;
    const ctx = offCanvas.getContext('2d');
    ctx.drawImage(img, 0, 0, 112, 112);

    const imgData = ctx.getImageData(0, 0, 112, 112);
    const data = imgData.data;

    let edgeCount = 0;
    let maxGrad = 0;
    let hotX = 0.5;
    let hotY = 0.5;

    // Simple horizontal & vertical gradient
    for (let y = 1; y < 111; y += 2) {
      for (let x = 1; x < 111; x += 2) {
        const idx = (y * 112 + x) * 4;
        const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        const lumRight = 0.299 * data[idx + 4] + 0.587 * data[idx + 5] + 0.114 * data[idx + 6];
        const lumDown = 0.299 * data[idx + 448] + 0.587 * data[idx + 449] + 0.114 * data[idx + 450];

        const grad = Math.abs(lum - lumRight) + Math.abs(lum - lumDown);
        if (grad > 35) {
          edgeCount++;
          if (grad > maxGrad) {
            maxGrad = grad;
            hotX = x / 112;
            hotY = y / 112;
          }
        }
      }
    }

    const complexity = edgeCount / (56 * 56);
    const isHighRisk = complexity > 0.18 || maxGrad > 80;

    let confidence, highProb, lowProb;
    if (isHighRisk) {
      confidence = +(92 + Math.min(6.5, complexity * 15)).toFixed(1);
      highProb = confidence;
      lowProb = +(100 - confidence).toFixed(1);
    } else {
      confidence = +(93 + Math.random() * 5).toFixed(1);
      highProb = +(100 - confidence).toFixed(1);
      lowProb = confidence;
    }

    const heatCentroids = isHighRisk ? [
      { x: hotX, y: hotY, radius: 0.32, intensity: 0.96 },
      { x: Math.max(0.2, 1.0 - hotX), y: Math.min(0.8, hotY + 0.2), radius: 0.25, intensity: 0.82 }
    ] : [
      { x: 0.5, y: 0.5, radius: 0.18, intensity: 0.26 }
    ];

    const indicators = {
      fracturedStructure: isHighRisk,
      discontinuityPatterns: isHighRisk,
      fragmentedSurface: isHighRisk,
      blockSeparation: isHighRisk,
      uniformAppearance: !isHighRisk,
      lowComplexity: !isHighRisk
    };

    const geologicalSummary = isHighRisk
      ? 'Intense feature activation concentrated along identified discontinuity lines and planar shear joints. Evidence of surface fragmentation suggests reduced tensile cohesion and elevated rockfall hazard under operational vibrations.'
      : 'Model attention demonstrates diffuse, low-intensity activation across uniform rock mass. Rock face exhibits intact rock bridge strength and sound structural stability with no daylighting failure wedges detected.';

    return {
      risk: isHighRisk ? 'HIGH' : 'LOW',
      confidence,
      highRiskProb: highProb,
      lowRiskProb: lowProb,
      heatCentroids,
      indicators,
      geologicalSummary
    };
  }
}

window.rockfallAI = new RockfallAIEngine();
