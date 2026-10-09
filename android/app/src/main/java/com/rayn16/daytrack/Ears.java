package com.rayn16.daytrack;

import org.json.JSONArray;
import org.json.JSONObject;
import org.vosk.Model;
import org.vosk.Recognizer;

import java.io.IOException;
import java.util.Arrays;
import java.util.regex.Pattern;

// The listening half of "Hey Gwen", with no Android in it so it can be checked on a PC.
// Feed it 0.1 s of 16 kHz mono audio at a time; it answers true when it heard "hey / hi / okay Gwen".
// The recognizer only knows her name and a few sound-alikes, so "hey when" or "hey wendy" lose to them.
class Ears {
    static final String GRAMMAR = "[\"hey gwen\", \"hi gwen\", \"okay gwen\", \"hey\", \"hi\", \"okay\", \"when\", \"again\", \"win\","
            + " \"quinn\", \"wendy\", \"went\", \"queen\", \"one\", \"then\", \"when are you\", \"[unk]\"]";
    static final double MIN_CONF = 0.9; // lower if she misses you, higher if she wakes up on her own
    private static final Pattern WAKE = Pattern.compile("\\b(hey|hi|okay) gwen\\b");

    private final Recognizer rec;
    private short[] prev = new short[0];
    private double floor = 200; // the room's usual loudness
    private int tail;           // chunks still to hear after the last loud one

    Ears(Model m) throws IOException {
        rec = new Recognizer(m, 16000f, GRAMMAR);
        rec.setWords(true);
    }

    boolean feed(short[] buf, int n) {
        double sum = 0;
        for (int i = 0; i < n; i++) sum += (double) buf[i] * buf[i];
        double rms = Math.sqrt(sum / Math.max(1, n));
        // A quiet room isn't decoded at all, which is most of the battery saving
        boolean loud = rms > floor * 3 + 150;
        floor += (rms - floor) * (loud ? 0.002 : 0.02);
        if (loud && tail == 0) rec.acceptWaveForm(prev, prev.length); // the start of the word
        if (loud) tail = 15;
        boolean hit = false;
        if (tail > 0) {
            tail--;
            String r = rec.acceptWaveForm(buf, n) ? rec.getResult() : tail == 0 ? rec.getFinalResult() : null;
            hit = r != null && heard(r);
        }
        prev = Arrays.copyOf(buf, n);
        if (hit) reset();
        return hit;
    }

    void reset() { rec.reset(); tail = 0; }

    void close() { rec.close(); }

    static boolean heard(String json) {
        try {
            JSONObject o = new JSONObject(json);
            if (!WAKE.matcher(o.optString("text")).find()) return false;
            JSONArray w = o.optJSONArray("result");
            for (int i = 0; w != null && i < w.length(); i++) {
                JSONObject x = w.getJSONObject(i);
                if ("gwen".equals(x.optString("word")) && x.optDouble("conf") >= MIN_CONF) return true;
            }
        } catch (Exception ignored) { }
        return false;
    }
}
