import { Notice, Plugin } from "obsidian";
import { dedupeCalendarIds } from "./calendarIds";
import { formatEventsMarkdown } from "./formatter";
import { GoogleAuth } from "./googleAuth";
import { GoogleCalendarClient } from "./googleCalendar";
import { GcalTemplaterSettingTab, DEFAULT_SETTINGS } from "./settings";
import { TokenStore } from "./tokenStore";
import type { GcalEventsOptions, LegacyPluginSettings, PluginSettings } from "./types";

export default class GcalTemplaterPlugin extends Plugin {
  settings: PluginSettings;
  auth: GoogleAuth;
  private calendar: GoogleCalendarClient;

  async onload() {
    await this.loadSettings();

    const tokenStore = new TokenStore(this);
    this.auth = new GoogleAuth(
      tokenStore,
      () => this.settings.clientId,
      () => this.settings.clientSecret,
    );
    this.calendar = new GoogleCalendarClient(
      () => this.auth.getAccessToken(),
      () => this.settings.defaultCalendarIds,
      () => this.settings.timezone,
    );

    window.gcalEvents = async (options: GcalEventsOptions) => {
      try {
        const events = await this.calendar.getEvents(options);
        if (options.format === "raw") {
          return events;
        }
        return formatEventsMarkdown(events, this.settings.timezone, this.settings.markdownFormat);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Google Calendar request failed.";
        new Notice(message);
        throw error;
      }
    };

    this.addCommand({
      id: "connect-google-calendar",
      name: "Connect Google Calendar",
      callback: async () => {
        await this.loadSettings();
        await this.auth.connect();
        new Notice("Google Calendar connected.");
      },
    });

    this.addSettingTab(new GcalTemplaterSettingTab(this.app, this));
  }

  onunload() {
    delete window.gcalEvents;
  }

  async loadSettings() {
    this.settings = normalizeSettings(await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

function normalizeSettings(data: LegacyPluginSettings | null): PluginSettings {
  const settings = Object.assign({}, DEFAULT_SETTINGS, data);
  const defaultCalendarIds =
    data?.defaultCalendarIds ??
    (data?.defaultCalendarId ? [data.defaultCalendarId] : DEFAULT_SETTINGS.defaultCalendarIds);

  return {
    ...settings,
    defaultCalendarIds: normalizeCalendarIds(defaultCalendarIds),
  };
}

function normalizeCalendarIds(calendarIds: string[]): string[] {
  const normalized = dedupeCalendarIds(calendarIds);
  return normalized.length > 0 ? normalized : ["primary"];
}
