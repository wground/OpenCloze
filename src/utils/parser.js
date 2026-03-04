/**
 * parser.js
 * Parses reading files containing passages and vocabulary
 */

/**
 * Parse a reading file
 * @param {string} text - The markdown content of the reading file
 * @param {Object} languageConfig - The language configuration with sentenceDelimiters
 * @returns {Object} Reading data object
 */
export function parseReading(text, languageConfig) {
  const sections = text.split(/\n---\n/);

  const data = {
    title: '',
    lang: '',
    mode: 'reading',
    sentences: [],
    paragraphBreaks: [],
    exerciseSentences: [],
    wordBank: [],
    wordBankMap: new Map()
  };

  // Parse header and passage section (first section)
  const headerAndPassage = sections[0];
  const lines = headerAndPassage.split('\n');

  let passageLines = [];
  let readingPassage = false;

  for (const line of lines) {
    if (line.startsWith('# ')) {
      data.title = line.substring(2).trim();
    } else if (line.startsWith('lang:')) {
      data.lang = line.substring(5).trim();
      readingPassage = true; // After lang field, rest is passage
    } else if (line.startsWith('mode:')) {
      data.mode = line.substring(5).trim() || 'reading';
    } else if (readingPassage && line.trim()) {
      passageLines.push(line.trim());
    } else if (readingPassage && !line.trim() && passageLines.length > 0) {
      // Empty line indicates paragraph break
      passageLines.push(''); // Keep track of empty lines
    }
  }

  if (data.mode === 'reading') {
    // Split passage into sentences and track paragraph breaks
    const { sentences, paragraphBreaks } = splitIntoSentences(
      passageLines,
      languageConfig.sentenceDelimiters
    );
    data.sentences = sentences;
    data.paragraphBreaks = paragraphBreaks;
  } else {
    // vocab or grammar mode: parse as individual exercise sentences
    data.exerciseSentences = parseExerciseSentences(passageLines);
  }

  // Parse word bank section (second section if exists)
  if (sections.length > 1) {
    const wordBankSection = sections[1];
    data.wordBank = parseWordBank(wordBankSection);

    // Create wordBankMap with lowercase keys
    for (const entry of data.wordBank) {
      const key = entry.word.toLowerCase();
      data.wordBankMap.set(key, entry);
    }
  }

  return data;
}

/**
 * Parse exercise sentences for vocab/grammar modes
 * Each non-empty line is a sentence containing exactly one {word} blank
 * @param {string[]} lines - Array of passage lines
 * @returns {Array} Array of {sentence, blankWord, blankPosition} objects
 */
function parseExerciseSentences(lines) {
  const exerciseSentences = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Find the blank marked with {word}
    const blankMatch = trimmed.match(/\{([^}]+)\}/);
    if (!blankMatch) continue;

    const blankWord = blankMatch[1];
    const blankPosition = blankMatch.index;

    // Replace {word} with the actual word to get the natural sentence
    const sentence = trimmed.replace(`{${blankWord}}`, blankWord);

    exerciseSentences.push({ sentence, blankWord, blankPosition });
  }

  return exerciseSentences;
}

/**
 * Split passage into sentences and track paragraph breaks
 * @param {string[]} paragraphLines - Array of paragraph lines (empty strings mark breaks)
 * @param {string[]} delimiters - Array of sentence delimiter characters
 * @returns {Object} Object with sentences array and paragraphBreaks array
 */
function splitIntoSentences(paragraphLines, delimiters) {
  const sentences = [];
  const paragraphBreaks = [];

  let currentParagraphText = '';

  for (let i = 0; i < paragraphLines.length; i++) {
    const line = paragraphLines[i];

    if (!line) {
      // Empty line - paragraph break
      if (currentParagraphText.trim()) {
        const paragraphSentences = splitTextIntoSentences(
          currentParagraphText.trim(),
          delimiters
        );
        sentences.push(...paragraphSentences);

        // Mark paragraph break after the last sentence of this paragraph
        if (sentences.length > 0) {
          paragraphBreaks.push(sentences.length - 1);
        }

        currentParagraphText = '';
      }
    } else {
      // Add to current paragraph with space
      currentParagraphText += (currentParagraphText ? ' ' : '') + line;
    }
  }

  // Handle final paragraph if it doesn't end with empty line
  if (currentParagraphText.trim()) {
    const paragraphSentences = splitTextIntoSentences(
      currentParagraphText.trim(),
      delimiters
    );
    sentences.push(...paragraphSentences);

    // Mark final paragraph break
    if (sentences.length > 0) {
      paragraphBreaks.push(sentences.length - 1);
    }
  }

  return { sentences, paragraphBreaks };
}

/**
 * Split text into sentences based on delimiters
 * @param {string} text - Text to split
 * @param {string[]} delimiters - Array of delimiter characters
 * @returns {string[]} Array of sentences
 */
function splitTextIntoSentences(text, delimiters) {
  const sentences = [];
  let currentSentence = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    currentSentence += char;

    if (delimiters.includes(char)) {
      // Found a delimiter - end of sentence
      sentences.push(currentSentence.trim());
      currentSentence = '';
    }
  }

  // Add any remaining text as a sentence
  if (currentSentence.trim()) {
    sentences.push(currentSentence.trim());
  }

  return sentences;
}

/**
 * Parse the word bank section
 * @param {string} section - The word bank section text
 * @returns {Array} Array of word bank entries
 */
function parseWordBank(section) {
  const lines = section.split('\n');
  const wordBank = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip header lines and empty lines
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    // Parse pipe-delimited fields: word | pos | form | grammar | definition | distractors
    const fields = trimmed.split('|').map(s => s.trim());

    if (fields.length >= 5) {
      // Parse optional 6th column: comma-separated distractors
      let distractors = [];
      if (fields.length >= 6 && fields[5]) {
        distractors = fields[5].split(',').map(s => s.trim()).filter(s => s.length > 0);
      }

      wordBank.push({
        word: fields[0],
        pos: fields[1],
        form: fields[2],
        grammar: fields[3],
        definition: fields[4],
        distractors
      });
    }
  }

  return wordBank;
}
