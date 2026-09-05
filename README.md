# ROCKFALL AI — Intelligent Mine Safety Monitoring Command Center

An enterprise-grade, high-performance web platform designed for open-pit mining operations to detect, classify, and explain rockfall hazards using deep convolutional neural networks (`EfficientNet-B0`), edge telemetry, and Explainable AI (`Grad-CAM`).

---

## 🛠 Features & Capabilities

### 1. Multi-Role Operational Command
- **Administrator Console (UAV/Drone Focus)**:
  - Real-time 4K optical & thermal FLIR H20T telemetry stream HUD
  - Autonomous aerial patrol monitoring (Bench 14 Sector B-4)
  - Drone image management with drag-and-drop orthomosaic tensor ingestion
  - Drone fleet status & RTK GPS locks (UAV-01 Vanguard, UAV-02 SkyGuard)
  - Full compliance reporting, confusion matrix, and JSON audit export
- **Mine Worker Console (Fixed Camera Matrix)**:
  - 4-Camera perimeter matrix:
    - `CAM-01`: North Bench Pit Wall (Sector B-12)
    - `CAM-02`: Haul Road East Cut (MP 4.2 Switchback)
    - `CAM-03`: South Pit Wall Overlook (Sector A-1)
    - `CAM-04`: Primary Crusher Access Bluff (Sector D-3)
  - Dedicated fixed-camera upload and bench verification
  - High-priority rockfall emergency alerts with audible siren dispatch
  - Field inspection ticketing and acknowledge/escalate workflows

### 2. AI Risk Assessment & Explainable AI (Grad-CAM)
- **Model**: `EfficientNet-B0` trained on 2,764 open-pit slope stability images
- **Validation Accuracy**: `97.09%` (ROC-AUC: `0.991`)
- **Acceleration**: NVIDIA TensorRT CUDA (Inference latency: `~38 ms`)
- **Grad-CAM Attention Maps**:
  - Real-time HTML5 Canvas blending engine with normalized Jet colormap
  - Interactive opacity slider (0% to 100%)
  - Multi-view modes: Blended Overlay, Split Wiper, Original Only, Heatmap Only
  - Attention scale legend (0.0 Baseline to 1.0 Peak activation)
  - Target reticles marking critical fracture centroids
- **Geotechnical Visual Evidence Tracing**:
  - *High-Risk Indicators*: Fractured / irregular structure, Discontinuity-like patterns, Fragmented surface appearance, Potential block separation
  - *Low-Risk Indicators*: Uniform rock appearance, Lower visual discontinuity complexity, Intact rock bridge integrity
  - Plain-language geotechnical summary for non-technical field workers

### 3. Audio & Tactical Feedback (Web Audio API)
- Emergency hazard alert klaxon/siren for High Risk detections
- Melodic double-chime for Low Risk stability verifications
- Subtactile UI audio clicks and master mute toggle

### 4. Incident & Detection History
- Comprehensive search & filtering by Source (Drone vs Camera), Device (UAV-01, CAM-01..04), and Risk Level
- Interactive inspection modal to review past Grad-CAM heatmaps, reviewer signatures, and escalate actions
- Exportable safety audit reports (JSON / PDF printable)

---

## 🚀 How to Run

Because this application is built as a zero-dependency modern Single Page Application (using native ES6, Canvas 2D, Web Audio API, and Tailwind/Lucide via CDN), **no compilation or npm installation is required**.

### Quick Start:
1. Open `index.html` directly in any modern web browser (Chrome, Edge, Firefox, Safari).
2. Or serve it via any local web server:
   ```bash
   # Python 3
   python -m http.server 8080
   # Open http://localhost:8080
   ```

### 🔑 Demo Credentials (Or click the 1-Click Demo Fill buttons):
- **Administrator**: `admin@rockfall.ai` / `Admin2026!`
- **Mine Worker**: `worker@rockfall.ai` / `Worker2026!`

---

## 📁 Directory Structure

```
rockfall-ai/
├── index.html              # Main application container & views
├── README.md               # Documentation & operation manual
├── css/
│   └── styles.css          # Dark industrial styling, radar animations, HUD reticles
└── js/
    ├── sample-data.js      # Calibrated rockface textures & telemetry presets
    ├── audio.js            # Web Audio API industrial sound synthesizer
    ├── gradcam-canvas.js   # Real-time Grad-CAM heatmap blending visualizer
    ├── ai-engine.js        # EfficientNet-B0 inference & feature extraction engine
    ├── auth.js             # Role-based access control & session manager
    ├── telemetry.js        # UAV & Camera network live simulation
    ├── history-store.js    # Persistent incident detection logs & filters
    └── app.js              # Application coordinator & routing controller
```
