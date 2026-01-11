# OpenCloze

A language-agnostic web application for language learning through contextual cloze (fill-in-the-blank) exercises.

## Features

- **Language-Agnostic**: Works with any language via configuration files
- **Morphologically-Aware Distractors**: Wrong answers match the grammatical form of the target word
- **File-Based**: Students upload `.md` files prepared by instructors
- **Multi-Blank Sentences**: Sentences with multiple vocabulary words show all blanks, filled sequentially
- **Wiktionary Integration**: Click any word for dictionary lookup
- **Progressive Reveal Mode**: Passage reconstructs as blanks are filled
- **Progress Tracking**: Browser localStorage remembers progress per reading
- **No Server Required**: Runs entirely in the browser

## Tech Stack

- **Framework**: React with Vite
- **Styling**: CSS with custom properties (dark academia aesthetic)
- **Dictionary**: Wiktionary API with Google fallback
- **Storage**: Browser localStorage
- **Deployment**: GitHub Pages

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Visit `http://localhost:5173` to use the application.

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Deploy to GitHub Pages

```bash
npm run deploy
```

## File Format Specifications

OpenCloze uses two types of Markdown files:

### 1. Language Configuration Files

Located in `public/languages/` directory.

**Filename convention**: `[language-code].md` (e.g., `de.md`, `la.md`)

**Structure**:

```markdown
# [Language Name]

code: [iso-code]
wiktionary: [wiktionary-language-code]
direction: [ltr|rtl]

---

## Sentence Delimiters

.
!
?

---

## POS Categories

verb | Verb
noun | Noun
adj | Adjective
adv | Adverb
prep | Preposition
conj | Conjunction
pron | Pronoun
art | Article
other | Other

---

## Morphological Categories

### verb
tense: inf, pres, past, ptcp, subj
person: 1sg, 2sg, 3sg, 1pl, 2pl, 3pl

### noun
case: nom, acc, dat, gen
number: sg, pl

---

## Fallback Words

### verb.pres.3sg
ist
hat
wird
...

### noun.nom.sg
Zeit
Jahr
Tag
...
```

**Key Sections**:

- **Header**: Language name, ISO code, Wiktionary code, text direction
- **Sentence Delimiters**: Characters that mark sentence boundaries
- **POS Categories**: Maps POS tags to display names
- **Morphological Categories**: Hierarchical form components for each POS
- **Fallback Words**: Common words organized by grammatical form for distractor generation

### 2. Reading Files

Reading files contain the passage and vocabulary for a single exercise.

**Structure**:

```markdown
# [Title]

lang: [language-code]

[Passage text with multiple paragraphs]

---

## Wortschatz

word | pos | form | grammar | definition
arbeitet | verb | pres.3sg | | works
Skulptur | noun | nom.sg | f | sculpture
schöne | adj | pos.nom.f.sg | | beautiful
...
```

**Word Bank Fields**:

| Field | Required | Description | Examples |
|-------|----------|-------------|----------|
| word | Yes | Exact form as in text | `arbeiteten`, `pulchram` |
| pos | Yes | Part of speech tag | `verb`, `noun`, `adj` |
| form | Yes | Hierarchical morphological tag | `past.3pl`, `pos.acc.f.sg` |
| grammar | No | Additional info (gender, declension) | `f`, `3rd`, `m.nom.sg` |
| definition | Yes | Gloss or translation | `they worked`, `beautiful` |

## How It Works

### Distractor Selection Algorithm

OpenCloze uses **progressive morphological matching** to select grammatically-appropriate wrong answers:

1. Parse form into components (e.g., `past.3pl` → `["past", "3pl"]`)
2. Build search keys from specific to general:
   - `verb.past.3pl`
   - `verb.past`
   - `verb`
3. Collect candidates at each level from word bank and fallback words
4. Stop when 3+ candidates found
5. Select 3 random distractors + correct answer, shuffle

**Example**:

```
Input: correctWord = {word: "arbeiteten", pos: "verb", form: "past.3pl"}

Search: "verb.past.3pl" → "verb.past" → "verb"
Candidates: ["machten", "gingen", "kamen", "sahen", ...]
Selected: ["arbeiteten", "machten", "gingen", "kamen"]
```

### Form Matching

A word's form matches a search key if:
- **Exact match**: `verb.past.3pl` matches `verb.past.3pl`
- **Starts-with match**: `verb.past.3pl` matches `verb.past`
- **POS match**: `verb.past.3pl` matches `verb`

This ensures distractors are as grammatically similar as possible to the correct answer.

## Usage Instructions

### For Students

1. **Upload a Reading File**: Drag and drop or click to browse for a `.md` file
2. **Complete the Exercises**:
   - Select the correct word to fill each blank
   - Use keyboard shortcuts (1-4) for faster answers
   - Click any word to look it up in the dictionary
3. **Track Your Progress**:
   - Progress is saved automatically
   - Return anytime to continue where you left off
4. **Review Your Score**: See your final accuracy when complete

### For Instructors

1. **Choose a Language**: Select from available language configs or create a new one
2. **Prepare a Passage**: Write or find authentic text in the target language
3. **Select Vocabulary**: Choose 15-25 words that students should know
4. **Create Word Bank**:
   - List each word with its exact form from the passage
   - Specify POS, morphological form, and definition
   - Include grammar notes if helpful (gender, declension, etc.)
5. **Format as Markdown**: Follow the reading file format specification
6. **Test the Exercise**: Upload and complete it yourself to verify difficulty

### Creating Language Files

To add a new language:

1. Create `public/languages/[code].md` following the language config format
2. Add the language code to `src/App.jsx` in the `languageCodes` array
3. Include:
   - Sentence delimiters appropriate for the language
   - POS categories used in your word banks
   - Morphological categories defining form hierarchies
   - 15-25 fallback words per common form for distractor generation

## Project Structure

```
opencloze/
├── public/
│   └── languages/          # Language configuration files
│       ├── de.md
│       └── la.md
├── sample-readings/        # Example reading files
│   ├── 02-griechische-skulptur.md
│   └── 04-gallia-divisa.md
├── src/
│   ├── components/         # React components
│   │   ├── ClozeCard.jsx
│   │   ├── CompletionScreen.jsx
│   │   ├── DefinitionPanel.jsx
│   │   ├── FileUpload.jsx
│   │   ├── OptionButton.jsx
│   │   ├── PassageReveal.jsx
│   │   ├── ProgressBar.jsx
│   │   ├── Quiz.jsx
│   │   └── Settings.jsx
│   ├── utils/              # Utility functions
│   │   ├── clozeGenerator.js
│   │   ├── distractors.js
│   │   ├── languageParser.js
│   │   ├── parser.js
│   │   ├── storage.js
│   │   └── wiktionary.js
│   ├── styles/
│   │   └── index.css       # Global styles
│   ├── App.jsx
│   └── main.jsx
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Actions deployment
└── vite.config.js
```

## Design Philosophy

**Dark Academia Aesthetic**: Inspired by classical libraries and scholarly pursuits, featuring warm golds, rich browns, and comfortable serif typography.

**Progressive Disclosure**: Information is revealed gradually to maintain focus and provide a sense of accomplishment.

**Accessibility First**: Keyboard navigation, focus states, and semantic HTML ensure the application is usable by everyone.

**No Server Required**: All processing happens in the browser, making deployment simple and keeping student data private.

## License

MIT License - feel free to use for educational purposes.

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## Acknowledgments

- Morphological categories inspired by traditional grammar references
- Dark academia aesthetic inspired by classical educational institutions
- Wiktionary for providing free dictionary APIs
