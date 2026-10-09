package com.rayn16.daytrack;

import android.Manifest;
import android.app.AppOpsManager;
import android.app.PendingIntent;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStatsManager;
import android.content.ContentUris;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.database.Cursor;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.location.LocationManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.Process;
import android.provider.CalendarContract;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

// What the phone knows about her day: steps, screen time, calendar, and reminders tied to places.
// Shared by the page (MainActivity's Bridge), the 15-minute Poller and the receivers.
final class Phone {
    static boolean granted(Context c, String p) { return c.checkSelfPermission(p) == PackageManager.PERMISSION_GRANTED; }

    static boolean usageAccess(Context c) {
        AppOpsManager ao = c.getSystemService(AppOpsManager.class);
        int mode = Build.VERSION.SDK_INT >= 29 ? ao.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), c.getPackageName())
                : ao.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), c.getPackageName());
        return mode == AppOpsManager.MODE_ALLOWED;
    }

    // ---- Steps: the sensor counts since boot, so each day keeps where it started ----

    // Reads the counter (up to 3 s, off the main thread), records it, and returns {"today","days"} or "null"
    static String steps(Context c) {
        SensorManager sm = c.getSystemService(SensorManager.class);
        Sensor s = sm == null ? null : sm.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        if (s == null || (Build.VERSION.SDK_INT >= 29 && !granted(c, Manifest.permission.ACTIVITY_RECOGNITION))) return "null";
        CountDownLatch got = new CountDownLatch(1);
        float[] value = {-1};
        SensorEventListener l = new SensorEventListener() {
            public void onSensorChanged(SensorEvent e) { value[0] = e.values[0]; got.countDown(); }
            public void onAccuracyChanged(Sensor x, int a) { }
        };
        HandlerThread t = new HandlerThread("steps");
        t.start();
        sm.registerListener(l, s, SensorManager.SENSOR_DELAY_NORMAL, new Handler(t.getLooper()));
        try { got.await(3, TimeUnit.SECONDS); } catch (InterruptedException ignored) { }
        sm.unregisterListener(l);
        t.quitSafely();
        try {
            JSONObject st = value[0] >= 0 ? record(c, (long) value[0]) : new JSONObject(Poller.prefs(c).getString("steps", "{}"));
            JSONObject days = st.optJSONObject("days");
            if (days == null) days = new JSONObject();
            return new JSONObject().put("today", days.optLong(Poller.day(0), 0)).put("days", days).toString();
        } catch (Exception e) { return "null"; }
    }

    // State: {date, first (counter at the day's start), last (latest counter), carried (today's steps before a restart), days}
    static synchronized JSONObject record(Context c, long counter) throws Exception {
        JSONObject st = new JSONObject(Poller.prefs(c).getString("steps", "{}"));
        String today = Poller.day(0);
        long first = st.optLong("first", counter), last = st.optLong("last", counter), carried = st.optLong("carried", 0);
        if (!today.equals(st.optString("date"))) {
            // A new day starts from the last reading, so steps since then count today
            carried = 0;
            first = counter >= last ? last : 0;
        } else if (counter < last) {
            // Restarted: keep what today already had, the counter began again at 0
            carried += last - first;
            first = 0;
        }
        JSONObject days = st.optJSONObject("days");
        if (days == null) days = new JSONObject();
        days.put(today, carried + counter - first);
        String oldest = Poller.day(-29);
        for (Iterator<String> k = days.keys(); k.hasNext(); ) if (k.next().compareTo(oldest) < 0) k.remove();
        st.put("date", today).put("first", first).put("last", counter).put("carried", carried).put("days", days);
        Poller.prefs(c).edit().putString("steps", st.toString()).apply();
        return st;
    }

    // ---- Screen time since midnight, from the system's app usage events ----

    // {"minutes": total, "apps": [{"name","minutes"}] (top 5)}, or null without usage access
    static JSONObject usage(Context c) {
        if (!usageAccess(c)) return null;
        Calendar mid = Calendar.getInstance();
        mid.set(Calendar.HOUR_OF_DAY, 0); mid.set(Calendar.MINUTE, 0); mid.set(Calendar.SECOND, 0); mid.set(Calendar.MILLISECOND, 0);
        long from = mid.getTimeInMillis(), now = System.currentTimeMillis();
        PackageManager pm = c.getPackageManager();
        ResolveInfo home = pm.resolveActivity(new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME), PackageManager.MATCH_DEFAULT_ONLY);
        String launcher = home == null || home.activityInfo == null ? "" : home.activityInfo.packageName;
        Map<String, Long> open = new HashMap<>(), ms = new HashMap<>(); // open: activity -> when it came to the front
        Set<String> seen = new HashSet<>();
        UsageEvents ev = c.getSystemService(UsageStatsManager.class).queryEvents(from, now);
        UsageEvents.Event e = new UsageEvents.Event();
        while (ev.hasNextEvent()) {
            ev.getNextEvent(e);
            String pkg = e.getPackageName(), key = pkg + "/" + e.getClassName();
            if (pkg.equals(launcher)) continue;
            int type = e.getEventType();
            if (type == UsageEvents.Event.MOVE_TO_FOREGROUND) { open.put(key, e.getTimeStamp()); seen.add(key); } // = ACTIVITY_RESUMED
            else if (type == UsageEvents.Event.MOVE_TO_BACKGROUND) { // = ACTIVITY_PAUSED
                Long start = open.remove(key);
                if (start != null) add(ms, pkg, e.getTimeStamp() - start);
                else if (seen.add(key)) add(ms, pkg, e.getTimeStamp() - from); // already open at midnight
            }
        }
        for (Map.Entry<String, Long> o : open.entrySet()) add(ms, o.getKey().substring(0, o.getKey().indexOf('/')), now - o.getValue());
        long total = 0;
        for (long v : ms.values()) total += v;
        ArrayList<Map.Entry<String, Long>> top = new ArrayList<>(ms.entrySet());
        Collections.sort(top, (a, b) -> Long.compare(b.getValue(), a.getValue()));
        try {
            JSONArray apps = new JSONArray();
            for (int i = 0; i < Math.min(5, top.size()); i++) {
                String pkg = top.get(i).getKey(), name = pkg;
                try { name = pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString(); } catch (Exception ignored) { }
                apps.put(new JSONObject().put("name", name).put("minutes", top.get(i).getValue() / 60000));
            }
            return new JSONObject().put("minutes", total / 60000).put("apps", apps);
        } catch (Exception x) { return null; }
    }

    private static void add(Map<String, Long> m, String k, long v) { m.put(k, (m.containsKey(k) ? m.get(k) : 0) + Math.max(0, v)); }

    // Today's screen time to the PC once a day at the time she picked, so Gwen can say something about it
    static void screenCheckin(Context c) {
        String hm = Poller.prefs(c).getString("screenAt", ""), server = Poller.prefs(c).getString("server", "");
        long at = screenTime(c);
        if (hm.isEmpty() || server.isEmpty() || at == 0 || System.currentTimeMillis() < at) return;
        JSONObject u = usage(c);
        if (u == null) return;
        try {
            Poller.http(server + "/.netlify/functions/phone", new JSONObject().put("key", Poller.prefs(c).getString("screenKey", ""))
                    .put("event", "screen").put("minutes", u.getLong("minutes")).put("apps", u.getJSONArray("apps")).toString());
            Poller.prefs(c).edit().putString("screenSent", Poller.day(0)).apply();
        } catch (Exception ignored) { } // PC out of reach: the next wake-up tries again
    }

    // When the next screen check-in is due (today's, until it's sent), or 0 when it's off
    static long screenTime(Context c) {
        String hm = Poller.prefs(c).getString("screenAt", "");
        try {
            Calendar t = Calendar.getInstance();
            t.set(Calendar.HOUR_OF_DAY, Integer.parseInt(hm.substring(0, hm.indexOf(':'))));
            t.set(Calendar.MINUTE, Integer.parseInt(hm.substring(hm.indexOf(':') + 1)));
            t.set(Calendar.SECOND, 0); t.set(Calendar.MILLISECOND, 0);
            if (Poller.day(0).equals(Poller.prefs(c).getString("screenSent", ""))) t.add(Calendar.DAY_OF_MONTH, 1);
            return t.getTimeInMillis();
        } catch (Exception e) { return 0; }
    }

    // ---- Calendar: the phone's own events, repeats expanded ----

    static String calendar(Context c, long from, long to) {
        if (!granted(c, Manifest.permission.READ_CALENDAR)) return "[]";
        Uri.Builder u = CalendarContract.Instances.CONTENT_URI.buildUpon();
        ContentUris.appendId(u, from);
        ContentUris.appendId(u, to);
        JSONArray a = new JSONArray();
        try (Cursor q = c.getContentResolver().query(u.build(), new String[]{CalendarContract.Instances.TITLE, CalendarContract.Instances.BEGIN,
                        CalendarContract.Instances.END, CalendarContract.Instances.ALL_DAY},
                CalendarContract.Instances.VISIBLE + "=1", null, CalendarContract.Instances.BEGIN + " ASC")) {
            while (q != null && q.moveToNext() && a.length() < 200)
                a.put(new JSONObject().put("title", q.isNull(0) ? "" : q.getString(0)).put("start", q.getLong(1)).put("end", q.getLong(2)).put("allDay", q.getInt(3) == 1));
        } catch (Exception ignored) { }
        return a.toString();
    }

    // ---- Reminders that go off when she arrives somewhere (the system's proximity alerts, no Play Services) ----

    // Replaces the registered places with json ([{"id","lat","lon","radius","title","body"}]); null re-registers the saved ones
    static synchronized void places(Context c, String json) {
        LocationManager lm = c.getSystemService(LocationManager.class);
        String old = Poller.prefs(c).getString("places", "[]");
        boolean ok = granted(c, Manifest.permission.ACCESS_FINE_LOCATION);
        try {
            JSONArray p = new JSONArray(json == null ? old : json);
            if (json != null) Poller.prefs(c).edit().putString("places", json).apply();
            JSONArray o = new JSONArray(old);
            for (int i = 0; i < o.length() && ok; i++) lm.removeProximityAlert(place(c, o.getJSONObject(i)));
            for (int i = 0; i < p.length() && ok; i++) {
                JSONObject x = p.getJSONObject(i);
                lm.addProximityAlert(x.getDouble("lat"), x.getDouble("lon"), (float) x.optDouble("radius", 100), -1, place(c, x));
            }
        } catch (Exception ignored) { } // bad json, or location turned off
    }

    private static String joinIds(JSONArray a) {
        if (a == null) return null;
        StringBuilder b = new StringBuilder();
        for (int i = 0; i < a.length(); i++) b.append(i > 0 ? "," : "").append(a.optString(i));
        return b.toString();
    }

    // Mutable: the system adds KEY_PROXIMITY_ENTERING. The place id in the data keeps each one apart.
    private static PendingIntent place(Context c, JSONObject x) {
        String id = x.optString("id");
        Intent i = new Intent(c, PlaceReceiver.class).setData(Uri.parse("daytrack-place:" + Uri.encode(id)))
                .putExtra("id", id).putExtra("title", x.optString("title", "📍 DayTrack")).putExtra("body", x.optString("body"))
                .putExtra("tick", joinIds(x.optJSONArray("tick"))).putExtra("name", x.optString("name"));
        return PendingIntent.getBroadcast(c, 0, i, PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0));
    }
}
