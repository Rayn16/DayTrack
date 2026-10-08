package com.rayn16.daytrack;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

// Alarm or phone restart: fetch notifications from the PC and set the next wake-up (and the place reminders after a restart)
public class PollReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context c, Intent i) {
        PendingResult r = goAsync();
        Context app = c.getApplicationContext();
        new Thread(() -> {
            try {
                if (Intent.ACTION_BOOT_COMPLETED.equals(i.getAction())) { Phone.places(app, null); BossAlarm.schedule(app); } // a restart forgets proximity alerts and alarms
                Poller.poll(app);
            } finally { r.finish(); }
        }).start();
    }
}
