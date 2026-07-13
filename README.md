# Thailand Money Expense

A Google Apps Script starter for turning Thai bank transaction emails into structured expense rows in Google Sheets.

It currently supports CardX credit-card transaction emails. The project is intentionally provider- and destination-agnostic: add a parser for another bank, or replace the Google Sheets adapter with your own integration.

## What it does

1. Searches recent Gmail messages that match a configured bank rule.
2. Parses the transaction date, merchant, amount, card suffix, and payment method.
3. Writes each unique Gmail message to a Google Sheet.

The unique key is `gmail-<messageId>`, so a transaction email is written only once even when Gmail groups several notifications into one thread.

## Quick start

### 1. Create a Google Sheet

Create a blank spreadsheet and copy its ID from the URL:

`https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit`

Put that value in `Config.js`:

```js
spreadsheetId: "PASTE_YOUR_GOOGLE_SHEET_ID_HERE"
```

### 2. Create an Apps Script project

Create a new project at [script.google.com](https://script.google.com), then copy these files into the project:

- `appsscript.json`
- `Config.js`
- `Code.js`
- `CardXProvider.js`
- `GoogleSheetsAdapter.js`

Alternatively, use [clasp](https://github.com/google/clasp):

```sh
cp .clasp.json.example .clasp.json
# Edit .clasp.json and add your own Apps Script project ID.
npx @google/clasp push
```

### 3. Authorize and test

In the Apps Script editor, select `runEmailSync` and click **Run**. Google will ask for access to read Gmail and write to the spreadsheet you configured.

The first run creates a `Transactions` sheet and writes these columns:

| external_ref | date | merchant | amount | currency | payment_method | provider | account_last4 |
| --- | --- | --- | --- | --- | --- | --- | --- |

### 4. Automate it

In Apps Script, open **Triggers** and create a time-driven trigger for `runEmailSync`. Every 5–15 minutes is usually sufficient.

`Config.js` defaults to searching the last day of messages. Keep this small when using a frequent trigger.

## Add a bank parser

1. Add a rule in `Config.js`.
2. Add a parser in a new file, returning this shape:

```js
{
  externalRef: "gmail-...",
  date: "2026-07-13T01:00:00.000Z",
  merchant: "ร้านค้า",
  amount: 149.25,
  currency: "THB",
  paymentMethod: "credit_card",
  paymentProvider: "BANK_NAME",
  accountLast4: "1234"
}
```

3. Route its provider name in `parseEmail_` inside `Code.js`.

Please add an anonymized email sample and a parser test case in your pull request. Never commit a real email, spreadsheet ID, API key, OAuth token, or Apps Script `scriptId`.

## Privacy and security

- This repository contains no credentials or personal identifiers.
- `.clasp.json` is ignored because it identifies your own Apps Script project.
- The default app only requests Gmail read access and Google Sheets access.
- Do not paste credentials into source files. Use Apps Script Script Properties for any custom integration secrets.

## Contributing

Contributions are welcome, especially parsers for Thai banks and cards. Please keep parsers narrow: match the sender and subject, parse only the transaction fields needed, and preserve `gmail-<messageId>` as the idempotency key.

## License

MIT. See [LICENSE](LICENSE).
