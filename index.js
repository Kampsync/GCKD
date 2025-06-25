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
      'PRODID:icalendar-ruby',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Kampsync Calendar',
      'X-PUBLISHED-TTL:PT1H'
    ];

    const dtstampGlobal = formatDTStamp(new Date());

    if (Array.isArray(data)) {
      data.forEach(event => {
        const start = formatDate(event.start_date);
        const end = formatDate(event.end_date);
        const uid = event.uid || generateUID(); // fallback UID
        const dtstamp = dtstampGlobal;
        const platform = (event.source_platform || 'Booking').toLowerCase();

        // Determine booking link
        let bookingLink = '';
        const rawUID = uid || '';
        if (platform.includes('rvshare') && rawUID.length > 10 && !rawUID.includes('Booking')) {
          bookingLink = 'https://rvshare.com/dashboard/reservations';
        } else if (platform.includes('outdoorsy') && rawUID.includes('Booking')) {
          const match = rawUID.match(/(\d{6,})/);
          if (match) bookingLink = `https://www.outdoorsy.com/dashboard/bookings/${match[1]}`;
        } else if (platform.includes('rvezy') && rawUID.length > 10) {
          bookingLink = `https://www.rvezy.com/owner/reservations/${rawUID}`;
        } else if (platform.includes('airbnb')) {
          bookingLink = 'https://www.airbnb.com/hosting/reservations';
        } else if (platform.includes('hipcamp')) {
          bookingLink = 'View this booking by logging into your Hipcamp host dashboard.';
        } else if (platform.includes('camplify')) {
          bookingLink = 'Log in to your Camplify host dashboard to view booking details.';
        } else if (platform.includes('yescapa')) {
          bookingLink = 'Log in to your Yescapa dashboard to view booking details.';
        }

        const summary = escape([event.source_platform, event.summary].filter(Boolean).join(', '));
        const descriptionParts = [];
        if (event.description) descriptionParts.push(event.description);
        if (bookingLink) descriptionParts.push(`Booking Link: ${bookingLink}`);
        const description = escape(descriptionParts.join('\n'));

        ics.push('BEGIN:VEVENT');
        ics.push(`DTSTAMP:${dtstamp}`);
        ics.push(`UID:${uid}`);
        ics.push(`DTSTART;VALUE=DATE:${start}`);
        ics.push(`DTEND;VALUE=DATE:${end}`);
        ics.push(`DESCRIPTION:${description}`);
        ics.push(`SUMMARY:${summary}`);
        ics.push('END:VEVENT');
      });
    }

    ics.push('END:VCALENDAR');
    const output = ics.join('\r\n');

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=300');

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
  return new Date(date).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function escape(str) {
  return (str || '')
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function generateUID() {
  return `uid-${Math.random().toString(36).substring(2, 10)}@kampsync`;
}

app.listen(port, () => {
  console.log(`KampSync iCal proxy running on port ${port}`);
});
