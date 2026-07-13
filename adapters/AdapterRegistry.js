var EXPENSE_ADAPTERS = EXPENSE_ADAPTERS || {};

function registerExpenseAdapter_(name, handler) {
  EXPENSE_ADAPTERS = EXPENSE_ADAPTERS || {};
  EXPENSE_ADAPTERS[name] = handler;
}

function deliverExpenses_(expenses) {
  const adapterName = PropertiesService.getScriptProperties().getProperty("EXPENSE_ADAPTER") || "log";
  const adapter = EXPENSE_ADAPTERS[adapterName];
  if (!adapter) throw new Error(`Unknown expense adapter: ${adapterName}`);
  return adapter(expenses);
}
