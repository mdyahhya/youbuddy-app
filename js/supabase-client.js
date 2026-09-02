// ============================================================================
// YouBuddy — Supabase Client & Seamless Local-First Persistence Engine
// ============================================================================

import { CONFIG, SEED_DATA, getSupabaseCredentials } from './config.js';

class SupabaseService {
  constructor() {
    this.isLiveConfigured = false;
    this.client = null;
    this.storageKey = 'youbuddy_db_v1';
    this.initStorage();
    this.initClient();
  }

  initStorage() {
    let stored = localStorage.getItem(this.storageKey);
    if (!stored) {
      const initialDb = {
        universities: [...SEED_DATA.universities],
        academic_years: [...SEED_DATA.academic_years],
        streams: [...SEED_DATA.streams],
        subjects: [...SEED_DATA.subjects],
        topics: [...SEED_DATA.topics],
        posts: [], // NO hardcoded feed data — fetched exclusively from Supabase
        mcq_options: [],
        mcq_responses: {},
        post_views: {},
        profile: { ...SEED_DATA.default_user }
      };

      localStorage.setItem(this.storageKey, JSON.stringify(initialDb));
    }
  }

  getDb() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey)) || {};
    } catch {
      return {};
    }
  }

  saveDb(data) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  initClient() {
    const { url, key, isConfigured } = getSupabaseCredentials();

    if (window.supabase && isConfigured) {
      try {
        this.client = window.supabase.createClient(url, key);
        this.isLiveConfigured = true;
        console.log("[Supabase] Connected to live Supabase backend:", url);
      } catch (err) {
        this.isLiveConfigured = false;
        console.warn("[Supabase] Init error:", err);
      }
    } else {
      this.isLiveConfigured = false;
      console.log("[Supabase] Supabase credentials not set or incomplete. Waiting for configuration.");
    }
  }

  reconnect(url, key) {
    if (url) localStorage.setItem("youbuddy_supabase_url", url);
    if (key) localStorage.setItem("youbuddy_supabase_anon_key", key);
    this.initClient();
    return this.isLiveConfigured;
  }

  // Live Supabase Feed Query (Returns posts with nested mcq_options)
  async getFeedPostsWithMCQ() {
    if (this.isLiveConfigured && this.client) {
      const { data, error } = await this.client
        .from('posts')
        .select(`
          *,
          mcq_options (*)
        `)
        .eq('is_published', true)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Supabase getFeedPostsWithMCQ error]:', error);
        throw error;
      }

      // Sort nested mcq_options by display_order or option_letter
      if (Array.isArray(data)) {
        data.forEach(p => {
          if (Array.isArray(p.mcq_options)) {
            p.options = p.mcq_options.sort((a, b) => (a.display_order || 0) - (b.display_order || 0) || a.option_letter.localeCompare(b.option_letter));
          } else {
            p.options = [];
          }
        });
      }

      return data || [];
    }

    // Return empty list if Supabase backend is not configured yet
    return [];
  }

  // Generic Query Helpers
  async getTable(tableName) {
    if (this.isLiveConfigured && this.client) {
      const { data, error } = await this.client.from(tableName).select('*');
      if (!error && data) return data;
    }
    const db = this.getDb();
    return db[tableName] || [];
  }


  async insertRow(tableName, row) {
    const db = this.getDb();
    if (!db[tableName]) db[tableName] = [];
    
    const newRow = {
      id: row.id || `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...row
    };

    db[tableName].push(newRow);
    this.saveDb(db);

    if (this.isLiveConfigured && this.client) {
      this.client.from(tableName).insert(newRow).then(({ error }) => {
        if (error) console.error(`[Supabase insert error on ${tableName}]:`, error);
      });
    }

    return newRow;
  }

  async updateRow(tableName, id, updates) {
    const db = this.getDb();
    if (!db[tableName]) return null;
    const index = db[tableName].findIndex(r => r.id === id);
    if (index !== -1) {
      db[tableName][index] = {
        ...db[tableName][index],
        ...updates,
        updated_at: new Date().toISOString()
      };
      this.saveDb(db);
    }

    if (this.isLiveConfigured && this.client) {
      this.client.from(tableName).update(updates).eq('id', id).then(({ error }) => {
        if (error) console.error(`[Supabase update error on ${tableName}]:`, error);
      });
    }

    return db[tableName][index];
  }

  async deleteRow(tableName, id) {
    const db = this.getDb();
    if (db[tableName]) {
      db[tableName] = db[tableName].filter(r => r.id !== id);
      this.saveDb(db);
    }

    if (this.isLiveConfigured && this.client) {
      this.client.from(tableName).delete().eq('id', id).then(({ error }) => {
        if (error) console.error(`[Supabase delete error on ${tableName}]:`, error);
      });
    }

    return true;
  }
}

export const dbService = new SupabaseService();
