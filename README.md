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
- `CardXProvider.js`
- `KbankProvider.js`
- `LogAdapter.js`

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

`Config.js` defaults to searching the last day of messages. Keep this small when using a frequent trigger.

## Add a destination adapter

The default `LogAdapter.js` deliberately has no external side effect. To send records to Google Sheets, a database, or another service, add an adapter and replace this line in `Code.js`:

```js
const result = logExpenses_(expenses);
```

Keep the `gmail-<messageId>` value as the destination's idempotency key.

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
- The default app requests Gmail read-only access only.
- Do not paste credentials into source files. Use Apps Script Script Properties for any custom integration secrets.

## Contributing

Contributions are welcome, especially parsers for Thai banks and cards. Please keep parsers narrow: match the sender and subject, parse only the transaction fields needed, and preserve `gmail-<messageId>` as the idempotency key.

## License

MIT. See [LICENSE](LICENSE).
