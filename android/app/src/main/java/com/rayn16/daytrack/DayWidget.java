package com.rayn16.daytrack;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.text.SpannableString;
import android.text.Spanned;
import android.text.style.StrikethroughSpan;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;

// Home-screen widget: today's tasks and Gwen's face. The page hands over all tasks (Bridge.widget) and the
// widget works out today's itself, so it stays right on later days without the app opening.
public class DayWidget extends AppWidgetProvider {
    private static final int[] ROWS = {R.id.row0, R.id.row1, R.id.row2, R.id.row3, R.id.row4, R.id.row5};

    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) { refresh(c); }

    static void refresh(Context c) {
        try {
            AppWidgetManager m = AppWidgetManager.getInstance(c);
            if (m == null) return; // no widgets on this device
            int[] ids = m.getAppWidgetIds(new ComponentName(c, DayWidget.class));
            if (ids.length > 0) m.updateAppWidget(ids, views(c));
        } catch (Exception ignored) { }
    }

    // A tap on Done (widget or notification): tick it here too so the widget shows it straight away
    static void done(Context c, String taskId) {
        SharedPreferences p = Poller.prefs(c);
        String today = Poller.day(0);
        try {
            JSONObject w = new JSONObject(p.getString("widget", "{}"));
            JSONArray tasks = w.optJSONArray("tasks");
            for (int i = 0; tasks != null && i < tasks.length(); i++) {
                JSONObject t = tasks.getJSONObject(i);
                if (!taskId.equals(t.optString("id"))) continue;
                JSONArray d = t.optJSONArray("done");
                if (d == null) t.put("done", d = new JSONArray());
                if (!has(d, today)) d.put(today);
            }
            p.edit().putString("widget", w.toString()).apply();
        } catch (Exception ignored) { }
        refresh(c);
    }

    private static RemoteViews views(Context c) throws Exception {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_day);
        PendingIntent open = PendingIntent.getActivity(c, 0, new Intent(c, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        v.setOnClickPendingIntent(R.id.head, open);
        Bitmap face = BitmapFactory.decodeFile(new File(c.getFilesDir(), "widget_face.png").getPath());
        if (face != null) v.setImageViewBitmap(R.id.face, face);
        else v.setImageViewResource(R.id.face, R.mipmap.ic_launcher);

        // Today's tasks, undone first
        String today = Poller.day(0);
        int dow = Calendar.getInstance().get(Calendar.DAY_OF_WEEK) - 1; // 0 = Sunday, like the page
        JSONArray all = new JSONObject(Poller.prefs(c).getString("widget", "{}")).optJSONArray("tasks");
        List<JSONObject> undone = new ArrayList<>(), done = new ArrayList<>();
        for (int i = 0; all != null && i < all.length(); i++) {
            JSONObject t = all.optJSONObject(i);
            if (t == null) continue;
            JSONArray d = t.optJSONArray("done"), days = t.optJSONArray("days");
            boolean isToday;
            if (t.optBoolean("recurring")) isToday = days == null || days.length() == 0 || hasDay(days, dow);
            else if (d != null && d.length() > 0) isToday = has(d, today);
            else isToday = t.isNull("date") || t.optString("date").isEmpty() || t.optString("date").compareTo(today) <= 0;
            if (isToday) (has(d, today) ? done : undone).add(t);
        }
        int total = undone.size() + done.size();
        v.setTextViewText(R.id.title, "Today · " + done.size() + "/" + total);
        undone.addAll(done);

        for (int r = 0; r < ROWS.length; r++) {
            int row = ROWS[r];
            v.setViewVisibility(row, r < Math.max(1, total) ? View.VISIBLE : View.GONE);
            if (total == 0 && r == 0) {
                v.setTextViewText(row, "Nothing today 💜");
                v.setTextColor(row, 0xFF888888);
                v.setOnClickPendingIntent(row, open);
            }
            if (r >= total) continue;
            JSONObject t = undone.get(r);
            String id = t.optString("id"), name = t.optString("name"), icon = t.optString("icon");
            if (has(t.optJSONArray("done"), today)) {
                SpannableString s = new SpannableString("✓ " + name);
                s.setSpan(new StrikethroughSpan(), 2, s.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
                v.setTextViewText(row, s);
                v.setTextColor(row, 0xFF9E9E9E);
                v.setOnClickPendingIntent(row, open);
            } else {
                // Image icons (data: URLs) can't show here, so just the name
                v.setTextViewText(row, "○ " + (icon.isEmpty() || icon.startsWith("data:") ? "" : icon + " ") + name);
                v.setTextColor(row, 0xFF222222);
                // Its own action and request code per row and task, so a tap never ticks the wrong one
                Intent tick = new Intent(c, ActionReceiver.class).setAction("widget")
                        .putExtra("action", "done").putExtra("taskId", id).putExtra("notifId", 0);
                v.setOnClickPendingIntent(row, PendingIntent.getBroadcast(c, id.hashCode() * 8 + r, tick,
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
            }
        }
        return v;
    }

    private static boolean has(JSONArray a, String s) {
        for (int i = 0; a != null && i < a.length(); i++) if (s.equals(a.optString(i))) return true;
        return false;
    }

    private static boolean hasDay(JSONArray a, int dow) {
        for (int i = 0; i < a.length(); i++) if (a.optInt(i, -1) == dow) return true;
        return false;
    }
}
