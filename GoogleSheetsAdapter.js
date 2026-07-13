function writeExpensesToSheet_(expenses) {
  if (CONFIG.spreadsheetId === "PASTE_YOUR_GOOGLE_SHEET_ID_HERE") {
    throw new Error("Set CONFIG.spreadsheetId before running the importer.");
  }

  const spreadsheet = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  const sheet = spreadsheet.getSheetByName(CONFIG.sheetName) || spreadsheet.insertSheet(CONFIG.sheetName);
  const headers = ["external_ref", "date", "merchant", "amount", "currency", "payment_method", "provider", "account_last4"];

  if (sheet.getLastRow() === 0) sheet.appendRow(headers);

  const existingRefs = new Set(
    sheet.getLastRow() < 2 ? [] : sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().flat().filter(Boolean)
  );
  const rows = expenses
    .filter(expense => !existingRefs.has(expense.externalRef))
    .map(expense => [
      expense.externalRef,
      expense.date,
      expense.merchant || "",
      expense.amount,
      expense.currency,
      expense.paymentMethod,
      expense.paymentProvider,
      expense.accountLast4 || ""
    ]);

  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length).setValues(rows);
  }

  return {created: rows.length, skipped: expenses.length - rows.length};
}
