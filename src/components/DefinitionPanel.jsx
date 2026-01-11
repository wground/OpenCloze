import { useState, useEffect } from 'react';
import { lookupWord, getGoogleSearchUrl } from '../utils/wiktionary';
import './DefinitionPanel.css';

/**
 * DefinitionPanel Component
 * Displays dictionary definitions in a fixed right-side panel
 *
 * @param {string} word - The word to look up
 * @param {Object|null} wordBankEntry - Word bank entry if word is in vocabulary
 * @param {Object} languageConfig - Language configuration with wiktionary code and name
 * @param {Function} onClose - Callback to close the panel
 */
export default function DefinitionPanel({ word, wordBankEntry, languageConfig, onClose }) {
  const [wiktionaryData, setWiktionaryData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch from Wiktionary on mount
    const fetchDefinition = async () => {
      setLoading(true);
      const data = await lookupWord(
        word,
        languageConfig.wiktionary,
        languageConfig.name
      );
      setWiktionaryData(data);
      setLoading(false);
    };

    fetchDefinition();
  }, [word, languageConfig]);

  // Handle click outside to close (on overlay)
  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('definition-overlay')) {
      onClose();
    }
  };

  // Handle Escape key to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="definition-overlay" onClick={handleOverlayClick}>
      <div className="definition-panel">
        <div className="definition-header">
          <h2 className="definition-word">{word}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="definition-content">
          {/* Word Bank Entry Section */}
          {wordBankEntry && (
            <div className="section word-bank-section">
              <h3>Vocabulary Entry</h3>
              <div className="word-bank-info">
                <div className="info-row">
                  <span className="info-label">Part of Speech:</span>
                  <span className="info-value">{wordBankEntry.pos}</span>
                </div>
                {wordBankEntry.form && (
                  <div className="info-row">
                    <span className="info-label">Form:</span>
                    <span className="info-value">{wordBankEntry.form}</span>
                  </div>
                )}
                {wordBankEntry.grammar && (
                  <div className="info-row">
                    <span className="info-label">Grammar:</span>
                    <span className="info-value">{wordBankEntry.grammar}</span>
                  </div>
                )}
                <div className="info-row definition-row">
                  <span className="info-label">Definition:</span>
                  <span className="info-value">{wordBankEntry.definition}</span>
                </div>
              </div>
            </div>
          )}

          {/* Wiktionary Section */}
          <div className="section wiktionary-section">
            <h3>Dictionary</h3>

            {loading && (
              <div className="loading">Loading definitions...</div>
            )}

            {!loading && wiktionaryData && (
              <>
                <div className="definitions-list">
                  {wiktionaryData.definitions.slice(0, 3).map((def, index) => (
                    <div key={index} className="definition-item">
                      <span className="definition-pos">{def.pos}</span>
                      <span className="definition-text">{def.definition}</span>
                    </div>
                  ))}
                </div>
                <a
                  href={wiktionaryData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="external-link"
                >
                  View on Wiktionary →
                </a>
              </>
            )}

            {!loading && !wiktionaryData && (
              <div className="no-definitions">
                <p>No dictionary definitions found.</p>
                <a
                  href={getGoogleSearchUrl(word, languageConfig.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="external-link"
                >
                  Search on Web? →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
