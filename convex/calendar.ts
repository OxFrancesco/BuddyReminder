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

interface ClerkOAuthTokenResponse {
  data: Array<{
    object: string;
    token: string;
    provider: string;
    scopes: string[];
  }>;
}

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
      return data.data[0].token;
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

    const event: CalendarEvent = {
      summary: item.title,
      description: item.body || undefined,
      start: {
        dateTime: new Date(item.triggerAt).toISOString(),
        timeZone: item.timezone || "UTC",
      },
      end: {
        dateTime: new Date(item.triggerAt + 3600000).toISOString(), // +1 hour
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
