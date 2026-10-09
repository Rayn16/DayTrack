package com.rayn16.daytrack;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

// Now and next on the lock screen: an ongoing notification with today's current task and the next one.
// The app sends the list ([{"id","name","time"}], "[]" clears it); Done ticks the task and moves on to the next.
final class NowNext {
    static final int ID = 7301;
    private static final String CHANNEL = "now_next";

    static synchronized void set(Context c, String json) {
        Poller.prefs(c).edit().putString("nowNext", json == null ? "[]" : json).putString("nowNextDay", Poller.day(0)).apply();
        show(c);
    }

    static synchronized void done(Context c, String taskId) {
        try {
            JSONArray a = new JSONArray(Poller.prefs(c).getString("nowNext", "[]")), out = new JSONArray();
            for (int i = 0; i < a.length(); i++) if (!taskId.equals(a.getJSONObject(i).optString("id"))) out.put(a.getJSONObject(i));
            Poller.prefs(c).edit().putString("nowNext", out.toString()).apply();
        } catch (Exception ignored) { }
        show(c);
    }

    private static void show(Context c) {
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        JSONArray a;
        try { a = new JSONArray(Poller.prefs(c).getString("nowNext", "[]")); } catch (Exception e) { a = new JSONArray(); }
        // ponytail: yesterday's list clears itself on the next Done; the app sends a fresh one when it's opened
        if (a.length() == 0 || !Poller.day(0).equals(Poller.prefs(c).getString("nowNextDay", ""))) { nm.cancel(ID); return; }
        if (Build.VERSION.SDK_INT >= 26) nm.createNotificationChannel(new NotificationChannel(CHANNEL, "Now and next", NotificationManager.IMPORTANCE_LOW));
        JSONObject now = a.optJSONObject(0), next = a.optJSONObject(1);
        String t = now.optString("time"), id = now.optString("id");
        Intent open = new Intent(c, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        Intent tick = new Intent(c, ActionReceiver.class).setAction("nownext").putExtra("action", "done").putExtra("taskId", id).putExtra("notifId", ID);
        Notification.Builder b = (Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(c, CHANNEL) : new Notification.Builder(c))
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle("Now: " + now.optString("name") + (t.isEmpty() ? "" : " · " + t))
                .setContentText(next == null ? "The last one today 💜" : "Next: " + next.optString("name") + (next.optString("time").isEmpty() ? "" : " · " + next.optString("time")))
                .setOngoing(true).setOnlyAlertOnce(true).setShowWhen(false)
                .setVisibility(Notification.VISIBILITY_PUBLIC)
                .setContentIntent(PendingIntent.getActivity(c, ID, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE))
                .addAction(new Notification.Action.Builder(null, "✅ Done", PendingIntent.getBroadcast(c, ID, tick, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE)).build());
        nm.notify(ID, b.build());
    }
}
