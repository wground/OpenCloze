import { useState, useEffect, useCallback } from 'react';
import { generateExerciseQuestions } from '../utils/exerciseGenerator';
import { generateFileId, saveProgress, loadProgress, clearProgress } from '../utils/storage';
import ProgressBar from './ProgressBar';
import OptionButton from './OptionButton';
import CompletionScreen from './CompletionScreen';
import DefinitionPanel from './DefinitionPanel';
import './ExerciseQuiz.css';

/**
 * ExerciseQuiz Component
 * Quiz orchestrator for vocab and grammar exercise modes.
 * Presents one sentence at a time with 4-option multiple choice.
 *
 * @param {Object} fileData - Parsed file data (mode, exerciseSentences, wordBankMap, etc.)
 * @param {Object} languageConfig - Language configuration
 * @param {Function} onReset - Callback to return to file upload screen
 */
export default function ExerciseQuiz({ fileData, languageConfig, onReset }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [incorrectOptions, setIncorrectOptions] = useState(new Set());
  const [answerState, setAnswerState] = useState(null); // 'correct' | null
  const [showDefinition, setShowDefinition] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [selectedWord, setSelectedWord] = useState(null);
  const [fileId, setFileId] = useState('');

  const modeLabel = fileData.mode === 'grammar' ? 'Grammar Practice' : 'Vocab Practice';

  // Generate questions and restore progress on mount
  useEffect(() => {
    const generated = generateExerciseQuestions(fileData, languageConfig.fallbackWords);
    setQuestions(generated);

    const id = generateFileId(fileData.title, JSON.stringify(fileData));
    setFileId(id);

    const saved = loadProgress(id);
    if (saved && saved.exerciseMode) {
      setCurrentIndex(saved.currentIndex || 0);
      setAnswers(saved.answers || []);
    }
  }, [fileData, languageConfig]);

  // Save progress whenever state changes
  useEffect(() => {
    if (questions.length > 0 && fileId) {
      saveProgress(fileId, {
        exerciseMode: true,
        currentIndex,
        answers
      });
    }
  }, [currentIndex, answers, questions, fileId]);

  const handleNext = useCallback(() => {
    setAnswerState(null);
    setIncorrectOptions(new Set());
    setShowDefinition(false);
    setIsFading(false);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setShowCompletion(true);
    }
  }, [currentIndex, questions.length]);

  const handleOptionClick = (option) => {
    if (answerState === 'correct' || incorrectOptions.has(option)) return;

    const currentQuestion = questions[currentIndex];
    const isCorrect = option === currentQuestion.blankWord;

    if (isCorrect) {
      setAnswerState('correct');
      setAnswers(prev => [...prev, {
        questionIndex: currentIndex,
        selectedOption: option,
        correctOption: currentQuestion.blankWord,
        isCorrect: true
      }]);

      // Show definition briefly, then advance
      setShowDefinition(true);
      setTimeout(() => setIsFading(true), 1200);
      setTimeout(() => handleNext(), 1700);
    } else {
      setIncorrectOptions(prev => new Set([...prev, option]));
    }
  };

  // Keyboard shortcuts: 1-4 for options
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (answerState === 'correct') return;
      if (e.key >= '1' && e.key <= '4') {
        const index = parseInt(e.key) - 1;
        if (questions[currentIndex] && index < questions[currentIndex].options.length) {
          handleOptionClick(questions[currentIndex].options[index]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [answerState, currentIndex, questions, incorrectOptions]);

  const handleWordClick = (word) => {
    const cleaned = word.replace(/[.,!?;:"""'']/g, '');
    const wordBankEntry = fileData.wordBankMap.get(cleaned.toLowerCase());
    setSelectedWord({ word: cleaned, wordBankEntry });
  };

  const handleResetProgress = () => {
    const generated = generateExerciseQuestions(fileData, languageConfig.fallbackWords);
    setQuestions(generated);
    setCurrentIndex(0);
    setAnswers([]);
    setIncorrectOptions(new Set());
    setAnswerState(null);
    setShowDefinition(false);
    setIsFading(false);
    setShowCompletion(false);
    if (fileId) clearProgress(fileId);
  };

  if (questions.length === 0) {
    return <div className="exercise-loading">Generating questions...</div>;
  }

  if (showCompletion) {
    const correctCount = answers.filter(a => a.isCorrect).length;
    return (
      <CompletionScreen
        correctCount={correctCount}
        totalCount={questions.length}
        onReset={handleResetProgress}
        onLoadNew={onReset}
      />
    );
  }

  const currentQuestion = questions[currentIndex];
  const { sentence, blankWord, blankPosition, wordEntry, options } = currentQuestion;
  const correctCount = answers.filter(a => a.isCorrect).length;

  // Render sentence with blank
  const beforeBlank = sentence.substring(0, blankPosition);
  const afterBlank = sentence.substring(blankPosition + blankWord.length);

  return (
    <div className="exercise-quiz-container">
      {/* Header bar: title + mode badge + controls */}
      <div className="exercise-header">
        <div className="exercise-header-left">
          <h2 className="exercise-title">{fileData.title}</h2>
          <span className={`exercise-mode-badge exercise-mode-${fileData.mode}`}>
            {modeLabel}
          </span>
        </div>
        <div className="exercise-header-actions">
          <button className="exercise-action-btn" onClick={handleResetProgress}>
            Reset
          </button>
          <button className="exercise-action-btn" onClick={onReset}>
            Load File
          </button>
        </div>
      </div>

      <ProgressBar
        current={currentIndex + 1}
        total={questions.length}
        correctCount={correctCount}
      />

      {/* Question card */}
      <div className="exercise-card">
        <div className="exercise-sentence">
          {/* Render clickable text before the blank */}
          {beforeBlank.split(/(\s+)/).map((part, i) => {
            if (part.trim()) {
              return (
                <span
                  key={`b${i}`}
                  className="clickable-word"
                  onClick={() => handleWordClick(part)}
                >
                  {part}
                </span>
              );
            }
            return part;
          })}

          {/* The blank */}
          <span className={`exercise-blank ${answerState === 'correct' ? 'exercise-blank-correct' : 'exercise-blank-active'}`}>
            {answerState === 'correct' ? blankWord : '_____'}
          </span>

          {/* Render clickable text after the blank */}
          {afterBlank.split(/(\s+)/).map((part, i) => {
            if (part.trim()) {
              return (
                <span
                  key={`a${i}`}
                  className="clickable-word"
                  onClick={() => handleWordClick(part)}
                >
                  {part}
                </span>
              );
            }
            return part;
          })}
        </div>

        {/* Definition reveal after correct answer */}
        {showDefinition && wordEntry && (
          <div className={`exercise-definition-reveal ${isFading ? 'fading-out' : ''}`}>
            <span className="exercise-def-word">{wordEntry.word}</span>
            {wordEntry.form && <span className="exercise-def-form">{wordEntry.form}</span>}
            <span className="exercise-def-meaning">{wordEntry.definition}</span>
          </div>
        )}

        {/* Answer options */}
        <div className={`exercise-options ${isFading ? 'fading-out' : ''}`}>
          {options.map((option, index) => {
            let state = 'default';
            let disabled = false;

            if (incorrectOptions.has(option)) {
              state = 'greyed';
              disabled = true;
            }

            if (answerState === 'correct') {
              state = option === blankWord ? 'correct' : 'default';
              disabled = true;
            }

            return (
              <OptionButton
                key={index}
                text={option}
                state={state}
                onClick={() => handleOptionClick(option)}
                disabled={disabled}
                shortcut={index + 1}
              />
            );
          })}
        </div>
      </div>

      {/* Dictionary panel */}
      {selectedWord && (
        <DefinitionPanel
          word={selectedWord.word}
          wordBankEntry={selectedWord.wordBankEntry}
          languageConfig={languageConfig}
          onClose={() => setSelectedWord(null)}
        />
      )}
    </div>
  );
}
