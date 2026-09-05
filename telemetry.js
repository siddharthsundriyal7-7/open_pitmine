/**
 * ROCKFALL AI — Telemetry & Device Network Simulator
 * Real-time monitoring of UAV-01 fleet and fixed mine camera network (CAM-01..04).
 */

class TelemetryManager {
  constructor() {
    this.cameras = JSON.parse(JSON.stringify(window.ROCKFALL_DATA.cameras));
    this.drones = JSON.parse(JSON.stringify(window.ROCKFALL_DATA.drones));
    this.subscribers = [];
    this.interval = null;
    this.startSimulation();
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notify() {
    this.subscribers.forEach(cb => cb({ cameras: this.cameras, drones: this.drones }));
  }

  startSimulation() {
    this.interval = setInterval(() => {
      // 1. Subtle UAV-01 telemetry drift (realistic flight fluctuations)
      const uav = this.drones.find(d => d.id === 'UAV-01');
      if (uav && uav.status === 'ONLINE') {
        const altNum = 142 + (Math.random() * 2 - 1);
        uav.altitude = `${altNum.toFixed(1)} m AGL`;
        const spdNum = 4.6 + (Math.random() * 0.8 - 0.4);
        uav.speed = `${spdNum.toFixed(1)} m/s`;
        uav.signal = Math.min(100, Math.max(92, Math.floor(98 + (Math.random() * 4 - 2))));
        // Occasional battery tick
        if (Math.random() < 0.1 && uav.battery > 20) {
          uav.battery -= 1;
        }
        const now = new Date();
        uav.lastTransmission = now.toTimeString().substring(0, 8);
      }

      // 2. Camera heartbeats
      this.cameras.forEach(cam => {
        if (cam.status !== 'OFFLINE') {
          cam.lastPing = 'Just now';
          const jitter = Math.floor(Math.random() * 3 - 1);
          cam.signal = Math.min(100, Math.max(80, cam.signal + jitter));
        }
      });

      this.notify();
    }, 3000);
  }

  getCamera(id) {
    return this.cameras.find(c => c.id === id);
  }

  getDrone(id) {
    return this.drones.find(d => d.id === id);
  }

  setCameraStatus(id, status) {
    const cam = this.getCamera(id);
    if (cam) {
      cam.status = status;
      this.notify();
    }
  }

  setDroneStatus(id, status) {
    const drone = this.getDrone(id);
    if (drone) {
      drone.status = status;
      this.notify();
    }
  }
}

window.telemetryManager = new TelemetryManager();
