package com.rayn16.daytrack;

import android.Manifest;
import android.app.Activity;
import android.app.NotificationManager;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
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

import java.util.ArrayList;

// DayTrack's own window: the web app from the APK's assets in a WebView, with the phone standing in
// for what Chrome used to give it (notifications, speech, file picker, location). See the
// window.DayTrackNative shim at the top of index.html for the other side.
public class MainActivity extends Activity {
    private static final String START = "https://appassets.androidplatform.net/assets/web/index.html";
    private static final int REQ_MIC = 1, REQ_NOTIF = 2, REQ_LOC = 3, REQ_FILE = 4;

    private WebView web;
    private SpeechRecognizer speech;
    private boolean speechInterim;
    private String speechLang = "";
    private ValueCallback<Uri[]> fileCallback;
    private GeolocationPermissions.Callback geoCallback;
    private String geoOrigin;

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
        web.loadUrl(getIntent().getBooleanExtra("gwen", false) ? START + "?tab=gwen" : START);
    }

    // A tap on Gwen's notification opens her chat
    @Override
    protected void onNewIntent(Intent i) {
        super.onNewIntent(i);
        if (i.getBooleanExtra("gwen", false)) web.evaluateJavascript("switchTab('gwen');pullGwenInbox();", null);
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
        web.evaluateJavascript("window.__dtResume&&__dtResume()", null);
        getSystemService(NotificationManager.class).cancel(Poller.GWEN_ID);
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
    }

    private boolean granted(String p) { return checkSelfPermission(p) == PackageManager.PERMISSION_GRANTED; }

    private void js(String code) { runOnUiThread(() -> web.evaluateJavascript(code, null)); }

    private void emit(String kind, String data) {
        js("window.__dtSpeech&&__dtSpeech(" + JSONObject.quote(kind) + "," + (data == null ? "null" : JSONObject.quote(data)) + ")");
    }

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

        @JavascriptInterface public boolean notifOn() { return getSystemService(NotificationManager.class).areNotificationsEnabled(); }

        @JavascriptInterface public void askNotif() {
            if (Build.VERSION.SDK_INT >= 33 && !granted(Manifest.permission.POST_NOTIFICATIONS))
                runOnUiThread(() -> requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, REQ_NOTIF));
            else js("window.__dtPerm&&__dtPerm(" + notifOn() + ")");
        }

        @JavascriptInterface public void show(String title, String body) { Poller.show(MainActivity.this, title, body, null, false); }

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
    }
}
