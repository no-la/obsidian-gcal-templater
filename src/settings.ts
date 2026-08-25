import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import type GcalTemplaterPlugin from "./main";
import type { PluginSettings } from "./types";

export const DEFAULT_SETTINGS: PluginSettings = {
  clientId: "",
  defaultCalendarId: "primary",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  markdownFormat: "- {{date}} {{time}} {{title}}{{location}}",
};

export class GcalTemplaterSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private plugin: GcalTemplaterPlugin,
  ) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Google Calendar Templater" });

    new Setting(containerEl)
      .setName("Google OAuth client ID")
      .setDesc("Use a desktop app OAuth client with the loopback redirect URI.")
      .addText((text) =>
        text
          .setPlaceholder("1234567890-....apps.googleusercontent.com")
          .setValue(this.plugin.settings.clientId)
          .onChange(async (value) => {
            this.plugin.settings.clientId = value.trim();
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Default calendar ID")
      .setDesc("Use primary or a specific Google Calendar ID.")
      .addText((text) =>
        text
          .setPlaceholder("primary")
          .setValue(this.plugin.settings.defaultCalendarId)
          .onChange(async (value) => {
            this.plugin.settings.defaultCalendarId = value.trim() || "primary";
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Timezone")
      .setDesc("Date-only ranges are interpreted in this timezone.")
      .addText((text) =>
        text
          .setPlaceholder("Asia/Tokyo")
          .setValue(this.plugin.settings.timezone)
          .onChange(async (value) => {
            this.plugin.settings.timezone = value.trim() || "UTC";
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Markdown format")
      .setDesc("Available tokens: {{date}}, {{time}}, {{start}}, {{end}}, {{title}}, {{location}}, {{calendarId}}, {{htmlLink}}.")
      .addText((text) =>
        text
          .setPlaceholder("- {{date}} {{time}} {{title}}")
          .setValue(this.plugin.settings.markdownFormat)
          .onChange(async (value) => {
            this.plugin.settings.markdownFormat = value || DEFAULT_SETTINGS.markdownFormat;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Connect Google Calendar")
      .setDesc("Opens Google OAuth in your browser.")
      .addButton((button) =>
        button.setButtonText("Connect").setCta().onClick(async () => {
          try {
            await this.plugin.auth.connect();
            new Notice("Google Calendar connected.");
          } catch (error) {
            new Notice(error instanceof Error ? error.message : "Google Calendar connection failed.");
          }
        }),
      );

    new Setting(containerEl)
      .setName("Disconnect")
      .setDesc("Removes locally stored Google Calendar tokens.")
      .addButton((button) =>
        button.setButtonText("Disconnect").onClick(async () => {
          await this.plugin.auth.disconnect();
          new Notice("Google Calendar tokens removed.");
        }),
      );
  }
}
