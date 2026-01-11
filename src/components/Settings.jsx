import './Settings.css';

/**
 * Settings Component
 * Displays quiz settings and actions
 *
 * @param {Object} settings - Settings object with boolean flags
 * @param {Function} onSettingsChange - Callback when settings change: (newSettings) => void
 * @param {Function} onReset - Callback to reset current reading progress
 * @param {Function} onClearProgress - Callback to load a different file
 * @param {string} readingTitle - Title of the current reading
 */
export default function Settings({
  settings,
  onSettingsChange,
  onReset,
  onClearProgress,
  readingTitle
}) {
  const handleToggle = (key) => {
    onSettingsChange({
      ...settings,
      [key]: !settings[key]
    });
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2 className="reading-title">{readingTitle}</h2>
      </div>

      <div className="settings-content">
        {/* Progressive Reveal Toggle */}
        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={settings.progressiveReveal || false}
              onChange={() => handleToggle('progressiveReveal')}
              className="setting-checkbox"
            />
            <span className="setting-text">Progressive Reveal Mode</span>
          </label>
          <p className="setting-description">
            Reveal passage sentences as you complete questions
          </p>
        </div>

        {/* Action Buttons */}
        <div className="settings-actions">
          <button
            className="action-button reset-button"
            onClick={onReset}
          >
            Reset Progress
          </button>

          <button
            className="action-button load-button"
            onClick={onClearProgress}
          >
            Load Different File
          </button>
        </div>
      </div>
    </div>
  );
}
