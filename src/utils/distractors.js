/**
 * distractors.js
 * Selects morphologically-appropriate distractor options for cloze questions
 */

/**
 * Select 4 answer options (3 distractors + 1 correct answer)
 * @param {Object} correctWord - The word bank entry for the correct answer
 * @param {Array} wordBank - Array of all word bank entries
 * @param {Map} fallbackWords - Map of form keys to fallback word arrays
 * @param {Set} usedWords - Set of words already used as blanks in this question
 * @returns {Array} Array of 4 shuffled word strings
 */
export function selectOptions(correctWord, wordBank, fallbackWords, usedWords) {
  const { word, pos, form } = correctWord;

  // Build progressive search keys from most specific to most general
  const searchKeys = buildSearchKeys(pos, form);

  // Collect candidates using progressive matching
  const candidates = collectCandidates(
    searchKeys,
    correctWord,
    wordBank,
    fallbackWords,
    usedWords
  );

  // Select 3 random distractors from candidates
  const distractors = selectRandomDistractors(candidates, 3);

  // Combine correct answer with distractors and shuffle
  const options = [...distractors, word];
  shuffleArray(options);

  return options;
}

/**
 * Build progressive search keys from most specific to most general
 * @param {string} pos - Part of speech
 * @param {string} form - Morphological form (dot-separated)
 * @returns {Array} Array of search keys, most specific first
 *
 * Example: pos="verb", form="past.3pl"
 * Returns: ["verb.past.3pl", "verb.past", "verb"]
 */
function buildSearchKeys(pos, form) {
  const keys = [];

  if (!form) {
    return [pos];
  }

  // Parse form into components
  const components = form.split('.');

  // Build keys progressively: start with full form, drop rightmost component each time
  for (let i = components.length; i > 0; i--) {
    const formPart = components.slice(0, i).join('.');
    keys.push(`${pos}.${formPart}`);
  }

  // Final fallback: just the POS
  keys.push(pos);

  return keys;
}

/**
 * Collect candidate words using progressive matching
 * @param {Array} searchKeys - Array of search keys (specific to general)
 * @param {Object} correctWord - The correct word entry
 * @param {Array} wordBank - Array of word bank entries
 * @param {Map} fallbackWords - Map of form keys to word arrays
 * @param {Set} usedWords - Set of words to exclude
 * @returns {Array} Array of candidate word strings
 */
function collectCandidates(searchKeys, correctWord, wordBank, fallbackWords, usedWords) {
  const candidates = new Set();
  const excludeWords = new Set([...usedWords, correctWord.word.toLowerCase()]);

  // Try each search key from most specific to most general
  for (const key of searchKeys) {
    // Collect from word bank
    for (const entry of wordBank) {
      if (excludeWords.has(entry.word.toLowerCase())) {
        continue;
      }

      if (formMatches(entry, key)) {
        candidates.add(entry.word);
      }
    }

    // Collect from fallback words
    if (fallbackWords.has(key)) {
      const fallbackList = fallbackWords.get(key);
      for (const word of fallbackList) {
        if (!excludeWords.has(word.toLowerCase())) {
          candidates.add(word);
        }
      }
    }

    // Stop if we have enough candidates
    if (candidates.size >= 3) {
      break;
    }
  }

  return Array.from(candidates);
}

/**
 * Check if a word entry's form matches a target search key
 * @param {Object} entry - Word bank entry with pos and form
 * @param {string} targetKey - Search key like "verb.past.3pl" or "verb.past" or "verb"
 * @returns {boolean} True if the entry matches the target key
 *
 * Matching logic:
 * - Exact match: entry "verb.past.3pl" matches key "verb.past.3pl"
 * - Starts-with match: entry "verb.past.3pl" matches key "verb.past"
 * - POS match: entry "verb.past.3pl" matches key "verb"
 */
function formMatches(entry, targetKey) {
  const { pos, form } = entry;

  // Build the full form key for this entry
  const entryKey = form ? `${pos}.${form}` : pos;

  // Exact match
  if (entryKey === targetKey) {
    return true;
  }

  // Starts-with match (more specific entry matches broader key)
  // e.g., "verb.past.3pl" starts with "verb.past"
  if (entryKey.startsWith(targetKey + '.')) {
    return true;
  }

  // POS-only match
  if (targetKey === pos) {
    return true;
  }

  return false;
}

/**
 * Select N random items from an array
 * @param {Array} array - Array to select from
 * @param {number} count - Number of items to select
 * @returns {Array} Array of selected items
 */
function selectRandomDistractors(array, count) {
  if (array.length <= count) {
    return [...array];
  }

  // Fisher-Yates shuffle to select random items
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
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
