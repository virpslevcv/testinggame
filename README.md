# Mooncake Moonlight

A small, bilingual Chinese character practice prototype for beginner readers.
Learners see Simplified Chinese characters with Mandarin pinyin, Cantonese
Jyutping, and English meanings, listen to the pronunciation, and try tracing or
writing each character. The story game is an illustrated visual novel with
shifting 3D-perspective backgrounds, a shaded anime-style 3D character, a flat
2D dialogue box, and short-answer story questions. Its protagonist, Mina Park,
is Korean, speaks English, has black hair with teal highlights and brown eyes,
and moves through the city as the story advances.

## How to run

On your computer, open `index.html` in a browser. This does not require opening
a port.

If you prefer to use a local server, run this from the game folder:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Then visit http://127.0.0.1:8000 on the same computer. You do not need to
change firewall or router settings. If port 8000 is already in use, use another
port, such as `8001`, and visit http://127.0.0.1:8001 instead.

To test on a Samsung phone, host the folder at a URL the phone can reach, then
open that URL in Samsung Internet or Chrome. The local-only address above is
for the computer itself; it will not open from the phone.

## Character practice

1. Look at a character, its Mandarin and Cantonese pronunciation, meaning, and an example word.
2. Use **🔊 Listen** to hear the English meaning and Chinese character/word in Mandarin and Cantonese-friendly speech when the browser supports it.
3. Choose **✍️ Practice Writing** to open the tracing area, or practise on paper.
   Writing can be skipped.
4. Continue at your own pace. There is no timer or score.

The current sample set is **月** (Mandarin: yuè, Cantonese: jyut6, moon), **人**
(Mandarin: rén, Cantonese: jan4, person), and **口** (Mandarin: kǒu,
Cantonese: hau2, mouth). Mandarin pronunciation is enlarged and tone marks are
highlighted. Use the **中 / EN** control to change language and the
character-font control to switch between serif and rounded sans-serif Chinese
text. The game opens directly to the story; use **Chinese character practice**
in the top controls to switch to writing practice.

## Visual novel

Select a companion, then complete the first reading prompt in English, Mandarin,
or Cantonese. The first prompt uses 月亮
(yuè liang / jyut6 loeng5) or “moon,” and can be replayed aloud. It is untimed,
allows retries, and is intended as low-pressure reading practice—not a
dyslexia assessment or treatment. The adventure uses illustrated backdrops,
Mina's anime-inspired expressions and poses, subtle speaking motion, and
pop-up questions.
Scene artwork shifts from the ruined city to the river archive and tower as the
story advances.

## Accessibility and device notes

- **Easy read** increases text size and spacing and reduces decorative motion to support dyslexic and low-vision reading.
- **Character font** switches Chinese characters between serif and rounded,
  bold sans-serif styles.
- **Listen** uses the browser's built-in speech synthesis when available. Speech
  voices and pronunciation depend on the device/browser language packs.
- Visual-novel motion respects the operating system's reduced-motion preference.
- The writing area supports touch, mouse, and stylus input on compatible devices.
  It is a freehand tracing space, not stroke-order instruction or automatic
  handwriting assessment.
- Layout and buttons adapt to narrow touch screens, including Samsung phones.
- This is an early learning prototype, not a dyslexia assessment or treatment.
  Test the wording, Chinese pronunciation, and readability with children,
  families, and educators before using it in a classroom.

No build step or app installation is required.
