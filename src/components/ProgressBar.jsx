import './ProgressBar.css';

/**
 * ProgressBar Component
 * Displays quiz progress with a visual bar and statistics
 *
 * @param {number} current - Current question number (1-indexed)
 * @param {number} total - Total number of questions
 * @param {number} correctCount - Number of correct answers so far
 */
export default function ProgressBar({ current, total, correctCount }) {
  // Calculate percentage for progress bar
  const percentage = total > 0 ? (current / total) * 100 : 0;

  // Calculate accuracy percentage
  const accuracyPercentage = current > 0 ? Math.round((correctCount / current) * 100) : 0;

  return (
    <div className="progress-bar-container">
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="progress-text">
        Question {current} of {total} · {accuracyPercentage}% correct
      </div>
    </div>
  );
}
