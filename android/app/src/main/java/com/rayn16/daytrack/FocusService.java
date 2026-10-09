package com.rayn16.daytrack;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

// Focus lock: while a DayTrack timer runs, opening TikTok, YouTube, Instagram, Snapchat or a game gets a heads-up
// from Gwen (a notification that opens DayTrack, no overlay). A foreground service, since Android freezes the app
// in the background. Reads the system's app usage events (usage access) every 3 seconds.
public class FocusService extends Service {
    private static final String CHANNEL = "focus";
    private static final Set<String> APPS = new HashSet<>(Arrays.asList(
            "com.zhiliaoapp.musically", "com.ss.android.ugc.trill", "com.google.android.youtube",
            "com.instagram.android", "com.snapchat.android"));
    static volatile int slips;
    private static volatile String[] lines = {"Hey! You're supposed to be focusing 😤"};
    private static volatile long until;
    private Handler handler;
    private String last = "";
    private long since;

    // json: {"lines": [what Gwen says]}
    static void start(Context c, String json) {
        try {
            JSONArray a = new JSONObject(json).optJSONArray("lines");
            if (a != null && a.length() > 0) {
                String[] l = new String[a.length()];
                for (int i = 0; i < l.length; i++) l[i] = a.optString(i);
                lines = l;
            }
        } catch (Exception ignored) { }
        slips = 0;
        until = System.currentTimeMillis() + 4 * 3600_000L; // the page never said stop (killed): give up after 4 hours
        Intent i = new Intent(c, FocusService.class);
        try { if (Build.VERSION.SDK_INT >= 26) c.startForegroundService(i); else c.startService(i); }
        catch (Exception ignored) { } // not allowed from the background
    }

    // How many times he slipped this run
    static int stop(Context c) {
        c.stopService(new Intent(c, FocusService.class));
        return slips;
    }

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel ch = new NotificationChannel(CHANNEL, "Focus lock", NotificationManager.IMPORTANCE_LOW);
            getSystemService(NotificationManager.class).createNotificationChannel(ch);
        }
        PendingIntent open = PendingIntent.getActivity(this, 8, new Intent(this, MainActivity.class), PendingIntent.FLAG_IMMUTABLE);
        Notification n = (Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CHANNEL) : new Notification.Builder(this))
                .setSmallIcon(R.drawable.ic_notification).setContentTitle("🎯 Focus lock")
                .setContentText("Gwen is watching your apps until the timer stops 👀").setContentIntent(open).setOngoing(true).build();
        if (Build.VERSION.SDK_INT >= 34) startForeground(43, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        else startForeground(43, n);
        if (handler == null) {
            handler = new Handler(Looper.getMainLooper());
            since = System.currentTimeMillis();
            handler.post(this::check);
        }
        return START_NOT_STICKY;
    }

    private void check() {
        if (System.currentTimeMillis() > until) { stopSelf(); return; }
        try {
            String fg = foreground();
            if (fg != null && !fg.equals(last)) {
                last = fg;
                if (distracting(fg)) {
                    slips++;
                    String[] l = lines;
                    Poller.show(this, "💜 Gwen", l[(int) (Math.random() * l.length)], null, true, false, null);
                }
            }
        } catch (Exception ignored) { } // usage access taken away
        handler.postDelayed(this::check, 3000);
    }

    // The app that came to the front since the last check, or null
    private String foreground() {
        long now = System.currentTimeMillis();
        UsageEvents ev = getSystemService(UsageStatsManager.class).queryEvents(Math.max(since, now - 60000), now);
        UsageEvents.Event e = new UsageEvents.Event();
        String fg = null;
        while (ev.hasNextEvent()) {
            ev.getNextEvent(e);
            if (e.getEventType() == UsageEvents.Event.MOVE_TO_FOREGROUND && e.getTimeStamp() > since) { fg = e.getPackageName(); since = e.getTimeStamp(); }
        }
        return fg;
    }

    private boolean distracting(String pkg) {
        if (APPS.contains(pkg)) return true;
        if (Build.VERSION.SDK_INT < 26) return false;
        try { return getPackageManager().getApplicationInfo(pkg, 0).category == ApplicationInfo.CATEGORY_GAME; }
        catch (Exception e) { return false; }
    }

    @Override public void onDestroy() {
        if (handler != null) handler.removeCallbacksAndMessages(null);
        super.onDestroy();
    }

    @Override public IBinder onBind(Intent i) { return null; }
}
