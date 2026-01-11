/**
 * languageParser.js
 * Parses language configuration files (e.g., de.md, la.md)
 */

/**
 * Parse a language configuration file
 * @param {string} text - The markdown content of the language file
 * @returns {Object} Language configuration object
 */
export function parseLanguageConfig(text) {
  const sections = text.split(/\n---\n/);

  const config = {
    name: '',
    code: '',
    wiktionary: '',
    direction: 'ltr',
    sentenceDelimiters: [],
    posCategories: new Map(),
    morphCategories: new Map(),
    fallbackWords: new Map()
  };

  // Parse header section (first section)
  const headerSection = sections[0];
  const lines = headerSection.split('\n');

  for (const line of lines) {
    if (line.startsWith('# ')) {
      config.name = line.substring(2).trim();
    } else if (line.startsWith('code:')) {
      config.code = line.substring(5).trim();
    } else if (line.startsWith('wiktionary:')) {
      config.wiktionary = line.substring(11).trim();
    } else if (line.startsWith('direction:')) {
      config.direction = line.substring(10).trim();
    }
  }

  // Parse remaining sections
  for (let i = 1; i < sections.length; i++) {
    const section = sections[i].trim();

    if (section.includes('## Sentence Delimiters')) {
      config.sentenceDelimiters = parseSentenceDelimiters(section);
    } else if (section.includes('## POS Categories')) {
      config.posCategories = parsePOSCategories(section);
    } else if (section.includes('## Morphological Categories')) {
      config.morphCategories = parseMorphCategories(section);
    } else if (section.includes('## Fallback Words')) {
      config.fallbackWords = parseFallbackWords(section);
    }
  }

  return config;
}

/**
 * Parse the Sentence Delimiters section
 * @param {string} section - The section text
 * @returns {string[]} Array of delimiter characters
 */
function parseSentenceDelimiters(section) {
  const lines = section.split('\n').slice(1); // Skip header
  const delimiters = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('##')) {
      delimiters.push(trimmed);
    }
  }

  return delimiters;
}

/**
 * Parse the POS Categories section
 * @param {string} section - The section text
 * @returns {Map<string, string>} Map of POS tag to display name
 */
function parsePOSCategories(section) {
  const lines = section.split('\n').slice(1); // Skip header
  const categories = new Map();

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && trimmed.includes('|')) {
      const [tag, name] = trimmed.split('|').map(s => s.trim());
      categories.set(tag, name);
    }
  }

  return categories;
}

/**
 * Parse the Morphological Categories section
 * @param {string} section - The section text
 * @returns {Map<string, Object>} Map of POS to morphological structure
 *
 * Each POS maps to an object with level names as keys and arrays of values.
 * Example: Map { 'verb' => { tense: ['inf', 'pres', ...], person: ['1sg', '2sg', ...] } }
 */
function parseMorphCategories(section) {
  const lines = section.split('\n').slice(1); // Skip header
  const categories = new Map();

  let currentPOS = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('###')) {
      // New POS header
      currentPOS = trimmed.substring(3).trim();
      categories.set(currentPOS, {});
    } else if (trimmed && trimmed.includes(':') && currentPOS) {
      // Level line: "tense: inf, pres, past, ptcp, subj"
      const [level, valuesStr] = trimmed.split(':').map(s => s.trim());
      const values = valuesStr.split(',').map(s => s.trim());
      categories.get(currentPOS)[level] = values;
    }
  }

  return categories;
}

/**
 * Parse the Fallback Words section
 * @param {string} section - The section text
 * @returns {Map<string, string[]>} Map of form key to array of words
 *
 * Keys are hierarchical form tags like "verb.pres.3sg" or "noun.nom.sg"
 * Values are arrays of fallback words for that form
 */
function parseFallbackWords(section) {
  const lines = section.split('\n').slice(1); // Skip header
  const fallbackWords = new Map();

  let currentKey = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('###')) {
      // New form key header: "### verb.pres.3sg"
      currentKey = trimmed.substring(3).trim();
      fallbackWords.set(currentKey, []);
    } else if (trimmed && currentKey) {
      // Word entry
      fallbackWords.get(currentKey).push(trimmed);
    }
  }

  return fallbackWords;
}
