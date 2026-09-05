/**
 * ROCKFALL AI — Authentication & Operational Role Management
 * Handles multi-role state, credentials verification, login/logout, and permissions.
 */

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.selectedRole = 'ADMINISTRATOR'; // Default selected role tab
    this.sessionKey = 'rockfall_ai_auth_session';

    // Demo Accounts
    this.accounts = {
      ADMINISTRATOR: {
        username: 'admin@rockfall.ai',
        password: 'Admin2026!',
        role: 'ADMINISTRATOR',
        name: 'Chief Geotech Eng. Elena Rostova',
        badgeId: 'GEO-ADMIN-01',
        title: 'Geotechnical Command Director',
        permissions: ['uav_monitoring', 'drone_upload', 'ai_analysis', 'system_monitoring', 'reports', 'full_access']
      },
      WORKER: {
        username: 'worker@rockfall.ai',
        password: 'Worker2026!',
        role: 'WORKER',
        name: 'Pit Lead J. Martinez',
        badgeId: 'PIT-OPS-884',
        title: 'Pit Safety Supervisor (Shift A)',
        permissions: ['camera_monitoring', 'camera_upload', 'ai_analysis', 'rockfall_alerts', 'detection_history', 'camera_status']
      }
    };

    this.restoreSession();
  }

  restoreSession() {
    try {
      const saved = localStorage.getItem(this.sessionKey);
      if (saved) {
        this.currentUser = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not restore auth session:', e);
    }
  }

  setRoleTab(role) {
    if (role === 'ADMINISTRATOR' || role === 'WORKER') {
      this.selectedRole = role;
    }
  }

  async login(username, password, role) {
    // Simulate network validation delay
    await new Promise(r => setTimeout(r, 600));

    const targetAccount = this.accounts[role];
    if (!targetAccount) {
      throw new Error('Invalid operational role specified.');
    }

    const trimmedUser = (username || '').trim().toLowerCase();
    const expectedUser = targetAccount.username.toLowerCase();

    // Allow standard demo login or valid password
    if (trimmedUser === expectedUser && password === targetAccount.password) {
      this.currentUser = { ...targetAccount };
      localStorage.setItem(this.sessionKey, JSON.stringify(this.currentUser));
      return this.currentUser;
    } else {
      throw new Error(`Authentication failed: Incorrect credentials for ${role === 'ADMINISTRATOR' ? 'Administrator' : 'Mine Worker'}. Use demo credentials.`);
    }
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem(this.sessionKey);
  }

  isAuthenticated() {
    return !!this.currentUser;
  }

  isAdmin() {
    return this.currentUser && this.currentUser.role === 'ADMINISTRATOR';
  }

  isWorker() {
    return this.currentUser && this.currentUser.role === 'WORKER';
  }

  getDemoCredentials(role) {
    return this.accounts[role] || this.accounts.ADMINISTRATOR;
  }
}

window.authManager = new AuthManager();
