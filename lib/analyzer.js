const path = require('path');

function extractUsage(msg) {
  if (!msg || typeof msg !== 'object') return null;
  if (msg.message && msg.message.usage) return msg.message.usage;
  if (msg.usage) return msg.usage;
  return null;
}

function sessionNameFromFile(file) {
  const base = path.basename(file, '.jsonl');
  const parent = path.basename(path.dirname(file));
  return parent && parent !== '.' ? `${parent}/${base}` : base;
}

function analyzeSessions(sessions) {
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCacheReadTokens = 0;
  let totalCacheWriteTokens = 0;

  const sessionStats = [];

  for (const session of sessions) {
    let sIn = 0, sOut = 0, sCacheR = 0, sCacheW = 0;

    for (const msg of session.messages) {
      const usage = extractUsage(msg);
      if (!usage) continue;

      const inTok = Number(usage.input_tokens) || 0;
      const outTok = Number(usage.output_tokens) || 0;
      const cacheR = Number(usage.cache_read_input_tokens) || 0;
      const cacheW = Number(usage.cache_creation_input_tokens) || 0;

      sIn += inTok;
      sOut += outTok;
      sCacheR += cacheR;
      sCacheW += cacheW;

      totalInputTokens += inTok;
      totalOutputTokens += outTok;
      totalCacheReadTokens += cacheR;
      totalCacheWriteTokens += cacheW;
    }

    const totalSessionTokens = sIn + sOut + sCacheR + sCacheW;
    const sessionHitRate =
      sIn + sCacheR > 0 ? (sCacheR / (sIn + sCacheR)) * 100 : 0;

    sessionStats.push({
      name: sessionNameFromFile(session.file),
      file: session.file,
      input: sIn,
      output: sOut,
      cacheRead: sCacheR,
      cacheWrite: sCacheW,
      totalTokens: totalSessionTokens,
      cacheHitRate: sessionHitRate,
    });
  }

  const overallCacheHitRate =
    totalInputTokens + totalCacheReadTokens > 0
      ? (totalCacheReadTokens / (totalInputTokens + totalCacheReadTokens)) * 100
      : 0;

  return {
    totalInputTokens,
    totalOutputTokens,
    totalCacheReadTokens,
    totalCacheWriteTokens,
    overallCacheHitRate,
    sessionStats,
    totalSessions: sessions.length,
  };
}

module.exports = { analyzeSessions };
