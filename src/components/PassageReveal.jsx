import './PassageReveal.css';

/**
 * PassageReveal Component
 * Displays the passage with progressive reveal of sentences
 *
 * @param {Array} sentences - Array of sentence strings
 * @param {Set} revealedIndices - Set of sentence indices that should be revealed
 * @param {Array} paragraphBreaks - Array of sentence indices that end paragraphs
 * @param {Function} onWordClick - Callback when word is clicked: (word) => void
 */
export default function PassageReveal({ sentences, revealedIndices, paragraphBreaks, onWordClick }) {
  const isParagraphBreak = (index) => {
    return paragraphBreaks.includes(index);
  };

  const handleWordClick = (word) => {
    if (onWordClick) {
      onWordClick(word);
    }
  };

  return (
    <div className="passage-reveal">
      {sentences.map((sentence, index) => {
        const isRevealed = revealedIndices.has(index);
        const showParagraphBreak = isParagraphBreak(index) && index < sentences.length - 1;

        return (
          <span key={index}>
            <span className={`sentence ${isRevealed ? 'sentence-revealed' : 'sentence-hidden'}`}>
              {isRevealed ? (
                // Make revealed sentences clickable word-by-word
                sentence.split(/(\s+)/).map((part, i) => {
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
                })
              ) : (
                '· · ·'
              )}
            </span>
            {showParagraphBreak && <div className="paragraph-break" />}
            {!showParagraphBreak && !isParagraphBreak(index) && ' '}
          </span>
        );
      })}
    </div>
  );
}
