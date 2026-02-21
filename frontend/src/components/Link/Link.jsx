import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { ClipLoader } from 'react-spinners';
import {
  faLightbulb, faBrain,
  faListUl, faAlignLeft, faCheckCircle, faQuestionCircle, faTrophy, faRedo
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import mermaid from 'mermaid';
import './index.css';

// Mermaid Component
const MermaidDiagram = ({ chart }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && chart) {
      mermaid.initialize({ startOnLoad: true, theme: 'neutral', securityLevel: 'loose' });
      mermaid.contentLoaded();
      try {
        ref.current.removeAttribute('data-processed');
        mermaid.render('mermaid-chart', chart).then(({ svg }) => {
          ref.current.innerHTML = svg;
        });
      } catch (e) {
        console.error("Mermaid error:", e);
      }
    }
  }, [chart]);

  return <div key={chart} ref={ref} className="mermaid-container animate-pop"></div>;
};

// ---- Professional Quiz Generator ----

// Antonym/opposite pairs for generating plausible wrong answers
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
  // Extract good factual sentences from the ENTIRE summary
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

  // Extract key nouns/concepts from each sentence
  const extractKeyConcepts = (sentence) => {
    return sentence.split(/\s+/)
      .map(w => w.replace(/[^a-zA-Z]/g, ''))
      .filter(w => w.length > 3 && !STOP_WORDS.has(w.toLowerCase()));
  };

  // Create a corrupted version of a sentence for wrong answers
  const corruptSentence = (sentence) => {
    const words = sentence.split(' ');
    const methods = [];

    // Method 1: Swap an antonym
    for (let i = 0; i < words.length; i++) {
      const clean = words[i].replace(/[^a-zA-Z]/g, '').toLowerCase();
      if (SWAP_PAIRS[clean]) {
        const newWords = [...words];
        const replacement = SWAP_PAIRS[clean];
        // Preserve capitalization
        newWords[i] = words[i][0] === words[i][0].toUpperCase()
          ? replacement.charAt(0).toUpperCase() + replacement.slice(1)
          : replacement;
        methods.push(newWords.join(' '));
      }
    }

    // Method 2: Add "not" or "never" before a key verb
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

    // Method 3: Swap two key concept words positions
    const keyIndices = [];
    for (let i = 0; i < words.length; i++) {
      const clean = words[i].replace(/[^a-zA-Z]/g, '');
      if (clean.length > 4 && !STOP_WORDS.has(clean.toLowerCase())) {
        keyIndices.push(i);
      }
    }
    if (keyIndices.length >= 2) {
      const newWords = [...words];
      const a = keyIndices[0], b = keyIndices[keyIndices.length - 1];
      [newWords[a], newWords[b]] = [newWords[b], newWords[a]];
      methods.push(newWords.join(' '));
    }

    return methods;
  };

  // Select sentences evenly distributed across the ENTIRE summary
  // Divide the sentence list into 3 equal thirds and pick from the middle of each third
  const n = sentences.length;
  const third = n / 3;
  const i1 = Math.min(Math.round(third * 0.5), n - 1);       // middle of 1st third
  const i2 = Math.min(Math.round(third * 1.5), n - 1);       // middle of 2nd third
  const i3 = Math.min(Math.round(third * 2.5), n - 1);       // middle of 3rd third
  const indices = [...new Set([i1, i2, i3])];
  const selected = indices.slice(0, 3).map(i => sentences[i]);

  // Collect all key concepts for "Which concept" questions
  const allConcepts = [...new Set(
    sentences.flatMap(s => extractKeyConcepts(s))
      .map(w => w.toLowerCase())
      .filter(w => w.length > 4)
  )];

  // Generate professional questions
  const questions = [];
  const questionTypes = ['true_statement', 'concept_question', 'true_statement'];

  selected.forEach((sentence, qi) => {
    const qType = questionTypes[qi % questionTypes.length];

    if (qType === 'true_statement') {
      // TYPE: "Which of the following statements is TRUE based on the summary?"
      const wrongVersions = corruptSentence(sentence);
      // Get a wrong sentence from a different part of the text with corruption
      const otherSentences = sentences.filter(s => s !== sentence);
      if (otherSentences.length > 0) {
        const randomOther = otherSentences[Math.floor(Math.random() * otherSentences.length)];
        const corruptedOthers = corruptSentence(randomOther);
        wrongVersions.push(...corruptedOthers);
      }

      const distractors = [...new Set(wrongVersions)]
        .filter(w => w !== sentence && w.length > 20)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      // Ensure we have exactly 3 distractors
      while (distractors.length < 3) {
        const filler = sentences.filter(s => s !== sentence)[distractors.length] || `This topic is not covered in the summary`;
        const corrupted = corruptSentence(filler);
        distractors.push(corrupted[0] || filler + ' (unrelated)');
      }

      const options = [sentence, ...distractors.slice(0, 3)].sort(() => Math.random() - 0.5);

      questions.push({
        id: qi,
        question: `Q${qi + 1}. Which of the following statements is TRUE according to the summary?`,
        sentence: null,
        options,
        correct: sentence,
      });

    } else if (qType === 'concept_question') {
      // TYPE: "What does the summary say about [topic]?"
      const concepts = extractKeyConcepts(sentence);
      const topic = concepts.length > 0 ? concepts[0] : 'this topic';

      // Correct answer is a shortened version of the sentence
      const correctAnswer = sentence;

      // Generate wrong answers by corrupting
      const wrongVersions = corruptSentence(sentence);
      const distractors = wrongVersions
        .filter(w => w !== sentence)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      while (distractors.length < 3) {
        distractors.push(`${topic} is not mentioned in the summary`);
      }

      const options = [correctAnswer, ...distractors.slice(0, 3)].sort(() => Math.random() - 0.5);

      questions.push({
        id: qi,
        question: `Q${qi + 1}. What does the summary mention about "${topic}"?`,
        sentence: null,
        options,
        correct: correctAnswer,
      });
    }
  });

  return questions.slice(0, 3);
};


const Summarization = () => {
  const [link, setLink] = useState('');
  const [summarization, setSummarization] = useState('');
  const [displayedSummary, setDisplayedSummary] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [viewMode, setViewMode] = useState("full");
  const [recentSummaries, setRecentSummaries] = useState(() => {
    const saved = sessionStorage.getItem('smart_notes_recents');
    return saved ? JSON.parse(saved) : [];
  });
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
    sessionStorage.setItem('smart_notes_recents', JSON.stringify(recentSummaries));
  }, [recentSummaries]);

  const saveToRecent = (text, type, source) => {
    const title = type === 'link' ? (source.includes('youtube.com') || source.includes('youtu.be') ? 'YouTube Lecture' : 'Web Resource') : 'Live Recording';
    const newItem = { id: Date.now(), title, date: 'Today', summary: text, source };
    const updated = [newItem, ...recentSummaries].slice(0, 8);
    setRecentSummaries(updated);
  };

  const handleInputChange = (event) => setLink(event.target.value);

  const typewriter = (text) => {
    setIsTyping(true);
    setDisplayedSummary("");
    let i = 0;
    const speed = text.length > 500 ? 5 : 15;
    const words = text.split(" ");
    const interval = setInterval(() => {
      if (i < words.length && words[i] !== undefined) {
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
      setStatusMessage("🧠 AI is generating your Smart Notes...");
      const endpoint = '/api/link-summary';
      const response = await axios.post(endpoint, { link });
      const fullText = response.data.summary;
      setSummarization(fullText);
      setCopied(false);
      setStatusMessage("✅ Notes processed!");
      saveToRecent(fullText, 'link', link);
      typewriter(fullText);
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || "Summary failed";
      setStatusMessage(`❌ Error: ${errorMsg}`);
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
    if (option === quizQuestions[currentQ].correct) {
      setScore(s => s + 1);
    }
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

  const toBullets = (text) => {
    if (!text) return [];
    let rawSentences = text.split(/[.!\n\?]/);
    if (rawSentences.length < 3 && text.length > 150) {
      const transitions = /\s+(?:moreover|consequently|furthermore|additionally|specifically|however|therefore|similarly|because|since|although|whereas|while|especially|instead)\s+/i;
      rawSentences = text.split(transitions);
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
        const filler = ['you may', 'in this video', 'today we', 'welcome to', 'i want to', 'this is', 'it is'];
        if (filler.some(f => lower.startsWith(f))) return false;
        return true;
      })
      .map(s => s.charAt(0).toUpperCase() + s.slice(1));
  };

  const getScoreEmoji = () => {
    const pct = score / quizQuestions.length;
    if (pct === 1) return { emoji: '🏆', label: 'Perfect Score!', color: '#10b981' };
    if (pct >= 0.66) return { emoji: '🎉', label: 'Great Job!', color: '#6366f1' };
    return { emoji: '📖', label: 'Keep Studying!', color: '#f59e0b' };
  };

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
              <div key={item.id} className="recent-item animate-pop" onClick={() => { setSummarization(item.summary); typewriter(item.summary); setShowSidebar(false); setShowQuiz(false); }}>
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

      {showSidebar && <div className="sidebar-overlay" onClick={() => setShowSidebar(false)}></div>}

      {/* Main Content Area */}
      <div className="container content-area centered-content">
        <h1 className="header-link">YouTube <span className="blue-text">Smart</span> Summary</h1>

        {statusMessage && (
          <div className={`status-banner ${loading ? 'processing' : ''}`}>
            {loading && <ClipLoader size={18} color="var(--accent-color)" />}
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="input-group">
          <input
            className="link-input"
            type="text"
            placeholder="Paste YouTube Link here..."
            value={link}
            onChange={handleInputChange}
            disabled={loading}
          />
          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={!link || loading}
          >
            {loading ? "AI is processing..." : "Generate Smart Summary"}
          </button>
        </div>

        {summarization && (
          <div className="summary-wrapper fade-in">
            <div className="summary-header">
              <h2>Generated Smart Notes</h2>
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
              <button className="quiz-trigger-btn" onClick={handleStartQuiz}>
                <FontAwesomeIcon icon={faQuestionCircle} /> Take a Quiz
              </button>
            </div>
          </div>
        )}

        {/* ===== QUIZ SECTION ===== */}
        {showQuiz && (
          <div className="quiz-section fade-in">
            <div className="quiz-header">
              <FontAwesomeIcon icon={faQuestionCircle} className="quiz-icon" />
              <h2>Knowledge Check</h2>
            </div>

            {!quizDone ? (
              <div className="quiz-card animate-pop">
                <div className="quiz-progress">
                  <span>Question {currentQ + 1} of {quizQuestions.length}</span>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${((currentQ) / quizQuestions.length) * 100}%` }}></div>
                  </div>
                </div>

                <p className="quiz-question">{quizQuestions[currentQ]?.question}</p>
                <p className="quiz-sentence">"{quizQuestions[currentQ]?.sentence}"</p>

                <div className="quiz-options">
                  {quizQuestions[currentQ]?.options.map((opt, i) => {
                    let cls = 'quiz-option';
                    if (answered) {
                      if (opt === quizQuestions[currentQ].correct) cls += ' correct';
                      else if (opt === selectedAnswer) cls += ' wrong';
                    } else if (selectedAnswer === opt) {
                      cls += ' selected';
                    }
                    return (
                      <button key={i} className={cls} onClick={() => handleSelectAnswer(opt)}>
                        <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {answered && (
                  <div className={`answer-feedback ${selectedAnswer === quizQuestions[currentQ].correct ? 'correct-fb' : 'wrong-fb'}`}>
                    {selectedAnswer === quizQuestions[currentQ].correct
                      ? '✅ Correct! Well done!'
                      : `❌ Wrong! The answer is: "${quizQuestions[currentQ].correct}"`}
                  </div>
                )}

                {answered && (
                  <button className="quiz-next-btn" onClick={handleNext}>
                    {currentQ + 1 >= quizQuestions.length ? 'See Results 🏆' : 'Next Question →'}
                  </button>
                )}
              </div>
            ) : (
              <div className="quiz-result animate-pop">
                <div className="result-emoji">{getScoreEmoji().emoji}</div>
                <h3 style={{ color: getScoreEmoji().color }}>{getScoreEmoji().label}</h3>
                <p className="score-text">You scored <strong>{score}</strong> out of <strong>{quizQuestions.length}</strong></p>
                <div className="score-bar">
                  <div className="score-fill" style={{ width: `${(score / quizQuestions.length) * 100}%`, background: getScoreEmoji().color }}></div>
                </div>
                <button className="retake-btn" onClick={handleRetakeQuiz}>
                  <FontAwesomeIcon icon={faRedo} /> Retake Quiz
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Summarization;
