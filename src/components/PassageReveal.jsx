import './PassageReveal.css';

/**
 * PassageReveal Component
 * Displays the passage with progressive reveal of sentences
 *
 * @param {Array} sentences - Array of sentence strings
 * @param {Set} revealedIndices - Set of sentence indices that should be revealed
 * @param {Array} paragraphBreaks - Array of sentence indices that end paragraphs
 */
export default function PassageReveal({ sentences, revealedIndices, paragraphBreaks }) {
  const isParagraphBreak = (index) => {
    return paragraphBreaks.includes(index);
  };

  return (
    <div className="passage-reveal">
      {sentences.map((sentence, index) => {
        const isRevealed = revealedIndices.has(index);
        const showParagraphBreak = isParagraphBreak(index) && index < sentences.length - 1;

        return (
          <span key={index}>
            <span className={`sentence ${isRevealed ? 'sentence-revealed' : 'sentence-hidden'}`}>
              {isRevealed ? sentence : '· · ·'}
            </span>
            {showParagraphBreak && <div className="paragraph-break" />}
            {!showParagraphBreak && !isParagraphBreak(index) && ' '}
          </span>
        );
      })}
    </div>
  );
}
