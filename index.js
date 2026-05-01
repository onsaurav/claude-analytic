#!/usr/bin/env node

const chalk = require('chalk');
const { findClaudeProjectsDir } = require('./lib/finder');
const { readSessions } = require('./lib/reader');
const { analyzeSessions } = require('./lib/analyzer');
const { displayResults } = require('./lib/display');

(function main() {
  let claudeDir;
  try {
    claudeDir = findClaudeProjectsDir();
  } catch (err) {
    console.error(chalk.red('\n❌ Claude Code not found. Please install it first: https://claude.ai/code'));
    console.error(chalk.gray(`\nDetails: ${err.message}\n`));
    process.exit(1);
  }

  const sessions = readSessions(claudeDir);

  if (!sessions || sessions.length === 0) {
    console.log(chalk.yellow('\n⚠️  No sessions found. Start using Claude Code first.\n'));
    process.exit(0);
  }

  const analysis = analyzeSessions(sessions);
  displayResults(claudeDir, analysis);
})();
