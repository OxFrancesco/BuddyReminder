"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

interface CalendarEvent {
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
}

interface GoogleCalendarEvent {
  id?: string;
  status?: string;
  summary?: string;
  description?: string;
  updated?: string;
  start?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
}

interface GoogleCalendarEventsResponse {
  items?: GoogleCalendarEvent[];
  nextPageToken?: string;
  nextSyncToken?: string;
}

interface ClerkOAuthTokenResponse {
  data: Array<{
    object: string;
    token: string;
    provider: string;
    scopes: string[];
  }>;
}

const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];

const hasCalendarScope = (scopes: string[] | undefined): boolean => {
  if (!scopes || scopes.length === 0) return false;
  return scopes.some((scope) => GOOGLE_CALENDAR_SCOPES.includes(scope));
};

async function getGoogleOAuthToken(clerkId: string): Promise<string | null> {
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  if (!clerkSecretKey) {
    console.error("CLERK_SECRET_KEY not configured");
    return null;
  }

  try {
    const response = await fetch(
      `https://api.clerk.com/v1/users/${clerkId}/oauth_access_tokens/oauth_google`,
      {
        headers: {
          Authorization: `Bearer ${clerkSecretKey}`,
        },
      }
    );

    if (!response.ok) {
      console.error("Failed to get OAuth token from Clerk:", response.status);
      return null;
    }

    const data: ClerkOAuthTokenResponse = await response.json();
    if (data.data && data.data.length > 0) {
      const calendarToken = data.data.find((entry) => hasCalendarScope(entry.scopes));
      if (!calendarToken) {
        console.error("Google OAuth token missing calendar scope");
        return null;
      }
      return calendarToken.token;
    }
    return null;
  } catch (error) {
    console.error("Error fetching OAuth token:", error);
    return null;
  }
}

async function createCalendarEvent(
  token: string,
  event: CalendarEvent
): Promise<string | null> {
  try {
    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to create calendar event:", error);
      return null;
    }

    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error("Calendar create error:", error);
    return null;
  }
}

async function updateCalendarEvent(
  token: string,
  eventId: string,
  event: CalendarEvent
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    return response.ok;
  } catch (error) {
    console.error("Calendar update error:", error);
    return false;
  }
}

async function deleteCalendarEvent(
  token: string,
  eventId: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.ok;
  } catch (error) {
    console.error("Calendar delete error:", error);
    return false;
  }
}

async function listCalendarEvents(
  token: string,
  syncToken?: string
): Promise<{
  events: GoogleCalendarEvent[];
  nextSyncToken?: string;
  syncTokenInvalid?: boolean;
}> {
  const events: GoogleCalendarEvent[] = [];
  let pageToken: string | undefined;
  let nextSyncToken: string | undefined;

  try {
    do {
      const params = new URLSearchParams({
        singleEvents: "true",
        showDeleted: "true",
        maxResults: "2500",
      });
      if (syncToken) params.set("syncToken", syncToken);
      if (pageToken) params.set("pageToken", pageToken);

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 410) {
        return { events: [], syncTokenInvalid: true };
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to list calendar events:", errorText);
        return { events };
      }

      const data: GoogleCalendarEventsResponse = await response.json();
      if (data.items?.length) {
        events.push(...data.items);
      }
      pageToken = data.nextPageToken;
      if (data.nextSyncToken) {
        nextSyncToken = data.nextSyncToken;
      }
    } while (pageToken);

    return { events, nextSyncToken };
  } catch (error) {
    console.error("Calendar list error:", error);
    return { events };
  }
}

export const checkCalendarScope = action({
  args: {},
  handler: async (ctx): Promise<{ hasScope: boolean }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { hasScope: false };
    }

    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (!clerkSecretKey) {
      console.error("CLERK_SECRET_KEY not configured");
      return { hasScope: false };
    }

    try {
      const response = await fetch(
        `https://api.clerk.com/v1/users/${identity.subject}/oauth_access_tokens/oauth_google`,
        {
          headers: {
            Authorization: `Bearer ${clerkSecretKey}`,
          },
        }
      );

      if (!response.ok) {
        console.error("Failed to check OAuth scopes:", response.status);
        return { hasScope: false };
      }

      const data: ClerkOAuthTokenResponse = await response.json();
      const hasScope =
        data.data?.some((entry) => hasCalendarScope(entry.scopes)) ?? false;
      return { hasScope };
    } catch (error) {
      console.error("Error checking OAuth scopes:", error);
      return { hasScope: false };
    }
  },
});

export const syncItemToCalendar = action({
  args: { itemId: v.id("items") },
  handler: async (ctx, { itemId }): Promise<{ success: boolean; eventId?: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { success: false };
    }

    // Get item and user data
    const data = await ctx.runQuery(internal.calendarHelpers.getItemWithUser, { itemId });
    if (!data) {
      return { success: false };
    }

    const { item, user } = data;

    // Verify ownership
    if (user.clerkId !== identity.subject) {
      return { success: false };
    }

    // Get Google OAuth token
    const googleToken = await getGoogleOAuthToken(user.clerkId);
    if (!googleToken) {
      console.error("No Google OAuth token available");
      return { success: false };
    }

    // Skip items without a trigger time
    if (!item.triggerAt) {
      return { success: true };
    }

    const defaultEndAt = item.triggerAt + 3600000;
    const endAt =
      item.endAt && item.endAt > item.triggerAt ? item.endAt : defaultEndAt;
    const event: CalendarEvent = {
      summary: item.title,
      description: item.body || undefined,
      start: {
        dateTime: new Date(item.triggerAt).toISOString(),
        timeZone: item.timezone || "UTC",
      },
      end: {
        dateTime: new Date(endAt).toISOString(),
        timeZone: item.timezone || "UTC",
      },
    };

    if (item.googleCalendarEventId) {
      // Update or delete existing event
      if (item.status === "done") {
        const deleted = await deleteCalendarEvent(googleToken, item.googleCalendarEventId);
        if (deleted) {
          await ctx.runMutation(internal.calendarHelpers.updateItemCalendarEventId, {
            itemId,
            eventId: null,
          });
        }
        return { success: deleted };
      } else {
        const updated = await updateCalendarEvent(
          googleToken,
          item.googleCalendarEventId,
          event
        );
        return { success: updated, eventId: item.googleCalendarEventId };
      }
    } else if (item.status === "open") {
      // Create new event
      const eventId = await createCalendarEvent(googleToken, event);
      if (eventId) {
        await ctx.runMutation(internal.calendarHelpers.updateItemCalendarEventId, {
          itemId,
          eventId,
        });
        return { success: true, eventId };
      }
      return { success: false };
    }

    return { success: true };
  },
});

export const deleteItemFromCalendar = action({
  args: { itemId: v.id("items") },
  handler: async (ctx, { itemId }): Promise<{ success: boolean }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { success: false };
    }

    const data = await ctx.runQuery(internal.calendarHelpers.getItemWithUser, { itemId });
    if (!data) {
      return { success: false };
    }

    const { item, user } = data;

    if (user.clerkId !== identity.subject) {
      return { success: false };
    }

    if (!item.googleCalendarEventId) {
      return { success: true };
    }

    const googleToken = await getGoogleOAuthToken(user.clerkId);
    if (!googleToken) {
      return { success: false };
    }

    const deleted = await deleteCalendarEvent(googleToken, item.googleCalendarEventId);
    if (deleted) {
      await ctx.runMutation(internal.calendarHelpers.updateItemCalendarEventId, {
        itemId,
        eventId: null,
      });
    }

    return { success: deleted };
  },
});

export const syncFromGoogle = action({
  args: {},
  handler: async (
    ctx
  ): Promise<{
    success: boolean;
    created: number;
    updated: number;
    deleted: number;
    skipped: number;
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { success: false, created: 0, updated: 0, deleted: 0, skipped: 0 };
    }

    const user = await ctx.runQuery(internal.calendarHelpers.getUserByClerkId, {
      clerkId: identity.subject,
    });
    if (!user) {
      return { success: false, created: 0, updated: 0, deleted: 0, skipped: 0 };
    }

    const googleToken = await getGoogleOAuthToken(user.clerkId);
    if (!googleToken) {
      console.error("No Google OAuth token available for calendar sync");
      return { success: false, created: 0, updated: 0, deleted: 0, skipped: 0 };
    }

    let eventsResult = await listCalendarEvents(googleToken, user.googleCalendarSyncToken);
    if (eventsResult.syncTokenInvalid) {
      await ctx.runMutation(internal.calendarHelpers.updateUserCalendarSyncToken, {
        userId: user._id,
        syncToken: null,
      });
      eventsResult = await listCalendarEvents(googleToken);
    }

    if (eventsResult.nextSyncToken) {
      await ctx.runMutation(internal.calendarHelpers.updateUserCalendarSyncToken, {
        userId: user._id,
        syncToken: eventsResult.nextSyncToken,
      });
    }

    const items = await ctx.runQuery(internal.calendarHelpers.getItemsForCalendarSync, {
      userId: user._id,
    });
    const itemsByEventId = new Map(
      items
        .filter((item) => item.googleCalendarEventId)
        .map((item) => [item.googleCalendarEventId as string, item])
    );

    let created = 0;
    let updated = 0;
    let deleted = 0;
    let skipped = 0;

    for (const event of eventsResult.events) {
      if (!event.id) {
        skipped++;
        continue;
      }

      const existing = itemsByEventId.get(event.id);

      if (event.status === "cancelled") {
        if (existing) {
          await ctx.runMutation(internal.calendarHelpers.deleteItemFromGoogle, {
            itemId: existing._id,
          });
          deleted++;
        } else {
          skipped++;
        }
        continue;
      }

      const startDateTime = event.start?.dateTime;
      const endDateTime = event.end?.dateTime;
      if (!startDateTime || !endDateTime) {
        skipped++;
        continue;
      }

      const triggerAt = Date.parse(startDateTime);
      const endAt = Date.parse(endDateTime);
      if (Number.isNaN(triggerAt) || Number.isNaN(endAt) || endAt <= triggerAt) {
        skipped++;
        continue;
      }

      const updatedAt = event.updated ? Date.parse(event.updated) : Date.now();
      const timezone = event.start?.timeZone || event.end?.timeZone || "UTC";

      if (existing) {
        await ctx.runMutation(internal.calendarHelpers.updateItemFromGoogle, {
          itemId: existing._id,
          title: event.summary || "Untitled event",
          body: event.description || undefined,
          triggerAt,
          endAt,
          timezone,
          updatedAt,
          googleCalendarEventId: event.id,
        });
        updated++;
      } else {
        await ctx.runMutation(internal.calendarHelpers.createItemFromGoogle, {
          userId: user._id,
          title: event.summary || "Untitled event",
          body: event.description || undefined,
          triggerAt,
          endAt,
          timezone,
          updatedAt,
          googleCalendarEventId: event.id,
        });
        created++;
      }
    }

    return { success: true, created, updated, deleted, skipped };
  },
});
