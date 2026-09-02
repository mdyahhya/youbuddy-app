// ============================================================================
// YouBuddy — Auth & User Profile Context Service
// ============================================================================

import { dbService } from '../supabase-client.js';
import { SEED_DATA } from '../config.js';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.listeners = [];
    this.init();
  }

  init() {
    const db = dbService.getDb();
    this.currentUser = db.profile || { ...SEED_DATA.default_user };
  }

  getUser() {
    return this.currentUser;
  }

  isAdmin() {
    return !!this.currentUser?.is_admin;
  }

  setAdminMode(isAdmin) {
    this.updateProfile({ is_admin: isAdmin });
  }

  updateAcademicContext(universityId, yearId, streamId = null) {
    return this.updateProfile({
      selected_university_id: universityId,
      selected_year_id: yearId,
      selected_stream_id: streamId
    });
  }

  updateProfile(updates) {
    this.currentUser = {
      ...this.currentUser,
      ...updates
    };

    const db = dbService.getDb();
    db.profile = this.currentUser;
    dbService.saveDb(db);

    this.notifyListeners();
    return this.currentUser;
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach(cb => cb(this.currentUser));
  }
}

export const authService = new AuthService();
