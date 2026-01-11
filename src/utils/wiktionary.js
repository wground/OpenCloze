/**
 * wiktionary.js
 * Fetches dictionary definitions from Wiktionary API
 */

const WIKTIONARY_API_BASE = 'https://en.wiktionary.org/api/rest_v1/page/definition/';
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
    const url = `${WIKTIONARY_API_BASE}${encodeURIComponent(word)}`;

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    // Extract definitions for the specified language
    const definitions = extractDefinitions(data, languageName);

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
 * Extract definitions from Wiktionary API response
 * @param {Object} data - API response data
 * @param {string} languageName - Language name to filter by
 * @returns {Array} Array of {pos, definition} objects
 */
function extractDefinitions(data, languageName) {
  const definitions = [];

  // Wiktionary API returns language sections
  for (const langKey in data) {
    const langSection = data[langKey];

    // Check if this is the language we're looking for
    // The API uses language names as keys (e.g., "German", "Latin")
    if (langKey.toLowerCase() !== languageName.toLowerCase()) {
      continue;
    }

    // Each language section has POS entries
    if (Array.isArray(langSection)) {
      for (const posEntry of langSection) {
        const pos = posEntry.partOfSpeech || 'unknown';

        // Extract definitions from this POS entry
        if (Array.isArray(posEntry.definitions)) {
          for (const defEntry of posEntry.definitions) {
            if (defEntry.definition) {
              definitions.push({
                pos: pos,
                definition: cleanDefinition(defEntry.definition)
              });

              // Limit to 2-3 definitions as per spec
              if (definitions.length >= 3) {
                return definitions;
              }
            }
          }
        }
      }
    }
  }

  return definitions;
}

/**
 * Clean up a definition string by removing HTML tags and extra whitespace
 * @param {string} definition - Raw definition string
 * @returns {string} Cleaned definition
 */
function cleanDefinition(definition) {
  // Remove HTML tags
  let cleaned = definition.replace(/<[^>]*>/g, '');

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
