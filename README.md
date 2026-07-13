# Thailand Money Expense

A Google Apps Script starter for parsing Thai bank transaction emails into structured expense records.

It currently supports CardX credit-card transaction emails and KBank transaction emails for PromptPay, Bill Payment, and Funds Transfer. The default adapter only writes parsed records to the Apps Script execution log; add your own destination adapter when you are ready.

## What it does

1. Searches recent Gmail messages that match a configured bank rule.
2. Parses the transaction date, merchant, amount, card suffix, and payment method.
3. Logs each parsed record in the Apps Script execution log.

The unique key is `gmail-<messageId>`, so a transaction email is written only once even when Gmail groups several notifications into one thread.

## Quick start

### 1. Create an Apps Script project

Create a new project at [script.google.com](https://script.google.com), then copy these files into the project:

- `appsscript.json`
- `Config.js`
- `Code.js`
- `providers/CardXProvider.js`
- `providers/KbankProvider.js`
- `adapters/LogAdapter.js`
- `adapters/GoogleSheetsAdapter.js`
- `adapters/ApiAdapter.js`

Alternatively, use [clasp](https://github.com/google/clasp):

```sh
cp .clasp.json.example .clasp.json
# Edit .clasp.json and add your own Apps Script project ID.
npx @google/clasp push
```

### 2. Authorize and test

In the Apps Script editor, select `runEmailSync` and click **Run**. Google will ask for read-only access to Gmail. Open **Execution log** to inspect the parsed records.

### 3. Automate it

In Apps Script, open **Triggers** and create a time-driven trigger for `runEmailSync`. Every 5–15 minutes is usually sufficient.

`Config.js` defaults to searching the last day of messages. Keep this small when using a frequent trigger. Processed Gmail message IDs are retained in Script Properties, so messages in an existing thread are parsed and delivered only once. This deliberately does not use Gmail labels: Gmail labels apply to an entire thread, which can hide a later transaction email in that same thread.

## Adapters

`Code.js` delegates the parsed records through one adapter entry point:

```js
const result = deliverExpenses_(expenses);
```

`adapters/LogAdapter.js` provides the default behavior and deliberately has no external side effect. A private deployment can add `deliverExpensesWithCustomAdapter_` without changing the parsing core. Keep `gmail-<messageId>` as the destination's idempotency key.

### Google Sheets

`adapters/GoogleSheetsAdapter.js` is an optional adapter. Set these Apps Script Script Properties, then call `writeExpensesToGoogleSheet_(expenses)`:

- `SHEETS_SPREADSHEET_ID` (required)
- `SHEETS_SHEET_NAME` (optional; defaults to `Transactions`)

### HTTP API

`adapters/ApiAdapter.js` is an optional example for a batch expense-import API. It maps parsed transactions to an `items` payload and sends it with a bearer key. Set these Apps Script Script Properties, then call `sendExpensesToApi_(expenses)`:

- `X_API_BASE_URL`
- `X_COMPANY_ID`
- `X_API_KEY`

It is a generic example: change the endpoint and request body to match your own API before enabling it.

## Project layout

```text
providers/   Bank and card email parsers
adapters/    Output implementations (log, Google Sheets, HTTP API)
Code.js      Search, parse, and route the transactions
Config.js    Search rules and provider configuration
```

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
- The default path is log-only; it does not write to Sheets or call an HTTP API.
- The manifest includes Google Sheets and external-request scopes so the optional adapters can be enabled without editing the manifest.
- Do not paste credentials into source files. Use Apps Script Script Properties for any custom integration secrets.

## Contributing

Contributions are welcome, especially parsers for Thai banks and cards. Please keep parsers narrow: match the sender and subject, parse only the transaction fields needed, and preserve `gmail-<messageId>` as the idempotency key.

## License

MIT. See [LICENSE](LICENSE).
