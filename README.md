# Google Calendar Templater

Google Calendar Templater is an Obsidian plugin that exposes Google Calendar events to Templater templates.

The plugin registers `window.gcalEvents()`. Templater can call it, wait for Google Calendar events, and insert the returned Markdown into the current note.

```js
<%*
tR += await window.gcalEvents({
  from: "2026-08-25",
  to: "2026-08-26",
  calendarId: "primary"
})
%>
```

## Features

- Fetch Google Calendar events from Templater
- Query events by date range
- Use `primary` or any Google Calendar ID
- Expand recurring events with Google Calendar API
- Render timed and all-day events as Markdown
- Return raw event objects when needed
- Store OAuth tokens with Obsidian SecretStorage when available

## Requirements

- Obsidian desktop
- Templater
- A Google Cloud project
- Google Calendar API enabled in that project
- OAuth 2.0 desktop client ID and client secret

This plugin is desktop only because it uses a local loopback OAuth callback.

## Setup

### 1. Enable Google Calendar API

In Google Cloud Console, open your project and enable **Google Calendar API**.

If this is missing, authentication can succeed but event fetching will fail with `403`.

### 2. Create an OAuth client

In Google Cloud Console:

1. Open **Google Auth Platform**.
2. Configure the consent screen.
3. Create an OAuth 2.0 client.
4. Choose **Desktop app** as the client type.
5. Copy the client ID.
6. Copy the client secret.

Google may require the client secret during token exchange even for a desktop client. This plugin therefore supports both client ID and client secret.

### 3. Configure the plugin

In Obsidian:

1. Open **Settings**.
2. Open **Community plugins**.
3. Open **Google Calendar Templater** settings.
4. Paste the Google OAuth client ID.
5. Paste the Google OAuth client secret.
6. Set the timezone, for example `Asia/Tokyo`.
7. Press **Connect Google Calendar**.
8. Approve access in the browser.
9. Return to Obsidian and press **Check connection**.

The plugin requests read-only scopes:

```text
https://www.googleapis.com/auth/calendar.events.readonly
https://www.googleapis.com/auth/calendar.readonly
```

## Usage

Insert today's events:

```js
<%*
tR += await window.gcalEvents({
  from: tp.date.now("YYYY-MM-DD"),
  to: tp.date.now("YYYY-MM-DD", 1)
})
%>
```

Insert tomorrow's events:

```js
<%*
tR += await window.gcalEvents({
  from: tp.date.now("YYYY-MM-DD", 1),
  to: tp.date.now("YYYY-MM-DD", 2)
})
%>
```

Insert a fixed range:

```js
<%*
tR += await window.gcalEvents({
  from: "2026-08-25",
  to: "2026-09-01",
  calendarId: "primary",
  format: "markdown",
  includeAllDay: true,
  includeDeclined: false
})
%>
```

Return raw objects:

````js
<%*
const events = await window.gcalEvents({
  from: "2026-08-25",
  to: "2026-09-01",
  format: "raw"
})

tR += "```json\n" + JSON.stringify(events, null, 2) + "\n```"
%>
````

Use a soft failure in templates:

```js
<%*
try {
  tR += await window.gcalEvents({
    from: tp.date.now("YYYY-MM-DD"),
    to: tp.date.now("YYYY-MM-DD", 1)
  })
} catch (error) {
  tR += `%% Google Calendar Templater: ${error.message} %%`
}
%>
```

## API

```ts
window.gcalEvents(options: GcalEventsOptions): Promise<string | GcalEvent[]>
```

```ts
type GcalEventsOptions = {
  from: string;
  to: string;
  calendarId?: string;
  format?: "markdown" | "raw";
  includeAllDay?: boolean;
  includeDeclined?: boolean;
};
```

`from` and `to` accept either `YYYY-MM-DD` or ISO datetime strings.

Date-only values are interpreted in the configured timezone. `to` is exclusive, so this query returns events for August 25 only:

```js
await window.gcalEvents({
  from: "2026-08-25",
  to: "2026-08-26"
})
```

## Markdown Format

The default Markdown format is configurable in plugin settings.

Default:

```md
- {{date}} {{time}} {{title}}{{location}}
```

Available tokens:

```text
{{date}}
{{time}}
{{start}}
{{end}}
{{title}}
{{location}}
{{calendarId}}
{{htmlLink}}
```

## Security Notes

OAuth access tokens and refresh tokens are stored with Obsidian SecretStorage when available.

The Google OAuth client secret is stored in plugin settings. Obsidian plugins run locally and cannot keep a client secret truly secret from the local user. Use an OAuth client dedicated to this plugin.

## Troubleshooting

### `Google Calendar is not connected`

The plugin does not have a stored refresh token.

Open plugin settings, press **Connect Google Calendar**, then press **Check connection**.

### `client_secret is missing`

Paste the Google OAuth client secret into plugin settings and reconnect.

### `Google Calendar events.list failed: 403`

The most common cause is that **Google Calendar API** is not enabled in the Google Cloud project.

Enable Google Calendar API, then run the template again.

### The template aborts

Wrap the call in `try/catch` and return an Obsidian comment on failure:

```js
<%*
try {
  tR += await window.gcalEvents({
    from: tp.date.now("YYYY-MM-DD"),
    to: tp.date.now("YYYY-MM-DD", 1)
  })
} catch (error) {
  tR += `%% Google Calendar Templater: ${error.message} %%`
}
%>
```

## 日本語

Google Calendar Templater は、Obsidian の Templater から Google Calendar の予定を取得するためのプラグインです。

`window.gcalEvents()` を公開し、指定した日付範囲の予定を Markdown または raw object として返します。

### セットアップ

1. Google Cloud Console で Google Calendar API を有効化する
2. Google Auth Platform で OAuth consent screen を設定する
3. OAuth 2.0 client を作る
4. client type は **Desktop app** を選ぶ
5. client ID と client secret をコピーする
6. Obsidian の Google Calendar Templater 設定に貼る
7. timezone を設定する
8. **Connect Google Calendar** を押す
9. ブラウザで許可する
10. Obsidian に戻って **Check connection** を押す

### 使用例

```js
<%*
tR += await window.gcalEvents({
  from: tp.date.now("YYYY-MM-DD"),
  to: tp.date.now("YYYY-MM-DD", 1)
})
%>
```

`to` は exclusive boundary です。`from: "2026-08-25"`、`to: "2026-08-26"` は 2026-08-25 の 1 日分として扱います。
