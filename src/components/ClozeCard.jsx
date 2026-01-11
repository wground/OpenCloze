import { useState, useEffect } from 'react';
import { createDisplaySentence } from '../utils/clozeGenerator';
import OptionButton from './OptionButton';
import './ClozeCard.css';

/**
 * ClozeCard Component
 * Displays a cloze question with blanks and answer options
 *
 * @param {Object} question - Question object with sentenceIndex, sentence, blanks
 * @param {number} currentBlankIndex - Index of the current blank being filled
 * @param {Set} filledBlanks - Set of blank indices that have been filled
 * @param {Array} options - Array of 4 answer options
 * @param {Function} onAnswer - Callback when answer is selected: (option) => void
 * @param {Function} onWordClick - Callback when word is clicked: (word) => void
 * @param {Function} onNext - Callback for next button: () => void
 */
export default function ClozeCard({
  question,
  currentBlankIndex,
  filledBlanks,
  options,
  onAnswer,
  onWordClick,
  onNext
}) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [answerState, setAnswerState] = useState(null); // 'correct' or 'incorrect'
  const [showNext, setShowNext] = useState(false);

  const { sentence, blanks } = question;
  const currentBlank = blanks[currentBlankIndex];
  const correctAnswer = currentBlank.wordEntry.word;

  // Reset state when blank changes
  useEffect(() => {
    setSelectedOption(null);
    setAnswerState(null);
    setShowNext(false);
  }, [currentBlankIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Number keys 1-4 for options
      if (e.key >= '1' && e.key <= '4' && !selectedOption) {
        const index = parseInt(e.key) - 1;
        if (index < options.length) {
          handleOptionClick(options[index]);
        }
      }

      // Enter for next
      if (e.key === 'Enter' && showNext) {
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [options, selectedOption, showNext, onNext]);

  const handleOptionClick = (option) => {
    if (selectedOption) return; // Already answered

    setSelectedOption(option);
    const isCorrect = option === correctAnswer;
    setAnswerState(isCorrect ? 'correct' : 'incorrect');

    // Call parent callback
    onAnswer(option);

    // Auto-advance after 1 second, or show Next button if last blank
    const isLastBlank = currentBlankIndex === blanks.length - 1;
    if (isLastBlank) {
      setShowNext(true);
    } else {
      setTimeout(() => {
        onNext();
      }, 1000);
    }
  };

  const handleWordClick = (word) => {
    // Don't open dictionary for blanks
    if (word.trim() === '_____') return;
    onWordClick(word);
  };

  // Create display segments
  const segments = createDisplaySentence(sentence, blanks, filledBlanks);

  return (
    <div className="cloze-card">
      <div className="sentence-display">
        {segments.map((segment, index) => {
          if (segment.type === 'text') {
            // Make text clickable word-by-word
            return (
              <span key={index}>
                {segment.content.split(/(\s+)/).map((part, i) => {
                  if (part.trim()) {
                    return (
                      <span
                        key={i}
                        className="clickable-word"
                        onClick={() => handleWordClick(part)}
                      >
                        {part}
                      </span>
                    );
                  }
                  return part; // Whitespace
                })}
              </span>
            );
          } else {
            // Blank
            const isCurrent = segment.blankIndex === currentBlankIndex;
            const isFilled = segment.filled;
            const isPast = segment.blankIndex < currentBlankIndex;

            let blankClass = 'blank';
            if (isCurrent) {
              blankClass += ' blank-current';
            } else if (isFilled || isPast) {
              blankClass += ' blank-filled';
            } else {
              blankClass += ' blank-upcoming';
            }

            return (
              <span key={index} className={blankClass}>
                {isCurrent ? '_____' : segment.word}
              </span>
            );
          }
        })}
      </div>

      <div className="options-container">
        <div className="options-grid">
          {options.map((option, index) => {
            let state = 'default';

            if (selectedOption) {
              if (option === selectedOption) {
                state = answerState; // 'correct' or 'incorrect'
              } else if (option === correctAnswer && answerState === 'incorrect') {
                state = 'correct'; // Show correct answer
              }
            }

            return (
              <OptionButton
                key={index}
                text={option}
                state={state}
                onClick={() => handleOptionClick(option)}
                disabled={selectedOption !== null}
                shortcut={index + 1}
              />
            );
          })}
        </div>

        {showNext && (
          <button className="next-button" onClick={onNext}>
            Next Question →
          </button>
        )}
      </div>

      <div className="blank-indicator">
        Blank {currentBlankIndex + 1} of {blanks.length}
      </div>
    </div>
  );
}
