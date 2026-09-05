/**
 * ROCKFALL AI — Main Application Controller & View Orchestrator
 * Connects UI views, navigation, AI analysis pipelines, live feeds, and event listeners.
 */

class RockfallApp {
  constructor() {
    this.currentView = 'dashboard';
    this.activeAnalysis = null;
    this.selectedSample = null;
    this.uploadedImage = null;
    this.currentInspectionRecord = null;
    this.gradCam = null;
    this.inspectGradCam = null;
    this.filters = { source: 'ALL', device: 'ALL', risk: 'ALL', query: '' };
    this.feedThermal = false;
    this.selectedFeedCamera = 'CAM-02';

    this.init();
  }

  async init() {
    this.bindGlobalEvents();
    this.setupAuthUI();

    if (window.authManager.isAuthenticated()) {
      this.showCommandCenter();
    } else {
      this.showLogin();
    }
  }

  /* ==========================================================================
     AUTHENTICATION & VIEW SWITCHING
     ========================================================================== */

  setupAuthUI() {
    // Role selection tabs on login screen
    const roleBtns = document.querySelectorAll('.auth-role-tab');
    roleBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const role = e.currentTarget.dataset.role;
        window.soundSystem.playClick();
        window.authManager.setRoleTab(role);
        this.updateRoleSelectionUI(role);
      });
    });

    // Quick demo autofill buttons
    const demoAdminBtn = document.getElementById('btn-demo-admin');
    if (demoAdminBtn) {
      demoAdminBtn.addEventListener('click', () => {
        window.soundSystem.playClick();
        window.authManager.setRoleTab('ADMINISTRATOR');
        this.updateRoleSelectionUI('ADMINISTRATOR');
        const creds = window.authManager.getDemoCredentials('ADMINISTRATOR');
        document.getElementById('login-username').value = creds.username;
        document.getElementById('login-password').value = creds.password;
      });
    }

    const demoWorkerBtn = document.getElementById('btn-demo-worker');
    if (demoWorkerBtn) {
      demoWorkerBtn.addEventListener('click', () => {
        window.soundSystem.playClick();
        window.authManager.setRoleTab('WORKER');
        this.updateRoleSelectionUI('WORKER');
        const creds = window.authManager.getDemoCredentials('WORKER');
        document.getElementById('login-username').value = creds.username;
        document.getElementById('login-password').value = creds.password;
      });
    }

    // Login Form Submit
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        window.soundSystem.initContext();
        window.soundSystem.playClick();
        await this.handleLoginSubmit();
      });
    }

    // Logout buttons
    document.querySelectorAll('.btn-logout-trigger').forEach(btn => {
      btn.addEventListener('click', () => {
        window.soundSystem.playClick();
        window.authManager.logout();
        this.showLogin();
      });
    });
  }

  updateRoleSelectionUI(role) {
    document.querySelectorAll('.auth-role-tab').forEach(tab => {
      const isSelected = tab.dataset.role === role;
      if (isSelected) {
        tab.classList.add('bg-amber-500/20', 'border-amber-500', 'text-amber-400');
        tab.classList.remove('border-slate-800', 'text-slate-400');
      } else {
        tab.classList.remove('bg-amber-500/20', 'border-amber-500', 'text-amber-400');
        tab.classList.add('border-slate-800', 'text-slate-400');
      }
    });

    const infoBox = document.getElementById('role-permission-details');
    if (infoBox) {
      if (role === 'ADMINISTRATOR') {
        infoBox.innerHTML = `
          <div class="text-xs text-amber-400 font-mono font-semibold uppercase tracking-wider mb-1">Administrator Access Profile</div>
          <p class="text-xs text-slate-300">UAV/Drone aerial surveillance, drone image management, AI model diagnostics, telemetry streams, and full compliance reporting.</p>
        `;
      } else {
        infoBox.innerHTML = `
          <div class="text-xs text-cyan-400 font-mono font-semibold uppercase tracking-wider mb-1">Mine Worker Access Profile</div>
          <p class="text-xs text-slate-300">Fixed pit camera matrix (CAM-01..04), manual face upload, real-time rockfall hazard sirens, and field evacuation alerts.</p>
        `;
      }
    }
  }

  async handleLoginSubmit() {
    const userEl = document.getElementById('login-username');
    const passEl = document.getElementById('login-password');
    const errEl = document.getElementById('login-error-msg');
    const btnEl = document.getElementById('btn-login-submit');
    const spinnerEl = document.getElementById('login-spinner');
    const btnTextEl = document.getElementById('login-btn-text');

    errEl.classList.add('hidden');
    btnEl.disabled = true;
    spinnerEl.classList.remove('hidden');
    btnTextEl.textContent = 'AUTHENTICATING ENCRYPTED LINK...';

    try {
      const role = window.authManager.selectedRole;
      await window.authManager.login(userEl.value, passEl.value, role);
      btnTextEl.textContent = 'ACCESS GRANTED';
      this.showCommandCenter();
    } catch (err) {
      errEl.textContent = err.message || 'Authentication error. Please verify credentials.';
      errEl.classList.remove('hidden');
      btnEl.disabled = false;
      spinnerEl.classList.add('hidden');
      btnTextEl.textContent = 'INITIALIZE LOGIN →';
    }
  }

  showLogin() {
    document.getElementById('screen-login').classList.remove('hidden');
    document.getElementById('screen-command-center').classList.add('hidden');
    // Pre-fill administrator demo by default
    const creds = window.authManager.getDemoCredentials('ADMINISTRATOR');
    document.getElementById('login-username').value = creds.username;
    document.getElementById('login-password').value = creds.password;
    this.updateRoleSelectionUI('ADMINISTRATOR');
  }

  showCommandCenter() {
    document.getElementById('screen-login').classList.add('hidden');
    document.getElementById('screen-command-center').classList.remove('hidden');

    this.renderRoleHeader();
    this.renderSidebarNav();

    // Default filters based on role
    if (window.authManager.isAdmin()) {
      this.filters.source = 'DRONE';
      this.navigateTo('dashboard');
    } else {
      this.filters.source = 'CAMERA';
      this.navigateTo('dashboard');
    }

    // Set initial active rockface sample
    const defaultSample = window.ROCKFALL_DATA.samples[0];
    this.loadSampleAnalysis(defaultSample);

    // Initialize telemetry subscription
    window.telemetryManager.subscribe((telemetry) => {
      this.updateLiveTelemetryWidgets(telemetry);
    });

    // Initialize detection history listener
    window.historyStore.subscribe(() => {
      this.renderHistoryTable();
      this.renderRecentDetectionsWidget();
    });
  }

  renderRoleHeader() {
    const user = window.authManager.currentUser;
    if (!user) return;

    const roleTag = document.getElementById('header-role-tag');
    const userName = document.getElementById('header-user-name');
    const badgeId = document.getElementById('header-badge-id');
    const title = document.getElementById('header-user-title');
    const dashTitle = document.getElementById('dashboard-main-heading');

    if (userName) userName.textContent = user.name;
    if (badgeId) badgeId.textContent = user.badgeId;
    if (title) title.textContent = user.title;

    if (window.authManager.isAdmin()) {
      roleTag.textContent = 'ADMINISTRATOR';
      roleTag.className = 'badge-tech badge-tech-orange text-xs';
      if (dashTitle) dashTitle.textContent = 'UAV ROCKFALL MONITORING COMMAND CENTER';
    } else {
      roleTag.textContent = 'MINE WORKER';
      roleTag.className = 'badge-tech badge-tech-cyan text-xs';
      if (dashTitle) dashTitle.textContent = 'MINE CAMERA ROCKFALL MONITORING COMMAND CENTER';
    }
  }

  /* ==========================================================================
     NAVIGATION & ROUTING
     ========================================================================== */

  renderSidebarNav() {
    const isAdmin = window.authManager.isAdmin();
    const navContainer = document.getElementById('sidebar-nav-links');
    if (!navContainer) return;

    // Build role-specific navigation list
    const adminNav = [
      { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
      { id: 'drone-live', label: 'Drone Live Feed', icon: 'crosshair' },
      { id: 'drone-upload', label: 'Drone Image Upload', icon: 'upload-cloud' },
      { id: 'ai-analysis', label: 'AI Risk Analysis', icon: 'cpu' },
      { id: 'history', label: 'Detection History', icon: 'clipboard-list' },
      { id: 'device-status', label: 'Drone Fleet Status', icon: 'plane' },
      { id: 'workflow', label: 'System Pipeline', icon: 'git-merge' },
      { id: 'reports', label: 'Safety & Model Reports', icon: 'file-text' },
      { id: 'settings', label: 'Settings', icon: 'sliders' },
      { id: 'help', label: 'Help & Geotech Guide', icon: 'help-circle' }
    ];

    const workerNav = [
      { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
      { id: 'camera-live', label: 'Mine Camera Feed', icon: 'video' },
      { id: 'camera-upload', label: 'Camera Image Upload', icon: 'camera' },
      { id: 'ai-analysis', label: 'AI Risk Analysis', icon: 'cpu' },
      { id: 'history', label: 'Detection History', icon: 'clipboard-list' },
      { id: 'device-status', label: 'Mine Camera Status', icon: 'shield-check' },
      { id: 'alerts', label: 'Rockfall Alerts', icon: 'alert-triangle' },
      { id: 'workflow', label: 'System Pipeline', icon: 'git-merge' },
      { id: 'reports', label: 'Safety Reports', icon: 'file-text' },
      { id: 'settings', label: 'Settings', icon: 'sliders' },
      { id: 'help', label: 'Help & Field Manual', icon: 'help-circle' }
    ];

    const navItems = isAdmin ? adminNav : workerNav;

    navContainer.innerHTML = navItems.map(item => `
      <button data-view="${item.id}" class="nav-item-btn w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors text-slate-300 hover:text-amber-400 hover:bg-slate-800/60 text-left">
        <i data-lucide="${item.icon}" class="w-4 h-4"></i>
        <span>${item.label}</span>
      </button>
    `).join('');

    // Lucide icons re-render
    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Attach click handlers
    navContainer.querySelectorAll('.nav-item-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const viewId = e.currentTarget.dataset.view;
        window.soundSystem.playClick();
        this.navigateTo(viewId);
      });
    });
  }

  navigateTo(viewId) {
    this.currentView = viewId;

    // Highlight active nav button
    document.querySelectorAll('.nav-item-btn').forEach(btn => {
      if (btn.dataset.view === viewId) {
        btn.classList.add('bg-amber-500/15', 'text-amber-400', 'border-l-2', 'border-amber-500');
        btn.classList.remove('text-slate-300');
      } else {
        btn.classList.remove('bg-amber-500/15', 'text-amber-400', 'border-l-2', 'border-amber-500');
        btn.classList.add('text-slate-300');
      }
    });

    // Hide all view panels
    document.querySelectorAll('.view-panel').forEach(panel => {
      panel.classList.add('hidden');
    });

    // Show target view panel
    const targetPanel = document.getElementById(`view-${viewId}`);
    if (targetPanel) {
      targetPanel.classList.remove('hidden');
    }

    // View-specific initializations
    if (viewId === 'dashboard' || viewId === 'ai-analysis') {
      this.ensureGradCamInitialized();
    } else if (viewId === 'history') {
      this.renderHistoryTable();
    } else if (viewId === 'device-status') {
      this.renderDeviceStatusView();
    } else if (viewId === 'alerts') {
      this.renderAlertsView();
    } else if (viewId === 'workflow') {
      this.renderWorkflowView();
    } else if (viewId === 'reports') {
      this.renderReportsView();
    } else if (viewId === 'camera-live') {
      this.renderLiveCameraView();
    } else if (viewId === 'drone-live') {
      this.renderLiveDroneView();
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  /* ==========================================================================
     GRAD-CAM & AI RISK ASSESSMENT RENDERING
     ========================================================================== */

  ensureGradCamInitialized() {
    const canvas = document.getElementById('gradcam-main-canvas');
    if (!canvas) return;

    if (!this.gradCam) {
      this.gradCam = new window.GradCamVisualizer(canvas);
      this.bindGradCamControls();
    }

    if (this.activeAnalysis) {
      this.renderAnalysisDetails(this.activeAnalysis);
    }
  }

  bindGradCamControls() {
    // Opacity slider
    const slider = document.getElementById('gradcam-opacity-slider');
    const label = document.getElementById('gradcam-opacity-label');
    if (slider) {
      slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (this.gradCam) this.gradCam.setOpacity(val);
        if (label) label.textContent = `${Math.round(val * 100)}%`;
      });
    }

    // Mode buttons (Overlay, Split, Original, Heatmap)
    document.querySelectorAll('.btn-gradcam-mode').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = e.currentTarget.dataset.mode;
        window.soundSystem.playClick();
        document.querySelectorAll('.btn-gradcam-mode').forEach(b => {
          b.classList.remove('bg-amber-500', 'text-slate-950');
          b.classList.add('bg-slate-800', 'text-slate-300');
        });
        e.currentTarget.classList.add('bg-amber-500', 'text-slate-950');
        e.currentTarget.classList.remove('bg-slate-800', 'text-slate-300');

        if (this.gradCam) this.gradCam.setMode(mode);
      });
    });

    // Split wiper interaction on canvas
    const canvas = document.getElementById('gradcam-main-canvas');
    if (canvas) {
      let isDragging = false;
      canvas.addEventListener('mousedown', (e) => {
        if (this.gradCam && this.gradCam.mode === 'split') {
          isDragging = true;
          this.updateSplitFromEvent(e, canvas);
        }
      });
      window.addEventListener('mousemove', (e) => {
        if (isDragging && this.gradCam && this.gradCam.mode === 'split') {
          this.updateSplitFromEvent(e, canvas);
        }
      });
      window.addEventListener('mouseup', () => { isDragging = false; });
    }
  }

  updateSplitFromEvent(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0.05, Math.min(0.95, x / rect.width));
    this.gradCam.setSplitPosition(ratio);
  }

  async loadSampleAnalysis(sample) {
    this.selectedSample = sample;
    this.ensureGradCamInitialized();

    const analysis = await window.rockfallAI.analyze({
      sampleId: sample.id,
      deviceId: sample.deviceId,
      source: sample.source,
      location: sample.location,
      title: sample.title
    });

    this.activeAnalysis = analysis;
    this.activeAnalysis.svgRock = sample.svgRock;

    if (this.gradCam) {
      await this.gradCam.loadImage(sample.svgRock);
      this.gradCam.setHeatmap(analysis.heatCentroids, analysis.risk);
    }

    this.renderAnalysisDetails(analysis);

    // If High Risk, play siren or chimes accordingly
    if (analysis.risk === 'HIGH') {
      window.soundSystem.playHighRiskKlaxon();
    } else {
      window.soundSystem.playSafeChime();
    }
  }

  renderAnalysisDetails(analysis) {
    const isHigh = analysis.risk === 'HIGH';

    // Risk Indicator Badges
    const badgeEl = document.getElementById('ai-risk-badge');
    const descEl = document.getElementById('ai-risk-desc');
    const headerAlertBox = document.getElementById('dashboard-alert-banner');

    if (badgeEl) {
      if (isHigh) {
        badgeEl.innerHTML = `
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-mono font-bold text-lg rounded shadow-lg shadow-red-600/30 animate-pulse">
            <i data-lucide="alert-triangle" class="w-6 h-6"></i>
            <span>HIGH RISK</span>
          </div>`;
      } else {
        badgeEl.innerHTML = `
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-mono font-bold text-lg rounded shadow-lg shadow-emerald-600/30">
            <i data-lucide="check-circle" class="w-6 h-6"></i>
            <span>LOW RISK</span>
          </div>`;
      }
    }

    if (descEl) {
      descEl.textContent = isHigh
        ? 'IMMINENT ROCKFALL HAZARD IDENTIFIED — DISCONTINUITY NETWORK CRITICAL'
        : 'STRUCTURAL STABILITY CONFIRMED — INTACT ROCK BRIDGE INTEGRITY';
    }

    // Circular Confidence Gauge SVG
    const gaugeCircle = document.getElementById('gauge-confidence-circle');
    const gaugeText = document.getElementById('gauge-confidence-text');
    if (gaugeCircle && gaugeText) {
      const radius = 45;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (analysis.confidence / 100) * circumference;
      gaugeCircle.style.strokeDasharray = `${circumference}`;
      gaugeCircle.style.strokeDashoffset = `${offset}`;
      gaugeCircle.style.stroke = isHigh ? '#ef4444' : '#10b981';
      gaugeText.textContent = `${analysis.confidence}%`;
    }

    // Probability Bars
    const highProbBar = document.getElementById('prob-high-bar');
    const highProbVal = document.getElementById('prob-high-val');
    const lowProbBar = document.getElementById('prob-low-bar');
    const lowProbVal = document.getElementById('prob-low-val');

    if (highProbBar) highProbBar.style.width = `${analysis.highRiskProb}%`;
    if (highProbVal) highProbVal.textContent = `${analysis.highRiskProb}%`;
    if (lowProbBar) lowProbBar.style.width = `${analysis.lowRiskProb}%`;
    if (lowProbVal) lowProbVal.textContent = `${analysis.lowRiskProb}%`;

    // Processing latency & details
    const cudaLatencyEl = document.getElementById('ai-cuda-latency');
    if (cudaLatencyEl) cudaLatencyEl.textContent = analysis.cudaLatency || '38.4 ms';

    // Geotechnical Visual Evidence Indicators Checklist
    const indContainer = document.getElementById('visual-indicators-list');
    if (indContainer) {
      const ind = analysis.indicators || {};
      indContainer.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
          <div class="flex items-center gap-2 p-2 rounded ${ind.fracturedStructure ? 'bg-red-950/40 border border-red-800/60 text-red-300' : 'bg-slate-900 border border-slate-800 text-slate-500'}">
            <i data-lucide="${ind.fracturedStructure ? 'alert-circle' : 'circle'}" class="w-4 h-4 ${ind.fracturedStructure ? 'text-red-400' : 'text-slate-600'}"></i>
            <span>Fractured / Irregular Structure</span>
          </div>
          <div class="flex items-center gap-2 p-2 rounded ${ind.discontinuityPatterns ? 'bg-red-950/40 border border-red-800/60 text-red-300' : 'bg-slate-900 border border-slate-800 text-slate-500'}">
            <i data-lucide="${ind.discontinuityPatterns ? 'alert-circle' : 'circle'}" class="w-4 h-4 ${ind.discontinuityPatterns ? 'text-red-400' : 'text-slate-600'}"></i>
            <span>Discontinuity-like Patterns</span>
          </div>
          <div class="flex items-center gap-2 p-2 rounded ${ind.fragmentedSurface ? 'bg-red-950/40 border border-red-800/60 text-red-300' : 'bg-slate-900 border border-slate-800 text-slate-500'}">
            <i data-lucide="${ind.fragmentedSurface ? 'alert-circle' : 'circle'}" class="w-4 h-4 ${ind.fragmentedSurface ? 'text-red-400' : 'text-slate-600'}"></i>
            <span>Fragmented Surface Appearance</span>
          </div>
          <div class="flex items-center gap-2 p-2 rounded ${ind.blockSeparation ? 'bg-red-950/40 border border-red-800/60 text-red-300' : 'bg-slate-900 border border-slate-800 text-slate-500'}">
            <i data-lucide="${ind.blockSeparation ? 'alert-circle' : 'circle'}" class="w-4 h-4 ${ind.blockSeparation ? 'text-red-400' : 'text-slate-600'}"></i>
            <span>Potential Block Separation</span>
          </div>
          <div class="flex items-center gap-2 p-2 rounded ${ind.uniformAppearance ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-300' : 'bg-slate-900 border border-slate-800 text-slate-500'}">
            <i data-lucide="${ind.uniformAppearance ? 'check-circle' : 'circle'}" class="w-4 h-4 ${ind.uniformAppearance ? 'text-emerald-400' : 'text-slate-600'}"></i>
            <span>Uniform Rock Appearance</span>
          </div>
          <div class="flex items-center gap-2 p-2 rounded ${ind.lowComplexity ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-300' : 'bg-slate-900 border border-slate-800 text-slate-500'}">
            <i data-lucide="${ind.lowComplexity ? 'check-circle' : 'circle'}" class="w-4 h-4 ${ind.lowComplexity ? 'text-emerald-400' : 'text-slate-600'}"></i>
            <span>Lower Visual Discontinuity Complexity</span>
          </div>
        </div>
      `;
    }

    // Geotechnical Plain Language Explanation
    const summaryEl = document.getElementById('geological-summary-text');
    if (summaryEl) {
      summaryEl.textContent = analysis.geologicalSummary;
    }

    // Update Dashboard Hazard Banner
    if (headerAlertBox) {
      if (isHigh) {
        headerAlertBox.className = 'alert-hazard-box p-4 rounded mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4';
        headerAlertBox.innerHTML = `
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded bg-red-600/20 border border-red-500 flex items-center justify-center text-red-500">
              <i data-lucide="alert-octagon" class="w-6 h-6 animate-pulse"></i>
            </div>
            <div>
              <div class="text-sm font-heading font-bold text-red-400 tracking-wider flex items-center gap-2">
                ⚠ HIGH ROCKFALL RISK DETECTED
                <span class="badge-tech badge-tech-red text-[11px]">${analysis.deviceId} | ${analysis.location}</span>
              </div>
              <div class="text-xs text-slate-300 font-mono mt-0.5">
                Confidence: ${analysis.confidence}% | Risk Prob: ${analysis.highRiskProb}% | Timestamp: ${analysis.timestamp}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button id="btn-ack-alert" class="btn-industrial-outline text-xs py-1.5 px-3">
              <i data-lucide="check" class="w-3.5 h-3.5"></i> Acknowledge
            </button>
            <button id="btn-evac-siren" class="btn-danger-action text-xs py-1.5 px-3">
              <i data-lucide="volume-2" class="w-3.5 h-3.5"></i> Dispatch Geotech Alert
            </button>
          </div>
        `;
        document.getElementById('btn-ack-alert')?.addEventListener('click', () => {
          window.soundSystem.playClick();
          headerAlertBox.classList.add('opacity-50');
        });
        document.getElementById('btn-evac-siren')?.addEventListener('click', () => {
          window.soundSystem.playHighRiskKlaxon();
          alert(`[DISPATCH TICKET ISSUED] Geotechnical field emergency inspection team dispatched to ${analysis.location} via radio channel 4.`);
        });
      } else {
        headerAlertBox.className = 'alert-safe-box p-4 rounded mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4';
        headerAlertBox.innerHTML = `
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded bg-emerald-600/20 border border-emerald-500 flex items-center justify-center text-emerald-400">
              <i data-lucide="shield-check" class="w-6 h-6"></i>
            </div>
            <div>
              <div class="text-sm font-heading font-bold text-emerald-400 tracking-wider flex items-center gap-2">
                ✓ LOW ROCKFALL RISK
                <span class="badge-tech badge-tech-green text-[11px]">${analysis.deviceId} | ${analysis.location}</span>
              </div>
              <div class="text-xs text-slate-300 font-mono mt-0.5">
                Stability Verified | Confidence: ${analysis.confidence}% | Intact Rock Factor: 98.2%
              </div>
            </div>
          </div>
          <span class="text-xs font-mono text-emerald-400/80 border border-emerald-500/30 px-3 py-1 rounded bg-emerald-950/20">
            NORMAL BENCH OPERATIONS
          </span>
        `;
      }
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  /* ==========================================================================
     IMAGE UPLOAD FLOW (UAV & CAMERA INPUT)
     ========================================================================== */

  setupUploadComponents() {
    // 1. Drone Image Upload Handler
    const droneDropZone = document.getElementById('drone-drop-zone');
    const droneFileInput = document.getElementById('drone-file-input');
    const btnDroneAnalyze = document.getElementById('btn-drone-analyze');

    if (droneDropZone && droneFileInput) {
      droneDropZone.addEventListener('click', () => droneFileInput.click());
      droneDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        droneDropZone.classList.add('border-amber-500', 'bg-amber-500/10');
      });
      droneDropZone.addEventListener('dragleave', () => {
        droneDropZone.classList.remove('border-amber-500', 'bg-amber-500/10');
      });
      droneDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        droneDropZone.classList.remove('border-amber-500', 'bg-amber-500/10');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.handleFileSelected(e.dataTransfer.files[0], 'DRONE');
        }
      });
      droneFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleFileSelected(e.target.files[0], 'DRONE');
        }
      });
    }

    if (btnDroneAnalyze) {
      btnDroneAnalyze.addEventListener('click', async () => {
        window.soundSystem.playClick();
        await this.runUploadedAnalysis('DRONE');
      });
    }

    // 2. Camera Image Upload Handler
    const camDropZone = document.getElementById('camera-drop-zone');
    const camFileInput = document.getElementById('camera-file-input');
    const btnCamAnalyze = document.getElementById('btn-camera-analyze');
    const camSelect = document.getElementById('camera-select-dropdown');

    if (camDropZone && camFileInput) {
      camDropZone.addEventListener('click', () => camFileInput.click());
      camDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        camDropZone.classList.add('border-cyan-500', 'bg-cyan-500/10');
      });
      camDropZone.addEventListener('dragleave', () => {
        camDropZone.classList.remove('border-cyan-500', 'bg-cyan-500/10');
      });
      camDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        camDropZone.classList.remove('border-cyan-500', 'bg-cyan-500/10');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.handleFileSelected(e.dataTransfer.files[0], 'CAMERA');
        }
      });
      camFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleFileSelected(e.target.files[0], 'CAMERA');
        }
      });
    }

    if (camSelect) {
      camSelect.addEventListener('change', (e) => {
        const cam = window.telemetryManager.getCamera(e.target.value);
        const locEl = document.getElementById('cam-upload-location-display');
        if (cam && locEl) {
          locEl.textContent = `${cam.location} (${cam.coordinates})`;
        }
      });
    }

    if (btnCamAnalyze) {
      btnCamAnalyze.addEventListener('click', async () => {
        window.soundSystem.playClick();
        await this.runUploadedAnalysis('CAMERA');
      });
    }

    // Preset quick sample picker buttons on upload views
    document.querySelectorAll('.btn-load-preset-sample').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sampleId = e.currentTarget.dataset.sampleId;
        window.soundSystem.playClick();
        const sample = window.ROCKFALL_DATA.samples.find(s => s.id === sampleId);
        if (sample) {
          this.loadSampleAnalysis(sample);
          this.navigateTo('dashboard');
        }
      });
    });
  }

  handleFileSelected(file, source) {
    const reader = new FileReader();
    const prefix = source === 'DRONE' ? 'drone' : 'camera';
    const previewEl = document.getElementById(`${prefix}-image-preview`);
    const metaBox = document.getElementById(`${prefix}-meta-box`);
    const filenameEl = document.getElementById(`${prefix}-filename-text`);
    const sizeEl = document.getElementById(`${prefix}-filesize-text`);

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.uploadedImage = img;
        if (previewEl) {
          previewEl.src = e.target.result;
          previewEl.classList.remove('hidden');
        }
        if (metaBox) metaBox.classList.remove('hidden');
        if (filenameEl) filenameEl.textContent = file.name;
        if (sizeEl) sizeEl.textContent = `${(file.size / 1024).toFixed(1)} KB (${img.naturalWidth}×${img.naturalHeight})`;
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  async runUploadedAnalysis(source) {
    if (!this.uploadedImage) {
      // Automatically load the active sector benchmark sample for instant analysis
      const sample = source === 'DRONE'
        ? window.ROCKFALL_DATA.samples[0]
        : window.ROCKFALL_DATA.samples[1];
      await this.loadSampleAnalysis(sample);
      this.navigateTo('dashboard');
      return;
    }

    const prefix = source === 'DRONE' ? 'drone' : 'camera';
    const progressEl = document.getElementById(`${prefix}-upload-progress`);
    const statusText = document.getElementById(`${prefix}-processing-status`);

    if (progressEl) progressEl.classList.remove('hidden');
    if (statusText) statusText.textContent = 'CUDA INFERENCE IN PROGRESS...';

    // Telemetry metadata
    let deviceId = 'UAV-01';
    let location = 'Sector B-4 Bench 14';
    if (source === 'CAMERA') {
      const sel = document.getElementById('camera-select-dropdown');
      deviceId = sel ? sel.value : 'CAM-01';
      const cam = window.telemetryManager.getCamera(deviceId);
      location = cam ? cam.location : 'Mine Face';
    }

    const result = await window.rockfallAI.analyze({
      imageElement: this.uploadedImage,
      deviceId,
      source,
      location,
      title: `Manual Scan - ${deviceId}`
    });

    // Add to history store
    const record = window.historyStore.addRecord({
      ...result,
      customImage: this.uploadedImage.src
    });

    this.activeAnalysis = result;
    if (progressEl) progressEl.classList.add('hidden');
    if (statusText) statusText.textContent = 'ANALYSIS COMPLETE';

    // Load into Grad-CAM visualizer
    this.ensureGradCamInitialized();
    if (this.gradCam) {
      await this.gradCam.loadImage(this.uploadedImage);
      this.gradCam.setHeatmap(result.heatCentroids, result.risk);
    }

    this.renderAnalysisDetails(result);
    this.navigateTo('dashboard');
  }

  /* ==========================================================================
     DETECTION HISTORY & FILTERING
     ========================================================================== */

  setupHistoryEvents() {
    // Source filter buttons (ALL, DRONE, CAMERA)
    document.querySelectorAll('.btn-filter-source').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const src = e.currentTarget.dataset.source;
        window.soundSystem.playClick();
        this.filters.source = src;
        document.querySelectorAll('.btn-filter-source').forEach(b => {
          b.classList.remove('bg-amber-500', 'text-slate-950');
          b.classList.add('bg-slate-800', 'text-slate-300');
        });
        e.currentTarget.classList.add('bg-amber-500', 'text-slate-950');
        e.currentTarget.classList.remove('bg-slate-800', 'text-slate-300');
        this.renderHistoryTable();
      });
    });

    // Risk filter (ALL, HIGH, LOW)
    const riskSelect = document.getElementById('history-risk-filter');
    if (riskSelect) {
      riskSelect.addEventListener('change', (e) => {
        this.filters.risk = e.target.value;
        this.renderHistoryTable();
      });
    }

    // Search query
    const searchInput = document.getElementById('history-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filters.query = e.target.value;
        this.renderHistoryTable();
      });
    }

    // Inspection Modal Close
    const closeModalBtn = document.getElementById('btn-close-inspect-modal');
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => {
        window.soundSystem.playClick();
        document.getElementById('inspect-modal').classList.add('hidden');
      });
    }

    // Inspect Modal Status update buttons
    document.getElementById('btn-modal-action-ack')?.addEventListener('click', () => {
      if (this.currentInspectionRecord) {
        window.soundSystem.playClick();
        window.historyStore.updateRecordStatus(this.currentInspectionRecord.id, 'REVIEWED - ACKNOWLEDGED', 'Control Room Operator');
        document.getElementById('inspect-modal-status').textContent = 'REVIEWED - ACKNOWLEDGED';
        this.renderHistoryTable();
      }
    });

    document.getElementById('btn-modal-action-escalate')?.addEventListener('click', () => {
      if (this.currentInspectionRecord) {
        window.soundSystem.playHighRiskKlaxon();
        window.historyStore.updateRecordStatus(this.currentInspectionRecord.id, 'ESCALATED - GEOTECH INSPECTION DISPATCHED', 'Lead Geotechnical Engineer');
        document.getElementById('inspect-modal-status').textContent = 'ESCALATED - GEOTECH INSPECTION DISPATCHED';
        this.renderHistoryTable();
      }
    });
  }

  renderHistoryTable() {
    const tableBody = document.getElementById('history-table-body');
    if (!tableBody) return;

    const records = window.historyStore.getFilteredRecords(this.filters);

    if (records.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-8 text-slate-500 font-mono text-xs">
            NO DETECTION LOGS MATCHING CURRENT CRITERIA
          </td>
        </tr>`;
      return;
    }

    tableBody.innerHTML = records.map(r => {
      const isHigh = r.risk === 'HIGH';
      return `
        <tr class="hover:bg-slate-800/40 transition-colors">
          <td class="font-mono text-xs text-slate-400 whitespace-nowrap">${r.time}</td>
          <td>
            <span class="badge-tech ${r.source === 'DRONE' ? 'badge-tech-orange' : 'badge-tech-cyan'}">
              <i data-lucide="${r.source === 'DRONE' ? 'plane' : 'camera'}" class="w-3 h-3"></i>
              ${r.source}
            </span>
          </td>
          <td class="font-mono font-semibold text-xs text-slate-200">${r.device}</td>
          <td>
            <div class="w-14 h-9 rounded overflow-hidden bg-slate-900 border border-slate-700 flex items-center justify-center">
              ${r.sampleId ? `
                <div class="w-full h-full transform scale-50 origin-top-left pointer-events-none">
                  ${window.ROCKFALL_DATA.samples.find(s => s.id === r.sampleId)?.svgRock || '<div class="text-[9px] text-slate-500">PREVIEW</div>'}
                </div>` : `
                <span class="text-[9px] font-mono text-slate-500">CUSTOM</span>
              `}
            </div>
          </td>
          <td>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-bold ${isHigh ? 'bg-red-950/60 text-red-400 border border-red-800/50' : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'}">
              <span class="status-dot ${isHigh ? 'danger' : 'online'}"></span>
              ${r.risk} RISK
            </span>
          </td>
          <td class="font-mono text-xs ${isHigh ? 'text-red-400 font-bold' : 'text-emerald-400'}">${r.confidence}%</td>
          <td>
            <span class="text-xs font-mono ${isHigh ? 'text-amber-300' : 'text-slate-400'}">${r.status}</span>
          </td>
          <td>
            <button data-inspect-id="${r.id}" class="btn-inspect-record btn-industrial-outline text-xs py-1 px-2.5">
              <i data-lucide="eye" class="w-3 h-3"></i> Inspect
            </button>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Attach inspect handlers
    tableBody.querySelectorAll('.btn-inspect-record').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const recordId = e.currentTarget.dataset.inspectId;
        window.soundSystem.playClick();
        this.openInspectModal(recordId);
      });
    });
  }

  renderRecentDetectionsWidget() {
    const list = document.getElementById('recent-detections-list');
    if (!list) return;

    const topRecords = window.historyStore.records.slice(0, 4);
    list.innerHTML = topRecords.map(r => {
      const isHigh = r.risk === 'HIGH';
      return `
        <div class="flex items-center justify-between p-2.5 rounded bg-slate-900/60 border border-slate-800/60 text-xs">
          <div class="flex items-center gap-2">
            <span class="status-dot ${isHigh ? 'danger' : 'online'}"></span>
            <div>
              <span class="font-mono font-semibold text-slate-200">${r.device}</span>
              <span class="text-slate-400 text-[11px] block">${r.location}</span>
            </div>
          </div>
          <div class="text-right">
            <span class="font-mono font-bold ${isHigh ? 'text-red-400' : 'text-emerald-400'}">${r.risk} (${r.confidence}%)</span>
            <span class="text-slate-500 text-[10px] block font-mono">${r.time.split(' ')[1]}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  openInspectModal(recordId) {
    const record = window.historyStore.records.find(r => r.id === recordId);
    if (!record) return;

    this.currentInspectionRecord = record;
    const modal = document.getElementById('inspect-modal');
    modal.classList.remove('hidden');

    document.getElementById('inspect-modal-title').textContent = `${record.id} — ${record.device} [${record.source}]`;
    document.getElementById('inspect-modal-meta').textContent = `${record.location} | Time: ${record.time} | Confidence: ${record.confidence}%`;
    document.getElementById('inspect-modal-status').textContent = record.status;
    document.getElementById('inspect-modal-reviewer').textContent = record.reviewedBy || 'Automated Check';

    const canvas = document.getElementById('inspect-gradcam-canvas');
    if (!this.inspectGradCam) {
      this.inspectGradCam = new window.GradCamVisualizer(canvas);
    }

    const sample = window.ROCKFALL_DATA.samples.find(s => s.id === record.sampleId);
    const sourceImage = sample ? sample.svgRock : record.customImage;

    if (sourceImage) {
      this.inspectGradCam.loadImage(sourceImage).then(() => {
        this.inspectGradCam.setHeatmap(record.heatCentroids, record.risk);
      });
    }

    document.getElementById('inspect-geological-explanation').textContent =
      record.geologicalSummary || 'Structural discontinuity scanning completed with zero anomalous planar fractures.';

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  /* ==========================================================================
     LIVE CAMERA & DRONE FEED SIMULATION
     ========================================================================== */

  renderLiveDroneView() {
    const container = document.getElementById('drone-live-stream-viewport');
    if (!container) return;

    const sample = window.ROCKFALL_DATA.samples[0]; // High risk bench
    container.innerHTML = `
      <div class="relative w-full h-[480px] bg-slate-950 overflow-hidden rounded border border-slate-800">
        <!-- Live Rockface Base -->
        <div class="w-full h-full">
          ${sample.svgRock}
        </div>

        <!-- HUD Scanning Elements -->
        <div class="hud-scanline"></div>
        <div class="hud-grid-overlay absolute inset-0 pointer-events-none"></div>

        <!-- Drone Telemetry HUD Overlays -->
        <div class="absolute top-3 left-3 bg-slate-950/80 border border-slate-700 px-3 py-1.5 rounded font-mono text-xs text-amber-400 flex items-center gap-3">
          <div class="flex items-center gap-1.5">
            <span class="status-dot online"></span>
            <span>UAV-01 LIVE 4K</span>
          </div>
          <span class="text-slate-400">|</span>
          <span id="live-drone-altitude">ALT: 142.4 m AGL</span>
          <span class="text-slate-400">|</span>
          <span id="live-drone-speed">SPD: 4.8 m/s</span>
          <span class="text-slate-400">|</span>
          <span id="live-drone-battery">BAT: 84%</span>
        </div>

        <div class="absolute top-3 right-3 bg-slate-950/80 border border-slate-700 px-3 py-1.5 rounded font-mono text-xs text-cyan-400 flex items-center gap-2">
          <i data-lucide="crosshair" class="w-3.5 h-3.5"></i>
          <span>RTK FIX (18 SATS) [21°44'12"N, 85°18'44"E]</span>
        </div>

        <!-- Center Crosshair Reticle -->
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div class="w-32 h-32 border border-amber-500/40 rounded-full flex items-center justify-center">
            <div class="w-2 h-2 bg-amber-500 rounded-full animate-ping"></div>
            <div class="absolute w-44 h-px bg-amber-500/30"></div>
            <div class="absolute h-44 w-px bg-amber-500/30"></div>
          </div>
        </div>

        <!-- Live Controls Bottom Bar -->
        <div class="absolute bottom-3 inset-x-3 bg-slate-950/85 border border-slate-700 p-2.5 rounded flex items-center justify-between">
          <div class="flex items-center gap-2">
            <button id="btn-toggle-thermal" class="btn-industrial-outline text-xs py-1.5 px-3">
              <i data-lucide="thermometer" class="w-3.5 h-3.5"></i> Spectrum: RGB (FLIR H20T)
            </button>
            <span class="text-xs font-mono text-slate-400">Gimbal: -45° PITCH</span>
          </div>
          <div class="flex items-center gap-2">
            <button id="btn-drone-capture-frame" class="btn-industrial-primary text-xs py-1.5 px-4">
              <i data-lucide="camera" class="w-3.5 h-3.5"></i> CAPTURE FRAME FOR AI SCAN →
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-drone-capture-frame')?.addEventListener('click', () => {
      window.soundSystem.playClick();
      this.loadSampleAnalysis(sample);
      this.navigateTo('dashboard');
    });

    document.getElementById('btn-toggle-thermal')?.addEventListener('click', (e) => {
      window.soundSystem.playClick();
      this.feedThermal = !this.feedThermal;
      e.currentTarget.innerHTML = this.feedThermal
        ? '<i data-lucide="thermometer" class="w-3.5 h-3.5"></i> Spectrum: THERMAL IR'
        : '<i data-lucide="thermometer" class="w-3.5 h-3.5"></i> Spectrum: RGB (FLIR H20T)';
      container.style.filter = this.feedThermal ? 'invert(1) hue-rotate(180deg) saturate(2)' : 'none';
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  renderLiveCameraView() {
    const matrix = document.getElementById('camera-matrix-grid');
    if (!matrix) return;

    const cams = window.telemetryManager.cameras;
    matrix.innerHTML = cams.map(cam => {
      const isHigh = cam.lastRisk === 'HIGH';
      const sample = window.ROCKFALL_DATA.samples.find(s => s.deviceId === cam.id) || window.ROCKFALL_DATA.samples[0];
      return `
        <div class="industrial-card p-3 flex flex-col justify-between">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2 font-mono font-semibold text-xs text-slate-200">
              <span class="status-dot ${cam.status === 'ONLINE' ? 'online' : 'warning'}"></span>
              <span>${cam.id} — ${cam.name}</span>
            </div>
            <span class="badge-tech ${isHigh ? 'badge-tech-red' : 'badge-tech-green'} text-[10px]">
              ${cam.lastRisk} RISK
            </span>
          </div>

          <!-- Video Surface -->
          <div class="relative h-44 bg-slate-950 rounded overflow-hidden border border-slate-800">
            <div class="w-full h-full transform scale-75 origin-top-left pointer-events-none">
              ${sample.svgRock}
            </div>
            <div class="absolute top-2 left-2 bg-slate-950/80 px-2 py-0.5 rounded font-mono text-[10px] text-cyan-400">
              ${cam.resolution} | ${cam.fps} FPS
            </div>
            <div class="absolute bottom-2 left-2 bg-slate-950/80 px-2 py-0.5 rounded font-mono text-[10px] text-slate-400">
              ${cam.location}
            </div>
          </div>

          <div class="mt-3 flex items-center justify-between">
            <div class="text-[11px] font-mono text-slate-400">
              Lens: ${cam.lensStatus} | Temp: ${cam.temperature}
            </div>
            <button data-camera-id="${cam.id}" class="btn-camera-trigger-ai btn-industrial-outline text-xs py-1 px-2.5">
              <i data-lucide="zap" class="w-3 h-3"></i> Analyze Frame
            </button>
          </div>
        </div>
      `;
    }).join('');

    matrix.querySelectorAll('.btn-camera-trigger-ai').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const camId = e.currentTarget.dataset.cameraId;
        window.soundSystem.playClick();
        const sample = window.ROCKFALL_DATA.samples.find(s => s.deviceId === camId) || window.ROCKFALL_DATA.samples[0];
        this.loadSampleAnalysis(sample);
        this.navigateTo('dashboard');
      });
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  /* ==========================================================================
     TELEMETRY & STATUS VIEWS
     ========================================================================== */

  updateLiveTelemetryWidgets(telemetry) {
    const uav = telemetry.drones.find(d => d.id === 'UAV-01');
    if (uav) {
      const batEl = document.getElementById('uav-bat-display');
      const sigEl = document.getElementById('uav-sig-display');
      const altEl = document.getElementById('uav-alt-display');
      if (batEl) batEl.textContent = `${uav.battery}%`;
      if (sigEl) sigEl.textContent = `${uav.signal}%`;
      if (altEl) altEl.textContent = uav.altitude;
    }
  }

  renderDeviceStatusView() {
    const container = document.getElementById('device-status-content');
    if (!container) return;

    const isAdmin = window.authManager.isAdmin();

    if (isAdmin) {
      const drones = window.telemetryManager.drones;
      container.innerHTML = `
        <div class="mb-4">
          <h3 class="text-sm font-heading text-amber-400 tracking-wider uppercase mb-1">Autonomous Drone Fleet Telemetry</h3>
          <p class="text-xs text-slate-400">Live operational status of airborne UAV rockfall inspection units.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${drones.map(d => `
            <div class="industrial-card p-4">
              <div class="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <div class="flex items-center gap-2">
                  <span class="status-dot ${d.status === 'ONLINE' ? 'online' : 'warning'}"></span>
                  <span class="font-mono font-bold text-sm text-slate-100">${d.id} — ${d.name}</span>
                </div>
                <span class="badge-tech ${d.status === 'ONLINE' ? 'badge-tech-orange' : 'badge-tech-cyan'}">${d.subStatus}</span>
              </div>
              <div class="grid grid-cols-2 gap-3 text-xs font-mono">
                <div><span class="text-slate-500">Model:</span> <span class="text-slate-300">${d.model}</span></div>
                <div><span class="text-slate-500">Battery:</span> <span class="text-emerald-400 font-bold">${d.battery}%</span></div>
                <div><span class="text-slate-500">Signal:</span> <span class="text-cyan-400 font-bold">${d.signal}% (5G RTK)</span></div>
                <div><span class="text-slate-500">Altitude:</span> <span class="text-slate-300">${d.altitude}</span></div>
                <div><span class="text-slate-500">Speed:</span> <span class="text-slate-300">${d.speed}</span></div>
                <div><span class="text-slate-500">GPS Lock:</span> <span class="text-slate-300">${d.gpsLock}</span></div>
                <div><span class="text-slate-500">Gimbal:</span> <span class="text-slate-300">${d.gimbalPitch}</span></div>
                <div><span class="text-slate-500">Storage:</span> <span class="text-slate-300">${d.storage}</span></div>
                <div class="col-span-2 border-t border-slate-800 pt-2"><span class="text-slate-500">AI Processing:</span> <span class="text-amber-400">${d.aiProcessingStatus}</span></div>
                <div class="col-span-2"><span class="text-slate-500">Monitoring Mode:</span> <span class="text-slate-300">${d.monitoringStatus}</span></div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      const cams = window.telemetryManager.cameras;
      container.innerHTML = `
        <div class="mb-4">
          <h3 class="text-sm font-heading text-cyan-400 tracking-wider uppercase mb-1">Fixed Perimeter Camera Array</h3>
          <p class="text-xs text-slate-400">High-resolution fixed optical sensor network monitoring high-risk pit walls.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${cams.map(c => `
            <div class="industrial-card p-4">
              <div class="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <div class="flex items-center gap-2">
                  <span class="status-dot ${c.status === 'ONLINE' ? 'online' : 'warning'}"></span>
                  <span class="font-mono font-bold text-sm text-slate-100">${c.id} — ${c.name}</span>
                </div>
                <span class="badge-tech ${c.status === 'ONLINE' ? 'badge-tech-green' : 'badge-tech-orange'}">${c.status}</span>
              </div>
              <div class="grid grid-cols-2 gap-3 text-xs font-mono">
                <div><span class="text-slate-500">Location:</span> <span class="text-slate-300">${c.location}</span></div>
                <div><span class="text-slate-500">Coordinates:</span> <span class="text-slate-300">${c.coordinates}</span></div>
                <div><span class="text-slate-500">Signal:</span> <span class="text-cyan-400 font-bold">${c.signal}%</span></div>
                <div><span class="text-slate-500">Resolution:</span> <span class="text-slate-300">${c.resolution}</span></div>
                <div><span class="text-slate-500">FPS:</span> <span class="text-slate-300">${c.fps} FPS</span></div>
                <div><span class="text-slate-500">Lens Wiper:</span> <span class="text-slate-300">${c.lensStatus}</span></div>
                <div><span class="text-slate-500">Housing Temp:</span> <span class="text-slate-300">${c.temperature}</span></div>
                <div><span class="text-slate-500">Last Transmission:</span> <span class="text-slate-300">${c.lastTransmission}</span></div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  /* ==========================================================================
     ALERTS & WORKFLOW VIEWS
     ========================================================================== */

  renderAlertsView() {
    const container = document.getElementById('alerts-content');
    if (!container) return;

    const highRiskRecords = window.historyStore.records.filter(r => r.risk === 'HIGH');

    container.innerHTML = `
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h3 class="text-sm font-heading text-red-400 tracking-wider uppercase mb-1">Active Rockfall Hazard Alerts</h3>
          <p class="text-xs text-slate-400">Critical incidents requiring geotechnical evaluation or field worker evacuation.</p>
        </div>
        <button id="btn-trigger-drill-siren" class="btn-danger-action text-xs">
          <i data-lucide="volume-2" class="w-3.5 h-3.5"></i> Test Hazard Siren
        </button>
      </div>

      <div class="space-y-3">
        ${highRiskRecords.map(r => `
          <div class="alert-hazard-box p-4 rounded flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div class="flex items-start gap-3">
              <div class="w-9 h-9 rounded bg-red-600/30 border border-red-500 flex items-center justify-center text-red-400 shrink-0">
                <i data-lucide="alert-triangle" class="w-5 h-5 animate-pulse"></i>
              </div>
              <div>
                <div class="text-sm font-mono font-bold text-red-400">
                  ${r.device} — ${r.location}
                </div>
                <div class="text-xs text-slate-300 font-mono mt-0.5">
                  Detected: ${r.time} | Confidence: ${r.confidence}% | Status: <span class="text-amber-400 font-bold">${r.status}</span>
                </div>
                <div class="text-xs text-slate-400 mt-1 max-w-xl">
                  ${r.geologicalSummary}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button data-inspect-id="${r.id}" class="btn-inspect-record btn-industrial-outline text-xs py-1.5 px-3">
                <i data-lucide="eye" class="w-3.5 h-3.5"></i> Inspect Heatmap
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    document.getElementById('btn-trigger-drill-siren')?.addEventListener('click', () => {
      window.soundSystem.playHighRiskKlaxon();
    });

    container.querySelectorAll('.btn-inspect-record').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const recordId = e.currentTarget.dataset.inspectId;
        window.soundSystem.playClick();
        this.openInspectModal(recordId);
      });
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  renderWorkflowView() {
    const container = document.getElementById('workflow-content');
    if (!container) return;

    container.innerHTML = `
      <div class="space-y-8">
        <!-- Drone Pipeline -->
        <div class="industrial-card p-5">
          <div class="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
            <div class="flex items-center gap-2">
              <i data-lucide="plane" class="w-5 h-5 text-amber-400"></i>
              <span class="font-heading font-bold text-sm text-slate-100 uppercase tracking-wider">UAV Autonomous Aerial Pipeline</span>
            </div>
            <span class="badge-tech badge-tech-orange text-xs">END-TO-END: 76.4 ms</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 text-center">
            <div class="workflow-node active-pulse p-3 rounded">
              <i data-lucide="plane" class="w-6 h-6 mx-auto text-amber-400 mb-1"></i>
              <div class="font-mono text-xs font-bold text-slate-200">UAV-01</div>
              <div class="text-[10px] text-slate-500">Autonomous Patrol</div>
            </div>
            <div class="workflow-node p-3 rounded">
              <i data-lucide="camera" class="w-6 h-6 mx-auto text-cyan-400 mb-1"></i>
              <div class="font-mono text-xs font-bold text-slate-200">IMAGE CAPTURE</div>
              <div class="text-[10px] text-slate-500">4K Optical / 12ms</div>
            </div>
            <div class="workflow-node p-3 rounded">
              <i data-lucide="cpu" class="w-6 h-6 mx-auto text-purple-400 mb-1"></i>
              <div class="font-mono text-xs font-bold text-slate-200">AI ANALYSIS</div>
              <div class="text-[10px] text-slate-500">EfficientNet / 38ms</div>
            </div>
            <div class="workflow-node p-3 rounded">
              <i data-lucide="alert-triangle" class="w-6 h-6 mx-auto text-red-400 mb-1"></i>
              <div class="font-mono text-xs font-bold text-slate-200">RISK PREDICTION</div>
              <div class="text-[10px] text-slate-500">High / Low Class</div>
            </div>
            <div class="workflow-node p-3 rounded">
              <i data-lucide="layers" class="w-6 h-6 mx-auto text-amber-400 mb-1"></i>
              <div class="font-mono text-xs font-bold text-slate-200">GRAD-CAM</div>
              <div class="text-[10px] text-slate-500">Heatmap Blend / 22ms</div>
            </div>
            <div class="workflow-node p-3 rounded">
              <i data-lucide="layout-dashboard" class="w-6 h-6 mx-auto text-emerald-400 mb-1"></i>
              <div class="font-mono text-xs font-bold text-slate-200">DASHBOARD</div>
              <div class="text-[10px] text-slate-500">Command Center</div>
            </div>
          </div>
        </div>

        <!-- Camera Pipeline -->
        <div class="industrial-card p-5">
          <div class="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
            <div class="flex items-center gap-2">
              <i data-lucide="video" class="w-5 h-5 text-cyan-400"></i>
              <span class="font-heading font-bold text-sm text-slate-100 uppercase tracking-wider">Fixed Mine Camera Warning Pipeline</span>
            </div>
            <span class="badge-tech badge-tech-cyan text-xs">END-TO-END: 64.2 ms</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 text-center">
            <div class="workflow-node active-pulse p-3 rounded">
              <i data-lucide="video" class="w-6 h-6 mx-auto text-cyan-400 mb-1"></i>
              <div class="font-mono text-xs font-bold text-slate-200">MINE CAMERA</div>
              <div class="text-[10px] text-slate-500">CAM-01..04 Matrix</div>
            </div>
            <div class="workflow-node p-3 rounded">
              <i data-lucide="camera" class="w-6 h-6 mx-auto text-cyan-400 mb-1"></i>
              <div class="font-mono text-xs font-bold text-slate-200">IMAGE CAPTURE</div>
              <div class="text-[10px] text-slate-500">Fixed Bench / 10ms</div>
            </div>
            <div class="workflow-node p-3 rounded">
              <i data-lucide="cpu" class="w-6 h-6 mx-auto text-purple-400 mb-1"></i>
              <div class="font-mono text-xs font-bold text-slate-200">AI ANALYSIS</div>
              <div class="text-[10px] text-slate-500">EfficientNet / 38ms</div>
            </div>
            <div class="workflow-node p-3 rounded">
              <i data-lucide="alert-triangle" class="w-6 h-6 mx-auto text-red-400 mb-1"></i>
              <div class="font-mono text-xs font-bold text-slate-200">RISK PREDICTION</div>
              <div class="text-[10px] text-slate-500">Threshold Check</div>
            </div>
            <div class="workflow-node p-3 rounded">
              <i data-lucide="layers" class="w-6 h-6 mx-auto text-amber-400 mb-1"></i>
              <div class="font-mono text-xs font-bold text-slate-200">GRAD-CAM</div>
              <div class="text-[10px] text-slate-500">Visual Evidence</div>
            </div>
            <div class="workflow-node p-3 rounded bg-red-950/40 border-red-800">
              <i data-lucide="volume-2" class="w-6 h-6 mx-auto text-red-400 mb-1 animate-pulse"></i>
              <div class="font-mono text-xs font-bold text-red-400">ALERT & SIREN</div>
              <div class="text-[10px] text-slate-400">Field Evacuation</div>
            </div>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  renderReportsView() {
    const container = document.getElementById('reports-content');
    if (!container) return;

    const info = window.ROCKFALL_DATA.modelInfo;

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Model Specification Card -->
        <div class="industrial-card p-5">
          <div class="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div>
              <h3 class="font-heading text-base text-amber-400 tracking-wider uppercase">AI Geotechnical Model Specification</h3>
              <p class="text-xs text-slate-400">Validated deep neural network architecture for open-pit bench slope stability.</p>
            </div>
            <button id="btn-export-audit-json" class="btn-industrial-outline text-xs">
              <i data-lucide="download" class="w-3.5 h-3.5"></i> Export Audit (JSON)
            </button>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div class="p-3 bg-slate-900/60 rounded border border-slate-800">
              <span class="text-slate-500 block">Neural Architecture</span>
              <span class="text-slate-100 font-bold text-sm">${info.architecture}</span>
            </div>
            <div class="p-3 bg-slate-900/60 rounded border border-slate-800">
              <span class="text-slate-500 block">Validation Accuracy</span>
              <span class="text-emerald-400 font-bold text-sm">${info.validationAccuracy}%</span>
            </div>
            <div class="p-3 bg-slate-900/60 rounded border border-slate-800">
              <span class="text-slate-500 block">Benchmark Dataset</span>
              <span class="text-slate-100 font-bold text-sm">${info.datasetImages} Images</span>
            </div>
            <div class="p-3 bg-slate-900/60 rounded border border-slate-800">
              <span class="text-slate-500 block">Risk Classes</span>
              <span class="text-slate-100 font-bold text-sm">${info.riskClasses} (Low / High)</span>
            </div>
            <div class="p-3 bg-slate-900/60 rounded border border-slate-800">
              <span class="text-slate-500 block">Input Tensor Resolution</span>
              <span class="text-slate-100 font-bold text-sm">${info.inputResolution}</span>
            </div>
            <div class="p-3 bg-slate-900/60 rounded border border-slate-800">
              <span class="text-slate-500 block">Acceleration Device</span>
              <span class="text-cyan-400 font-bold text-sm">${info.accelerationDevice}</span>
            </div>
            <div class="p-3 bg-slate-900/60 rounded border border-slate-800">
              <span class="text-slate-500 block">Explainability Method</span>
              <span class="text-amber-400 font-bold text-sm">${info.explainability}</span>
            </div>
            <div class="p-3 bg-slate-900/60 rounded border border-slate-800">
              <span class="text-slate-500 block">ROC-AUC / Precision</span>
              <span class="text-emerald-400 font-bold text-sm">${info.aucRoc} / ${info.precision}%</span>
            </div>
          </div>
        </div>

        <!-- Confusion Matrix & Safety Statistics -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="industrial-card p-5">
            <h4 class="font-heading text-sm text-slate-200 tracking-wider uppercase mb-3">Confusion Matrix (Validation Set: 2,764 Scans)</h4>
            <table class="w-full text-xs font-mono text-center border-collapse">
              <thead>
                <tr class="border-b border-slate-800">
                  <th class="p-2 text-slate-500 text-left">Actual \\ Predicted</th>
                  <th class="p-2 text-emerald-400">Pred: LOW RISK</th>
                  <th class="p-2 text-red-400">Pred: HIGH RISK</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-slate-800/60">
                  <td class="p-2 text-slate-400 text-left font-semibold">Actual: LOW RISK (1,420)</td>
                  <td class="p-2 bg-emerald-950/30 text-emerald-300 font-bold">1,386 (97.6%)</td>
                  <td class="p-2 bg-red-950/20 text-slate-400">34 (2.4%)</td>
                </tr>
                <tr>
                  <td class="p-2 text-slate-400 text-left font-semibold">Actual: HIGH RISK (1,344)</td>
                  <td class="p-2 bg-red-950/20 text-slate-400">46 (3.4%)</td>
                  <td class="p-2 bg-red-950/30 text-red-400 font-bold">1,298 (96.6%)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="industrial-card p-5 flex flex-col justify-between">
            <h4 class="font-heading text-sm text-slate-200 tracking-wider uppercase mb-3">Operational Safety Impact (Past 30 Days)</h4>
            <div class="grid grid-cols-2 gap-3 text-xs font-mono">
              <div class="p-3 bg-slate-900 rounded border border-slate-800">
                <div class="text-2xl font-bold text-amber-400">14</div>
                <div class="text-slate-400 text-[11px] mt-1">Imminent Rockfalls Prevented</div>
              </div>
              <div class="p-3 bg-slate-900 rounded border border-slate-800">
                <div class="text-2xl font-bold text-emerald-400">0</div>
                <div class="text-slate-400 text-[11px] mt-1">Personnel Injuries Recorded</div>
              </div>
              <div class="p-3 bg-slate-900 rounded border border-slate-800">
                <div class="text-2xl font-bold text-cyan-400">1,842</div>
                <div class="text-slate-400 text-[11px] mt-1">Autonomous Aerial Patrols</div>
              </div>
              <div class="p-3 bg-slate-900 rounded border border-slate-800">
                <div class="text-2xl font-bold text-slate-200">100%</div>
                <div class="text-slate-400 text-[11px] mt-1">Geotechnical Compliance</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-export-audit-json')?.addEventListener('click', () => {
      window.soundSystem.playClick();
      const exportData = {
        modelSpec: info,
        generatedAt: new Date().toISOString(),
        site: 'Open-Pit Mine Sector 4',
        recordsCount: window.historyStore.records.length,
        recentDetections: window.historyStore.records
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ROCKFALL_AI_AUDIT_REPORT_${new Date().toISOString().substring(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  /* ==========================================================================
     GLOBAL EVENT LISTENERS
     ========================================================================== */

  bindGlobalEvents() {
    // Audio mute button toggle in top header
    const muteBtn = document.getElementById('btn-audio-mute-toggle');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        const isMuted = window.soundSystem.toggleMute();
        muteBtn.innerHTML = isMuted
          ? '<i data-lucide="volume-x" class="w-4 h-4 text-slate-500"></i>'
          : '<i data-lucide="volume-2" class="w-4 h-4 text-amber-400"></i>';
        if (window.lucide) window.lucide.createIcons();
      });
    }

    this.setupUploadComponents();
    this.setupHistoryEvents();
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.app = new RockfallApp();
});
