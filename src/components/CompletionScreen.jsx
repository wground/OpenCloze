import './CompletionScreen.css';

/**
 * CompletionScreen Component
 * Displays quiz completion summary
 *
 * @param {number} correctCount - Number of correct answers
 * @param {number} totalCount - Total number of questions
 * @param {Function} onReset - Callback to reset and try again
 * @param {Function} onLoadNew - Callback to load a different file
 */
export default function CompletionScreen({ correctCount, totalCount, onReset, onLoadNew }) {
  const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  let message = '';
  if (percentage >= 90) {
    message = 'Excellent work!';
  } else if (percentage >= 75) {
    message = 'Well done!';
  } else if (percentage >= 60) {
    message = 'Good effort!';
  } else {
    message = 'Keep practicing!';
  }

  return (
    <div className="completion-screen">
      <div className="completion-card">
        <h1 className="completion-title">Quiz Complete</h1>

        <div className="completion-stats">
          <div className="stat-item">
            <div className="stat-value">{correctCount}</div>
            <div className="stat-label">Correct</div>
          </div>
          <div className="stat-divider">·</div>
          <div className="stat-item">
            <div className="stat-value">{totalCount}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-divider">·</div>
          <div className="stat-item">
            <div className="stat-value">{percentage}%</div>
            <div className="stat-label">Score</div>
          </div>
        </div>

        <p className="completion-message">{message}</p>

        <div className="completion-actions">
          <button className="completion-button retry-button" onClick={onReset}>
            Try Again
          </button>
          <button className="completion-button new-button" onClick={onLoadNew}>
            Load New File
          </button>
        </div>
      </div>
    </div>
  );
}
