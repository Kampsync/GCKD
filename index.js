import express from 'express';
import axios from 'axios';

const app = express();
const port = process.env.PORT || 8080;

// iCal endpoint
app.get('/v1/ical/:icalKey', async (req, res) => {
  const { icalKey } = req.params;
  console.log('Received iCal key:', icalKey);

  try {
    // Corrected param key to match Xano's expected input
    const { data } = await axios.get(
      'https://xfxa-cldj-sxth.n7e.xano.io/api:yHTBBmYY/kampsync_ical_link_GCKD',
      { params: { kampsync_ical_link: icalKey } }
    );

    // Build the .ics calendar string
    let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//icalendar-ruby
CALSCALE:GREGORIAN
METHOD:PUBLISH
`;

    data.forEach(event => {
      const start = formatDate(event.start_date);
      const end = formatDate(event.end_date);
      const summary = escape(event.summary);
      const description = `${summary}\\n${event.reservation_id}`;
      const uid = event.uid || `${event.reservation_id}-${start}`;

      ics += `BEGIN:VEVENT
UID:${uid}
SUMMARY:${summary}
DTSTART;VALUE=DATE:${start}
DTEND;VALUE=DATE:${end}
DESCRIPTION:${description}
END:VEVENT
`;
    });

    ics += `END:VCALENDAR`;

    // Display raw .ics as plain text in the browser
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline');
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
  return (str || '').replace(/\r?\n/g, '').replace(/,/g, '\\,');
}

app.listen(port, () => {
  console.log(`KampSync iCal proxy running on port ${port}`);
});
