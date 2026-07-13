const CONFIG = {
  // Gmail is searched by thread. Keep this short because the script runs often.
  days: 1,
  limit: 20,
  // Message-level state replaces a Gmail label: a label belongs to a whole
  // thread and would hide later bank notifications in the same conversation.
  processedMessageLimit: 500,

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
