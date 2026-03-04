# OpenCloze

A language-agnostic web application for language learning through contextual cloze (fill-in-the-blank) exercises.

## Features

- **Three Exercise Modes**: Reading passages, vocabulary practice, and grammar practice
- **Language-Agnostic**: Works with any language via configuration files
- **Morphologically-Aware Distractors**: Wrong answers match the grammatical form of the target word
- **File-Based**: Students upload `.md` files prepared by instructors
- **Wiktionary Integration**: Click any word for dictionary lookup
- **Progress Tracking**: Browser localStorage remembers progress per exercise
- **No Server Required**: Runs entirely in the browser

## Tech Stack

- **Framework**: React with Vite
- **Styling**: CSS with custom properties (dark academia aesthetic)
- **Storage**: Browser localStorage
- **Deployment**: GitHub Pages

## Getting Started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build
npm run deploy     # GitHub Pages
```

---

## Exercise Modes

OpenCloze supports three modes, set via the `mode:` field in the file header.

### Reading Mode (default)

A continuous passage with word-bank words turned into fill-in-the-blank questions presented in reading order. Includes Progressive Reveal (the passage reconstructs as blanks are filled).

### Vocab Practice Mode

Individual sentences presented one at a time in shuffled order. Each sentence has exactly one blank. Students choose from 4 options. The word's definition is shown briefly after each correct answer.

### Grammar Practice Mode

Identical interface to vocab mode. The distinction is in how distractors are chosen: wrong answers are different morphological forms of the **same root word** (e.g., blank is `duxit`, wrong answers are `ducit`, `ducet`, `ducere`). Instructors supply these distractors explicitly in the word bank.

---

## File Format

All exercise files are Markdown with two sections separated by `---`.

### Header

```
# Title Here
lang: de
mode: vocab
```

- `mode:` is optional and defaults to `reading`. Valid values: `reading`, `vocab`, `grammar`.
- `lang:` must match a file in `public/languages/`.

---

### Reading Mode File

```markdown
# Kafka, Ein altes Blatt
lang: de
mode: reading

Es ist, als wäre viel vernachlässigt worden in der Verteidigung
unseres Vaterlandes. Wir haben uns bisher nicht darum gekümmert
und sind unserer Arbeit nachgegangen...

---

## Wortschatz

vernachlässigt | verb | ptcp | | neglected
Verteidigung | noun | nom.sg | f | defence
nachgegangen | verb | ptcp | | went about
```

The passage is continuous text. Any word in the Wortschatz that appears in the passage becomes a blank.

---

### Vocab / Grammar Mode File

Each non-empty line in the passage section is one sentence containing **exactly one** blank marked with curly braces: `{word}`.

```markdown
# Vocab: German Daily Life
lang: de
mode: vocab

Die Katze sitzt auf dem {Dach} und schaut nach unten.
Er {liest} jeden Abend ein Buch vor dem Schlafen.
Wir gehen zusammen in die {Schule} am Morgen.

---

## Wortschatz

Dach  | noun | nom.sg | n | roof  | Haus, Tisch, Bett
liest | verb | pres.3sg | | reads
Schule | noun | acc.sg | f | school
```

Blank lines between sentences are ignored — only sentences with a `{word}` marker are used.

---

### Word Bank Fields

```
word | pos | form | grammar | definition | distractor1, distractor2, distractor3
```

| Field | Required | Description |
|---|---|---|
| word | Yes | Exact form as it appears in the sentence |
| pos | Yes | Part of speech (`verb`, `noun`, `adj`, …) |
| form | Yes | Morphological tag (`pres.3sg`, `acc.sg`, `pos.nom.f.sg`) |
| grammar | No | Extra info such as gender or declension class |
| definition | Yes | English gloss or translation |
| distractors | No | Three comma-separated wrong answers (see below) |

**Distractors (6th column)**

- **Vocab mode**: supply 3 different words with a similar role (e.g., `Haus, Tisch, Bett` for a noun blank). If omitted, the app draws from other word-bank entries, then from the language's fallback word lists.
- **Grammar mode**: supply 3 other forms of the **same root** (e.g., `ducit, ducet, ducere` for `duxit`). This is the key column for grammar exercises — always include it.
- If fewer than 3 are provided, the remaining slots are filled automatically.

**Grammar mode example**:

```markdown
# Grammar: Latin Verb Forms
lang: la
mode: grammar

Caesar copias in Galliam {duxit}.
Milites castra {ponunt} in colle.

---

## Wortschatz

duxit  | verb | perf.act.ind.3sg | | he led         | ducit, ducet, ducere
ponunt | verb | pres.act.ind.3pl | | they place     | ponebant, posuerunt, ponere
```

---

## For Instructors

### Quick-start checklist

1. Decide on a mode: `reading`, `vocab`, or `grammar`.
2. Write your sentences (one per line for vocab/grammar; a continuous passage for reading).
3. Mark each blank with `{word}`.
4. Write a Wortschatz entry for every blanked word.
5. For grammar mode, always fill in the 6th column with three alternative forms.
6. Set `lang:` to `de` or `la` (or add a new language config).
7. Test by uploading the file yourself before sharing with students.

### Tips

- Keep one blank per sentence in vocab/grammar mode — the parser expects exactly one `{...}` per line.
- For vocab mode, distractors should be plausible but clearly wrong in context; the app will auto-fill from the word bank if you omit them.
- For grammar mode, choose distractors from different tenses, persons, or cases of the same verb/noun to make the exercise grammatically meaningful.
- Reading mode works best with 15–25 target words spread across a substantial passage.

---

## Project Structure

```
opencloze/
├── public/
│   ├── languages/                          # Language configuration files
│   │   ├── de.md
│   │   └── la.md
│   └── sample-readings/
│       ├── OpenCloze DE Example Reading.md
│       ├── OpenCloze DE Example Vocab.md
│       ├── OpenCloze DE Example Grammar.md
│       ├── OpenCloze LA Example Reading.md
│       ├── OpenCloze LA Example Vocab.md
│       └── OpenCloze LA Example Grammar.md
├── src/
│   ├── components/
│   │   ├── ExerciseQuiz.jsx/css            # Vocab/grammar quiz orchestrator
│   │   ├── Quiz.jsx/css                    # Reading quiz orchestrator
│   │   ├── ClozeCard.jsx/css              # Reading sentence card
│   │   ├── OptionButton.jsx/css           # Multiple choice button
│   │   ├── ProgressBar.jsx/css            # Progress indicator
│   │   ├── CompletionScreen.jsx/css       # Final score
│   │   ├── DefinitionPanel.jsx/css        # Dictionary sidebar
│   │   ├── PassageReveal.jsx/css          # Progressive passage reveal
│   │   ├── Settings.jsx/css               # Reading mode settings
│   │   └── FileUpload.jsx/css             # File upload screen
│   ├── utils/
│   │   ├── parser.js                      # MD file parser (all modes)
│   │   ├── exerciseGenerator.js           # Vocab/grammar question generator
│   │   ├── clozeGenerator.js              # Reading question generator
│   │   ├── distractors.js                 # POS-matched distractor selection
│   │   ├── languageParser.js              # Language config parser
│   │   ├── storage.js                     # localStorage progress
│   │   └── wiktionary.js                  # Dictionary URL builder
│   ├── App.jsx                            # Root — routes by mode
│   └── main.jsx
└── vite.config.js
```

### Adding a New Language

1. Create `public/languages/[code].md` following the format of `de.md`.
2. Add the language code to the `languageCodes` array in `src/App.jsx`.
3. Include sentence delimiters, POS categories, morphological categories, and fallback word lists.

---

## License

MIT — free to use for educational purposes.
