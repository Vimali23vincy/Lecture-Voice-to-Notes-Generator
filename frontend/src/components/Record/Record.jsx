import React, { useEffect, useState, useMemo, useRef } from 'react';
import axios from 'axios';
import { ClipLoader } from 'react-spinners';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import {
  faPlay, faStop, faUndo, faLightbulb, faBook, faQuestionCircle,
  faBrain, faChevronDown, faChevronUp, faHighlighter,
  faListUl, faAlignLeft, faCheckCircle, faSitemap, faRedo, faTrophy
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import mermaid from 'mermaid';
import './index.css'

// ---- Quiz Generator (same as Link page) ----
const SWAP_PAIRS = {
  'increase': 'decrease', 'decrease': 'increase',
  'improve': 'worsen', 'worsen': 'improve',
  'positive': 'negative', 'negative': 'positive',
  'important': 'insignificant', 'significant': 'minor',
  'faster': 'slower', 'slower': 'faster',
  'larger': 'smaller', 'smaller': 'larger',
  'better': 'worse', 'worse': 'better',
  'more': 'fewer', 'fewer': 'more',
  'higher': 'lower', 'lower': 'higher',
  'strong': 'weak', 'weak': 'strong',
  'advanced': 'basic', 'basic': 'advanced',
  'complex': 'simple', 'simple': 'complex',
  'efficient': 'inefficient', 'modern': 'traditional',
  'traditional': 'modern', 'human': 'machine',
  'machine': 'human', 'natural': 'artificial',
  'artificial': 'natural', 'automated': 'manual',
  'manual': 'automated', 'public': 'private',
  'private': 'public', 'create': 'destroy',
  'help': 'hinder', 'support': 'oppose',
  'benefit': 'harm', 'reduce': 'increase',
  'enable': 'prevent', 'replace': 'preserve',
  'accept': 'reject', 'allow': 'prohibit',
};

const STOP_WORDS = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'need', 'used', 'that', 'this', 'these', 'those', 'it', 'its', 'they', 'them', 'their', 'he', 'she', 'his', 'her', 'we', 'our', 'you', 'your', 'i', 'my', 'me', 'and', 'or', 'but', 'so', 'for', 'nor', 'yet', 'at', 'by', 'in', 'of', 'on', 'to', 'up', 'as', 'with', 'from', 'into', 'about', 'than', 'also', 'just', 'very', 'much', 'most', 'some', 'any', 'all', 'each', 'every', 'many', 'few', 'not', 'only', 'such', 'if', 'when', 'then', 'now', 'well', 'here', 'there', 'what', 'which', 'who', 'how', 'why', 'where', 'been', 'going', 'like', 'make', 'take', 'even', 'still']);

const generateQuizFromText = (text) => {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim().replace(/[.!?]$/, ''))
    .filter(s => {
      const wordCount = s.split(' ').length;
      return wordCount >= 8 && wordCount <= 35 && s.length > 50
        && !s.endsWith('?')
        && !s.startsWith('So ')
        && !s.startsWith('Well ');
    });

  if (sentences.length < 2) return [];

  const extractKeyConcepts = (sentence) => {
    return sentence.split(/\s+/)
      .map(w => w.replace(/[^a-zA-Z]/g, ''))
      .filter(w => w.length > 3 && !STOP_WORDS.has(w.toLowerCase()));
  };

  const corruptSentence = (sentence) => {
    const words = sentence.split(' ');
    const methods = [];
    for (let i = 0; i < words.length; i++) {
      const clean = words[i].replace(/[^a-zA-Z]/g, '').toLowerCase();
      if (SWAP_PAIRS[clean]) {
        const newWords = [...words];
        const replacement = SWAP_PAIRS[clean];
        newWords[i] = words[i][0] === words[i][0].toUpperCase()
          ? replacement.charAt(0).toUpperCase() + replacement.slice(1)
          : replacement;
        methods.push(newWords.join(' '));
      }
    }
    const verbIndicators = ['is', 'are', 'was', 'can', 'will', 'could', 'should', 'does', 'do', 'has', 'have'];
    for (let i = 0; i < words.length; i++) {
      const clean = words[i].toLowerCase().replace(/[^a-z]/g, '');
      if (verbIndicators.includes(clean) && !['not', 'never', "don't", "doesn't", "isn't", "aren't"].includes((words[i + 1] || '').toLowerCase())) {
        const newWords = [...words];
        newWords.splice(i + 1, 0, 'not');
        methods.push(newWords.join(' '));
        break;
      }
    }
    const keyIndices = [];
    for (let i = 0; i < words.length; i++) {
      const clean = words[i].replace(/[^a-zA-Z]/g, '');
      if (clean.length > 4 && !STOP_WORDS.has(clean.toLowerCase())) keyIndices.push(i);
    }
    if (keyIndices.length >= 2) {
      const newWords = [...words];
      const a = keyIndices[0], b = keyIndices[keyIndices.length - 1];
      [newWords[a], newWords[b]] = [newWords[b], newWords[a]];
      methods.push(newWords.join(' '));
    }
    return methods;
  };

  const n = sentences.length;
  const third = n / 3;
  const i1 = Math.min(Math.round(third * 0.5), n - 1);
  const i2 = Math.min(Math.round(third * 1.5), n - 1);
  const i3 = Math.min(Math.round(third * 2.5), n - 1);
  const indices = [...new Set([i1, i2, i3])];
  const selected = indices.slice(0, 3).map(i => sentences[i]);

  const questions = [];
  const questionTypes = ['true_statement', 'concept_question', 'true_statement'];

  selected.forEach((sentence, qi) => {
    const qType = questionTypes[qi % questionTypes.length];
    if (qType === 'true_statement') {
      const wrongVersions = corruptSentence(sentence);
      const otherSentences = sentences.filter(s => s !== sentence);
      if (otherSentences.length > 0) {
        const randomOther = otherSentences[Math.floor(Math.random() * otherSentences.length)];
        wrongVersions.push(...corruptSentence(randomOther));
      }
      const distractors = [...new Set(wrongVersions)]
        .filter(w => w !== sentence && w.length > 20)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      while (distractors.length < 3) {
        const filler = sentences.filter(s => s !== sentence)[distractors.length] || 'This topic is not covered in the summary';
        distractors.push(corruptSentence(filler)[0] || filler + ' (unrelated)');
      }
      const options = [sentence, ...distractors.slice(0, 3)].sort(() => Math.random() - 0.5);
      questions.push({ id: qi, question: `Q${qi + 1}. Which of the following statements is TRUE according to the summary?`, sentence: null, options, correct: sentence });
    } else {
      const concepts = extractKeyConcepts(sentence);
      const topic = concepts.length > 0 ? concepts[0] : 'this topic';
      const wrongVersions = corruptSentence(sentence);
      const distractors = wrongVersions.filter(w => w !== sentence).sort(() => Math.random() - 0.5).slice(0, 3);
      while (distractors.length < 3) distractors.push(`${topic} is not mentioned in the summary`);
      const options = [sentence, ...distractors.slice(0, 3)].sort(() => Math.random() - 0.5);
      questions.push({ id: qi, question: `Q${qi + 1}. What does the summary mention about "${topic}"?`, sentence: null, options, correct: sentence });
    }
  });

  return questions.slice(0, 3);
};

// Mermaid Component
const MermaidDiagram = ({ chart }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && chart) {
      mermaid.initialize({ startOnLoad: true, theme: 'neutral', securityLevel: 'loose' });
      mermaid.contentLoaded();
      try {
        ref.current.removeAttribute('data-processed');
        mermaid.render('mermaid-chart-record', chart).then(({ svg }) => {
          ref.current.innerHTML = svg;
        });
      } catch (e) {
        console.error("Mermaid error:", e);
      }
    }
  }, [chart]);

  return <div key={chart} ref={ref} className="mermaid-container animate-pop"></div>;
};

const Record = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [summarization, setSummarization] = useState("");
  const [displayedSummary, setDisplayedSummary] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [activeCard, setActiveCard] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [realTimeFlashcards, setRealTimeFlashcards] = useState([]);
  const [accumulatedTranscript, setAccumulatedTranscript] = useState("");
  const [viewMode, setViewMode] = useState("full");
  const [recentSummaries, setRecentSummaries] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);

  // Quiz States
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('recent_summaries');
    if (saved) setRecentSummaries(JSON.parse(saved));
  }, []);

  const saveToRecent = (text, type) => {
    const newItem = {
      id: Date.now(),
      title: type === 'record' ? 'Live Recording' : 'YouTube Lecture',
      date: 'Today',
      summary: text
    };
    const updated = [newItem, ...recentSummaries].slice(0, 5);
    setRecentSummaries(updated);
    sessionStorage.setItem('recent_summaries', JSON.stringify(updated));
  };

  const {
    transcript,
    finalTranscript,
    resetTranscript,
    listening,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // Auto-restart logic for long recordings (30m+)
  useEffect(() => {
    if (isRecording && !listening) {
      SpeechRecognition.startListening({ continuous: true, language: 'en-GB' });
    }
  }, [isRecording, listening]);

  // Capture transcript chunks for long-duration persistence
  useEffect(() => {
    if (finalTranscript) {
      setAccumulatedTranscript(prev => prev + " " + finalTranscript);
      resetTranscript();
    }
  }, [finalTranscript, resetTranscript]);

  const fullLiveTranscript = (accumulatedTranscript + " " + transcript).trim();

  const keywords = [
    'important', 'remember', 'recall', 'specifically', 'definition', 'concept',
    'basically', 'crucial', 'essential', 'key', 'example', 'illustration',
    'furthermore', 'morover', 'however', 'consequently', 'therefore',
    'test', 'exam', 'assignment', 'homework', 'summary', 'conclusion'
  ];

  const highlightedTranscript = useMemo(() => {
    if (!fullLiveTranscript) return null;
    return fullLiveTranscript.split(' ').map((word, i) => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
      if (keywords.includes(cleanWord)) return <span key={i} className="highlight-keyword">{word} </span>;
      if (word.includes('?')) return <span key={i} className="highlight-question">{word} </span>;
      return word + ' ';
    });
  }, [fullLiveTranscript]);

  useEffect(() => {
    if (!transcript) return;
    const sentences = transcript.split('. ');
    const latest = sentences[sentences.length - 1];
    if (latest.includes(' means ') || latest.includes(' is defined as ')) {
      const parts = latest.split(/ means | is defined as /);
      if (parts.length === 2 && parts[0].length < 30) {
        const newFC = { front: parts[0].trim(), back: parts[1].trim() };
        setRealTimeFlashcards(prev => {
          if (prev.some(f => f.front === newFC.front)) return prev;
          return [...prev, newFC].slice(-3);
        });
      }
    }
  }, [transcript]);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => setSeconds(prev => prev + 1), 1000);
      setStatusMessage("🎙 Recording lecture...");
    } else {
      setSeconds(0);
      clearInterval(interval);
      if (transcript) setStatusMessage("⌛ Ready to summarize");
      else setStatusMessage("");
    }
    return () => clearInterval(interval);
  }, [isRecording, transcript]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleRecording = () => {
    if (isRecording) {
      SpeechRecognition.stopListening();
    } else {
      setAccumulatedTranscript("");
      resetTranscript();
      setSummarization("");
      setRealTimeFlashcards([]);
      SpeechRecognition.startListening({ continuous: true, language: 'en-GB' });
    }
    setIsRecording(!isRecording);
  };

  const typewriter = (text) => {
    setIsTyping(true);
    setDisplayedSummary("");
    let i = 0;
    const speed = text.length > 500 ? 5 : 15;

    const words = text.split(" ");
    const interval = setInterval(() => {
      if (i < words.length) {
        setDisplayedSummary((prev) => prev + (i === 0 ? "" : " ") + words[i]);
        i++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, speed);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setSummarization("");
      setDisplayedSummary("");
      setShowQuiz(false);
      setQuizQuestions([]);
      setStatusMessage("🧠 AI is processing your live notes...");
      const endpoint = process.env.NODE_ENV === 'development' ? '/api/record-summary-dev' : '/api/record-summary';
      const response = await axios.post(endpoint, { finalTranscript: fullLiveTranscript });
      const fullText = response.data.summary;

      setSummarization(fullText);
      setCopied(false);
      setStatusMessage("✅ Notes processed!");

      saveToRecent(fullText, 'record');
      typewriter(fullText);
    } catch (error) {
      setStatusMessage("❌ Summary failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = () => {
    const questions = generateQuizFromText(summarization);
    setQuizQuestions(questions);
    setCurrentQ(0);
    setScore(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setQuizDone(false);
    setShowQuiz(true);
  };

  const handleSelectAnswer = (option) => {
    if (answered) return;
    setSelectedAnswer(option);
    setAnswered(true);
    if (option === quizQuestions[currentQ].correct) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (currentQ + 1 >= quizQuestions.length) {
      setQuizDone(true);
    } else {
      setCurrentQ(q => q + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    }
  };

  const handleRetakeQuiz = () => {
    const questions = generateQuizFromText(summarization);
    setQuizQuestions(questions);
    setCurrentQ(0);
    setScore(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setQuizDone(false);
  };

  const getScoreEmoji = () => {
    const pct = score / quizQuestions.length;
    if (pct === 1) return { emoji: '🏆', label: 'Perfect Score!', color: '#10b981' };
    if (pct >= 0.66) return { emoji: '🎉', label: 'Great Job!', color: '#6366f1' };
    return { emoji: '📖', label: 'Keep Studying!', color: '#f59e0b' };
  };

  const toBullets = (text) => {
    if (!text) return [];

    // 1. Initial split by standard punctuation
    let rawSentences = text.split(/[.!\n\?]/);

    // 2. Fallback for poorly punctuated live transcripts
    if (rawSentences.length < 3 && text.length > 150) {
      // Split by logical connectors
      const transitions = /\s+(?:furthermore|additionally|specifically|however|therefore|similarly|consequently|moreover|because|since|although|whereas|while)\s+/i;
      rawSentences = text.split(transitions);

      // Final fallback for purely conversational blocks
      if (rawSentences.length < 3) {
        rawSentences = text.split(/\s+(?:and|but|so|then|also)\s+/i);
      }
    }

    return rawSentences
      .map(s => s.trim())
      .filter(s => {
        if (s.length < 20) return false;
        if (s.endsWith('?')) return false;

        const lower = s.toLowerCase();
        const filler = ['you may', 'in this recording', 'today we', 'welcome to', 'i want to', 'this is', 'it is'];
        if (filler.some(f => lower.startsWith(f))) return false;

        return true;
      })
      .map(s => s.charAt(0).toUpperCase() + s.slice(1));
  };

  const generateDiagram = (text) => {
    const bullets = toBullets(text).slice(0, 5);
    if (bullets.length === 0) return "graph TD\n  A[Live Record] --> B[No details found]";

    let chart = "graph TD\n";
    chart += "  Main[Class Discussion] --> Sub1[Topics Covered]\n";
    bullets.forEach((b, i) => {
      const cleanB = b.replace(/[^a-zA-Z0-9 ]/g, "").slice(0, 40);
      chart += `  Sub1 --> B${i}["${cleanB}..."]\n`;
    });
    return chart;
  };





  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="main-layout">
        <div className="container centered-content">
          <div className="status-banner error">
            <span>❌ Your browser does not support speech recognition. Please use Google Chrome.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`main-layout ${showSidebar ? 'sidebar-open' : ''}`}>
      {/* Sidebar Toggle Button */}
      <button className="sidebar-toggle-btn" onClick={() => setShowSidebar(!showSidebar)} title="View Recent Summaries">
        <FontAwesomeIcon icon={faBrain} />
      </button>

      {/* Sidebar Section (Drawer Mode) */}
      <aside className={`sidebar ${showSidebar ? 'active' : ''}`}>
        <div className="sidebar-header">
          <div className="title-with-close">
            <FontAwesomeIcon icon={faBrain} className="sidebar-logo-icon" />
            <h3>Recent Notes</h3>
          </div>
          <button className="close-sidebar" onClick={() => setShowSidebar(false)}>×</button>
        </div>
        <div className="recent-list">
          {recentSummaries.length === 0 ? (
            <div className="empty-recent">No recent notes yet...</div>
          ) : (
            recentSummaries.map((item) => (
              <div key={item.id} className="recent-item animate-pop" onClick={() => { setSummarization(item.summary); typewriter(item.summary); setShowSidebar(false); }}>
                <div className="recent-icon">🕒</div>
                <div className="recent-info">
                  <span className="recent-title">{item.title}</span>
                  <span className="recent-date">{item.date}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Overlay for clicking outside sidebar */}
      {showSidebar && <div className="sidebar-overlay" onClick={() => setShowSidebar(false)}></div>}

      {/* Main Content Area */}
      <div className="container content-area centered-content">
        <h1 className="title"><span className="blue-text">AI</span> Smart Notes</h1>

        {statusMessage && (
          <div className={`status-banner ${loading ? 'processing' : ''}`}>
            {loading ? <ClipLoader size={24} color="var(--accent-color)" /> : <FontAwesomeIcon icon={faCheckCircle} className="success-icon" />}
            <span>{statusMessage}</span>
          </div>
        )}

        {isRecording && realTimeFlashcards.length > 0 && (
          <div className="realtime-insights fade-in">
            <div className="insight-header"><FontAwesomeIcon icon={faBrain} className="pulse" /> <span>Real-time Insight Flashcards</span></div>
            <div className="rt-flashcards">
              {realTimeFlashcards.map((fc, i) => (
                <div key={i} className="rt-fc-item animate-pop">
                  <div className="rt-fc-front">{fc.front}</div>
                  <div className="rt-fc-back">{fc.back}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="status-container">
          <div className="recording-header">
            <span className={`listening-indicator ${isRecording ? 'active' : ''}`}>{isRecording ? 'LIVE RECORDING' : 'IDLE'}</span>
            <div className="timer-display">{formatTime(seconds)}</div>
          </div>
          {isRecording && <div className="waveform-container">{[...Array(12)].map((_, i) => (<div key={i} className="bar" style={{ animationDelay: `${i * 0.1}s` }}></div>))}</div>}
        </div>

        <div className="controls">
          <div className="btn-group">
            <button className={`control-btn ${isRecording ? 'active' : ''}`} onClick={toggleRecording}><FontAwesomeIcon icon={isRecording ? faStop : faPlay} /></button>
            <button className="control-btn secondary" onClick={() => { setAccumulatedTranscript(""); resetTranscript(); setSummarization(""); setStatusMessage(""); setRealTimeFlashcards([]); }}><FontAwesomeIcon icon={faUndo} /></button>
          </div>
        </div>

        <div className="transcript-box">
          <div className="box-header"><FontAwesomeIcon icon={faAlignLeft} /> <span>Live Transcript</span></div>
          <div className="highlighted-content">{fullLiveTranscript || <span className="placeholder">Start speaking to see your transcript here...</span>}</div>
        </div>

        {!summarization && (
          <button className="transcribe-button main-action" onClick={handleSubmit} disabled={isRecording || loading || !fullLiveTranscript}>
            {loading ? "AI is processing..." : "Generate Smart Summary"}
          </button>
        )}

        {summarization && (
          <div className="summary-section fade-in">
            <div className="section-header">
              <h2>Your Smart Summary</h2>
              <div className="view-controls">
                <button className={`view-btn ${viewMode === 'full' ? 'active' : ''}`} onClick={() => setViewMode('full')}>
                  <FontAwesomeIcon icon={faAlignLeft} /> Full
                </button>
                <button className={`view-btn ${viewMode === 'bullets' ? 'active' : ''}`} onClick={() => setViewMode('bullets')}>
                  <FontAwesomeIcon icon={faListUl} /> Bullets
                </button>
              </div>
            </div>

            <div className="summary-content-container animate-pop">
              {viewMode === 'bullets' ? (
                <ul className="summary-bullets">
                  {toBullets(displayedSummary).map((b, i) => (
                    <li key={i} className="bullet-item">
                      <FontAwesomeIcon icon={faLightbulb} className="bullet-icon" />
                      <span>{b}</span>
                    </li>
                  ))}
                  {isTyping && <li className="bullet-item typing"><span>AI is thinking...</span></li>}
                </ul>
              ) : (
                <div className="summary-full-text">
                  <p>{displayedSummary}{isTyping && <span className="cursor-blink">|</span>}</p>
                </div>
              )}
            </div>
            <div className="action-row">
              <button className="copy-full-btn" onClick={() => { navigator.clipboard.writeText(summarization); setCopied(true); setTimeout(() => setCopied(false), 2000) }}>
                {copied ? "Copied! ✅" : "Copy Full Text 📋"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Record;
