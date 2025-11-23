import { Injectable } from '@angular/core';

export interface AppUser {
  id: number;
  name: string;
  email: string;
  passwordHash: string; // SHA-256 hex
}

const STORAGE_KEY = 'app_users_v1';

@Injectable({ providedIn: 'root' })
export class UserService {
  private users: AppUser[] = [];

  constructor() {
    this.users = this.load();
  }

  private load(): AppUser[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as AppUser[];
    } catch (e) { /* ignore */ }
    return [];
  }

  private save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.users)); } catch (e) { /* ignore */ }
  }

  list(): AppUser[] {
    return this.users.slice();
  }

  findByEmail(email: string): AppUser | undefined {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  async register(name: string, email: string, password: string): Promise<{ ok: boolean; reason?: string; user?: AppUser }> {
    email = (email || '').trim();
    if (!email) return { ok: false, reason: 'Email requerido' };
    if (this.findByEmail(email)) return { ok: false, reason: 'Email ya registrado' };
    const hash = await this.hashPassword(password || '');
    const id = Date.now();
    const u: AppUser = { id, name: (name || '').trim(), email, passwordHash: hash };
    this.users.unshift(u);
    this.save();
    return { ok: true, user: u };
  }

  async validateCredentials(email: string, password: string): Promise<{ ok: boolean; user?: AppUser }> {
    const u = this.findByEmail(email || '');
    if (!u) return { ok: false };
    const hash = await this.hashPassword(password || '');
    if (hash === u.passwordHash) return { ok: true, user: u };
    return { ok: false };
  }

  // Web Crypto SHA-256 -> hex. Falls back to storing plain text if Crypto not available (very unlikely in modern browsers)
  private async hashPassword(password: string): Promise<string> {
    try {
      if (typeof crypto !== 'undefined' && (crypto as any).subtle && typeof (crypto as any).subtle.digest === 'function') {
        const enc = new TextEncoder();
        const data = enc.encode(password);
        const hashBuf = await (crypto as any).subtle.digest('SHA-256', data);
        const hashArr = Array.from(new Uint8Array(hashBuf));
        const hashHex = hashArr.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
      }
    } catch (e) {
      // ignore and fallback
    }
    // fallback (not secure): return password as-is
    return password;
  }
}
