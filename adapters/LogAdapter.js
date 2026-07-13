function logExpenses_(expenses) {
  expenses.forEach(expense => Logger.log(JSON.stringify(expense)));
  return {logged: expenses.length};
}
