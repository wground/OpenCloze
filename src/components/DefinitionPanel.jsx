import { useEffect } from 'react';
import { getWiktionaryUrl } from '../utils/wiktionary';
import './DefinitionPanel.css';

/**
 * DefinitionPanel Component
 * Displays dictionary definitions in a fixed right-side panel with embedded Wiktionary page
 *
 * @param {string} word - The word to look up
 * @param {Object|null} wordBankEntry - Word bank entry if word is in vocabulary
 * @param {Object} languageConfig - Language configuration with wiktionary code and name
 * @param {Function} onClose - Callback to close the panel
 */
export default function DefinitionPanel({ word, wordBankEntry, languageConfig, onClose }) {
  // Generate Wiktionary URL with language anchor
  const wiktionaryUrl = getWiktionaryUrl(word, languageConfig.name);

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
            <div className="wiktionary-header">
              <h3>Wiktionary</h3>
              <a
                href={wiktionaryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="external-link-small"
              >
                Open in new tab ↗
              </a>
            </div>
            <iframe
              src={wiktionaryUrl}
              className="wiktionary-iframe"
              title={`Wiktionary definition for ${word}`}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
