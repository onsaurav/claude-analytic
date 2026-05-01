const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

function isClaudeBinaryAvailable() {
  const cmd = process.platform === 'win32' ? 'where claude' : 'which claude';
  try {
    const out = execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    return out.length > 0;
  } catch {
    return false;
  }
}

function tryClaudeVersion() {
  try {
    execSync('claude --version', { stdio: ['ignore', 'pipe', 'ignore'] });
    return true;
  } catch {
    return false;
  }
}

function getCandidatePaths() {
  const home = os.homedir();
  const candidates = [];

  if (process.env.CLAUDE_CONFIG_DIR) {
    candidates.push(path.join(process.env.CLAUDE_CONFIG_DIR, 'projects'));
  }

  if (process.platform === 'win32') {
    if (process.env.APPDATA) {
      candidates.push(path.join(process.env.APPDATA, 'Claude', 'projects'));
    }
    if (process.env.USERPROFILE) {
      candidates.push(path.join(process.env.USERPROFILE, '.claude', 'projects'));
    }
    candidates.push(path.join(home, '.claude', 'projects'));
  } else {
    candidates.push(path.join(home, '.claude', 'projects'));
  }

  return Array.from(new Set(candidates));
}

function findClaudeProjectsDir() {
  const binaryAvailable = isClaudeBinaryAvailable();
  if (binaryAvailable) {
    tryClaudeVersion();
  }

  const candidates = getCandidatePaths();
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      return candidate;
    }
  }

  if (!binaryAvailable) {
    throw new Error(
      'Claude Code is not installed or not in PATH, and no Claude data folder was found.\n' +
        'Checked the following paths:\n  - ' +
        candidates.join('\n  - ')
    );
  }

  throw new Error(
    'Claude binary found, but no projects folder exists. Checked:\n  - ' +
      candidates.join('\n  - ') +
      '\nStart a Claude Code session first, then re-run.'
  );
}

module.exports = { findClaudeProjectsDir };
