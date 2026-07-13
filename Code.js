function runEmailSync() {
  const query = buildQuery_(CONFIG);
  const threads = GmailApp.search(query, 0, CONFIG.limit);
  const expenses = [];

  threads.forEach(thread => {
    thread.getMessages().forEach(message => {
      const rule = findRule_(message);
      if (!rule) return;

      const email = {
        messageId: message.getId(),
        threadId: thread.getId(),
        date: message.getDate().toISOString(),
        from: message.getFrom(),
        subject: message.getSubject(),
        body: message.getPlainBody()
      };
      const expense = parseEmail_(rule.provider, email);

      if (expense) {
        expenses.push(expense);
      } else {
        Logger.log(`Could not parse ${rule.provider} email ${message.getId()}`);
      }
    });
  });

  const result = writeExpensesToSheet_(expenses);
  Logger.log(JSON.stringify({query, found: expenses.length, ...result}));
  return result;
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
