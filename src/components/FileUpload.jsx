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

      if (fileData.sentences.length === 0) {
        setError('File contains no passage text');
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
      // Fetch the sample reading file
      const response = await fetch(`/sample-readings/${filename}`);
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
        <h3>Try a Sample Reading</h3>
        <div className="sample-readings-grid">
          <div className="sample-reading-card">
            <div className="sample-reading-header">
              <span className="sample-language-badge">Latin</span>
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
