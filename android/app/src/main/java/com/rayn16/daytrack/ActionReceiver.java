package com.rayn16.daytrack;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import org.json.JSONArray;
import org.json.JSONObject;

// Done / Tomorrow / 10 min tapped on a notification, or a task tapped on the widget (Done)
public class ActionReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context c, Intent i) {
        Context app = c.getApplicationContext();
        String action = i.getStringExtra("action"), taskId = i.getStringExtra("taskId");
        app.getSystemService(NotificationManager.class).cancel(i.getIntExtra("notifId", 0));
        if (action == null || taskId == null) return;
        String date = Poller.day("tomorrow".equals(action) ? 1 : 0);
        if (!"snooze".equals(action)) {
            // The app applies it to the task next time it's open
            synchronized (ActionReceiver.class) {
                try {
                    JSONArray a = new JSONArray(Poller.prefs(app).getString("actions", "[]"));
                    a.put(new JSONObject().put("action", action).put("taskId", taskId).put("date", date));
                    Poller.prefs(app).edit().putString("actions", a.toString()).commit();
                } catch (Exception ignored) { }
            }
        } else Poller.addTime(app, System.currentTimeMillis() + 11 * 60000L);
        if ("done".equals(action)) DayWidget.done(app, taskId);
        // Tell the PC so it stops (done), moves it (tomorrow) or comes back in 10 minutes (snooze)
        String server = Poller.prefs(app).getString("server", "");
        if (server.isEmpty()) return;
        PendingResult r = goAsync();
        new Thread(() -> {
            try {
                Poller.http(server + "/.netlify/functions/reminder-action", new JSONObject()
                        .put("auth", Poller.id(app)).put("taskId", taskId).put("action", action).put("date", date).toString());
            } catch (Exception ignored) {
            } finally { r.finish(); }
        }).start();
    }
}
