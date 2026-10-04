package com.rayn16.daytrack;

import android.content.pm.PackageManager;

import com.google.androidbrowserhelper.trusted.SharedPreferencesTokenStore;
import com.google.androidbrowserhelper.trusted.TwaLauncher;
import com.google.androidbrowserhelper.trusted.SessionStore;

/**
 * Opens DayTrack in Chrome even when another browser is the default: in Samsung Internet her
 * notifications arrive silently and the mic hears nothing. Falls back to the default without Chrome.
 */
public class LauncherActivity extends com.google.androidbrowserhelper.trusted.LauncherActivity {
    private static final String CHROME = "com.android.chrome";

    @Override
    protected TwaLauncher createTwaLauncher() {
        if (!hasChrome()) return super.createTwaLauncher();
        return new TwaLauncher(this, CHROME, SessionStore.makeSessionId(getTaskId()),
                new SharedPreferencesTokenStore(this));
    }

    private boolean hasChrome() {
        try {
            return getPackageManager().getApplicationInfo(CHROME, 0).enabled;
        } catch (PackageManager.NameNotFoundException e) {
            return false;
        }
    }
}
