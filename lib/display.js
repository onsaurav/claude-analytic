const chalk = require('chalk');
const Table = require('cli-table3');

function formatNumber(n) {
  return Number(n || 0).toLocaleString('en-US');
}

function formatCost(n) {
  return `$${Number(n || 0).toFixed(4)}`;
}

function formatPercent(n) {
  return `${Number(n || 0).toFixed(2)}%`;
}

function displayResults(claudeDir, analysis) {
  console.log();
  console.log(chalk.bold.cyan('╔════════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║              Claude Analytic Report                    ║'));
  console.log(chalk.bold.cyan('╚════════════════════════════════════════════════════════╝'));
  console.log();
  console.log(chalk.gray('Detected Claude path: ') + chalk.white(claudeDir));
  console.log(chalk.gray('Total sessions:       ') + chalk.white(analysis.totalSessions));
  console.log();

  console.log(chalk.bold.yellow('▶ Overall Summary'));
  const summary = new Table({
    head: [chalk.cyan('Metric'), chalk.cyan('Value')],
    colWidths: [30, 30],
  });
  summary.push(
    ['Total Input Tokens', formatNumber(analysis.totalInputTokens)],
    ['Total Output Tokens', formatNumber(analysis.totalOutputTokens)],
    ['Total Cache Read Tokens', formatNumber(analysis.totalCacheReadTokens)],
    ['Total Cache Write Tokens', formatNumber(analysis.totalCacheWriteTokens)],
    ['Overall Cache Hit Rate', chalk.green(formatPercent(analysis.overallCacheHitRate))]
  );
  console.log(summary.toString());
  console.log();

  console.log(chalk.bold.yellow('▶ Daily Costs'));
  const dailyTable = new Table({
    head: [
      chalk.cyan('Date'),
      chalk.cyan('Input'),
      chalk.cyan('Output'),
      chalk.cyan('Cache R'),
      chalk.cyan('Cache W'),
      chalk.cyan('Cost'),
    ],
  });

  const days = Object.keys(analysis.dailyCosts).sort();
  let totalCost = 0;
  if (days.length === 0) {
    dailyTable.push([chalk.gray('(no data)'), '', '', '', '', '']);
  } else {
    for (const day of days) {
      const d = analysis.dailyCosts[day];
      totalCost += d.cost;
      dailyTable.push([
        day,
        formatNumber(d.input),
        formatNumber(d.output),
        formatNumber(d.cacheRead),
        formatNumber(d.cacheWrite),
        chalk.green(formatCost(d.cost)),
      ]);
    }
  }
  console.log(dailyTable.toString());
  console.log(chalk.gray('Total cost across all days: ') + chalk.bold.green(formatCost(totalCost)));
  console.log();

  console.log(chalk.bold.yellow('▶ Top 5 Sessions by Token Usage'));
  const topSessions = [...analysis.sessionStats]
    .sort((a, b) => b.totalTokens - a.totalTokens)
    .slice(0, 5);

  const sessionsTable = new Table({
    head: [
      chalk.cyan('Session'),
      chalk.cyan('Input'),
      chalk.cyan('Output'),
      chalk.cyan('Cache Hit%'),
    ],
    colWidths: [40, 14, 14, 14],
    wordWrap: true,
  });

  if (topSessions.length === 0) {
    sessionsTable.push([chalk.gray('(no sessions)'), '', '', '']);
  } else {
    for (const s of topSessions) {
      sessionsTable.push([
        s.name,
        formatNumber(s.input),
        formatNumber(s.output),
        chalk.green(formatPercent(s.cacheHitRate)),
      ]);
    }
  }
  console.log(sessionsTable.toString());
  console.log();

  console.log(chalk.bold.magenta('💡 Tip: ') + chalk.white('High cache hit rate = lower cost'));
  console.log();
}

module.exports = { displayResults };
