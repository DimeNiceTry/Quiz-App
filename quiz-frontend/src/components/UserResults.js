import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserQuizResults } from '../api';
import './QuizResults.css'; // Используем те же стили

const UserResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedResult, setExpandedResult] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const resultsData = await getUserQuizResults();
        setResults(resultsData);
        setError(null);
      } catch (err) {
        setError('Ошибка при загрузке результатов. Пожалуйста, попробуйте позже.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  // Форматирование даты
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Расчет процента правильных ответов
  const calculatePercentage = (score, maxScore) => {
    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  };

  // Определение цвета в зависимости от процента
  const getColorForPercentage = (percentage) => {
    if (percentage >= 90) return '#4CAF50'; // Отлично
    if (percentage >= 75) return '#8BC34A'; // Хорошо
    if (percentage >= 60) return '#FFC107'; // Удовлетворительно
    return '#F44336'; // Неудовлетворительно
  };

  // Функция для переключения развернутого/свернутого состояния карточки результата
  const toggleResultDetails = (resultId) => {
    setExpandedResult(expandedResult === resultId ? null : resultId);
  };

  if (loading) {
    return <div className="loading-message">Загрузка результатов...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (results.length === 0) {
    return (
      <div className="quiz-results-container">
        <h1>История результатов</h1>
        <div className="no-results-message">
          У вас еще нет пройденных тестов.
        </div>
        <button 
          className="home-button"
          onClick={() => navigate('/')}
        >
          Вернуться к списку тестов
        </button>
      </div>
    );
  }

  return (
    <div className="quiz-results-container">
      <h1>История результатов</h1>
      
      <div className="results-list">
        {results.map((result) => {
          const percentage = calculatePercentage(result.score, result.max_score);
          const color = getColorForPercentage(percentage);
          const isExpanded = expandedResult === result.id;
          
          return (
            <div key={result.id} className={`result-item ${isExpanded ? 'expanded' : ''}`}>
              <div className="result-header" onClick={() => toggleResultDetails(result.id)}>
                <h3>{result.quiz_title}</h3>
                <span className="result-date">{formatDate(result.completed_at)}</span>
              </div>
              
              <div className="result-details">
                <div className="result-score">
                  <div className="score-circle mini" style={{ borderColor: color }}>
                    <div className="score-value mini">
                      {result.score}/{result.max_score}
                    </div>
                  </div>
                  <div className="score-percentage mini" style={{ color }}>
                    {percentage}%
                  </div>
                </div>
                
                <button 
                  className="retry-button"
                  onClick={() => navigate(`/quiz/${result.quiz}`)}
                >
                  Пройти тест снова
                </button>
              </div>
              
              {isExpanded && result.user_answers && (
                <div className="user-answers-details">
                  <h4>Ваши ответы:</h4>
                  <div className="answers-list">
                    {result.user_answers.map((answer, index) => (
                      <div key={index} className={`answer-item ${answer.is_correct ? 'correct' : 'incorrect'}`}>
                        <div className="question-text">
                          <span className="question-number">Вопрос {index + 1}:</span> {answer.question_text}
                        </div>
                        <div className="answer-details">
                          <div className="user-answer">
                            <span className="answer-label">Ваш ответ:</span> 
                            <span className={answer.is_correct ? 'correct-text' : 'incorrect-text'}>
                              {answer.user_answer}
                            </span>
                          </div>
                          {!answer.is_correct && (
                            <div className="correct-answer">
                              <span className="answer-label">Правильный ответ:</span> 
                              <span className="correct-text">{answer.correct_answer}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <button 
        className="home-button"
        onClick={() => navigate('/')}
      >
        Вернуться к списку тестов
      </button>
    </div>
  );
};

export default UserResults; 