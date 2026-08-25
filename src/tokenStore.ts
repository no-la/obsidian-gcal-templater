import type GcalTemplaterPlugin from "./main";
import type { StoredTokenSet } from "./types";

const ACCESS_TOKEN_KEY = "google-calendar-templater-access-token";
const REFRESH_TOKEN_KEY = "google-calendar-templater-refresh-token";
const EXPIRES_AT_KEY = "google-calendar-templater-expires-at";

export class TokenStore {
  constructor(private plugin: GcalTemplaterPlugin) {}

  async getTokens(): Promise<StoredTokenSet> {
    return {
      accessToken: await this.getSecret(ACCESS_TOKEN_KEY),
      refreshToken: await this.getSecret(REFRESH_TOKEN_KEY),
      expiresAt: Number(await this.getSecret(EXPIRES_AT_KEY)) || undefined,
    };
  }

  async setTokens(tokens: StoredTokenSet): Promise<void> {
    const current = await this.getTokens();
    const next = { ...current, ...tokens };

    if (next.accessToken) await this.setSecret(ACCESS_TOKEN_KEY, next.accessToken);
    if (next.refreshToken) await this.setSecret(REFRESH_TOKEN_KEY, next.refreshToken);
    if (next.expiresAt) await this.setSecret(EXPIRES_AT_KEY, String(next.expiresAt));
  }

  async clear(): Promise<void> {
    await this.removeSecret(ACCESS_TOKEN_KEY);
    await this.removeSecret(REFRESH_TOKEN_KEY);
    await this.removeSecret(EXPIRES_AT_KEY);
    this.plugin.settings.tokenFallback = undefined;
    await this.plugin.saveSettings();
  }

  private async getSecret(key: string): Promise<string | undefined> {
    const storage = this.secretStorage();
    if (storage?.getSecret) return asString(await storage.getSecret(key));
    if (storage?.get) return asString(await storage.get(key));
    return this.getFallbackValue(key);
  }

  private async setSecret(key: string, value: string): Promise<void> {
    const storage = this.secretStorage();
    if (storage?.setSecret) {
      await storage.setSecret(key, value);
      return;
    }
    if (storage?.set) {
      await storage.set(key, value);
      return;
    }

    const fallback = this.plugin.settings.tokenFallback ?? {};
    if (key === ACCESS_TOKEN_KEY) fallback.accessToken = value;
    if (key === REFRESH_TOKEN_KEY) fallback.refreshToken = value;
    if (key === EXPIRES_AT_KEY) fallback.expiresAt = Number(value);
    this.plugin.settings.tokenFallback = fallback;
    await this.plugin.saveSettings();
  }

  private async removeSecret(key: string): Promise<void> {
    const storage = this.secretStorage();
    if (storage?.deleteSecret) {
      await storage.deleteSecret(key);
      return;
    }
    if (storage?.removeSecret) {
      await storage.removeSecret(key);
      return;
    }
    if (storage?.delete) {
      await storage.delete(key);
      return;
    }
    if (storage?.remove) {
      await storage.remove(key);
    }
  }

  private getFallbackValue(key: string): string | undefined {
    const fallback = this.plugin.settings.tokenFallback;
    if (!fallback) return undefined;
    if (key === ACCESS_TOKEN_KEY) return fallback.accessToken;
    if (key === REFRESH_TOKEN_KEY) return fallback.refreshToken;
    if (key === EXPIRES_AT_KEY && fallback.expiresAt) return String(fallback.expiresAt);
    return undefined;
  }

  private secretStorage(): Record<string, ((...args: unknown[]) => unknown) | undefined> | undefined {
    return (this.plugin.app as unknown as { secretStorage?: Record<string, ((...args: unknown[]) => unknown) | undefined> })
      .secretStorage;
  }
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
