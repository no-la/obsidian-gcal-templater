# Google Calendar Templater

Google Calendar の予定を [[Templater]] から使うための Obsidian plugin です。

`window.gcalEvents()` を公開し、指定した日付範囲の予定を Markdown または raw object として返します。

```js
<%*
tR += await window.gcalEvents({
  from: "2026-08-25",
  to: "2026-08-31",
  calendarId: "primary"
})
%>
```

## できること

- Templater から Google Calendar の予定を取得する
- `YYYY-MM-DD` または ISO datetime で日付範囲を指定する
- 既定カレンダーまたは任意の `calendarId` を指定する
- 繰り返し予定を展開して開始時刻順に取得する
- 終日予定と時刻付き予定を Markdown に整形する
- token は Obsidian の SecretStorage を優先して保存する

## セットアップ

1. Google Cloud Console で OAuth 2.0 client ID を作る
2. client type は Desktop app / Installed app を使う
3. 必要なら redirect URI に `http://127.0.0.1:42813/callback` を追加する
4. Obsidian の plugin 設定に client ID を貼る
5. **Connect Google Calendar** を押して Google 認証を完了する

要求する scope は読み取り専用です。

```text
https://www.googleapis.com/auth/calendar.events.readonly
https://www.googleapis.com/auth/calendar.readonly
```

## 使い方

日次ノートに今日の予定を入れる例。

```js
<%*
tR += await window.gcalEvents({
  from: tp.date.now("YYYY-MM-DD"),
  to: tp.date.now("YYYY-MM-DD", 1)
})
%>
```

週の予定を入れる例。

```js
<%*
tR += await window.gcalEvents({
  from: "2026-08-25",
  to: "2026-09-01",
  calendarId: "primary",
  format: "markdown"
})
%>
```

raw object が欲しい場合。

```js
<%*
const events = await window.gcalEvents({
  from: "2026-08-25",
  to: "2026-09-01",
  format: "raw"
})
tR += JSON.stringify(events, null, 2)
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

`to` は exclusive boundary として扱います。

例えば `from: "2026-08-25"`、`to: "2026-08-26"` は 2026-08-25 の 1 日分です。

## Markdown format

設定画面の Markdown format では以下の token が使えます。

```ts
{{date}}
{{time}}
{{start}}
{{end}}
{{title}}
{{location}}
{{calendarId}}
{{htmlLink}}
```

既定値。

```md
- {{date}} {{time}} {{title}}{{location}}
```

## Notes

この plugin は desktop only です。

OAuth token は Obsidian の `SecretStorage` を優先して保存します。利用中の Obsidian に programmatic SecretStorage API がない場合は fallback として plugin data に保存します。

## English

Google Calendar Templater is an Obsidian plugin that exposes `window.gcalEvents()` for Templater templates.

It fetches Google Calendar events for a date range and returns Markdown by default.

```js
<%*
tR += await window.gcalEvents({
  from: tp.date.now("YYYY-MM-DD"),
  to: tp.date.now("YYYY-MM-DD", 1),
  format: "markdown"
})
%>
```

The plugin uses Google OAuth 2.0 with PKCE and requests read-only calendar scopes.
