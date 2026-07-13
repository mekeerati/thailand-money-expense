const CONFIG = {
  // Gmail is searched by thread. Keep this short because the script runs often.
  days: 1,
  limit: 20,

  // Create a spreadsheet, copy its ID from the URL, and put it here.
  spreadsheetId: "PASTE_YOUR_GOOGLE_SHEET_ID_HERE",
  sheetName: "Transactions",

  rules: [
    {
      provider: "cardx",
      from: ["support@cardx.co.th"],
      subject: ["แจ้งการทำรายการผ่านบัตร"]
    },
    {
      provider: "kbank",
      from: ["KPLUS@kasikornbank.com"],
      subject: [
        "Result of PromptPay Funds Transfer (Success)",
        "Result of Bill Payment (Success)",
        "Result of Funds Transfer (Success)"
      ]
    }
  ]
};
