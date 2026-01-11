import { useState, useEffect } from 'react';
import { parseLanguageConfig } from './utils/languageParser';
import FileUpload from './components/FileUpload';
import Quiz from './components/Quiz';
import './App.css';

function App() {
  const [languages, setLanguages] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [languageConfig, setLanguageConfig] = useState(null);

  // Fetch language configurations on mount
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        // List of available language files
        const languageCodes = ['de', 'la'];
        const languageMap = new Map();

        // Fetch each language file
        for (const code of languageCodes) {
          try {
            const response = await fetch(`${import.meta.env.BASE_URL}languages/${code}.md`);
            if (response.ok) {
              const text = await response.text();
              const config = parseLanguageConfig(text);
              languageMap.set(code, config);
            }
          } catch (err) {
            console.error(`Failed to load language: ${code}`, err);
          }
        }

        if (languageMap.size === 0) {
          setError('No language files could be loaded');
        } else {
          setLanguages(languageMap);
        }
      } catch (err) {
        setError('Failed to load language configurations');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLanguages();
  }, []);

  // Handle file upload
  const handleFileLoad = (data, langConfig) => {
    setFileData(data);
    setLanguageConfig(langConfig);
  };

  // Handle reset (return to file upload)
  const handleReset = () => {
    setFileData(null);
    setLanguageConfig(null);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="app-loading">
        <h1>OpenCloze</h1>
        <p>Loading language configurations...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="app-error">
        <h1>OpenCloze</h1>
        <p className="error-message">{error}</p>
      </div>
    );
  }

  // Render quiz if file is loaded
  if (fileData && languageConfig) {
    return (
      <Quiz
        fileData={fileData}
        languageConfig={languageConfig}
        onReset={handleReset}
      />
    );
  }

  // Render file upload
  return (
    <FileUpload
      onFileLoad={handleFileLoad}
      languages={languages}
    />
  );
}

export default App;
