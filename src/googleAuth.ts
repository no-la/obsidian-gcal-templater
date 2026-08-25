import { Notice, requestUrl } from "obsidian";
import { createServer, type Server } from "node:http";
import { randomBytes, createHash } from "node:crypto";
import type { GoogleTokenResponse } from "./types";
import { TokenStore } from "./tokenStore";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REDIRECT_PORT = 42813;
const REDIRECT_URI = `http://127.0.0.1:${REDIRECT_PORT}/callback`;
const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events.readonly",
  "https://www.googleapis.com/auth/calendar.readonly",
];

export class GoogleAuth {
  constructor(
    private tokenStore: TokenStore,
    private getClientId: () => string,
  ) {}

  async connect(): Promise<void> {
    const clientId = this.requireClientId();
    const verifier = base64Url(randomBytes(64));
    const challenge = base64Url(createHash("sha256").update(verifier).digest());
    const state = base64Url(randomBytes(32));

    const callback = waitForOAuthCallback(state);
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: REDIRECT_URI,
      response_type: "code",
      scope: SCOPES.join(" "),
      access_type: "offline",
      prompt: "consent",
      code_challenge: challenge,
      code_challenge_method: "S256",
      state,
    });

    window.open(`${AUTH_URL}?${params.toString()}`);
    const code = await callback;
    const tokens = await this.exchangeCode(clientId, code, verifier);
    await this.tokenStore.setTokens({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
    });
  }

  async disconnect(): Promise<void> {
    await this.tokenStore.clear();
  }

  async getAccessToken(): Promise<string> {
    const tokens = await this.tokenStore.getTokens();
    if (tokens.accessToken && tokens.expiresAt && tokens.expiresAt > Date.now() + 60_000) {
      return tokens.accessToken;
    }

    if (!tokens.refreshToken) {
      throw new Error("Google Calendar is not connected. Open plugin settings and connect your account.");
    }

    const refreshed = await this.refresh(tokens.refreshToken);
    await this.tokenStore.setTokens({
      accessToken: refreshed.access_token,
      expiresAt: Date.now() + refreshed.expires_in * 1000,
    });

    return refreshed.access_token;
  }

  private async exchangeCode(
    clientId: string,
    code: string,
    verifier: string,
  ): Promise<GoogleTokenResponse> {
    const body = new URLSearchParams({
      client_id: clientId,
      code,
      code_verifier: verifier,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
    });

    const response = await requestUrl({
      url: TOKEN_URL,
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Google token exchange failed: ${response.status}`);
    }

    return response.json as GoogleTokenResponse;
  }

  private async refresh(refreshToken: string): Promise<GoogleTokenResponse> {
    const body = new URLSearchParams({
      client_id: this.requireClientId(),
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });

    const response = await requestUrl({
      url: TOKEN_URL,
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (response.status < 200 || response.status >= 300) {
      new Notice("Google Calendar token refresh failed. Reconnect from plugin settings.");
      throw new Error(`Google token refresh failed: ${response.status}`);
    }

    return response.json as GoogleTokenResponse;
  }

  private requireClientId(): string {
    const clientId = this.getClientId().trim();
    if (!clientId) {
      throw new Error("Google OAuth client ID is missing.");
    }
    return clientId;
  }
}

function waitForOAuthCallback(expectedState: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let server: Server | undefined;
    const timeout = window.setTimeout(() => {
      server?.close();
      reject(new Error("Google OAuth timed out."));
    }, 120_000);

    server = createServer((request, response) => {
      if (!request.url) return;
      const url = new URL(request.url, REDIRECT_URI);

      if (url.pathname !== "/callback") {
        response.writeHead(404);
        response.end("Not found");
        return;
      }

      const state = url.searchParams.get("state");
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      if (error) {
        cleanup();
        response.end("Google Calendar authorization failed. You can close this window.");
        reject(new Error(`Google OAuth failed: ${error}`));
        return;
      }

      if (!code || state !== expectedState) {
        cleanup();
        response.end("Invalid Google Calendar authorization response. You can close this window.");
        reject(new Error("Invalid Google OAuth response."));
        return;
      }

      cleanup();
      response.end("Google Calendar connected. You can close this window.");
      resolve(code);
    });

    server.listen(REDIRECT_PORT, "127.0.0.1").on("error", reject);

    function cleanup() {
      window.clearTimeout(timeout);
      server?.close();
    }
  });
}

function base64Url(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}
