/**
 * wiktionary.js
 * Generates Wiktionary URLs for word lookups
 */

/**
 * Generate a Wiktionary URL for a word
 * @param {string} word - The word to look up
 * @param {string} languageName - Full language name (e.g., 'German', 'Latin')
 * @returns {string} Wiktionary URL with language anchor
 */
export function getWiktionaryUrl(word, languageName) {
  // Build URL with language section anchor for direct navigation
  const baseUrl = `https://en.wiktionary.org/wiki/${encodeURIComponent(word)}`;
  const anchor = `#${encodeURIComponent(languageName)}`;
  return baseUrl + anchor;
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
