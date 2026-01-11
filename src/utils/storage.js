/**
 * storage.js
 * Manages progress persistence using browser localStorage
 */

const STORAGE_KEY = 'opencloze-progress';

/**
 * Generate a unique file ID from title and content
 * @param {string} title - The reading title
 * @param {string} content - The file content
 * @returns {string} Unique file identifier
 */
export function generateFileId(title, content) {
  // Create a simple hash from title and content
  const combined = `${title}:${content}`;
  let hash = 0;

  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Return as positive hex string
  return Math.abs(hash).toString(36);
}

/**
 * Save progress for a reading file
 * @param {string} fileId - Unique file identifier
 * @param {Object} progress - Progress object
 * @param {number} progress.currentQuestionIndex - Index of current question
 * @param {number} progress.currentBlankIndex - Index of current blank within question
 * @param {Array} progress.answers - Array of answer records
 */
export function saveProgress(fileId, progress) {
  try {
    // Load existing progress data
    const allProgress = loadAllProgress();

    // Update progress for this file
    allProgress[fileId] = {
      ...progress,
      lastAccessed: new Date().toISOString()
    };

    // Save back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allProgress));
  } catch (error) {
    console.error('Failed to save progress:', error);
  }
}

/**
 * Load progress for a reading file
 * @param {string} fileId - Unique file identifier
 * @returns {Object|null} Progress object or null if not found
 */
export function loadProgress(fileId) {
  try {
    const allProgress = loadAllProgress();
    return allProgress[fileId] || null;
  } catch (error) {
    console.error('Failed to load progress:', error);
    return null;
  }
}

/**
 * Clear progress for a specific reading file
 * @param {string} fileId - Unique file identifier
 */
export function clearProgress(fileId) {
  try {
    const allProgress = loadAllProgress();
    delete allProgress[fileId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allProgress));
  } catch (error) {
    console.error('Failed to clear progress:', error);
  }
}

/**
 * Clear all progress data
 */
export function clearAllProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear all progress:', error);
  }
}

/**
 * Load all progress data from localStorage
 * @returns {Object} Object mapping file IDs to progress objects
 */
function loadAllProgress() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Failed to parse progress data:', error);
    return {};
  }
}
