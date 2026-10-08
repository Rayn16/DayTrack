package com.rayn16.daytrack;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

// The daily surprise boss: at its time the phone rings like an alarm (louder than silent mode, again and again)
// until he opens DayTrack or the fight's time runs out. The app gives the next few bosses: [{at, until, title, body}].
public class BossAlarm extends BroadcastReceiver {
    static final String CHANNEL = "boss_battle"; // a channel keeps its first sound, so new sound = new channel
    static final int ID = 7;

    static void set(Context c, String json) {
        Poller.prefs(c).edit().putString("boss", json == null ? "[]" : json).apply();
        schedule(c);
    }

    static void stop(Context c) { c.getSystemService(NotificationManager.class).cancel(ID); }

    // The first boss that hasn't rung yet and isn't over
    private static JSONObject next(Context c, boolean dueNow) {
        long now = System.currentTimeMillis(), rung = Poller.prefs(c).getLong("bossRung", 0);
        JSONObject best = null;
        try {
            JSONArray a = new JSONArray(Poller.prefs(c).getString("boss", "[]"));
            for (int i = 0; i < a.length(); i++) {
                JSONObject b = a.getJSONObject(i);
                long at = b.optLong("at"), until = b.optLong("until");
                if (at <= rung || until <= now || (dueNow && at > now + 5000)) continue;
                if (best == null || at < best.optLong("at")) best = b;
            }
        } catch (Exception ignored) { }
        return best;
    }

    static void schedule(Context c) {
        AlarmManager am = c.getSystemService(AlarmManager.class);
        PendingIntent pi = PendingIntent.getBroadcast(c, ID, new Intent(c, BossAlarm.class), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        am.cancel(pi);
        JSONObject b = next(c, false);
        if (b == null) return;
        long at = Math.max(System.currentTimeMillis() + 1000, b.optLong("at"));
        if (Build.VERSION.SDK_INT >= 31 && !am.canScheduleExactAlarms()) am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
        else am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
    }

    @Override
    public void onReceive(Context c, Intent i) {
        Context app = c.getApplicationContext();
        JSONObject b = next(app, true);
        if (b != null) {
            Poller.prefs(app).edit().putLong("bossRung", b.optLong("at")).apply();
            ring(app, b);
        }
        schedule(app);
    }

    private static void ring(Context c, JSONObject b) {
        Uri sound = Uri.parse("android.resource://" + c.getPackageName() + "/" + R.raw.boss_battle); // battle drums, not the ringtone
        long[] buzz = {0, 900, 250, 900, 250, 900, 250, 1500};
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel ch = new NotificationChannel(CHANNEL, "Boss fights", NotificationManager.IMPORTANCE_HIGH);
            ch.setDescription("Rings like an alarm when a daily boss appears");
            ch.setSound(sound, new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build());
            ch.enableVibration(true);
            ch.setVibrationPattern(buzz);
            ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            c.getSystemService(NotificationManager.class).createNotificationChannel(ch);
            c.getSystemService(NotificationManager.class).deleteNotificationChannel("boss"); // the old one that used the ringtone
        }
        Intent open = new Intent(c, MainActivity.class).putExtra("boss", true).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        PendingIntent pi = PendingIntent.getActivity(c, ID, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        long left = b.optLong("until") - System.currentTimeMillis();
        Notification.Builder n = (Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(c, CHANNEL) : new Notification.Builder(c))
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle(b.optString("title", "⚔️ A boss appeared!"))
                .setContentText(b.optString("body"))
                .setStyle(new Notification.BigTextStyle().bigText(b.optString("body")))
                .setCategory(Notification.CATEGORY_ALARM)
                .setPriority(Notification.PRIORITY_MAX)
                .setVisibility(Notification.VISIBILITY_PUBLIC)
                .setAutoCancel(true)
                .setContentIntent(pi)
                .setFullScreenIntent(pi, true)
                .addAction(new Notification.Action.Builder(null, "⚔️ Fight", pi).build());
        if (left > 0 && Build.VERSION.SDK_INT >= 26) n.setTimeoutAfter(left);
        if (Build.VERSION.SDK_INT < 26) n.setSound(sound, AudioManager.STREAM_ALARM).setVibrate(buzz);
        Notification note = n.build();
        note.flags |= Notification.FLAG_INSISTENT; // sound and buzz repeat until it's opened or dismissed
        c.getSystemService(NotificationManager.class).notify(ID, note);
    }
}
