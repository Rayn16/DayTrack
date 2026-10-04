package com.rayn16.daytrack;

import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;

import androidx.core.app.NotificationManagerCompat;

/**
 * Shows the site's notifications (reminders, Gwen) as DayTrack's own. The helper library puts
 * them on a "default" channel, which Android shows silently; this channel is high importance so
 * they pop up like a chat app's.
 */
public class DelegationService extends com.google.androidbrowserhelper.trusted.DelegationService {
    private static final String CHANNEL_ID = "daytrack_alerts";

    @SuppressLint("MissingPermission")
    @Override
    public boolean onNotifyNotificationWithChannel(String platformTag, int platformId,
            Notification notification, String channelName) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return super.onNotifyNotificationWithChannel(platformTag, platformId, notification, channelName);
        }
        if (!NotificationManagerCompat.from(this).areNotificationsEnabled()) return false;
        NotificationManager manager = getSystemService(NotificationManager.class);
        // No-op once it exists, and it never lowers what the user picked
        manager.createNotificationChannel(new NotificationChannel(
                CHANNEL_ID, "Reminders and Gwen", NotificationManager.IMPORTANCE_HIGH));
        if (manager.getNotificationChannel(CHANNEL_ID).getImportance() == NotificationManager.IMPORTANCE_NONE) {
            return false;
        }
        manager.notify(platformTag, platformId,
                Notification.Builder.recoverBuilder(this, notification).setChannelId(CHANNEL_ID).build());
        return true;
    }

    @Override
    public boolean onAreNotificationsEnabled(String channelName) {
        if (!NotificationManagerCompat.from(this).areNotificationsEnabled()) return false;
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return true;
        NotificationChannel channel = getSystemService(NotificationManager.class).getNotificationChannel(CHANNEL_ID);
        return channel == null || channel.getImportance() != NotificationManager.IMPORTANCE_NONE;
    }
}
