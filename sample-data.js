/**
 * ROCKFALL AI — Sample Data & Geological Rockface Synthesizer
 * Provides realistic rockface samples, telemetry presets, and historical detections.
 */

window.ROCKFALL_DATA = {
  // AI Model Specifications
  modelInfo: {
    architecture: 'EfficientNet-B0',
    validationAccuracy: 97.09,
    datasetImages: 2764,
    riskClasses: 2,
    inputResolution: '224 × 224',
    accelerationDevice: 'CUDA (NVIDIA RTX TensorRT)',
    explainability: 'Grad-CAM (Gradient-weighted Class Activation Mapping)',
    inferenceLatency: '38.4 ms',
    precision: 96.8,
    recall: 97.4,
    f1Score: 97.1,
    aucRoc: 0.991
  },

  // Sample Rockface Images with realistic geological features
  samples: [
    {
      id: 'sample-high-01',
      title: 'Bench 14 - Fractured Shear Wall',
      source: 'DRONE',
      deviceId: 'UAV-01',
      location: 'Open Pit North Wall - Sector B-4',
      risk: 'HIGH',
      confidence: 96.4,
      highRiskProb: 96.4,
      lowRiskProb: 3.6,
      timestamp: '2026-09-05 14:42:18',
      type: 'high',
      geologicalSummary: 'Severe sub-vertical fracturing and pervasive joint sets observed along the Bench 14 toe. High density of discontinuity-like patterns with visible daylighting fractures and potential planar sliding hazards.',
      indicators: {
        fracturedStructure: true,
        discontinuityPatterns: true,
        fragmentedSurface: true,
        blockSeparation: true,
        uniformAppearance: false,
        lowComplexity: false
      },
      heatCentroids: [
        { x: 0.62, y: 0.44, radius: 0.32, intensity: 0.98 },
        { x: 0.45, y: 0.68, radius: 0.28, intensity: 0.88 },
        { x: 0.75, y: 0.52, radius: 0.22, intensity: 0.79 }
      ],
      svgRock: `
        <svg viewBox="0 0 600 400" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="rockBase1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#2d2822"/>
              <stop offset="50%" stop-color="#473f35"/>
              <stop offset="100%" stop-color="#1f1b17"/>
            </linearGradient>
            <filter id="rockNoise" x="0%" y="0%" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="4" result="noise"/>
              <feDiffuseLighting in="noise" lighting-color="#eed8be" surfaceScale="2" result="light">
                <feDistantLight azimuth="45" elevation="60"/>
              </feDiffuseLighting>
              <feBlend mode="multiply" in="SourceGraphic" in2="light"/>
            </filter>
          </defs>
          <rect width="600" height="400" fill="url(#rockBase1)" filter="url(#rockNoise)"/>
          <!-- Severe fractures & discontinuities -->
          <path d="M 80 20 Q 150 90 220 140 T 360 210 Q 420 280 480 390" stroke="#0e0b08" stroke-width="7" fill="none" stroke-linecap="round"/>
          <path d="M 220 140 Q 300 130 380 180 T 520 220" stroke="#0b0907" stroke-width="6" fill="none"/>
          <path d="M 360 210 Q 340 280 350 380" stroke="#120e0a" stroke-width="5" fill="none"/>
          <path d="M 120 180 Q 200 240 260 360" stroke="#1a140f" stroke-width="4" fill="none"/>
          <!-- Block separation wedge -->
          <polygon points="340,160 460,190 420,290 310,250" fill="rgba(30,24,18,0.7)" stroke="#050403" stroke-width="3"/>
          <path d="M 460 190 L 550 210 L 510 320" stroke="#0e0b08" stroke-width="5" fill="none"/>
          <line x1="280" y1="90" x2="330" y2="130" stroke="#080605" stroke-width="4"/>
          <!-- Shattered talus at base -->
          <polygon points="180,330 220,310 250,350 200,370" fill="#3a3229" stroke="#16120e"/>
          <polygon points="320,340 370,320 400,360 340,380" fill="#443a2f" stroke="#16120e"/>
          <polygon points="430,320 490,310 520,370 450,380" fill="#352e25" stroke="#16120e"/>
          <!-- Geotech HUD annotation -->
          <text x="20" y="30" fill="#ff7a00" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="bold">BENCH 14 SEC-B4 [HIGH DISCONTINUITY DENSITY]</text>
        </svg>`
    },
    {
      id: 'sample-high-02',
      title: 'Haul Road East Cut - Overhang Wedge',
      source: 'CAMERA',
      deviceId: 'CAM-02',
      location: 'Haul Road East - MP 4.2',
      risk: 'HIGH',
      confidence: 94.8,
      highRiskProb: 94.8,
      lowRiskProb: 5.2,
      timestamp: '2026-09-05 15:10:02',
      type: 'high',
      geologicalSummary: 'Unstable overhang rock wedge identified above the primary haul road artery. Open tension gashes along the crest with high probability of toppling failure during heavy haul truck vibration.',
      indicators: {
        fracturedStructure: true,
        discontinuityPatterns: true,
        fragmentedSurface: true,
        blockSeparation: true,
        uniformAppearance: false,
        lowComplexity: false
      },
      heatCentroids: [
        { x: 0.38, y: 0.35, radius: 0.35, intensity: 0.95 },
        { x: 0.55, y: 0.50, radius: 0.25, intensity: 0.82 }
      ],
      svgRock: `
        <svg viewBox="0 0 600 400" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="rockBase2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#3b352d"/>
              <stop offset="50%" stop-color="#4a4238"/>
              <stop offset="100%" stop-color="#24201a"/>
            </linearGradient>
            <filter id="noise2">
              <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="4" result="noise"/>
              <feDiffuseLighting in="noise" lighting-color="#dfcfb8" surfaceScale="2.5" result="light">
                <feDistantLight azimuth="55" elevation="50"/>
              </feDiffuseLighting>
              <feBlend mode="multiply" in="SourceGraphic" in2="light"/>
            </filter>
          </defs>
          <rect width="600" height="400" fill="url(#rockBase2)" filter="url(#noise2)"/>
          <!-- Wedge overhang fractures -->
          <path d="M 50 80 Q 180 60 280 120 T 450 160 Q 520 220 580 320" stroke="#080605" stroke-width="8" fill="none"/>
          <path d="M 160 110 L 220 280 L 320 310" stroke="#120e0b" stroke-width="6" fill="none"/>
          <polygon points="120,70 280,120 210,270 90,200" fill="rgba(25,20,15,0.85)" stroke="#050302" stroke-width="4"/>
          <line x1="280" y1="120" x2="360" y2="240" stroke="#0a0806" stroke-width="5"/>
          <line x1="360" y1="240" x2="480" y2="260" stroke="#0e0a07" stroke-width="4"/>
          <!-- Tension cracks at crest -->
          <line x1="140" y1="30" x2="160" y2="70" stroke="#0a0806" stroke-width="4"/>
          <line x1="190" y1="20" x2="210" y2="60" stroke="#0a0806" stroke-width="4"/>
          <line x1="240" y1="35" x2="260" y2="85" stroke="#0a0806" stroke-width="4"/>
          <text x="20" y="30" fill="#ef4444" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="bold">HAUL-RD CAM-02 [OVERHANG TENSION CREST CRACK]</text>
        </svg>`
    },
    {
      id: 'sample-low-01',
      title: 'South Pit Wall - Stable Granodiorite',
      source: 'DRONE',
      deviceId: 'UAV-01',
      location: 'South Pit Wall - Sector A-1',
      risk: 'LOW',
      confidence: 97.2,
      highRiskProb: 2.8,
      lowRiskProb: 97.2,
      timestamp: '2026-09-05 13:15:40',
      type: 'low',
      geologicalSummary: 'Uniform monolithic granodiorite rock mass. Clean rock face with very low discontinuity frequency, tight interlocking joints, and no daylighting shear planes detected. Favorable structural stability.',
      indicators: {
        fracturedStructure: false,
        discontinuityPatterns: false,
        fragmentedSurface: false,
        blockSeparation: false,
        uniformAppearance: true,
        lowComplexity: true
      },
      heatCentroids: [
        { x: 0.48, y: 0.52, radius: 0.18, intensity: 0.28 }
      ],
      svgRock: `
        <svg viewBox="0 0 600 400" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="rockLow1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#4f5358"/>
              <stop offset="50%" stop-color="#60666d"/>
              <stop offset="100%" stop-color="#3c4045"/>
            </linearGradient>
            <filter id="noiseLow1">
              <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise"/>
              <feDiffuseLighting in="noise" lighting-color="#d6dadf" surfaceScale="1.2" result="light">
                <feDistantLight azimuth="45" elevation="75"/>
              </feDiffuseLighting>
              <feBlend mode="multiply" in="SourceGraphic" in2="light"/>
            </filter>
          </defs>
          <rect width="600" height="400" fill="url(#rockLow1)" filter="url(#noiseLow1)"/>
          <!-- Very subtle stable joint traces, no open gaps -->
          <path d="M 60 120 Q 220 130 380 140 T 560 150" stroke="#2d3034" stroke-width="1.5" fill="none" opacity="0.45"/>
          <path d="M 40 260 Q 280 270 540 280" stroke="#292c30" stroke-width="1.5" fill="none" opacity="0.45"/>
          <!-- Stable pre-split blast half-barrels -->
          <line x1="120" y1="40" x2="120" y2="360" stroke="#373b40" stroke-width="2" stroke-dasharray="12,6" opacity="0.6"/>
          <line x1="240" y1="40" x2="240" y2="360" stroke="#373b40" stroke-width="2" stroke-dasharray="12,6" opacity="0.6"/>
          <line x1="360" y1="40" x2="360" y2="360" stroke="#373b40" stroke-width="2" stroke-dasharray="12,6" opacity="0.6"/>
          <line x1="480" y1="40" x2="480" y2="360" stroke="#373b40" stroke-width="2" stroke-dasharray="12,6" opacity="0.6"/>
          <text x="20" y="30" fill="#10b981" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="bold">SECTOR A-1 [MONOLITHIC INTACT ROCK - SOUND BEDDING]</text>
        </svg>`
    },
    {
      id: 'sample-low-02',
      title: 'North Bench Crusher Access - Competent Basalt',
      source: 'CAMERA',
      deviceId: 'CAM-01',
      location: 'Primary Crusher Wall - Sector D-3',
      risk: 'LOW',
      confidence: 98.1,
      highRiskProb: 1.9,
      lowRiskProb: 98.1,
      timestamp: '2026-09-05 14:02:50',
      type: 'low',
      geologicalSummary: 'Competent columnar basalt formation with sound compressive strength. Tight interlocking block geometry without displacement or shear movement. Surface roughness provides high friction resistance.',
      indicators: {
        fracturedStructure: false,
        discontinuityPatterns: false,
        fragmentedSurface: false,
        blockSeparation: false,
        uniformAppearance: true,
        lowComplexity: true
      },
      heatCentroids: [
        { x: 0.50, y: 0.45, radius: 0.15, intensity: 0.22 }
      ],
      svgRock: `
        <svg viewBox="0 0 600 400" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="rockLow2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#3a3c3d"/>
              <stop offset="50%" stop-color="#474a4c"/>
              <stop offset="100%" stop-color="#2a2c2d"/>
            </linearGradient>
            <filter id="noiseLow2">
              <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="noise"/>
              <feDiffuseLighting in="noise" lighting-color="#ccd0d4" surfaceScale="1.4" result="light">
                <feDistantLight azimuth="60" elevation="70"/>
              </feDiffuseLighting>
              <feBlend mode="multiply" in="SourceGraphic" in2="light"/>
            </filter>
          </defs>
          <rect width="600" height="400" fill="url(#rockLow2)" filter="url(#noiseLow2)"/>
          <!-- Hexagonal columnar basalt joints, tight & interlocking -->
          <path d="M 100 80 L 150 120 L 150 200 L 100 240 L 60 200 L 60 120 Z" stroke="#1d1e1f" stroke-width="1.8" fill="none" opacity="0.5"/>
          <path d="M 230 70 L 280 110 L 280 190 L 230 230 L 190 190 L 190 110 Z" stroke="#1d1e1f" stroke-width="1.8" fill="none" opacity="0.5"/>
          <path d="M 370 90 L 420 130 L 420 220 L 370 260 L 320 220 L 320 130 Z" stroke="#1d1e1f" stroke-width="1.8" fill="none" opacity="0.5"/>
          <path d="M 490 80 L 540 120 L 540 210 L 490 250 L 440 210 L 440 120 Z" stroke="#1d1e1f" stroke-width="1.8" fill="none" opacity="0.5"/>
          <text x="20" y="30" fill="#10b981" font-family="'JetBrains Mono', monospace" font-size="12" font-weight="bold">CAM-01 CRUSHER BLUFF [COMPETENT BASALT COLUMNAR]</text>
        </svg>`
    }
  ],

  // Cameras network status
  cameras: [
    {
      id: 'CAM-01',
      name: 'North Bench Pit Wall',
      location: 'Bench 12 North Face',
      status: 'ONLINE',
      signal: 99,
      fps: 30,
      resolution: '4K (3840×2160)',
      lensStatus: 'Clean / Wiper Active',
      lastPing: '2 sec ago',
      lastTransmission: '14:42:10',
      lastRisk: 'LOW',
      temperature: '34°C',
      coordinates: '21°44\'12"N, 85°18\'44"E'
    },
    {
      id: 'CAM-02',
      name: 'Haul Road East Cut',
      location: 'Haul Road MP 4.2 Switchback',
      status: 'WARNING',
      signal: 88,
      fps: 25,
      resolution: '4K (3840×2160)',
      lensStatus: 'Minor Dust Coating',
      lastPing: '4 sec ago',
      lastTransmission: '15:10:02',
      lastRisk: 'HIGH',
      temperature: '38°C',
      coordinates: '21°44\'31"N, 85°19\'02"E'
    },
    {
      id: 'CAM-03',
      name: 'South Pit Wall Overlook',
      location: 'South Rim Overlook Mast #3',
      status: 'ONLINE',
      signal: 95,
      fps: 30,
      resolution: '4K (3840×2160)',
      lensStatus: 'Optimal',
      lastPing: '1 sec ago',
      lastTransmission: '15:08:44',
      lastRisk: 'LOW',
      temperature: '32°C',
      coordinates: '21°43\'58"N, 85°18\'22"E'
    },
    {
      id: 'CAM-04',
      name: 'Primary Crusher Access Bluff',
      location: 'Crusher Infeed Ramp Escarpment',
      status: 'ONLINE',
      signal: 96,
      fps: 30,
      resolution: '4K (3840×2160)',
      lensStatus: 'Optimal',
      lastPing: '2 sec ago',
      lastTransmission: '15:09:12',
      lastRisk: 'LOW',
      temperature: '33°C',
      coordinates: '21°44\'05"N, 85°18\'55"E'
    }
  ],

  // Drone Fleet status
  drones: [
    {
      id: 'UAV-01',
      model: 'DJI Matrice 350 RTK / FLIR H20T',
      name: 'Vanguard Alpha',
      status: 'ONLINE',
      subStatus: 'ACTIVE PATROL',
      battery: 84,
      signal: 98,
      altitude: '142 m AGL',
      speed: '4.8 m/s',
      gpsLock: 'RTK Fix (18 Sats)',
      gimbalPitch: '-45°',
      lastTransmission: '14:42:18',
      storage: '68% Free',
      backendStatus: 'CONNECTED (5G Uplink)',
      aiProcessingStatus: 'CUDA EDGE ACTIVE',
      monitoringStatus: 'AUTONOMOUS FLIGHT BENCH 14'
    },
    {
      id: 'UAV-02',
      model: 'Skydio X10 Enterprise',
      name: 'SkyGuard Sentinel',
      status: 'STANDBY',
      subStatus: 'DOCK CHARGING',
      battery: 98,
      signal: 100,
      altitude: '0 m (Docked)',
      speed: '0 m/s',
      gpsLock: 'Stationary Lock',
      gimbalPitch: '0°',
      lastTransmission: '14:30:00',
      storage: '92% Free',
      backendStatus: 'CHARGING & SYNCING',
      aiProcessingStatus: 'STANDBY',
      monitoringStatus: 'READY FOR DISPATCH'
    }
  ],

  // Initial Detection History Records
  initialHistory: [
    {
      id: 'DET-2026-9041',
      time: '2026-09-05 15:10:02',
      source: 'CAMERA',
      device: 'CAM-02',
      location: 'Haul Road East MP 4.2',
      sampleId: 'sample-high-02',
      risk: 'HIGH',
      confidence: 94.8,
      highProb: 94.8,
      lowProb: 5.2,
      status: 'ACTION DISPATCHED',
      reviewedBy: 'Geotech Desk (Lead D. Vance)'
    },
    {
      id: 'DET-2026-9040',
      time: '2026-09-05 14:42:18',
      source: 'DRONE',
      device: 'UAV-01',
      location: 'Bench 14 Sector B-4',
      sampleId: 'sample-high-01',
      risk: 'HIGH',
      confidence: 96.4,
      highProb: 96.4,
      lowProb: 3.6,
      status: 'REVIEWED - ESCALATED',
      reviewedBy: 'Admin Control Room'
    },
    {
      id: 'DET-2026-9039',
      time: '2026-09-05 14:02:50',
      source: 'CAMERA',
      device: 'CAM-01',
      location: 'Primary Crusher Wall',
      sampleId: 'sample-low-02',
      risk: 'LOW',
      confidence: 98.1,
      highProb: 1.9,
      lowProb: 98.1,
      status: 'STABLE / VERIFIED',
      reviewedBy: 'Automated AI Check'
    },
    {
      id: 'DET-2026-9038',
      time: '2026-09-05 13:15:40',
      source: 'DRONE',
      device: 'UAV-01',
      location: 'South Pit Wall Sector A-1',
      sampleId: 'sample-low-01',
      risk: 'LOW',
      confidence: 97.2,
      highProb: 2.8,
      lowProb: 97.2,
      status: 'STABLE / VERIFIED',
      reviewedBy: 'Automated AI Check'
    },
    {
      id: 'DET-2026-9037',
      time: '2026-09-05 11:48:12',
      source: 'CAMERA',
      device: 'CAM-03',
      location: 'South Pit Wall Overlook',
      sampleId: 'sample-low-01',
      risk: 'LOW',
      confidence: 96.5,
      highProb: 3.5,
      lowProb: 96.5,
      status: 'STABLE / VERIFIED',
      reviewedBy: 'Automated AI Check'
    },
    {
      id: 'DET-2026-9036',
      time: '2026-09-05 09:22:31',
      source: 'CAMERA',
      device: 'CAM-04',
      location: 'Crusher Infeed Ramp',
      sampleId: 'sample-low-02',
      risk: 'LOW',
      confidence: 97.8,
      highProb: 2.2,
      lowProb: 97.8,
      status: 'STABLE / VERIFIED',
      reviewedBy: 'Automated AI Check'
    }
  ]
};
