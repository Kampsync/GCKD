import express from 'express';
import axios from 'axios';

const app = express();
const port = process.env.PORT || 8080;

app.get('/v1/ical/:icalId', async (req, res) => {
  const icalId = req.params.icalId;
  const kampsyncIcalLink = `https://api.kampsync.com/v1/ical/${icalId}`;

  try {
    // Fetch bookings from Xano
    const { data: bookings } = await axios.get(
      'https://xfxa-cldj-sxth.n7e.xano.io/api:yHTBBmYY/kampsync_ical_link_GCKD',
      {
        params: {
          kampsync_ical_link: kampsyncIcalLink
        }
      }
    );

    // Construct ICS content
    let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//icalendar-ruby
CALSCALE:GREGORIAN
METHOD:PUBLISH
`;

    bookings.forEach(b => {
      const start = formatDate(b.start_date);
      const end = formatDate(b.end_date);
      const summary = clean(b.summary);
      const uid = b.uid || b.id || Date.now(); // fallback UID
      const description = `${clean(b.summary)}\\n${b.reservation_id}`;

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

    // Serve raw ICS as text
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline'); // <- required to prevent download
    res.send(ics);

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send('ICS generation failed');
  }
});

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toISOString().split('T')[0].replace(/-/g, '');
}

function clean(str) {
  return (str || '').replace(/\r?\n/g, '').replace(/,/g, '\\,');
}

app.listen(port, () => {
  console.log(`ICS API ready at port ${port}`);
});
