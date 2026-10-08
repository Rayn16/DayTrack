package com.rayn16.daytrack;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import android.os.Build;
import android.os.IBinder;
import android.os.VibrationEffect;
import android.os.Vibrator;

import org.vosk.LibVosk;
import org.vosk.LogLevel;
import org.vosk.Model;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URL;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

// "Hey Gwen", even with the phone locked. A foreground service keeps the mic open and an offline recognizer
// (Vosk's small English model, downloaded once) listens only for her name: nothing leaves the phone until it
// hears it. Then it buzzes and opens Gwen's call screen over the lock screen.
// Android won't start a mic service from the background, so it starts when the app is opened (after a phone
// restart too) and keeps going until it's switched off.
public class WakeService extends Service {
    private static final String CHANNEL = "hey_gwen", CHANNEL_UP = "hey_gwen_up";
    static final int ID = 43, UP_ID = 44;
    private static final String MODEL_URL = "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip";

    static volatile boolean appOpen;   // DayTrack is on screen and may use the mic itself
    private static volatile long wokeAt;     // when it last heard her; the call screen gets the mic for a bit
    private volatile boolean running;

    static boolean justWoke() { return System.currentTimeMillis() - wokeAt < 20000; }

    static boolean on(Context c) { return Poller.prefs(c).getBoolean("heyGwen", false); }

    static void set(Context c, boolean on) {
        Poller.prefs(c).edit().putBoolean("heyGwen", on).apply();
        if (on) start(c); else c.stopService(new Intent(c, WakeService.class));
    }

    static void start(Context c) {
        if (!on(c) || c.checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) return;
        Intent i = new Intent(c, WakeService.class);
        try { if (Build.VERSION.SDK_INT >= 26) c.startForegroundService(i); else c.startService(i); } catch (Exception ignored) { }
    }

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && "off".equals(intent.getAction())) { set(this, false); return START_NOT_STICKY; }
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationManager nm = getSystemService(NotificationManager.class);
            nm.createNotificationChannel(new NotificationChannel(CHANNEL, "Hey Gwen (listening)", NotificationManager.IMPORTANCE_MIN));
            NotificationChannel up = new NotificationChannel(CHANNEL_UP, "Hey Gwen (she answers)", NotificationManager.IMPORTANCE_HIGH);
            up.setSound(null, null); // the buzz is enough
            up.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            nm.createNotificationChannel(up);
        }
        try {
            if (Build.VERSION.SDK_INT >= 30) startForeground(ID, note("Say “Hey Gwen” any time"), ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE);
            else startForeground(ID, note("Say “Hey Gwen” any time"));
        } catch (Exception e) { stopSelf(); return START_NOT_STICKY; } // started while the app wasn't on screen
        if (!running) { running = true; new Thread(this::listen, "hey-gwen").start(); }
        return START_STICKY;
    }

    private Notification note(String text) {
        PendingIntent open = PendingIntent.getActivity(this, 9, new Intent(this, MainActivity.class).putExtra("gwen", true), PendingIntent.FLAG_IMMUTABLE);
        PendingIntent off = PendingIntent.getService(this, 10, new Intent(this, WakeService.class).setAction("off"), PendingIntent.FLAG_IMMUTABLE);
        return (Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CHANNEL) : new Notification.Builder(this))
                .setSmallIcon(R.drawable.ic_notification).setContentTitle("💜 Hey Gwen").setContentText(text)
                .setContentIntent(open).setOngoing(true)
                .addAction(new Notification.Action.Builder(null, "Turn off", off).build()).build();
    }

    private void listen() {
        Model model = null;
        Ears ears = null;
        AudioRecord mic = null;
        short[] buf = new short[1600]; // 0.1 s
        while (running) {
            try {
                if (ears == null) {
                    File dir = model();
                    LibVosk.setLogLevel(LogLevel.WARNINGS);
                    model = new Model(dir.getPath());
                    ears = new Ears(model);
                    getSystemService(NotificationManager.class).notify(ID, note("Say “Hey Gwen” any time"));
                }
                if (appOpen || System.currentTimeMillis() - wokeAt < 10000) {
                    if (mic != null) { mic.release(); mic = null; ears.reset(); }
                    Thread.sleep(500);
                    continue;
                }
                if (mic == null) {
                    int min = AudioRecord.getMinBufferSize(16000, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT);
                    mic = new AudioRecord(MediaRecorder.AudioSource.VOICE_RECOGNITION, 16000, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT, Math.max(min, 6400));
                    mic.startRecording();
                    if (mic.getRecordingState() != AudioRecord.RECORDSTATE_RECORDING) throw new IllegalStateException("mic busy");
                }
                int n = mic.read(buf, 0, buf.length);
                if (n <= 0) throw new IllegalStateException("mic read " + n);
                if (ears.feed(buf, n)) { mic.release(); mic = null; wake(); }
            } catch (Exception e) {
                if (mic != null) { mic.release(); mic = null; }
                if (ears == null) getSystemService(NotificationManager.class).notify(ID, note("Couldn't get ready, trying again soon"));
                try { Thread.sleep(ears == null ? 60000 : 3000); } catch (InterruptedException ignored) { }
            }
        }
        if (mic != null) mic.release();
        if (ears != null) ears.close();
        if (model != null) model.close();
    }

    // The speech model (40 MB), fetched once into the app's own storage
    private File model() throws Exception {
        File dir = new File(getFilesDir(), "vosk-en"), done = new File(dir, "ready");
        if (done.exists()) return dir;
        getSystemService(NotificationManager.class).notify(ID, note("Getting ready, a one-time 40 MB download…"));
        File zip = new File(getCacheDir(), "vosk-en.zip");
        try (InputStream in = new URL(MODEL_URL).openStream(); OutputStream out = new FileOutputStream(zip)) { copy(in, out); }
        try (ZipInputStream z = new ZipInputStream(new FileInputStream(zip))) {
            for (ZipEntry e; (e = z.getNextEntry()) != null; ) {
                String name = e.getName().substring(e.getName().indexOf('/') + 1); // drop the top folder
                if (name.isEmpty() || name.contains("..")) continue;
                File f = new File(dir, name);
                if (e.isDirectory()) { f.mkdirs(); continue; }
                f.getParentFile().mkdirs();
                try (OutputStream out = new FileOutputStream(f)) { copy(z, out); }
            }
        }
        zip.delete();
        if (!new File(dir, "am/final.mdl").exists() || !done.createNewFile()) throw new IllegalStateException("bad model download");
        return dir;
    }

    private static void copy(InputStream in, OutputStream out) throws Exception {
        byte[] b = new byte[65536];
        for (int n; (n = in.read(b)) > 0; ) out.write(b, 0, n);
    }

    @SuppressWarnings("deprecation")
    private void wake() {
        wokeAt = System.currentTimeMillis();
        Vibrator v = getSystemService(Vibrator.class);
        if (v != null) { if (Build.VERSION.SDK_INT >= 26) v.vibrate(VibrationEffect.createOneShot(120, 255)); else v.vibrate(120); }
        Intent open = new Intent(this, MainActivity.class).putExtra("wake", true).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        // With "Display over other apps" allowed she opens straight away; otherwise the full-screen notification
        // opens her on a locked or dark screen, and shows as a banner to tap while the phone is in use.
        try { startActivity(open); } catch (Exception ignored) { }
        PendingIntent pi = PendingIntent.getActivity(this, 11, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder n = (Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CHANNEL_UP) : new Notification.Builder(this))
                .setSmallIcon(R.drawable.ic_notification).setContentTitle("💜 Gwen's here").setContentText("Tap to talk")
                .setCategory(Notification.CATEGORY_CALL).setPriority(Notification.PRIORITY_MAX).setVisibility(Notification.VISIBILITY_PUBLIC)
                .setAutoCancel(true).setContentIntent(pi).setFullScreenIntent(pi, true);
        if (Build.VERSION.SDK_INT >= 26) n.setTimeoutAfter(15000);
        getSystemService(NotificationManager.class).notify(UP_ID, n.build());
    }

    @Override public void onDestroy() { running = false; super.onDestroy(); }

    @Override public IBinder onBind(Intent i) { return null; }
}
