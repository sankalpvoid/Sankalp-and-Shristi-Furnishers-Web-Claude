# Manufacturing sequence — source clips

The homepage sequence is built from the clips in this folder. **These are AI-generated placeholder
clips**, not footage of our workshop; replace them whenever better footage exists.

1. Copy the downloaded clips here (any name; numbering them `01-…`, `02-…` helps).
2. Edit `sequence.json`: list the files in playback order. Optional per clip: `start` / `end`
   (seconds to keep; `end: null` = to the end) and `crossfade` (seconds of dissolve into the next clip,
   `0` = hard cut; ignored on the last clip).
3. Run `npm run prepare:making`. It writes into `public/making/`:
   `sequence.mp4` (desktop), `sequence-sm.mp4` (phones), `poster.jpg` (first frame), `final.jpg` (last frame)
   and `sequence.meta.json`.
4. Set `enabled: true` in `src/config/making-sequence.ts`, commit `public/making/*` and push.

Needs `ffmpeg` and `ffprobe` on the PATH. The output is encoded with a keyframe every few frames so that
scrolling backwards is smooth; expect roughly 1–2 MB per second of footage for the desktop file.
The source clips are committed so they can be shared and rebuilt; keep each file under 100 MB (GitHub's push limit) and under 25 MB if you upload through the GitHub web page.
