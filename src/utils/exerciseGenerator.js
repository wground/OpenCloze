/**
 * exerciseGenerator.js
 * Generates shuffled multiple-choice questions for vocab and grammar exercise modes
 */

/**
 * Generate exercise questions from parsed vocab/grammar file data
 * @param {Object} fileData - Parsed file data with exerciseSentences, wordBankMap, wordBank, mode
 * @param {Map} fallbackWords - Map from language config with fallback word lists
 * @returns {Array} Array of question objects, shuffled
 */
export function generateExerciseQuestions(fileData, fallbackWords) {
  const { exerciseSentences, wordBankMap, wordBank, mode } = fileData;

  // Shuffle a copy of sentences (Fisher-Yates)
  const shuffled = [...exerciseSentences];
  shuffleArray(shuffled);

  const questions = [];

  for (const item of shuffled) {
    const { sentence, blankWord, blankPosition } = item;

    // Look up the word entry (case-insensitive)
    const wordEntry = wordBankMap.get(blankWord.toLowerCase());

    // Generate 4 options (1 correct + 3 distractors)
    const options = buildOptions(blankWord, wordEntry, wordBank, fallbackWords, mode);

    questions.push({
      sentence,
      blankWord,
      blankPosition,
      wordEntry: wordEntry || null,
      options
    });
  }

  return questions;
}

/**
 * Build 4 answer options for a question
 * @param {string} correctWord - The correct answer word
 * @param {Object|null} wordEntry - The word bank entry (may be null)
 * @param {Array} wordBank - All word bank entries
 * @param {Map} fallbackWords - Fallback word map from language config
 * @param {string} mode - 'vocab' or 'grammar'
 * @returns {string[]} Shuffled array of exactly 4 option strings
 */
function buildOptions(correctWord, wordEntry, wordBank, fallbackWords, mode) {
  // Case 1: entry has 3 explicit distractors — use those directly
  if (wordEntry && wordEntry.distractors && wordEntry.distractors.length >= 3) {
    const options = [correctWord, ...wordEntry.distractors.slice(0, 3)];
    shuffleArray(options);
    return options;
  }

  // Case 2: partial or no explicit distractors — fill remaining slots
  const explicitDistractors = wordEntry && wordEntry.distractors ? [...wordEntry.distractors] : [];
  const needed = 3 - explicitDistractors.length;

  let additionalDistractors = [];

  if (mode === 'grammar') {
    // Grammar mode: draw from other entries' distractors sharing the same POS,
    // or from fallback words matching the same POS
    additionalDistractors = collectGrammarDistractors(
      correctWord,
      wordEntry,
      wordBank,
      fallbackWords,
      needed,
      explicitDistractors
    );
  } else {
    // Vocab mode: draw from other Wortschatz entry words (different words), then fallback
    additionalDistractors = collectVocabDistractors(
      correctWord,
      wordEntry,
      wordBank,
      fallbackWords,
      needed,
      explicitDistractors
    );
  }

  const distractors = [...explicitDistractors, ...additionalDistractors].slice(0, 3);
  const options = [correctWord, ...distractors];
  shuffleArray(options);
  return options;
}

/**
 * Collect distractors for vocab mode: other Wortschatz words, then POS-matched fallbacks
 */
function collectVocabDistractors(correctWord, wordEntry, wordBank, fallbackWords, needed, exclude) {
  const excludeSet = new Set([
    correctWord.toLowerCase(),
    ...exclude.map(w => w.toLowerCase())
  ]);

  const candidates = [];

  // Draw from other word bank entries (their word forms)
  for (const entry of wordBank) {
    if (candidates.length >= needed) break;
    if (!excludeSet.has(entry.word.toLowerCase())) {
      candidates.push(entry.word);
      excludeSet.add(entry.word.toLowerCase());
    }
  }

  // Fill remaining from fallback words (POS-matched if possible)
  if (candidates.length < needed && wordEntry) {
    const fallbackCandidates = getFallbackCandidates(wordEntry, fallbackWords, excludeSet);
    const remaining = needed - candidates.length;
    candidates.push(...fallbackCandidates.slice(0, remaining));
  }

  return candidates;
}

/**
 * Collect distractors for grammar mode: other entries' distractors sharing same POS, then fallbacks
 */
function collectGrammarDistractors(correctWord, wordEntry, wordBank, fallbackWords, needed, exclude) {
  const excludeSet = new Set([
    correctWord.toLowerCase(),
    ...exclude.map(w => w.toLowerCase())
  ]);

  const candidates = [];

  // Draw from other word bank entries' explicit distractors (same POS preferred)
  const targetPos = wordEntry ? wordEntry.pos : null;

  for (const entry of wordBank) {
    if (candidates.length >= needed) break;
    if (entry.word.toLowerCase() === correctWord.toLowerCase()) continue;
    if (!targetPos || entry.pos === targetPos) {
      for (const d of (entry.distractors || [])) {
        if (candidates.length >= needed) break;
        if (!excludeSet.has(d.toLowerCase())) {
          candidates.push(d);
          excludeSet.add(d.toLowerCase());
        }
      }
    }
  }

  // If still not enough, try distractors from any-POS entries
  if (candidates.length < needed) {
    for (const entry of wordBank) {
      if (candidates.length >= needed) break;
      if (entry.word.toLowerCase() === correctWord.toLowerCase()) continue;
      for (const d of (entry.distractors || [])) {
        if (candidates.length >= needed) break;
        if (!excludeSet.has(d.toLowerCase())) {
          candidates.push(d);
          excludeSet.add(d.toLowerCase());
        }
      }
    }
  }

  // Fill remaining from fallback words
  if (candidates.length < needed && wordEntry) {
    const fallbackCandidates = getFallbackCandidates(wordEntry, fallbackWords, excludeSet);
    const remaining = needed - candidates.length;
    candidates.push(...fallbackCandidates.slice(0, remaining));
  }

  return candidates;
}

/**
 * Get fallback candidate words from language config, matching POS as closely as possible
 * @param {Object} wordEntry - The correct word's entry
 * @param {Map} fallbackWords - Fallback words map from language config
 * @param {Set} excludeSet - Words to exclude (lowercase)
 * @returns {string[]} Candidate words from fallback lists
 */
function getFallbackCandidates(wordEntry, fallbackWords, excludeSet) {
  const { pos, form } = wordEntry;
  const candidates = [];

  // Build search keys from most specific to general (same logic as distractors.js)
  const searchKeys = [];
  if (form) {
    const components = form.split('.');
    for (let i = components.length; i > 0; i--) {
      searchKeys.push(`${pos}.${components.slice(0, i).join('.')}`);
    }
  }
  searchKeys.push(pos);

  for (const key of searchKeys) {
    if (fallbackWords.has(key)) {
      for (const word of fallbackWords.get(key)) {
        if (!excludeSet.has(word.toLowerCase())) {
          candidates.push(word);
          excludeSet.add(word.toLowerCase());
        }
      }
    }
    if (candidates.length >= 10) break; // Collect enough, caller will slice
  }

  return candidates;
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
