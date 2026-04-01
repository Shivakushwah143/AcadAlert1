from datetime import datetime, timedelta


def build_checkin_invite(student_name: str) -> str:
    start = datetime.utcnow() + timedelta(days=7)
    end = start + timedelta(minutes=30)

    dtstamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    dtstart = start.strftime("%Y%m%dT%H%M%SZ")
    dtend = end.strftime("%Y%m%dT%H%M%SZ")

    summary = f"AcadAlert Check-in: {student_name}"
    description = "Academic progress check-in with advisor"

    ics = (
        "BEGIN:VCALENDAR\n"
        "VERSION:2.0\n"
        "PRODID:-//AcadAlert//EN\n"
        "CALSCALE:GREGORIAN\n"
        "BEGIN:VEVENT\n"
        f"DTSTAMP:{dtstamp}\n"
        f"DTSTART:{dtstart}\n"
        f"DTEND:{dtend}\n"
        f"SUMMARY:{summary}\n"
        f"DESCRIPTION:{description}\n"
        "END:VEVENT\n"
        "END:VCALENDAR\n"
    )

    return ics


def build_six_week_schedule(student_name: str) -> str:
    dtstamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    base = datetime.utcnow() + timedelta(days=1)
    base = base.replace(hour=9, minute=0, second=0, microsecond=0)

    events = []
    for week in range(6):
        start = base + timedelta(weeks=week)
        end = start + timedelta(minutes=45)
        events.append(
            (
                "BEGIN:VEVENT\n"
                f"DTSTAMP:{dtstamp}\n"
                f"DTSTART:{start.strftime('%Y%m%dT%H%M%SZ')}\n"
                f"DTEND:{end.strftime('%Y%m%dT%H%M%SZ')}\n"
                f"SUMMARY:AcadAlert Study Check-in ({student_name})\n"
                "DESCRIPTION:Weekly study plan check-in\n"
                "END:VEVENT\n"
            )
        )

    return (
        "BEGIN:VCALENDAR\n"
        "VERSION:2.0\n"
        "PRODID:-//AcadAlert//EN\n"
        "CALSCALE:GREGORIAN\n"
        + "".join(events)
        + "END:VCALENDAR\n"
    )
