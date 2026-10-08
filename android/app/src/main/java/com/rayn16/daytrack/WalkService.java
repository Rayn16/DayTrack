package com.rayn16.daytrack;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;
import android.os.Looper;

import org.json.JSONArray;

import java.util.ArrayList;
import java.util.List;

// Walk mode's GPS recorder. A foreground service, so the route keeps recording with the screen off
// (the WebView's own geolocation stops when the phone is in a pocket). The page reads the points with
// DayTrackNative.walkPoints(from).
public class WalkService extends Service {
    private static final String CHANNEL = "walk";
    private static final List<double[]> points = new ArrayList<>(); // lat, lon, alt, time ms, accuracy
    static volatile boolean running;
    private LocationListener listener;

    static void start(Context c) {
        synchronized (points) { points.clear(); }
        Intent i = new Intent(c, WalkService.class);
        if (Build.VERSION.SDK_INT >= 26) c.startForegroundService(i); else c.startService(i);
    }

    static void stop(Context c) { c.stopService(new Intent(c, WalkService.class)); }

    // Points recorded since index `from`, as [[lat,lon,alt,t,acc],...]
    static String since(int from) {
        JSONArray a = new JSONArray();
        synchronized (points) {
            for (int i = Math.max(0, from); i < points.size(); i++) {
                JSONArray p = new JSONArray();
                for (double v : points.get(i)) try { p.put(v); } catch (Exception ignored) { }
                a.put(p);
            }
        }
        return a.toString();
    }

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel ch = new NotificationChannel(CHANNEL, "Walk mode", NotificationManager.IMPORTANCE_LOW);
            getSystemService(NotificationManager.class).createNotificationChannel(ch);
        }
        PendingIntent open = PendingIntent.getActivity(this, 7, new Intent(this, MainActivity.class), PendingIntent.FLAG_IMMUTABLE);
        Notification n = (Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CHANNEL) : new Notification.Builder(this))
                .setSmallIcon(R.drawable.ic_notification).setContentTitle("🚶 Walk in progress")
                .setContentText("DayTrack is recording your route").setContentIntent(open).setOngoing(true).build();
        if (Build.VERSION.SDK_INT >= 29) startForeground(42, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION);
        else startForeground(42, n);
        if (listener == null) listen();
        running = true;
        return START_NOT_STICKY;
    }

    @SuppressWarnings({"deprecation", "MissingPermission"})
    private void listen() {
        listener = new LocationListener() {
            public void onLocationChanged(Location x) {
                if (x.getAccuracy() > 35) return; // drop the wild fixes
                synchronized (points) { points.add(new double[]{x.getLatitude(), x.getLongitude(), x.hasAltitude() ? x.getAltitude() : -9999, x.getTime(), x.getAccuracy()}); }
            }
            public void onStatusChanged(String s, int st, Bundle b) { }
            public void onProviderEnabled(String s) { }
            public void onProviderDisabled(String s) { }
        };
        try { getSystemService(LocationManager.class).requestLocationUpdates(LocationManager.GPS_PROVIDER, 3000, 4, listener, Looper.getMainLooper()); }
        catch (Exception e) { stopSelf(); }
    }

    @Override public void onDestroy() {
        running = false;
        if (listener != null) getSystemService(LocationManager.class).removeUpdates(listener);
        super.onDestroy();
    }

    @Override public IBinder onBind(Intent i) { return null; }
}
