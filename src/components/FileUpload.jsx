import { useState, useRef } from 'react';
import { parseReading } from '../utils/parser';
import './FileUpload.css';

/**
 * FileUpload Component
 * Handles file upload with drag-and-drop and click-to-browse functionality
 *
 * @param {Function} onFileLoad - Callback when file is successfully loaded: (data, langConfig) => void
 * @param {Map} languages - Map of language code to language config objects
 */
export default function FileUpload({ onFileLoad, languages }) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFile = async (file) => {
    setError(null);

    // Validate file type
    if (!file.name.endsWith('.md')) {
      setError('Please upload a Markdown (.md) file');
      return;
    }

    try {
      // Read file content
      const text = await file.text();

      // Quick parse to extract language code
      const langMatch = text.match(/^lang:\s*(\w+)/m);
      if (!langMatch) {
        setError('File is missing "lang:" field');
        return;
      }

      const langCode = langMatch[1].trim();

      // Validate language is loaded
      if (!languages.has(langCode)) {
        setError(`Language "${langCode}" not found. Available languages: ${Array.from(languages.keys()).join(', ')}`);
        return;
      }

      // Get language config
      const languageConfig = languages.get(langCode);

      // Parse the reading file
      const fileData = parseReading(text, languageConfig);

      // Validate parsed data
      if (!fileData.title) {
        setError('File is missing a title (# header)');
        return;
      }

      const isExerciseMode = fileData.mode === 'vocab' || fileData.mode === 'grammar';
      const hasContent = isExerciseMode
        ? fileData.exerciseSentences.length > 0
        : fileData.sentences.length > 0;

      if (!hasContent) {
        setError('File contains no exercise content');
        return;
      }

      if (fileData.wordBank.length === 0) {
        setError('File contains no vocabulary (Wortschatz section)');
        return;
      }

      // Success - call callback
      onFileLoad(fileData, languageConfig);

    } catch (err) {
      setError(`Failed to read file: ${err.message}`);
    }
  };

  const handleSampleReading = async (filename) => {
    setError(null);

    try {
      // Fetch the sample reading file - use BASE_URL for production compatibility
      const response = await fetch(`${import.meta.env.BASE_URL}sample-readings/${filename}`);
      if (!response.ok) {
        throw new Error(`Failed to load sample reading: ${response.statusText}`);
      }

      const text = await response.text();

      // Quick parse to extract language code
      const langMatch = text.match(/^lang:\s*(\w+)/m);
      if (!langMatch) {
        setError('Sample file is missing "lang:" field');
        return;
      }

      const langCode = langMatch[1].trim();

      // Validate language is loaded
      if (!languages.has(langCode)) {
        setError(`Language "${langCode}" not found.`);
        return;
      }

      // Get language config
      const languageConfig = languages.get(langCode);

      // Parse the reading file
      const fileData = parseReading(text, languageConfig);

      // Success - call callback
      onFileLoad(fileData, languageConfig);

    } catch (err) {
      setError(`Failed to load sample reading: ${err.message}`);
    }
  };

  return (
    <div className="file-upload-container">
      <div className="file-upload-header">
        <h1>OpenCloze</h1>
        <p className="subtitle">Language Learning Through Contextual Practice</p>
      </div>

      <div
        className={`file-upload-zone ${isDragging ? 'dragging' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".md"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        <div className="upload-icon">📄</div>
        <p className="upload-text">Drop a reading file here</p>
        <p className="upload-subtext">or click to browse</p>
        <p className="upload-format">Markdown files (.md)</p>
      </div>

      {error && (
        <div className="upload-error">
          {error}
        </div>
      )}

      <div className="sample-readings-section">
        <h3>Try a Sample Exercise</h3>

        <div className="sample-group-label">Readings</div>
        <div className="sample-readings-grid">
          <div className="sample-reading-card">
            <div className="sample-reading-header">
              <span className="sample-language-badge">Latin</span>
              <span className="sample-mode-badge sample-mode-reading">Reading</span>
            </div>
            <h4 className="sample-reading-title">Caesar, De Bello Gallico 1.1–2</h4>
            <p className="sample-reading-preview">
              Gallia est omnis divisa in partes tres, quarum unam incolunt Belgae, aliam Aquitani, tertiam qui ipsorum lingua Celtae...
            </p>
            <button
              className="sample-reading-button"
              onClick={() => handleSampleReading('OpenCloze LA Example Reading.md')}
            >
              Try this reading
            </button>
          </div>

          <div className="sample-reading-card">
            <div className="sample-reading-header">
              <span className="sample-language-badge">German</span>
              <span className="sample-mode-badge sample-mode-reading">Reading</span>
            </div>
            <h4 className="sample-reading-title">Kafka, Ein altes Blatt</h4>
            <p className="sample-reading-preview">
              Es ist, als wäre viel vernachlässigt worden in der Verteidigung unseres Vaterlandes. Wir haben uns bisher nicht darum gekümmert...
            </p>
            <button
              className="sample-reading-button"
              onClick={() => handleSampleReading('OpenCloze DE Example Reading.md')}
            >
              Try this reading
            </button>
          </div>
        </div>

        <div className="sample-group-label">Vocabulary Practice</div>
        <div className="sample-readings-grid">
          <div className="sample-reading-card">
            <div className="sample-reading-header">
              <span className="sample-language-badge">Latin</span>
              <span className="sample-mode-badge sample-mode-vocab">Vocab</span>
            </div>
            <h4 className="sample-reading-title">Latin Life and Society</h4>
            <p className="sample-reading-preview">
              Milites Romani castra in colle posuerunt. Senator longam orationem in foro habuit...
            </p>
            <button
              className="sample-reading-button"
              onClick={() => handleSampleReading('OpenCloze LA Example Vocab.md')}
            >
              Try this exercise
            </button>
          </div>

          <div className="sample-reading-card">
            <div className="sample-reading-header">
              <span className="sample-language-badge">German</span>
              <span className="sample-mode-badge sample-mode-vocab">Vocab</span>
            </div>
            <h4 className="sample-reading-title">German Daily Life</h4>
            <p className="sample-reading-preview">
              Die Katze sitzt auf dem Dach und schaut nach unten. Er liest jeden Abend ein Buch...
            </p>
            <button
              className="sample-reading-button"
              onClick={() => handleSampleReading('OpenCloze DE Example Vocab.md')}
            >
              Try this exercise
            </button>
          </div>
        </div>

        <div className="sample-group-label">Grammar Practice</div>
        <div className="sample-readings-grid">
          <div className="sample-reading-card">
            <div className="sample-reading-header">
              <span className="sample-language-badge">Latin</span>
              <span className="sample-mode-badge sample-mode-grammar">Grammar</span>
            </div>
            <h4 className="sample-reading-title">Latin Verb & Noun Forms</h4>
            <p className="sample-reading-preview">
              Caesar copias in Galliam duxit. Milites castra in colle ponunt. Senatus legem novam de civibus tulit...
            </p>
            <button
              className="sample-reading-button"
              onClick={() => handleSampleReading('OpenCloze LA Example Grammar.md')}
            >
              Try this exercise
            </button>
          </div>

          <div className="sample-reading-card">
            <div className="sample-reading-header">
              <span className="sample-language-badge">German</span>
              <span className="sample-mode-badge sample-mode-grammar">Grammar</span>
            </div>
            <h4 className="sample-reading-title">German Verb Conjugation</h4>
            <p className="sample-reading-preview">
              Er geht jeden Morgen zur Arbeit. Die Kinder spielten gestern den ganzen Tag im Garten...
            </p>
            <button
              className="sample-reading-button"
              onClick={() => handleSampleReading('OpenCloze DE Example Grammar.md')}
            >
              Try this exercise
            </button>
          </div>
        </div>
      </div>

      <div className="upload-info">
        <h3>Available Languages</h3>
        <div className="language-list">
          {Array.from(languages.values()).map(lang => (
            <span key={lang.code} className="language-tag">
              {lang.name} ({lang.code})
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
