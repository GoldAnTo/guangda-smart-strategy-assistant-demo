package com.guangda.demo.service;

import org.springframework.stereotype.Service;

import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
public class TextEncodingRepairService {

    public String normalize(String text) {
        if (text == null || text.isBlank()) {
            return text == null ? "" : text;
        }
        return cleanup(text);
    }

    public String bestEffortDecode(byte[] bytes, Charset preferredCharset) {
        List<String> candidates = new ArrayList<>();
        candidates.add(cleanup(new String(bytes, preferredCharset)));
        candidates.add(cleanup(new String(bytes, StandardCharsets.UTF_8)));
        candidates.add(cleanup(new String(bytes, Charset.forName("GBK"))));
        candidates.add(cleanup(new String(bytes, Charset.forName("GB18030"))));
        candidates.add(cleanup(new String(bytes, StandardCharsets.ISO_8859_1)));

        String best = candidates.get(0);
        int bestScore = score(best);
        for (String candidate : candidates) {
            int currentScore = score(candidate);
            if (currentScore > bestScore) {
                best = candidate;
                bestScore = currentScore;
            }
        }

        if (looksMojibake(best)) {
            String repaired = cleanup(new String(best.getBytes(StandardCharsets.ISO_8859_1), StandardCharsets.UTF_8));
            if (score(repaired) > bestScore) {
                return repaired;
            }
        }
        return best;
    }

    public String sample(String text, int maxLen) {
        if (text == null) {
            return "";
        }
        String cleaned = text.replaceAll("\\s+", " ").trim();
        if (cleaned.length() <= maxLen) {
            return cleaned;
        }
        return cleaned.substring(0, maxLen);
    }

    private String cleanup(String text) {
        return text.replace("\uFEFF", "").trim();
    }

    private boolean looksMojibake(String text) {
        return text.indexOf('\uFFFD') >= 0
                || text.contains("锟")
                || text.contains("Ã")
                || text.contains("æ")
                || text.contains("ç")
                || text.contains("ï")
                || countQuestionMarks(text) >= 6;
    }

    private int countQuestionMarks(String text) {
        int count = 0;
        for (char ch : text.toCharArray()) {
            if (ch == '?') {
                count++;
            }
        }
        return count;
    }

    private int score(String text) {
        int score = 0;
        for (char ch : text.toCharArray()) {
            if (Character.UnicodeScript.of(ch) == Character.UnicodeScript.HAN) {
                score += 4;
            } else if (Character.isLetterOrDigit(ch)) {
                score += 1;
            }
            if (ch == '\uFFFD' || ch == '?') {
                score -= 3;
            }
        }
        if (looksMojibake(text)) {
            score -= 10;
        }
        return score;
    }
}
