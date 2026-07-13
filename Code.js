function runEmailSync() {
  const query = buildQuery_(CONFIG);
  const threads = GmailApp.search(query, 0, CONFIG.limit);
  const processedMessageIds = getProcessedMessageIds_();
  const expenses = [];
  const newlySeenMessageIds = [];
  let skipped = 0;

  threads.forEach(thread => {
    thread.getMessages().forEach(message => {
      const rule = findRule_(message);
      if (!rule) return;

      const messageId = message.getId();
      if (processedMessageIds[messageId]) {
        skipped += 1;
        return;
      }

      const email = {
        messageId,
        threadId: thread.getId(),
        date: message.getDate().toISOString(),
        from: message.getFrom(),
        subject: message.getSubject(),
        body: message.getPlainBody()
      };
      const expense = parseEmail_(rule.provider, email);

      if (expense) {
        expenses.push(expense);
        newlySeenMessageIds.push(messageId);
      } else {
        Logger.log(`Could not parse ${rule.provider} email ${messageId}`);
      }
    });
  });

  const result = expenses.length > 0
    ? deliverExpenses_(expenses)
    : {skippedDelivery: true};
  rememberProcessedMessageIds_(newlySeenMessageIds);
  Logger.log(JSON.stringify({query, found: expenses.length, skipped, ...result}));
  return result;
}

function getProcessedMessageIds_() {
  const raw = PropertiesService.getScriptProperties().getProperty("PROCESSED_GMAIL_MESSAGE_IDS");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (error) {
    Logger.log(`Ignoring invalid PROCESSED_GMAIL_MESSAGE_IDS: ${error.message}`);
    return {};
  }
}

function rememberProcessedMessageIds_(messageIds) {
  if (messageIds.length === 0) return;

  const processed = getProcessedMessageIds_();
  const now = Date.now();
  messageIds.forEach(messageId => { processed[messageId] = now; });

  const retained = Object.entries(processed)
    .sort(([, left], [, right]) => right - left)
    .slice(0, CONFIG.processedMessageLimit)
    .reduce((result, [messageId, timestamp]) => {
      result[messageId] = timestamp;
      return result;
    }, {});

  PropertiesService.getScriptProperties().setProperty(
    "PROCESSED_GMAIL_MESSAGE_IDS",
    JSON.stringify(retained)
  );
}

function deliverExpenses_(expenses) {
  if (typeof deliverExpensesWithCustomAdapter_ === "function") {
    return deliverExpensesWithCustomAdapter_(expenses);
  }
  return logExpenses_(expenses);
}

function buildQuery_(config) {
  const ruleFilters = config.rules.map(rule => {
    const fromFilters = (rule.from || []).map(value => `from:${value}`);
    const subjectFilters = (rule.subject || []).map(value => `subject:"${value}"`);
    return `(${fromFilters.concat(subjectFilters).join(" ")})`;
  });

  return [`newer_than:${config.days}d`, `(${ruleFilters.join(" OR ")})`].join(" ");
}

function findRule_(message) {
  return CONFIG.rules.find(rule => messageMatchesRule_(message, rule));
}

function messageMatchesRule_(message, rule) {
  const from = message.getFrom().toLowerCase();
  const subject = message.getSubject().toLowerCase();
  const fromMatched = !rule.from || rule.from.length === 0 ||
    rule.from.some(value => from.includes(value.toLowerCase()));
  const subjectMatched = !rule.subject || rule.subject.length === 0 ||
    rule.subject.some(value => subject.includes(value.toLowerCase()));
  return fromMatched && subjectMatched;
}

function parseEmail_(provider, email) {
  switch (provider) {
    case "cardx": return parseCardxEmail_(email);
    case "kbank": return parseKbankEmail_(email);
    default: throw new Error(`Unknown provider: ${provider}`);
  }
}
