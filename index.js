import express from 'express';
import axios from 'axios';

const app = express();
const port = process.env.PORT || 8080;

app.get('/v1/ical/:icalKey', async (req, res) => {
  const { icalKey } = req.params;
  const fullUrl = `https://api.kampsync.com/v1/ical/${icalKey}`;
  console.log('Full URL sent to Xano:', fullUrl);

  try {
    const { data } = await axios.get(
      'https://xfxa-cldj-sxth.n7e.xano.io/api:yHTBBmYY/kampsync_ical_link_GCKD',
      { params: { kampsync_ical_link: fullUrl } }
    );

    let ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//icalendar-ruby',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:KampSync Calendar',
      'X-PUBLISHED-TTL:PT1H'
    ];

    if (Array.isArray(data)) {
      data.forEach(event => {
        const start = formatDate(event.start_date);
        const end = formatDate(event.end_date);
        const summary = escape(event.summary);
        const description = escape(`${event.summary}\n${event.reservation_id || ''}`);
        const uid = event.uid || `${event.reservation_id || Date.now()}-${start}`;
        const dtstamp = formatDTStamp(new Date());

        ics.push('BEGIN:VEVENT');
        ics.push(`UID:${uid}`);
        ics.push(`DTSTAMP:${dtstamp}`);
        ics.push(`SUMMARY:${summary}`);
        ics.push(`DTSTART;VALUE=DATE:${start}`);
        ics.push(`DTEND;VALUE=DATE:${end}`);
        ics.push(`DESCRIPTION:${description}`);
        ics.push('END:VEVENT');
      });
    }

    ics.push('END:VCALENDAR');

    const output = ics.join('\r\n');

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.status(200).send(output);
  } catch (err) {
    console.error('[ICAL ERROR]', err?.response?.data || err.message);
    res.status(500).send('Unable to fetch calendar data');
  }
});

function formatDate(dateStr) {
  return new Date(dateStr).toISOString().split('T')[0].replace(/-/g, '');
}

function formatDTStamp(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function escape(str) {
  return (str || '')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

app.listen(port, () => {
  console.log(`KampSync iCal proxy running on port ${port}`);
});
