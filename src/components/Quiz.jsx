import { useState, useEffect } from 'react';
import { generateQuestions } from '../utils/clozeGenerator';
import { selectOptions } from '../utils/distractors';
import { generateFileId, saveProgress, loadProgress, clearProgress } from '../utils/storage';
import Settings from './Settings';
import ProgressBar from './ProgressBar';
import PassageReveal from './PassageReveal';
import ClozeCard from './ClozeCard';
import DefinitionPanel from './DefinitionPanel';
import CompletionScreen from './CompletionScreen';
import './Quiz.css';

/**
 * Quiz Component
 * Main quiz orchestrator - manages state and renders all quiz components
 *
 * @param {Object} fileData - Parsed reading data
 * @param {Object} languageConfig - Language configuration
 * @param {Function} onReset - Callback to reset and load a different file
 */
export default function Quiz({ fileData, languageConfig, onReset }) {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentBlankIndex, setCurrentBlankIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [settings, setSettings] = useState({ progressiveReveal: true });
  const [revealedSentences, setRevealedSentences] = useState(new Set());
  const [selectedWord, setSelectedWord] = useState(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [fileId, setFileId] = useState('');

  // Generate questions and load progress on mount
  useEffect(() => {
    const generatedQuestions = generateQuestions(fileData);
    setQuestions(generatedQuestions);

    // Generate file ID
    const id = generateFileId(fileData.title, JSON.stringify(fileData));
    setFileId(id);

    // Load saved progress
    const savedProgress = loadProgress(id);
    if (savedProgress) {
      setCurrentQuestionIndex(savedProgress.currentQuestionIndex || 0);
      setCurrentBlankIndex(savedProgress.currentBlankIndex || 0);
      setAnswers(savedProgress.answers || []);

      // Restore revealed sentences if using progressive reveal
      if (savedProgress.revealedSentences) {
        setRevealedSentences(new Set(savedProgress.revealedSentences));
      }
    }
  }, [fileData]);

  // Save progress whenever state changes
  useEffect(() => {
    if (questions.length > 0 && fileId) {
      saveProgress(fileId, {
        currentQuestionIndex,
        currentBlankIndex,
        answers,
        revealedSentences: Array.from(revealedSentences)
      });
    }
  }, [currentQuestionIndex, currentBlankIndex, answers, revealedSentences, questions, fileId]);

  // Check if quiz is complete
  const isComplete = currentQuestionIndex >= questions.length;

  // Handle answer selection
  const handleAnswer = (selectedOption) => {
    const currentQuestion = questions[currentQuestionIndex];
    const currentBlank = currentQuestion.blanks[currentBlankIndex];
    const isCorrect = selectedOption === currentBlank.wordEntry.word;

    // Record answer
    const answerRecord = {
      questionIndex: currentQuestionIndex,
      blankIndex: currentBlankIndex,
      selectedOption,
      correctOption: currentBlank.wordEntry.word,
      isCorrect
    };

    setAnswers([...answers, answerRecord]);

    // Reveal sentence in progressive reveal mode only after all blanks in the sentence are answered
    if (settings.progressiveReveal) {
      const isLastBlankInQuestion = currentBlankIndex === currentQuestion.blanks.length - 1;
      if (isLastBlankInQuestion) {
        setRevealedSentences(new Set([...revealedSentences, currentQuestion.sentenceIndex]));
      }
    }
  };

  // Handle next (move to next blank or question)
  const handleNext = () => {
    const currentQuestion = questions[currentQuestionIndex];

    // Check if there are more blanks in current question
    if (currentBlankIndex < currentQuestion.blanks.length - 1) {
      setCurrentBlankIndex(currentBlankIndex + 1);
    } else {
      // Move to next question
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setCurrentBlankIndex(0);
      } else {
        // Quiz complete
        setShowCompletion(true);
      }
    }
  };

  // Handle word click (open definition panel)
  const handleWordClick = (word) => {
    // Clean word (remove punctuation)
    const cleanedWord = word.replace(/[.,!?;:"""'']/g, '');

    // Look up in word bank
    const wordBankEntry = fileData.wordBankMap.get(cleanedWord.toLowerCase());

    setSelectedWord({
      word: cleanedWord,
      wordBankEntry
    });
  };

  // Handle settings change
  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings);

    // If enabling progressive reveal, reveal all completed sentences
    if (newSettings.progressiveReveal && !settings.progressiveReveal) {
      const revealed = new Set();
      for (let i = 0; i <= currentQuestionIndex; i++) {
        if (questions[i]) {
          revealed.add(questions[i].sentenceIndex);
        }
      }
      setRevealedSentences(revealed);
    }

    // If disabling progressive reveal, clear revealed sentences
    if (!newSettings.progressiveReveal && settings.progressiveReveal) {
      setRevealedSentences(new Set());
    }
  };

  // Handle reset progress
  const handleResetProgress = () => {
    // Reset to first question (questions are now in reading order, not shuffled)
    setCurrentQuestionIndex(0);
    setCurrentBlankIndex(0);
    setAnswers([]);
    setRevealedSentences(new Set());
    setShowCompletion(false);
    if (fileId) {
      clearProgress(fileId);
    }
  };

  // Calculate correct count for progress bar
  const correctCount = answers.filter(a => a.isCorrect).length;
  const totalAnswered = answers.length;

  // Don't render if no questions
  if (questions.length === 0) {
    return <div className="quiz-loading">Generating questions...</div>;
  }

  // Show completion screen
  if (showCompletion) {
    return (
      <CompletionScreen
        correctCount={correctCount}
        totalCount={totalAnswered}
        onReset={handleResetProgress}
        onLoadNew={onReset}
      />
    );
  }

  // Get current question data
  const currentQuestion = questions[currentQuestionIndex];
  const currentBlank = currentQuestion.blanks[currentBlankIndex];

  // Get filled blanks for this question
  const filledBlanks = new Set(
    Array.from({ length: currentBlankIndex }, (_, i) => i)
  );

  // Generate options for current blank
  const usedWords = new Set(
    currentQuestion.blanks.map(b => b.wordEntry.word.toLowerCase())
  );
  const options = selectOptions(
    currentBlank.wordEntry,
    fileData.wordBank,
    languageConfig.fallbackWords,
    usedWords
  );

  return (
    <div className="quiz-container">
      <Settings
        settings={settings}
        onSettingsChange={handleSettingsChange}
        onReset={handleResetProgress}
        onClearProgress={onReset}
        readingTitle={fileData.title}
      />

      <ProgressBar
        current={totalAnswered + 1}
        total={questions.reduce((sum, q) => sum + q.blanks.length, 0)}
        correctCount={correctCount}
      />

      {settings.progressiveReveal && (
        <PassageReveal
          sentences={fileData.sentences}
          revealedIndices={revealedSentences}
          paragraphBreaks={fileData.paragraphBreaks}
          onWordClick={handleWordClick}
        />
      )}

      <ClozeCard
        question={currentQuestion}
        currentBlankIndex={currentBlankIndex}
        filledBlanks={filledBlanks}
        options={options}
        onAnswer={handleAnswer}
        onWordClick={handleWordClick}
        onNext={handleNext}
      />

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
