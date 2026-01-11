/**
 * clozeGenerator.js
 * Generates cloze questions from parsed reading data
 */

/**
 * Generate cloze questions from reading data
 * @param {Object} fileData - Parsed reading data with sentences and wordBankMap
 * @returns {Array} Array of question objects
 */
export function generateQuestions(fileData) {
  const { sentences, wordBankMap } = fileData;
  const questions = [];

  // Process each sentence to find word bank matches
  for (let sentenceIndex = 0; sentenceIndex < sentences.length; sentenceIndex++) {
    const sentence = sentences[sentenceIndex];
    const blanks = findBlanksInSentence(sentence, wordBankMap);

    // Only create a question if there are blanks in this sentence
    if (blanks.length > 0) {
      // Sort blanks by position (left to right in sentence)
      blanks.sort((a, b) => a.position - b.position);

      questions.push({
        sentenceIndex,
        sentence,
        blanks
      });
    }
  }

  // Shuffle questions (but not blanks within questions)
  shuffleArray(questions);

  return questions;
}

/**
 * Find all word bank matches in a sentence
 * @param {string} sentence - The sentence to search
 * @param {Map} wordBankMap - Map of lowercase words to word bank entries
 * @returns {Array} Array of blank objects
 */
function findBlanksInSentence(sentence, wordBankMap) {
  const blanks = [];
  const words = tokenizeSentence(sentence);

  for (const { word, position } of words) {
    const key = word.toLowerCase();

    if (wordBankMap.has(key)) {
      blanks.push({
        wordEntry: wordBankMap.get(key),
        wordInSentence: word,
        position
      });
    }
  }

  return blanks;
}

/**
 * Tokenize a sentence into words with their positions
 * @param {string} sentence - The sentence to tokenize
 * @returns {Array} Array of {word, position} objects
 */
function tokenizeSentence(sentence) {
  const tokens = [];
  let currentWord = '';
  let wordStart = 0;

  for (let i = 0; i < sentence.length; i++) {
    const char = sentence[i];

    if (isWordCharacter(char)) {
      if (currentWord === '') {
        wordStart = i;
      }
      currentWord += char;
    } else {
      if (currentWord) {
        tokens.push({
          word: currentWord,
          position: wordStart
        });
        currentWord = '';
      }
    }
  }

  // Add final word if sentence doesn't end with punctuation
  if (currentWord) {
    tokens.push({
      word: currentWord,
      position: wordStart
    });
  }

  return tokens;
}

/**
 * Check if a character is part of a word
 * @param {string} char - Character to check
 * @returns {boolean} True if character is part of a word
 */
function isWordCharacter(char) {
  // Letters, numbers, and common word characters (including accented characters)
  return /[\p{L}\p{N}-]/u.test(char);
}

/**
 * Create display segments for rendering a sentence with blanks
 * @param {string} sentence - The complete sentence
 * @param {Array} blanks - Array of blank objects (sorted by position)
 * @param {Set} filledBlanks - Set of blank indices that have been filled
 * @returns {Array} Array of segment objects for rendering
 *
 * Each segment is either:
 * - {type: 'text', content: string}
 * - {type: 'blank', blankIndex: number, word: string, filled: boolean}
 */
export function createDisplaySentence(sentence, blanks, filledBlanks) {
  const segments = [];
  let lastPosition = 0;

  for (let blankIndex = 0; blankIndex < blanks.length; blankIndex++) {
    const blank = blanks[blankIndex];
    const { wordInSentence, position } = blank;
    const wordEnd = position + wordInSentence.length;

    // Add text before this blank
    if (position > lastPosition) {
      const textBefore = sentence.substring(lastPosition, position);
      segments.push({
        type: 'text',
        content: textBefore
      });
    }

    // Add blank segment
    segments.push({
      type: 'blank',
      blankIndex,
      word: wordInSentence,
      filled: filledBlanks.has(blankIndex)
    });

    lastPosition = wordEnd;
  }

  // Add remaining text after last blank
  if (lastPosition < sentence.length) {
    const textAfter = sentence.substring(lastPosition);
    segments.push({
      type: 'text',
      content: textAfter
    });
  }

  return segments;
}

/**
 * Shuffle an array in place using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
