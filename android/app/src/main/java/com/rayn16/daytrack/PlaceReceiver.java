package com.rayn16.daytrack;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.location.LocationManager;
import android.net.Uri;

// She arrived at a place with a reminder (at most once every 30 minutes per place).
// A place with auto-tick ("tick": task ids) ticks them after 15 minutes there, unless she left before.
public class PlaceReceiver extends BroadcastReceiver {
    static final long DWELL = 15 * 60000L;

    @Override
    public void onReceive(Context c, Intent i) {
        String id = i.getStringExtra("id"), in = "placeIn_" + id, tick = i.getStringExtra("tick");
        long now = System.currentTimeMillis();
        if ("dwell".equals(i.getAction())) {
            if (Poller.prefs(c).getLong(in, 0) != i.getLongExtra("since", -1) || tick == null) return; // left, or came back since
            Poller.prefs(c).edit().remove(in).apply();
            for (String taskId : tick.split(","))
                if (!taskId.isEmpty()) c.sendBroadcast(new Intent(c, ActionReceiver.class).putExtra("action", "done").putExtra("taskId", taskId));
            Poller.show(c, "✅ Ticked at " + i.getStringExtra("name"), i.getStringExtra("body"), null, false, false, null);
            return;
        }
        if (!i.getBooleanExtra(LocationManager.KEY_PROXIMITY_ENTERING, false)) { Poller.prefs(c).edit().remove(in).apply(); return; }
        long was = Poller.prefs(c).getLong(in, 0);
        if (tick != null && !tick.isEmpty() && (was == 0 || now - was > 3 * 3600000L)) { // over 3 h: a missed exit
            Poller.prefs(c).edit().putLong(in, now).apply();
            Intent d = new Intent(c, PlaceReceiver.class).setAction("dwell").setData(Uri.parse("daytrack-dwell:" + Uri.encode(id)))
                    .putExtra("id", id).putExtra("since", now).putExtra("tick", tick).putExtra("name", i.getStringExtra("name")).putExtra("body", i.getStringExtra("body"));
            c.getSystemService(AlarmManager.class).setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, now + DWELL,
                    PendingIntent.getBroadcast(c, 1, d, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        }
        String key = "placeAt_" + id;
        if (now - Poller.prefs(c).getLong(key, 0) < 30 * 60000L) return;
        Poller.prefs(c).edit().putLong(key, now).apply();
        Poller.show(c, i.getStringExtra("title"), i.getStringExtra("body"), null, false, false, null);
    }
}
