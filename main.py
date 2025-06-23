# main.py
import os
import requests
import uuid
from flask import Flask, Response
from datetime import datetime

app = Flask(__name__)

XANO_LISTING_API = os.getenv("XANO_LISTING_API")    
XANO_BOOKING_API = os.getenv("XANO_BOOKING_API")     

def generate_ical(listing, bookings):
    title = listing.get("title", "Kampsync Listing")
    location = listing.get("location", "")
    description = listing.get("description", "")

    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Kampsync//EN",
        "CALSCALE:GREGORIAN"
    ]

    for booking in bookings:
        try:
            start = datetime.fromisoformat(booking["start_date"].replace("Z", "+00:00")).strftime("%Y%m%dT%H%M%SZ")
            end = datetime.fromisoformat(booking["end_date"].replace("Z", "+00:00")).strftime("%Y%m%dT%H%M%SZ")
            uid = uuid.uuid4().hex
            dtstamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
            summary = booking.get("summary", title)
            res_link = booking.get("reservation_id", "")

            lines += [
                "BEGIN:VEVENT",
                f"UID:{uid}",
                f"SUMMARY:{summary}",
                f"DESCRIPTION:{title} {location}\\n{res_link}",
                f"DTSTAMP:{dtstamp}",
                f"DTSTART:{start}",
                f"DTEND:{end}",
                "END:VEVENT"
            ]
        except Exception:
            continue

    lines.append("END:VCALENDAR")
    return "\n".join(lines)

@app.route("/v1/ical/<token>", methods=["GET"])
def serve_ical(token):
    try:
        listing_url = f"{XANO_LISTING_API}?ical_token={token}"
        listing_resp = requests.get(listing_url).json()
        if not listing_resp:
            return Response("Listing not found", status=404)
        listing = listing_resp[0]
        listing_id = listing["id"]

        bookings_url = f"{XANO_BOOKING_API}?listing_id={listing_id}"
        bookings = requests.get(bookings_url).json()

        ical_data = generate_ical(listing, bookings)
        return Response(ical_data, mimetype="text/plain")  # Important: NOT download
    except Exception as e:
        return Response(f"Error: {str(e)}", status=500)

if __name__ == "__main__":
    app.run(port=8080, host="0.0.0.0")
