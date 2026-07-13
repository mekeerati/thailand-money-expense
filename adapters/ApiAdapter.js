function sendExpensesToApi_(expenses, dedupeMode) {
  const config = getApiAdapterConfig_();
  const response = UrlFetchApp.fetch(
    `${config.apiBaseUrl}/api/companies/${config.companyId}/expenses/import`,
    {
      method: "post",
      contentType: "application/json",
      headers: {Authorization: `Bearer ${config.apiKey}`},
      payload: JSON.stringify({
        dedupeMode: dedupeMode || "SKIP",
        items: expenses.map(toApiImportItem_)
      }),
      muteHttpExceptions: true
    }
  );

  const status = response.getResponseCode();
  const body = response.getContentText();
  if (status < 200 || status >= 300) throw new Error(`API import failed (${status}): ${body}`);
  return JSON.parse(body);
}

function toApiImportItem_(expense) {
  return {
    title: expense.merchant || `${expense.paymentProvider} expense`,
    description: expense.merchant || null,
    externalRef: expense.externalRef,
    amount: expense.amount,
    currency: expense.currency,
    date: expense.date,
    paymentMethod: expense.paymentMethod,
    paymentProvider: expense.paymentProvider,
    accountCode: expense.accountLast4 ? `${expense.paymentProvider.toLowerCase()}-${expense.accountLast4}` : null
  };
}

function getApiAdapterConfig_() {
  const properties = PropertiesService.getScriptProperties();
  const apiBaseUrl = (properties.getProperty("X_API_BASE_URL") || "").replace(/\/+$/, "");
  const companyId = properties.getProperty("X_COMPANY_ID");
  const apiKey = properties.getProperty("X_API_KEY");
  const missing = [];
  if (!apiBaseUrl) missing.push("X_API_BASE_URL");
  if (!companyId) missing.push("X_COMPANY_ID");
  if (!apiKey) missing.push("X_API_KEY");
  if (missing.length > 0) throw new Error(`Missing Script Properties: ${missing.join(", ")}`);
  return {apiBaseUrl, companyId, apiKey};
}
