function parseKbankEmail_(email) {
  const amountMatch =
    email.body.match(/จำนวนเงิน\s*\(บาท\)\s*:\s*([\d,]+\.\d{2})/) ||
    email.body.match(/Amount\s*\(THB\)\s*:\s*([\d,]+\.\d{2})/i);
  if (!amountMatch) return null;

  const accountMatch =
    email.body.match(/(?:ชำระเงินจากบัญชี|โอนเงินจากบัญชี|เติมเงินจากบัญชี)\s*:\s*([xX\d-]+)/) ||
    email.body.match(/(?:Paid From Account|From Account)\s*:\s*([xX\d-]+)/i);
  const accountLast4 = accountMatch ? accountMatch[1].replace(/\D/g, "").slice(-4) : null;

  return {
    externalRef: `gmail-${email.messageId}`,
    date: email.date,
    merchant: extractKbankMerchant_(email.body, email.subject),
    amount: Number(amountMatch[1].replace(/,/g, "")),
    currency: "THB",
    paymentMethod: kbankPaymentMethod_(email.subject),
    paymentProvider: "KBANK",
    accountLast4
  };
}

function kbankPaymentMethod_(subject) {
  if (subject.includes("PromptPay")) return "promptpay";
  if (subject.includes("Bill Payment")) return "bill_payment";
  return "bank_transfer";
}

function extractKbankMerchant_(body, subject) {
  const labels = subject.includes("Bill Payment")
    ? ["เพื่อเข้าบัญชีบริษัท", "Company Name"]
    : ["ชื่อผู้รับเงิน", "Received Name", "เพื่อเข้าบัญชีบริษัท", "Company Name"];

  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = body.match(new RegExp(escaped + "\\s*[:：]\\s*(.+)", "i"));
    if (match && match[1].trim()) return match[1].trim();
  }
  return null;
}
