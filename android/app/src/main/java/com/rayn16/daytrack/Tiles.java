package com.rayn16.daytrack;

import android.app.PendingIntent;
import android.content.Intent;
import android.os.Build;
import android.service.quicksettings.Tile;
import android.service.quicksettings.TileService;

// Quick Settings tiles: "Add task" and "Talk to Gwen" open DayTrack straight there
public class Tiles {
    public static class Add extends TileService {
        @Override public void onStartListening() { ready(this); }
        @Override public void onClick() { open(this, new Intent(this, MainActivity.class).putExtra("tile", "add"), 5); }
    }

    public static class Gwen extends TileService {
        @Override public void onStartListening() { ready(this); }
        @Override public void onClick() { open(this, new Intent(this, MainActivity.class).putExtra("gwen", true), 6); }
    }

    private static void ready(TileService s) {
        Tile t = s.getQsTile();
        if (t != null) { t.setState(Tile.STATE_INACTIVE); t.updateTile(); }
    }

    @SuppressWarnings("deprecation")
    private static void open(TileService s, Intent i, int code) {
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        if (Build.VERSION.SDK_INT >= 34) s.startActivityAndCollapse(PendingIntent.getActivity(s, code, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        else s.startActivityAndCollapse(i);
    }
}
