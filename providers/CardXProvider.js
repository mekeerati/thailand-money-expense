function parseCardxEmail_(email) {
  const amountMatch = email.body.match(/ยอดเงิน\s*([\d,]+\.\d{2})\s*บ/);
  if (!amountMatch) return null;

  const cardMatch =
    email.subject.match(/ลงท้ายด้วย\s+(\d{4})/) ||
    email.body.match(/ลงท้ายด้วย\s+(\d{4})/);

  return {
    externalRef: `gmail-${email.messageId}`,
    date: email.date,
    merchant: extractCardxMerchant_(email.body),
    amount: Number(amountMatch[1].replace(/,/g, "")),
    currency: "THB",
    paymentMethod: "credit_card",
    paymentProvider: "CARDX",
    accountLast4: cardMatch ? cardMatch[1] : null
  };
}

function extractCardxMerchant_(body) {
  const patterns = [
    /\d{4}\s*ที่\s*([\s\S]*?)\s*ยอดเงิน/,
    /ที่\s+([^\r\n]+?)\s+ยอดเงิน/
  ];

  for (const pattern of patterns) {
    const match = body.match(pattern);
    if (!match) continue;
    const merchant = match[1]
      .replace(/^(?:>\s*)+/, "")
      .replace(/\s+/g, " ")
      .trim();
    if (merchant) return merchant;
  }
  return null;
}
