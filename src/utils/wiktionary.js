/**
 * wiktionary.js
 * Fetches dictionary definitions from Wiktionary using MediaWiki Action API
 */

const WIKTIONARY_API_BASE = 'https://en.wiktionary.org/w/api.php';
const TIMEOUT_MS = 5000; // 5 seconds

/**
 * Look up a word in Wiktionary
 * @param {string} word - The word to look up
 * @param {string} wiktionaryCode - Wiktionary language code (e.g., 'en', 'de', 'la')
 * @param {string} languageName - Full language name (e.g., 'German', 'Latin')
 * @returns {Promise<Object|null>} Object with definitions array and url, or null on error
 *
 * Return format:
 * {
 *   definitions: [{pos: string, definition: string}, ...],
 *   url: string
 * }
 */
export async function lookupWord(word, wiktionaryCode, languageName) {
  try {
    // Use MediaWiki Action API with CORS support
    const params = new URLSearchParams({
      action: 'parse',
      page: word,
      prop: 'wikitext',
      format: 'json',
      origin: '*' // Enable CORS
    });

    const url = `${WIKTIONARY_API_BASE}?${params}`;

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(url, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    // Check for API errors
    if (data.error) {
      return null;
    }

    // Extract wikitext
    const wikitext = data.parse?.wikitext?.['*'];
    if (!wikitext) {
      return null;
    }

    // Parse definitions from wikitext
    const definitions = parseWikitext(wikitext, languageName);

    if (definitions.length === 0) {
      return null;
    }

    // Build Wiktionary page URL
    const wiktionaryUrl = `https://en.wiktionary.org/wiki/${encodeURIComponent(word)}`;

    return {
      definitions,
      url: wiktionaryUrl
    };

  } catch (error) {
    // Return null on any error (network, timeout, parsing, etc.)
    return null;
  }
}

/**
 * Parse wikitext to extract definitions
 * @param {string} wikitext - Raw wikitext from API
 * @param {string} languageName - Language name to filter by
 * @returns {Array} Array of {pos, definition} objects
 */
function parseWikitext(wikitext, languageName) {
  const definitions = [];

  // Find the language section (e.g., ==German==, ==Latin==)
  const langRegex = new RegExp(`==${languageName}==([\\s\\S]*?)(?:==\\w+==|$)`, 'i');
  const langMatch = wikitext.match(langRegex);

  if (!langMatch) {
    return definitions;
  }

  const langSection = langMatch[1];

  // Extract POS sections and their definitions
  // Look for ===Noun===, ===Verb===, etc.
  const posRegex = /===([^=]+)===\s*([\s\S]*?)(?====|$)/g;
  let posMatch;

  while ((posMatch = posRegex.exec(langSection)) !== null) {
    const pos = posMatch[1].trim();
    const posContent = posMatch[2];

    // Skip non-POS sections like Etymology, Pronunciation, etc.
    const ignoredSections = ['etymology', 'pronunciation', 'alternative forms', 'declension', 'conjugation', 'usage notes', 'synonyms', 'antonyms', 'derived terms', 'related terms', 'see also', 'references', 'further reading'];
    if (ignoredSections.some(s => pos.toLowerCase().includes(s))) {
      continue;
    }

    // Extract definitions (lines starting with #)
    const defRegex = /^#\s*([^#\n][^\n]*)/gm;
    let defMatch;

    while ((defMatch = defRegex.exec(posContent)) !== null) {
      const definition = cleanDefinition(defMatch[1]);

      if (definition) {
        definitions.push({ pos, definition });

        // Limit to 3 definitions
        if (definitions.length >= 3) {
          return definitions;
        }
      }
    }
  }

  return definitions;
}

/**
 * Clean up a definition string by removing wikitext markup and extra whitespace
 * @param {string} definition - Raw definition string
 * @returns {string} Cleaned definition
 */
function cleanDefinition(definition) {
  // Remove HTML tags
  let cleaned = definition.replace(/<[^>]*>/g, '');

  // Remove wiki links: [[link|text]] -> text, [[link]] -> link
  cleaned = cleaned.replace(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g, '$1');

  // Remove template markers: {{template}}
  cleaned = cleaned.replace(/\{\{[^}]+\}\}/g, '');

  // Remove bold/italic markers
  cleaned = cleaned.replace(/'{2,}/g, '');

  // Remove reference tags like <ref>...</ref>
  cleaned = cleaned.replace(/<ref[^>]*>.*?<\/ref>/gi, '');

  // Replace multiple whitespace with single space
  cleaned = cleaned.replace(/\s+/g, ' ');

  // Trim
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Generate a Google search URL for a word
 * @param {string} word - The word to search for
 * @param {string} languageName - Language name (e.g., 'German', 'Latin')
 * @returns {string} Google search URL
 */
export function getGoogleSearchUrl(word, languageName) {
  const query = `${word} ${languageName} definition`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}
