import express from 'express';
import axios from 'axios';

const app = express();
const port = process.env.PORT || 8080;

// iCal endpoint
app.get('/v1/ical/:icalKey', async (req, res) => {
  const { icalKey } = req.params;
  const fullUrl = `https://api.kampsync.com/v1/ical/${icalKey}`;
  console.log('Full URL sent to Xano:', fullUrl);

  try {
    const { data } = await axios.get(
      'https://xfxa-cldj-sxth.n7e.xano.io/api:yHTBBmYY/kampsync_ical_link_GCKD',
      {
        params: {
          kampsync_ical_link: fullUrl
        }
      }
    );

    console.log('[ICAL RESPONSE]', data);

    let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//icalendar-ruby
CALSCALE:GREGORIAN
METHOD:PUBLISH
`;

    if (Array.isArray(data)) {
      data.forEach(event => {
        const start = formatDate(event.start_date);
        const end = formatDate(event.end_date);
        const summary = escape(event.summary);
        const description = `${summary}\\n${event.reservation_id || ''}`;
        const uid = event.uid || `${event.reservation_id || Date.now()}-${start}`;

        ics += `BEGIN:VEVENT
UID:${uid}
SUMMARY:${summary}
DTSTART;VALUE=DATE:${start}
DTEND;VALUE=DATE:${end}
DESCRIPTION:${description}
END:VEVENT
`;
      });
    }

    ics += `END:VCALENDAR`;

    // Force plain text display to avoid .ics download
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="calendar.ics"');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    res.status(200).send(ics);
  } catch (err) {
    console.error('[ICAL ERROR]', err?.response?.data || err.message);
    res.status(500).send('Unable to fetch calendar data');
  }
});

// Helpers
function formatDate(dateStr) {
  return new Date(dateStr).toISOString().split('T')[0].replace(/-/g, '');
}

function escape(str) {
  return (str || '')
    .replace(/\r?\n/g, '')  // remove newlines
    .replace(/,/g, '\\,')   // escape commas
    .replace(/;/g, '\\;');  // escape semicolons
}

app.listen(port, () => {
  console.log(`KampSync iCal proxy running on port ${port}`);
});
