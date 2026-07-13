function runEmailSync() {
  const query = buildQuery_(CONFIG);
  const threads = GmailApp.search(query, 0, CONFIG.limit);
  const syncState = getEmailSyncState_();
  const cutoff = getOverlapCutoff_(syncState.watermark);
  const expenses = [];
  const deliveredMessages = [];
  let skipped = 0;
  let stoppedAtWatermark = false;

  threads.forEach(thread => {
    thread.getMessages().forEach(message => {
      const rule = findRule_(message);
      if (!rule) return;
      deliveredMessages.push({message, rule, threadId: thread.getId()});
    });
  });

  // Gmail search returns threads. Sort their individual messages so the
  // watermark can safely stop us once we pass the overlap window.
  deliveredMessages.sort((left, right) => right.message.getDate() - left.message.getDate());
  const newlyDelivered = [];
  for (const item of deliveredMessages) {
    const message = item.message;
    const messageDate = message.getDate();
    if (cutoff && messageDate < cutoff) {
      stoppedAtWatermark = true;
      break;
    }

    const messageId = message.getId();
    if (syncState.recentMessageIds[messageId]) {
      skipped += 1;
      continue;
    }

    const email = {
      messageId,
      threadId: item.threadId,
      date: messageDate.toISOString(),
      from: message.getFrom(),
      subject: message.getSubject(),
      body: message.getPlainBody()
    };
    const expense = parseEmail_(item.rule.provider, email);
    if (expense) {
      expenses.push(expense);
      newlyDelivered.push({messageId, date: email.date});
    } else {
      Logger.log(`Could not parse ${item.rule.provider} email ${messageId}`);
    }
  }

  const result = expenses.length > 0
    ? deliverExpenses_(expenses)
    : {skippedDelivery: true};
  rememberDeliveredMessages_(syncState, newlyDelivered);
  Logger.log(JSON.stringify({query, found: expenses.length, skipped, stoppedAtWatermark, ...result}));
  return result;
}

function getEmailSyncState_() {
  const raw = PropertiesService.getScriptProperties().getProperty("EMAIL_SYNC_STATE");
  if (!raw) return {watermark: null, recentMessageIds: {}};
  try {
    const state = JSON.parse(raw);
    return {
      watermark: state.watermark || null,
      recentMessageIds: state.recentMessageIds || {}
    };
  } catch (error) {
    Logger.log(`Ignoring invalid EMAIL_SYNC_STATE: ${error.message}`);
    return {watermark: null, recentMessageIds: {}};
  }
}

function getOverlapCutoff_(watermark) {
  if (!watermark) return null;
  return new Date(new Date(watermark).getTime() - CONFIG.overlapMinutes * 60 * 1000);
}

function rememberDeliveredMessages_(state, deliveredMessages) {
  if (deliveredMessages.length === 0) return;

  const newestDate = deliveredMessages.reduce(
    (latest, item) => !latest || item.date > latest ? item.date : latest,
    state.watermark
  );
  const cutoff = getOverlapCutoff_(newestDate);
  deliveredMessages.forEach(item => { state.recentMessageIds[item.messageId] = item.date; });

  state.watermark = newestDate;
  state.recentMessageIds = Object.entries(state.recentMessageIds)
    .filter(([, date]) => new Date(date) >= cutoff)
    .reduce((result, [messageId, date]) => {
      result[messageId] = date;
      return result;
    }, {});
  PropertiesService.getScriptProperties().setProperty("EMAIL_SYNC_STATE", JSON.stringify(state));
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
