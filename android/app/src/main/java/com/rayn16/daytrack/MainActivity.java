package com.rayn16.daytrack;

import android.Manifest;
import android.app.Activity;
import android.app.KeyguardManager;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.WallpaperManager;
import android.content.ContentResolver;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageInstaller;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.hardware.biometrics.BiometricManager;
import android.hardware.biometrics.BiometricPrompt;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.media.ExifInterface;
import android.net.ConnectivityManager;
import android.net.LinkAddress;
import android.net.LinkProperties;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.util.Base64;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewAssetLoader;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.HttpURLConnection;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.URL;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

// DayTrack's own window: the web app from the APK's assets in a WebView, with the phone standing in
// for what Chrome used to give it (notifications, speech, file picker, location). See the
// window.DayTrackNative shim at the top of index.html for the other side. Also: self-update, the home-screen
// widget's data, share-into-DayTrack, fingerprint lock and wallpaper, and the phone features in Phone.java.
public class MainActivity extends Activity {
    private static final String START = "https://appassets.androidplatform.net/assets/web/index.html";
    private static final String APK = "https://github.com/Rayn16/DayTrack/releases/download/app/DayTrack.apk";
    private static final int REQ_MIC = 1, REQ_NOTIF = 2, REQ_LOC = 3, REQ_FILE = 4, REQ_PERM = 10;
    private static final String[] PERMS = {"location", "locationAlways", "calendar", "steps"}; // askPerm's request code is REQ_PERM + index

    private WebView web;
    private SpeechRecognizer speech;
    private boolean speechInterim;
    private String speechLang = "";
    private ValueCallback<Uri[]> fileCallback;
    private GeolocationPermissions.Callback geoCallback;
    private String geoOrigin;
    private volatile int installSession = -1;
    private final AtomicReference<String> share = new AtomicReference<>(""); // waiting for takeShare()
    private String settingsFor; // askPerm sent her to Settings for this; answered when she's back
    private String tile; // a Quick Settings tile tapped before the page was ready
    private boolean loaded;

    @Override
    protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        Poller.channel(this);
        Poller.schedule(this);
        getWindow().setStatusBarColor(0xFF6C63FF);

        WebViewAssetLoader assets = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this)).build();
        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setGeolocationEnabled(true);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW); // a plain http PC address still works
        web.addJavascriptInterface(new Bridge(), "DayTrackNative");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) { return assets.shouldInterceptRequest(r.getUrl()); }

            @Override
            public void onPageFinished(WebView v, String url) { loaded = true; openTile(null); }

            // Links out of the app (music, maps) open in their own apps
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                if (r.getUrl().toString().startsWith("https://appassets.androidplatform.net/")) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, r.getUrl())); } catch (Exception ignored) { }
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = cb;
                try { startActivityForResult(p.createIntent(), REQ_FILE); } catch (Exception e) { fileCallback = null; return false; }
                return true;
            }

            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback cb) {
                if (granted(Manifest.permission.ACCESS_COARSE_LOCATION)) { cb.invoke(origin, true, false); return; }
                geoOrigin = origin; geoCallback = cb;
                requestPermissions(new String[]{Manifest.permission.ACCESS_COARSE_LOCATION}, REQ_LOC);
            }
        });
        setContentView(web);
        web.loadUrl(getIntent().getBooleanExtra("gwen", false) ? START + "?tab=gwen" : getIntent().getBooleanExtra("boss", false) ? START + "?tab=boss" : START);
        if (getIntent().getBooleanExtra("boss", false)) BossAlarm.stop(this);
        // Not again after the activity is rebuilt or reopened from recents
        if (saved == null && (getIntent().getFlags() & Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY) == 0) handle(getIntent());
    }

    // A tap on Gwen's notification opens her chat
    @Override
    protected void onNewIntent(Intent i) {
        super.onNewIntent(i);
        if (i.getBooleanExtra("gwen", false)) web.evaluateJavascript("switchTab('gwen');pullGwenInbox();", null);
        if (i.getBooleanExtra("boss", false)) { BossAlarm.stop(this); web.evaluateJavascript("window.heroBossOpen&&heroBossOpen()", null); }
        handle(i);
    }

    // The "Add task" tile: the page opens its add box once it's loaded
    private void openTile(String t) {
        if (t != null) tile = t;
        if (!loaded || tile == null) return;
        web.evaluateJavascript("window.dtTile&&dtTile(" + JSONObject.quote(tile) + ")", null);
        tile = null;
    }

    // Something shared into DayTrack, or word back from installing an update
    private void handle(Intent i) {
        String t = i.getStringExtra("tile");
        if (t != null) openTile(t);
        if (Intent.ACTION_SEND.equals(i.getAction())) {
            CharSequence text = i.getCharSequenceExtra(Intent.EXTRA_TEXT), subject = i.getCharSequenceExtra(Intent.EXTRA_SUBJECT);
            Uri img = i.getType() != null && i.getType().startsWith("image/") ? (Uri) i.getParcelableExtra(Intent.EXTRA_STREAM) : null;
            new Thread(() -> {
                JSONObject o = new JSONObject();
                try {
                    if (text != null && text.length() > 0) o.put("text", text.toString());
                    if (subject != null && subject.length() > 0) o.put("subject", subject.toString());
                    String data = img == null ? null : sharedImage(img);
                    if (data != null) o.put("image", data);
                } catch (Exception ignored) { }
                if (o.length() == 0) return;
                share.set(o.toString());
                js("window.dtShared&&dtShared()"); // a page that's still loading picks it up with takeShare() instead
            }).start();
        }
        // Only our own install session's answer (the extra is its id), so no other app can use this
        int sid = i.getIntExtra("install", -1);
        if (sid != -1 && sid == installSession) {
            int status = i.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE);
            if (status == PackageInstaller.STATUS_PENDING_USER_ACTION) {
                Intent confirm = i.getParcelableExtra(Intent.EXTRA_INTENT);
                try { if (confirm != null) startActivity(confirm); } catch (Exception e) { updateState("error", "Couldn't open the installer"); }
            } else if (status == PackageInstaller.STATUS_FAILURE_ABORTED) updateState("error", "Update cancelled");
            else if (status != PackageInstaller.STATUS_SUCCESS) {
                String msg = i.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE);
                updateState("error", msg == null ? "Install failed" : "Install failed: " + msg);
            }
        }
    }

    // A shared picture as a small JPEG data: URL (at most 400px, turned upright)
    private String sharedImage(Uri uri) throws Exception {
        ContentResolver cr = getContentResolver();
        BitmapFactory.Options o = new BitmapFactory.Options();
        o.inJustDecodeBounds = true;
        try (InputStream in = cr.openInputStream(uri)) { BitmapFactory.decodeStream(in, null, o); }
        o.inJustDecodeBounds = false;
        o.inSampleSize = 1;
        while (Math.max(o.outWidth, o.outHeight) / (o.inSampleSize * 2) >= 400) o.inSampleSize *= 2;
        Bitmap b = null;
        try (InputStream in = cr.openInputStream(uri)) { b = BitmapFactory.decodeStream(in, null, o); }
        if (b == null) return null;
        int turn = 0;
        try (InputStream in = cr.openInputStream(uri)) {
            int e = new ExifInterface(in).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL);
            turn = e == ExifInterface.ORIENTATION_ROTATE_90 ? 90 : e == ExifInterface.ORIENTATION_ROTATE_180 ? 180 : e == ExifInterface.ORIENTATION_ROTATE_270 ? 270 : 0;
        } catch (Exception ignored) { } // not a JPEG, or no camera info
        b = fit(b, 400);
        if (turn != 0) {
            Matrix m = new Matrix();
            m.postRotate(turn);
            b = Bitmap.createBitmap(b, 0, 0, b.getWidth(), b.getHeight(), m, true);
        }
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        b.compress(Bitmap.CompressFormat.JPEG, 80, out);
        return "data:image/jpeg;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
    }

    // Shrink so the longer side is at most max pixels
    private static Bitmap fit(Bitmap b, int max) {
        float k = (float) max / Math.max(b.getWidth(), b.getHeight());
        if (k >= 1) return b;
        return Bitmap.createScaledBitmap(b, Math.max(1, Math.round(b.getWidth() * k)), Math.max(1, Math.round(b.getHeight() * k)), true);
    }

    // Cut a square from the middle and make it round, for Gwen's face on the widget
    private static Bitmap round(Bitmap b) {
        int s = Math.min(b.getWidth(), b.getHeight());
        Bitmap out = Bitmap.createBitmap(s, s, Bitmap.Config.ARGB_8888);
        Canvas cv = new Canvas(out);
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG);
        cv.drawCircle(s / 2f, s / 2f, s / 2f, p);
        p.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.SRC_IN));
        cv.drawBitmap(b, (s - b.getWidth()) / 2f, (s - b.getHeight()) / 2f, p);
        return out;
    }

    // Download the latest APK from the GitHub release and hand it to the system installer
    private void downloadUpdate() {
        PackageInstaller pi = getPackageManager().getPackageInstaller();
        int sid = -1;
        try {
            updateState("downloading", null);
            HttpURLConnection h = (HttpURLConnection) new URL(APK).openConnection(); // follows the redirect to GitHub's file host
            h.setConnectTimeout(15000);
            h.setReadTimeout(120000);
            try {
                if (h.getResponseCode() >= 400) throw new Exception("HTTP " + h.getResponseCode());
                sid = pi.createSession(new PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL));
                try (PackageInstaller.Session s = pi.openSession(sid)) {
                    try (InputStream in = h.getInputStream(); OutputStream out = s.openWrite("DayTrack.apk", 0, -1)) {
                        byte[] buf = new byte[65536];
                        for (int n; (n = in.read(buf)) > 0; ) out.write(buf, 0, n);
                        s.fsync(out);
                    }
                    updateState("installing", null);
                    installSession = sid;
                    // The system fills in the result, so this one has to be mutable
                    Intent back = new Intent(this, MainActivity.class).putExtra("install", sid).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    s.commit(PendingIntent.getActivity(this, 3, back,
                            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0)).getIntentSender());
                }
            } finally { h.disconnect(); }
        } catch (Exception e) {
            if (sid != -1) try { pi.abandonSession(sid); } catch (Exception ignored) { }
            updateState("error", "Couldn't download the update");
        }
    }

    private void updateState(String state, String msg) { js("window.__dtUpdate&&__dtUpdate(" + JSONObject.quote(state) + "," + str(msg) + ")"); }

    private void unlocked(boolean ok) { js("window.__dtUnlock&&__dtUnlock(" + ok + ")"); }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
        web.evaluateJavascript("window.__dtResume&&__dtResume()", null);
        getSystemService(NotificationManager.class).cancel(Poller.GWEN_ID);
        if (settingsFor != null) { perm2(settingsFor); settingsFor = null; }
    }

    @Override
    protected void onPause() { web.onPause(); super.onPause(); }

    @Override
    protected void onDestroy() { if (speech != null) speech.destroy(); web.destroy(); super.onDestroy(); }

    @Override
    public void onBackPressed() { moveTaskToBack(true); }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (req == REQ_FILE && fileCallback != null) {
            fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(res, data));
            fileCallback = null;
        }
    }

    @Override
    public void onRequestPermissionsResult(int req, String[] perms, int[] res) {
        boolean ok = res.length > 0 && res[0] == PackageManager.PERMISSION_GRANTED;
        if (req == REQ_MIC) { if (ok) startListening(); else { emit("error", "not-allowed"); emit("end", null); } }
        else if (req == REQ_NOTIF) js("window.__dtPerm&&__dtPerm(" + ok + ")");
        else if (req == REQ_LOC && geoCallback != null) { geoCallback.invoke(geoOrigin, ok, false); geoCallback = null; }
        else if (req >= REQ_PERM && req < REQ_PERM + PERMS.length) {
            String which = PERMS[req - REQ_PERM];
            // "All the time" is asked after a yes to "while using the app"
            if ("locationAlways".equals(which) && perms.length > 0 && Manifest.permission.ACCESS_FINE_LOCATION.equals(perms[0])
                    && granted(Manifest.permission.ACCESS_FINE_LOCATION) && !hasPerm(which)) askPerm(which);
            else perm2(which);
        }
    }

    private boolean hasPerm(String which) {
        switch (String.valueOf(which)) {
            case "location": return granted(Manifest.permission.ACCESS_FINE_LOCATION);
            case "locationAlways": return granted(Manifest.permission.ACCESS_FINE_LOCATION)
                    && (Build.VERSION.SDK_INT < 29 || granted(Manifest.permission.ACCESS_BACKGROUND_LOCATION));
            case "calendar": return granted(Manifest.permission.READ_CALENDAR);
            case "steps": return Build.VERSION.SDK_INT < 29 || granted(Manifest.permission.ACTIVITY_RECOGNITION);
            case "usage": return Phone.usageAccess(this);
            default: return false;
        }
    }

    // Asks Android (or opens the Settings page for it); the answer goes to window.__dtPerm2(which, ok)
    private void askPerm(String which) {
        int code = Arrays.asList(PERMS).indexOf(which);
        if (hasPerm(which) || (code < 0 && !"usage".equals(which))) { perm2(which); return; }
        if ("usage".equals(which)) {
            settingsFor = which;
            try { startActivity(new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)); } catch (Exception e) { settingsFor = null; perm2(which); }
            return;
        }
        String[] p = "calendar".equals(which) ? new String[]{Manifest.permission.READ_CALENDAR}
                : "steps".equals(which) ? new String[]{Manifest.permission.ACTIVITY_RECOGNITION}
                : "locationAlways".equals(which) && granted(Manifest.permission.ACCESS_FINE_LOCATION) ? new String[]{Manifest.permission.ACCESS_BACKGROUND_LOCATION}
                : new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION}; // Android 12+ wants both
        requestPermissions(p, REQ_PERM + code);
    }

    private void perm2(String which) { js("window.__dtPerm2&&__dtPerm2(" + JSONObject.quote(which) + "," + hasPerm(which) + ")"); }

    // One fresh location (GPS, else the network's), or null after 20 seconds
    @SuppressWarnings({"deprecation", "MissingPermission"})
    private void here() {
        LocationManager lm = getSystemService(LocationManager.class);
        boolean fine = granted(Manifest.permission.ACCESS_FINE_LOCATION);
        String p = fine && lm.isProviderEnabled(LocationManager.GPS_PROVIDER) ? LocationManager.GPS_PROVIDER
                : lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER) ? LocationManager.NETWORK_PROVIDER : null;
        if (p == null || (!fine && !granted(Manifest.permission.ACCESS_COARSE_LOCATION))) { hereDone(null); return; }
        AtomicBoolean done = new AtomicBoolean();
        CancellationSignal cancel = new CancellationSignal();
        LocationListener l = new LocationListener() {
            public void onLocationChanged(Location x) { if (done.compareAndSet(false, true)) hereDone(x); }
            public void onStatusChanged(String s, int st, Bundle b) { } // abstract before Android 11
            public void onProviderEnabled(String s) { }
            public void onProviderDisabled(String s) { }
        };
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            if (!done.compareAndSet(false, true)) return;
            cancel.cancel();
            lm.removeUpdates(l);
            hereDone(null);
        }, 20000);
        try {
            if (Build.VERSION.SDK_INT >= 30) lm.getCurrentLocation(p, cancel, getMainExecutor(), x -> { if (done.compareAndSet(false, true)) hereDone(x); });
            else lm.requestSingleUpdate(p, l, Looper.getMainLooper());
        } catch (Exception e) { if (done.compareAndSet(false, true)) hereDone(null); }
    }

    private void hereDone(Location x) {
        String j = "null";
        if (x != null) try { j = new JSONObject().put("lat", x.getLatitude()).put("lon", x.getLongitude()).put("acc", x.getAccuracy()).toString(); }
        catch (Exception ignored) { }
        js("window.__dtHere&&__dtHere(" + j + ")");
    }

    private boolean onWifi() {
        ConnectivityManager cm = getSystemService(ConnectivityManager.class);
        NetworkCapabilities n = cm.getActiveNetwork() == null ? null : cm.getNetworkCapabilities(cm.getActiveNetwork());
        return n != null && n.hasTransport(NetworkCapabilities.TRANSPORT_WIFI);
    }

    // Wake-on-LAN: the magic packet (6 x FF, then the MAC 16 times) to every broadcast address on the Wi-Fi, ports 9 and 7, three times
    private boolean wol(String mac) {
        if (mac == null || !mac.trim().matches("([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}") || !onWifi()) return false;
        String[] h = mac.trim().split("[:-]");
        byte[] pkt = new byte[102];
        for (int i = 0; i < 6; i++) pkt[i] = (byte) 0xFF;
        for (int i = 6; i < pkt.length; i++) pkt[i] = (byte) Integer.parseInt(h[i % 6], 16);
        ArrayList<InetAddress> to = new ArrayList<>();
        try {
            to.add(InetAddress.getByName("255.255.255.255"));
            ConnectivityManager cm = getSystemService(ConnectivityManager.class);
            LinkProperties lp = cm.getLinkProperties(cm.getActiveNetwork());
            if (lp != null) for (LinkAddress a : lp.getLinkAddresses()) {
                if (!(a.getAddress() instanceof Inet4Address)) continue;
                byte[] b = a.getAddress().getAddress(); // the subnet's broadcast: every host bit set
                for (int i = 0; i < 4; i++) b[i] |= (byte) (0xFF >> Math.max(0, Math.min(8, a.getPrefixLength() - 8 * i)));
                to.add(InetAddress.getByAddress(b));
            }
        } catch (Exception ignored) { }
        new Thread(() -> {
            try (DatagramSocket s = new DatagramSocket()) {
                s.setBroadcast(true);
                for (int k = 0; k < 3; k++) {
                    for (InetAddress a : to) for (int port : new int[]{9, 7})
                        try { s.send(new DatagramPacket(pkt, pkt.length, a, port)); } catch (Exception ignored) { }
                    Thread.sleep(300);
                }
            } catch (Exception ignored) { }
        }).start();
        return true;
    }

    private boolean granted(String p) { return checkSelfPermission(p) == PackageManager.PERMISSION_GRANTED; }

    private void js(String code) { runOnUiThread(() -> web.evaluateJavascript(code, null)); }

    private void emit(String kind, String data) {
        js("window.__dtSpeech&&__dtSpeech(" + JSONObject.quote(kind) + "," + str(data) + ")");
    }

    private static String str(String s) { return s == null ? "null" : JSONObject.quote(s); }

    private void startListening() {
        if (speech == null) {
            speech = SpeechRecognizer.createSpeechRecognizer(this);
            speech.setRecognitionListener(new RecognitionListener() {
                public void onReadyForSpeech(Bundle b) { }
                public void onBeginningOfSpeech() { }
                public void onRmsChanged(float v) { }
                public void onBufferReceived(byte[] b) { }
                public void onEndOfSpeech() { }
                public void onEvent(int t, Bundle b) { }

                public void onPartialResults(Bundle b) {
                    String t = first(b);
                    if (speechInterim && t != null && !t.isEmpty()) emit("partial", t);
                }

                public void onResults(Bundle b) {
                    String t = first(b);
                    if (t != null && !t.isEmpty()) emit("final", t);
                    else emit("error", "no-speech");
                    emit("end", null);
                }

                public void onError(int e) {
                    emit("error", e == SpeechRecognizer.ERROR_NO_MATCH || e == SpeechRecognizer.ERROR_SPEECH_TIMEOUT ? "no-speech"
                            : e == SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS ? "not-allowed" : "network");
                    emit("end", null);
                }
            });
        }
        Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
                .putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                .putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        if (!speechLang.isEmpty()) i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, speechLang);
        speech.startListening(i);
    }

    private static String first(Bundle b) {
        ArrayList<String> r = b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        return r == null || r.isEmpty() ? null : r.get(0);
    }

    // What the page can call (window.DayTrackNative). These run off the main thread.
    private class Bridge {
        @JavascriptInterface public String id() { return Poller.id(MainActivity.this); }

        @JavascriptInterface public void setServer(String url) { Poller.prefs(MainActivity.this).edit().putString("server", url).apply(); }

        @JavascriptInterface public void wakeAt(String json) {
            Poller.prefs(MainActivity.this).edit().putString("times", json).apply();
            Poller.schedule(MainActivity.this);
        }

        // The next daily bosses ([{at, until, title, body}]) ring like an alarm; stopBoss quiets one that's ringing
        @JavascriptInterface public void bosses(String json) { BossAlarm.set(MainActivity.this, json); }

        @JavascriptInterface public void stopBoss() { BossAlarm.stop(MainActivity.this); }

        @JavascriptInterface public boolean notifOn() { return getSystemService(NotificationManager.class).areNotificationsEnabled(); }

        @JavascriptInterface public void askNotif() {
            if (Build.VERSION.SDK_INT >= 33 && !granted(Manifest.permission.POST_NOTIFICATIONS))
                runOnUiThread(() -> requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, REQ_NOTIF));
            else js("window.__dtPerm&&__dtPerm(" + notifOn() + ")");
        }

        @JavascriptInterface public void show(String title, String body) { Poller.show(MainActivity.this, title, body, null, false, false, null); }

        @JavascriptInterface public String takeActions() {
            synchronized (ActionReceiver.class) {
                String a = Poller.prefs(MainActivity.this).getString("actions", "[]");
                Poller.prefs(MainActivity.this).edit().remove("actions").commit();
                return a;
            }
        }

        @JavascriptInterface public boolean hasSpeech() { return SpeechRecognizer.isRecognitionAvailable(MainActivity.this); }

        @JavascriptInterface public void listen(boolean interim, String lang) {
            runOnUiThread(() -> {
                speechInterim = interim;
                speechLang = lang == null ? "" : lang;
                if (granted(Manifest.permission.RECORD_AUDIO)) startListening();
                else requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, REQ_MIC);
            });
        }

        @JavascriptInterface public void stopListening() { runOnUiThread(() -> { if (speech != null) speech.stopListening(); }); }

        @JavascriptInterface public void cancelListening() {
            runOnUiThread(() -> { if (speech != null) speech.cancel(); emit("end", null); });
        }

        // This app's build number (the GitHub run number), to compare with the latest release
        @JavascriptInterface public int build() {
            try {
                PackageInfo p = getPackageManager().getPackageInfo(getPackageName(), 0);
                return Build.VERSION.SDK_INT >= 28 ? (int) p.getLongVersionCode() : p.versionCode;
            } catch (PackageManager.NameNotFoundException e) { return 0; }
        }

        // Progress goes to window.__dtUpdate(state, msg): "allow", "downloading", "installing" or "error"
        @JavascriptInterface public void update() {
            if (Build.VERSION.SDK_INT >= 26 && !getPackageManager().canRequestPackageInstalls()) {
                // Android first wants a yes to "install unknown apps" for DayTrack
                runOnUiThread(() -> {
                    try { startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getPackageName()))); }
                    catch (Exception ignored) { }
                });
                updateState("allow", null);
                return;
            }
            new Thread(MainActivity.this::downloadUpdate).start();
        }

        // All tasks for the home-screen widget, which picks today's itself
        @JavascriptInterface public void widget(String json) {
            Poller.prefs(MainActivity.this).edit().putString("widget", json).apply();
            DayWidget.refresh(MainActivity.this);
        }

        // Gwen's face for the widget, as a data: URL ("" removes it)
        @JavascriptInterface public void widgetFace(String dataUrl) {
            File f = new File(getFilesDir(), "widget_face.png");
            Bitmap b = dataUrl == null || dataUrl.isEmpty() ? null : Poller.bitmap(dataUrl);
            if (b == null) f.delete();
            else try (FileOutputStream o = new FileOutputStream(f)) { round(fit(b, 192)).compress(Bitmap.CompressFormat.PNG, 100, o); }
            catch (Exception ignored) { }
            DayWidget.refresh(MainActivity.this);
        }

        // What was shared into DayTrack as {"text","subject","image"}, once; "" when nothing
        @JavascriptInterface public String takeShare() { return share.getAndSet(""); }

        @JavascriptInterface public boolean canLock() {
            if (Build.VERSION.SDK_INT >= 30) return getSystemService(BiometricManager.class).canAuthenticate(
                    BiometricManager.Authenticators.BIOMETRIC_WEAK | BiometricManager.Authenticators.DEVICE_CREDENTIAL) == BiometricManager.BIOMETRIC_SUCCESS;
            return Build.VERSION.SDK_INT >= 28 && getSystemService(KeyguardManager.class).isDeviceSecure();
        }

        // Fingerprint (or the phone's PIN where Android allows it); the answer goes to window.__dtUnlock(ok)
        @JavascriptInterface public void unlock() {
            if (Build.VERSION.SDK_INT < 28) { unlocked(false); return; }
            runOnUiThread(() -> {
                try {
                    BiometricPrompt.Builder b = new BiometricPrompt.Builder(MainActivity.this).setTitle("Unlock DayTrack").setSubtitle("Use your fingerprint");
                    if (Build.VERSION.SDK_INT >= 30) b.setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_WEAK | BiometricManager.Authenticators.DEVICE_CREDENTIAL);
                    else if (Build.VERSION.SDK_INT == 29) b.setDeviceCredentialAllowed(true);
                    else b.setNegativeButton("Cancel", getMainExecutor(), (d, w) -> unlocked(false));
                    b.build().authenticate(new CancellationSignal(), getMainExecutor(), new BiometricPrompt.AuthenticationCallback() {
                        @Override public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult r) { unlocked(true); }
                        @Override public void onAuthenticationError(int code, CharSequence msg) { unlocked(false); } // cancelled or locked out
                    });
                } catch (Exception e) { unlocked(false); }
            });
        }

        @JavascriptInterface public boolean setWallpaper(String dataUrl) {
            try {
                Bitmap b = Poller.bitmap(dataUrl);
                if (b == null) return false;
                WallpaperManager.getInstance(MainActivity.this).setBitmap(b, null, true, WallpaperManager.FLAG_SYSTEM);
                return true;
            } catch (Exception e) { return false; }
        }

        // ---- The phone's own: Wi-Fi wake-up, permissions, location, places, calendar, steps, screen time ----

        @JavascriptInterface public boolean onWifi() { return MainActivity.this.onWifi(); }

        // false at once for a bad MAC or when not on Wi-Fi; the packets go out in the background
        @JavascriptInterface public boolean wol(String mac) { return MainActivity.this.wol(mac); }

        // which: "location", "locationAlways", "calendar", "steps" or "usage"
        @JavascriptInterface public boolean hasPerm(String which) { return MainActivity.this.hasPerm(which); }

        @JavascriptInterface public void askPerm(String which) { runOnUiThread(() -> MainActivity.this.askPerm(which)); }

        // The answer goes to window.__dtHere({"lat","lon","acc"} or null)
        @JavascriptInterface public void here() { runOnUiThread(MainActivity.this::here); }

        // [{"id","lat","lon","radius","title","body"}] replaces every place reminder ("[]" clears them)
        @JavascriptInterface public void places(String json) { Phone.places(MainActivity.this, json == null ? "[]" : json); }

        // [{"title","start","end","allDay"}] from the phone's calendars
        @JavascriptInterface public String calendar(long fromMs, long toMs) { return Phone.calendar(MainActivity.this, fromMs, toMs); }

        // {"today": n, "days": {"YYYY-MM-DD": n}} or "null"
        @JavascriptInterface public String steps() { return Phone.steps(MainActivity.this); }

        // {"minutes": n, "apps": [{"name","minutes"}]} or "null"
        @JavascriptInterface public String usage() {
            JSONObject u = Phone.usage(MainActivity.this);
            return u == null ? "null" : u.toString();
        }

        // "21:00" sends today's screen time to Gwen once a day from then on; "" turns it off
        @JavascriptInterface public void setScreenCheckin(String hm, String key) {
            Poller.prefs(MainActivity.this).edit().putString("screenAt", hm == null ? "" : hm).putString("screenKey", key == null ? "" : key).apply();
            Poller.schedule(MainActivity.this);
        }
    }
}
