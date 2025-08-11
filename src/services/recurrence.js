const { RRule } = require('rrule');

function buildRRule(event) {
  if (!event.recurrence || event.recurrence.freq === 'none') return null;

  const options = {
    freq: RRule[event.recurrence.freq.toUpperCase()],
    interval: event.recurrence.interval || 1,
    dtstart: new Date(event.startTime),
    until: event.recurrence.endDate || undefined,
  };

  if (event.recurrence.byWeekday) {
    options.byweekday = event.recurrence.byWeekday.map(d => RRule[d]);
  }

  return new RRule(options);
}

module.exports = { buildRRule };
