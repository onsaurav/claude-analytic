const path = require('path');

const RATES = {
  input: 3 / 1_000_000,
  output: 15 / 1_000_000,
  cacheRead: 0.30 / 1_000_000,
  cacheWrite: 3.75 / 1_000_000,
};

function extractUsage(msg) {
  if (!msg || typeof msg !== 'object') return null;
  if (msg.message && msg.message.usage) return msg.message.usage;
  if (msg.usage) return msg.usage;
  return null;
}

function extractTimestamp(msg) {
  if (!msg) return null;
  return (
    msg.timestamp ||
    (msg.message && msg.message.timestamp) ||
    msg.created_at ||
    null
  );
}

function dayKey(ts) {
  if (!ts) return 'unknown';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return 'unknown';
  return d.toISOString().slice(0, 10);
}

function calcCost(tokens) {
  return (
    tokens.input * RATES.input +
    tokens.output * RATES.output +
    tokens.cacheRead * RATES.cacheRead +
    tokens.cacheWrite * RATES.cacheWrite
  );
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

  const dailyCosts = {};
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

      const day = dayKey(extractTimestamp(msg));
      if (!dailyCosts[day]) {
        dailyCosts[day] = {
          input: 0,
          output: 0,
          cacheRead: 0,
          cacheWrite: 0,
          cost: 0,
        };
      }
      dailyCosts[day].input += inTok;
      dailyCosts[day].output += outTok;
      dailyCosts[day].cacheRead += cacheR;
      dailyCosts[day].cacheWrite += cacheW;
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

  for (const day of Object.keys(dailyCosts)) {
    const d = dailyCosts[day];
    d.cost = calcCost({
      input: d.input,
      output: d.output,
      cacheRead: d.cacheRead,
      cacheWrite: d.cacheWrite,
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
    dailyCosts,
    sessionStats,
    totalSessions: sessions.length,
  };
}

module.exports = { analyzeSessions, RATES };
