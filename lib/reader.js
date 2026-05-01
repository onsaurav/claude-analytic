const fs = require('fs');
const path = require('path');
const glob = require('glob');

function readSessions(claudeDir) {
  if (!claudeDir || !fs.existsSync(claudeDir)) {
    return [];
  }

  const pattern = path.join(claudeDir, '**/*.jsonl').replace(/\\/g, '/');
  const files = glob.sync(pattern, { nodir: true });

  const sessions = [];
  for (const file of files) {
    let content;
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }

    const lines = content.split(/\r?\n/);
    const messages = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        messages.push(JSON.parse(trimmed));
      } catch {
        // skip invalid lines silently
      }
    }

    if (messages.length > 0) {
      sessions.push({ file, messages });
    }
  }

  return sessions;
}

module.exports = { readSessions };
