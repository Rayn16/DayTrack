package com.rayn16.daytrack;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Build;
import android.util.Base64;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;

// Notifications without Chrome: DayTrack on the PC keeps them in an outbox, and the phone fetches them
// a little after each time something is due (exact alarms) and every 15 minutes in between.
final class Poller {
    static final String CHANNEL = "reminders";
    static final int GWEN_ID = 1;

    static SharedPreferences prefs(Context c) { return c.getSharedPreferences("daytrack", Context.MODE_PRIVATE); }

    // This phone's id: what the PC files its notifications under
    static synchronized String id(Context c) {
        SharedPreferences p = prefs(c);
        String id = p.getString("id", null);
        if (id == null) {
            byte[] b = new byte[16];
            new SecureRandom().nextBytes(b);
            StringBuilder s = new StringBuilder();
            for (byte x : b) s.append(String.format("%02x", x));
            id = s.toString();
            p.edit().putString("id", id).apply();
        }
        return id;
    }

    static void channel(Context c) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationChannel ch = new NotificationChannel(CHANNEL, "Reminders and Gwen", NotificationManager.IMPORTANCE_HIGH);
        c.getSystemService(NotificationManager.class).createNotificationChannel(ch);
    }

    // once: a one-time task, which can also be moved to tomorrow. image: a data: URL photo shown big.
    static void show(Context c, String title, String body, String taskId, boolean gwen, boolean once, String image) {
        channel(c);
        Intent open = new Intent(c, MainActivity.class).putExtra("gwen", gwen).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        int id = gwen ? GWEN_ID : (int) (System.currentTimeMillis() % 1000000) + 10;
        Bitmap pic = image == null || image.isEmpty() ? null : bitmap(image);
        Notification.Style style = pic != null ? new Notification.BigPictureStyle().bigPicture(pic).setSummaryText(body)
                : new Notification.BigTextStyle().bigText(body);
        Notification.Builder b = (Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(c, CHANNEL) : new Notification.Builder(c))
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(style)
                .setAutoCancel(true)
                .setPriority(Notification.PRIORITY_HIGH)
                .setDefaults(Notification.DEFAULT_ALL)
                .setContentIntent(PendingIntent.getActivity(c, id, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        if (taskId != null && !taskId.isEmpty()) {
            b.addAction(action(c, id, 0, taskId, "done", "✅ Done"));
            if (!gwen) b.addAction(action(c, id, 1, taskId, "snooze", "⏰ 10 min"));
            if (gwen || once) b.addAction(action(c, id, 2, taskId, "tomorrow", "📅 Tomorrow"));
        }
        c.getSystemService(NotificationManager.class).notify(id, b.build());
    }

    // One request code per notification and button, so neighbouring notifications never share one
    private static Notification.Action action(Context c, int notifId, int index, String taskId, String what, String label) {
        Intent i = new Intent(c, ActionReceiver.class).putExtra("action", what).putExtra("taskId", taskId).putExtra("notifId", notifId);
        PendingIntent pi = PendingIntent.getBroadcast(c, notifId * 8 + index, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        return new Notification.Action.Builder(null, label, pi).build();
    }

    // Fetch and show what's waiting on the PC (runs off the main thread)
    static void poll(Context c) {
        String server = prefs(c).getString("server", "");
        if (!server.isEmpty()) {
            try {
                JSONArray list = new JSONArray(http(server + "/.netlify/functions/outbox?auth=" + id(c), null));
                for (int i = 0; i < list.length(); i++) {
                    JSONObject m = list.getJSONObject(i);
                    show(c, m.optString("title", "⏰ DayTrack"), m.optString("body"), m.optString("taskId", null), m.optBoolean("gwen"),
                            m.optBoolean("once"), m.optString("image", null));
                }
            } catch (Exception ignored) { } // PC off or out of reach: try again at the next wake-up
        }
        DayWidget.refresh(c); // cheap, and moves the widget on to a new day
        schedule(c);
    }

    // The next exact wake-up from the times the app gave, and the 15-minute one
    static void schedule(Context c) {
        AlarmManager am = c.getSystemService(AlarmManager.class);
        long now = System.currentTimeMillis(), next = 0;
        try {
            JSONArray t = new JSONArray(prefs(c).getString("times", "[]"));
            for (int i = 0; i < t.length(); i++) {
                long x = t.getLong(i);
                if (x > now && (next == 0 || x < next)) next = x;
            }
        } catch (Exception ignored) { }
        PendingIntent exact = wake(c, 1);
        am.cancel(exact);
        if (next > 0) {
            if (Build.VERSION.SDK_INT >= 31 && !am.canScheduleExactAlarms()) am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, exact);
            else am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, exact);
        }
        am.setInexactRepeating(AlarmManager.RTC_WAKEUP, now + AlarmManager.INTERVAL_FIFTEEN_MINUTES, AlarmManager.INTERVAL_FIFTEEN_MINUTES, wake(c, 2));
    }

    static void addTime(Context c, long t) {
        try {
            JSONArray a = new JSONArray(prefs(c).getString("times", "[]"));
            a.put(t);
            prefs(c).edit().putString("times", a.toString()).apply();
        } catch (Exception ignored) { }
        schedule(c);
    }

    private static PendingIntent wake(Context c, int code) {
        return PendingIntent.getBroadcast(c, code, new Intent(c, PollReceiver.class), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    // "data:image/jpeg;base64,..." to a picture, or null
    static Bitmap bitmap(String dataUrl) {
        try {
            byte[] b = Base64.decode(dataUrl.substring(dataUrl.indexOf(',') + 1), Base64.DEFAULT);
            return BitmapFactory.decodeByteArray(b, 0, b.length);
        } catch (Exception e) { return null; }
    }

    static String day(int plus) {
        Calendar d = Calendar.getInstance();
        d.add(Calendar.DAY_OF_MONTH, plus);
        return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(d.getTime());
    }

    static String http(String url, String json) throws Exception {
        HttpURLConnection h = (HttpURLConnection) new URL(url).openConnection();
        h.setConnectTimeout(15000);
        h.setReadTimeout(15000);
        if (json != null) {
            h.setRequestMethod("POST");
            h.setDoOutput(true);
            h.setRequestProperty("Content-Type", "application/json");
            try (OutputStream o = h.getOutputStream()) { o.write(json.getBytes(StandardCharsets.UTF_8)); }
        }
        if (h.getResponseCode() >= 400) throw new Exception("HTTP " + h.getResponseCode());
        try (InputStream in = h.getInputStream()) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            for (int n; (n = in.read(buf)) > 0; ) out.write(buf, 0, n);
            return out.toString("UTF-8");
        } finally { h.disconnect(); }
    }
}
