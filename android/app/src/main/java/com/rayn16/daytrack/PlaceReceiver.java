package com.rayn16.daytrack;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.location.LocationManager;

// She arrived at a place with a reminder (at most once every 30 minutes per place)
public class PlaceReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context c, Intent i) {
        if (!i.getBooleanExtra(LocationManager.KEY_PROXIMITY_ENTERING, false)) return;
        String key = "placeAt_" + i.getStringExtra("id");
        long now = System.currentTimeMillis();
        if (now - Poller.prefs(c).getLong(key, 0) < 30 * 60000L) return;
        Poller.prefs(c).edit().putLong(key, now).apply();
        Poller.show(c, i.getStringExtra("title"), i.getStringExtra("body"), null, false, false, null);
    }
}
