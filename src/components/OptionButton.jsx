import './OptionButton.css';

/**
 * OptionButton Component
 * Displays an answer option button with different states
 *
 * @param {string} text - The option text to display
 * @param {string} state - Button state: 'default', 'selected', 'correct', 'incorrect'
 * @param {Function} onClick - Click handler
 * @param {boolean} disabled - Whether the button is disabled
 * @param {number} shortcut - Keyboard shortcut number (1-4)
 */
export default function OptionButton({ text, state, onClick, disabled, shortcut }) {
  const getClassName = () => {
    const classes = ['option-button'];

    if (state === 'correct') {
      classes.push('option-correct');
    } else if (state === 'incorrect') {
      classes.push('option-incorrect');
    } else if (state === 'selected') {
      classes.push('option-selected');
    }

    if (disabled && state === 'default') {
      classes.push('option-disabled');
    }

    return classes.join(' ');
  };

  return (
    <button
      className={getClassName()}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="option-text">{text}</span>
      {!disabled && state === 'default' && (
        <span className="option-shortcut">{shortcut}</span>
      )}
    </button>
  );
}
