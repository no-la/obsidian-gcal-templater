import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import type GcalTemplaterPlugin from "./main";
import type { PluginSettings } from "./types";

export const DEFAULT_SETTINGS: PluginSettings = {
  clientId: "",
  clientSecret: "",
  defaultCalendarIds: ["primary"],
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
      .setName("Google OAuth client secret")
      .setDesc("Some Google OAuth clients require this during token exchange. It is stored in plugin data, so use a dedicated Google Cloud OAuth client.")
      .addText((text) => {
        text.inputEl.type = "password";
        text
          .setPlaceholder("GOCSPX-...")
          .setValue(this.plugin.settings.clientSecret)
          .onChange(async (value) => {
            this.plugin.settings.clientSecret = value.trim();
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Default calendar IDs")
      .setDesc("One Google Calendar ID per line. Used when calendarIds is omitted.")
      .addTextArea((text) =>
        text
          .setPlaceholder("primary")
          .setValue(this.plugin.settings.defaultCalendarIds.join("\n"))
          .onChange(async (value) => {
            const calendarIds = value
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean);
            this.plugin.settings.defaultCalendarIds = calendarIds.length > 0 ? calendarIds : ["primary"];
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
            await this.plugin.loadSettings();
            await this.plugin.auth.connect();
            new Notice("Google Calendar connected.");
          } catch (error) {
            new Notice(error instanceof Error ? error.message : "Google Calendar connection failed.");
          }
        }),
      );

    new Setting(containerEl)
      .setName("Check connection")
      .setDesc("Checks whether a Google refresh token is stored locally.")
      .addButton((button) =>
        button.setButtonText("Check").onClick(async () => {
          const connected = await this.plugin.auth.isConnected();
          new Notice(connected ? "Google Calendar is connected." : "Google Calendar is not connected.");
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
