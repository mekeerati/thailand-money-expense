const CONFIG = {
  // Gmail is searched by thread. Keep this short because the script runs often.
  days: 1,
  limit: 20,
  // Gmail labels belong to a whole thread, so use a message-level watermark
  // instead. Keep this overlap to safely accept slightly delayed emails.
  overlapMinutes: 120,

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
