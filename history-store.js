/**
 * ROCKFALL AI — Detection History Store & Incident Tracking
 * Handles persistent log management, multi-criteria filtering, and incident ticket review.
 */

class HistoryStore {
  constructor() {
    this.storageKey = 'rockfall_ai_detection_logs';
    this.records = [];
    this.subscribers = [];
    this.load();
  }

  load() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        this.records = JSON.parse(saved);
      } else {
        this.records = JSON.parse(JSON.stringify(window.ROCKFALL_DATA.initialHistory));
        this.save();
      }
    } catch (e) {
      console.warn('Failed to load history logs:', e);
      this.records = JSON.parse(JSON.stringify(window.ROCKFALL_DATA.initialHistory));
    }
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.records));
    } catch (e) {
      console.warn('Failed to save history logs:', e);
    }
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notify() {
    this.subscribers.forEach(cb => cb(this.records));
  }

  addRecord(analysisResult) {
    const id = `DET-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRecord = {
      id,
      time: analysisResult.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19),
      source: analysisResult.source || 'CAMERA',
      device: analysisResult.deviceId || 'CAM-01',
      location: analysisResult.location || 'Mine Pit Bench',
      sampleId: analysisResult.sampleId || null,
      customImage: analysisResult.customImage || null,
      risk: analysisResult.risk || 'LOW',
      confidence: analysisResult.confidence || 95.0,
      highProb: analysisResult.highRiskProb || (analysisResult.risk === 'HIGH' ? 95.0 : 5.0),
      lowProb: analysisResult.lowRiskProb || (analysisResult.risk === 'HIGH' ? 5.0 : 95.0),
      status: analysisResult.risk === 'HIGH' ? 'PENDING DISPATCH' : 'STABLE / VERIFIED',
      reviewedBy: 'Automated AI Check',
      indicators: analysisResult.indicators,
      heatCentroids: analysisResult.heatCentroids,
      geologicalSummary: analysisResult.geologicalSummary
    };

    this.records.unshift(newRecord);
    this.save();
    this.notify();
    return newRecord;
  }

  updateRecordStatus(id, newStatus, reviewer) {
    const record = this.records.find(r => r.id === id);
    if (record) {
      record.status = newStatus;
      if (reviewer) record.reviewedBy = reviewer;
      this.save();
      this.notify();
    }
  }

  getFilteredRecords(filters = {}) {
    return this.records.filter(r => {
      // Source filter (DRONE, CAMERA, ALL)
      if (filters.source && filters.source !== 'ALL' && r.source !== filters.source) {
        return false;
      }
      // Device filter
      if (filters.device && filters.device !== 'ALL' && r.device !== filters.device) {
        return false;
      }
      // Risk filter (HIGH, LOW, ALL)
      if (filters.risk && filters.risk !== 'ALL' && r.risk !== filters.risk) {
        return false;
      }
      // Search query
      if (filters.query && filters.query.trim()) {
        const q = filters.query.toLowerCase();
        const matches = (
          r.id.toLowerCase().includes(q) ||
          r.device.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q)
        );
        if (!matches) return false;
      }
      return true;
    });
  }
}

window.historyStore = new HistoryStore();
