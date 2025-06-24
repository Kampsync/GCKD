import express from 'express';
import axios from 'axios';

const app = express();
const port = process.env.PORT || 8080;

app.get('/v1/ical/:icalKey', async (req, res) => {
  const { icalKey } = req.params;
  const fullIcalUrl = `https://api.kampsync.com/v1/ical/${icalKey}`;

  try {
    const response = await axios.get(
      'https://xfxa-cldj-sxth.n7e.xano.io/api:yHTBBmYY/kampsync_ical_link_GCKD',
      {
        params: {
          kampsync_ical_link: fullIcalUrl
        }
      }
    );

    const data = response.data;

    let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//KampSync//Booking Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
`;

    data.forEach(event => {
      const start = formatDate(event.start_date);
      const end = formatDate(event.end_date);
      const summary = escapeText(event.summary);
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

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline');
    res.status(200).send(ics);

  } catch (error) {
    console.error('Error fetching calendar data:', error?.response?.data || error.message);
    res.status(500).send('Unable to fetch calendar data');
  }
});

function formatDate(dateStr) {
  return new Date(dateStr).toISOString().split('T')[0].replace(/-/g, '');
}

function escapeText(str) {
  return (str || '').replace(/\r?\n/g, '').replace(/,/g, '\\,');
}

app.listen(port, () => {
  console.log(`KampSync iCal service running on port ${port}`);
});
