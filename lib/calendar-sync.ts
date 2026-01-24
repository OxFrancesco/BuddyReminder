import { useAuth } from '@clerk/clerk-expo';

export interface CalendarEvent {
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
}

export async function syncToGoogleCalendar(
  getToken: () => Promise<string | null>,
  event: CalendarEvent
): Promise<string | null> {
  try {
    const token = await getToken();
    if (!token) return null;

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) throw new Error('Failed to create calendar event');
    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error('Calendar sync error:', error);
    return null;
  }
}

export async function updateGoogleCalendarEvent(
  getToken: () => Promise<string | null>,
  eventId: string,
  event: CalendarEvent
): Promise<boolean> {
  try {
    const token = await getToken();
    if (!token) return false;

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Calendar update error:', error);
    return false;
  }
}

export async function deleteGoogleCalendarEvent(
  getToken: () => Promise<string | null>,
  eventId: string
): Promise<boolean> {
  try {
    const token = await getToken();
    if (!token) return false;

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Calendar delete error:', error);
    return false;
  }
}
