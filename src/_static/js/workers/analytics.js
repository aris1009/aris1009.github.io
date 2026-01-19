// Analytics processing worker for background analytics data processing
// Handles event aggregation, metric calculations, and data analysis

self.addEventListener('message', (event) => {
  const { action, data } = event.data;

  try {
    switch (action) {
      case 'aggregate':
        const aggregated = aggregateEvents(data.events, data.timeframe);
        self.postMessage({ success: true, result: aggregated });
        break;

      case 'calculate':
        const metrics = calculateMetrics(data.events, data.metrics);
        self.postMessage({ success: true, result: metrics });
        break;

      case 'anonymize':
        const anonymized = anonymizeData(data.data);
        self.postMessage({ success: true, result: anonymized });
        break;

      default:
        self.postMessage({ success: false, error: `Unknown action: ${action}` });
    }
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
});

function aggregateEvents(events, timeframe) {
  const now = Date.now();
  const startTime = now - (timeframe * 1000); // timeframe in seconds

  const filtered = events.filter(event => event.timestamp >= startTime);

  const aggregated = {
    total: filtered.length,
    byType: {},
    byPage: {},
    timeRange: { start: startTime, end: now }
  };

  filtered.forEach(event => {
    // Aggregate by event type
    aggregated.byType[event.type] = (aggregated.byType[event.type] || 0) + 1;

    // Aggregate by page
    if (event.page) {
      aggregated.byPage[event.page] = (aggregated.byPage[event.page] || 0) + 1;
    }
  });

  return aggregated;
}

function calculateMetrics(events, requestedMetrics) {
  const metrics = {};

  if (requestedMetrics.includes('pageViews')) {
    metrics.pageViews = events.filter(e => e.type === 'pageview').length;
  }

  if (requestedMetrics.includes('avgSessionDuration')) {
    const sessions = groupBySession(events);
    const durations = sessions.map(session => {
      const sorted = session.sort((a, b) => a.timestamp - b.timestamp);
      return sorted[sorted.length - 1].timestamp - sorted[0].timestamp;
    });
    metrics.avgSessionDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;
  }

  if (requestedMetrics.includes('bounceRate')) {
    const sessions = groupBySession(events);
    const bouncedSessions = sessions.filter(session => session.length === 1).length;
    metrics.bounceRate = sessions.length > 0 ? bouncedSessions / sessions.length : 0;
  }

  return metrics;
}

function anonymizeData(data) {
  return data.map(item => {
    const anonymized = { ...item };

    // Remove or hash personally identifiable information
    if (anonymized.ip) {
      anonymized.ip = hashIP(anonymized.ip);
    }

    if (anonymized.userId) {
      anonymized.userId = hashString(anonymized.userId);
    }

    return anonymized;
  });
}

function groupBySession(events) {
  const sessions = {};
  events.forEach(event => {
    const sessionId = event.sessionId;
    if (!sessions[sessionId]) {
      sessions[sessionId] = [];
    }
    sessions[sessionId].push(event);
  });
  return Object.values(sessions);
}

function hashIP(ip) {
  // Simple hash function for IP anonymization
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}