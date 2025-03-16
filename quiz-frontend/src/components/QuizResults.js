import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './QuizResults.css';
import { saveQuizResult } from '../api';

const QuizResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { quizId, quizTitle, userAnswers, questions } = location.state || {};
  const [resultSaved, setResultSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);
  
  // Проверяем, что все нужные данные переданы
  useEffect(() => {
    if (!quizId || !quizTitle || !userAnswers || !questions) {
      navigate('/');
    }
  }, [quizId, quizTitle, userAnswers, questions, navigate]);
  
  // Вычисляем результаты
  const calculateResults = () => {
    if (!questions || !userAnswers) return { score: 0, maxScore: 0, answersDetails: [] };
    
    let score = 0;
    const maxScore = questions.length;
    const answersDetails = [];
    
    questions.forEach((question, index) => {
      const questionId = question.id;
      const userAnswer = userAnswers[questionId] || null;
      const correctAnswers = question.answers.filter(answer => answer.is_correct);
      const isCorrect = userAnswer !== null && 
        correctAnswers.some(answer => answer.id === userAnswer);
      
      if (isCorrect) {
        score++;
      }
      
      answersDetails.push({
        questionText: question.text,
        userAnswer: userAnswer !== null ? 
          question.answers.find(a => a.id === userAnswer)?.text : 'Не отвечено',
        correctAnswers: correctAnswers.map(a => a.text).join(', '),
        isCorrect
      });
    });
    
    return { score, maxScore, answersDetails };
  };
  
  const { score, maxScore, answersDetails } = calculateResults();
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  
  // Сохраняем результат в БД
  useEffect(() => {
    const saveResult = async () => {
      if (quizId && !resultSaved) {
        try {
          await saveQuizResult(quizId, score, maxScore);
          setResultSaved(true);
        } catch (error) {
          setSaveError(error.message);
        }
      }
    };
    
    saveResult();
  }, [quizId, score, maxScore, resultSaved]);
  
  // Определяем оценку в зависимости от процента правильных ответов
  const getRating = (percent) => {
    if (percent >= 90) return { grade: '5 (Отлично)', color: '#4CAF50' };
    if (percent >= 75) return { grade: '4 (Хорошо)', color: '#8BC34A' };
    if (percent >= 60) return { grade: '3 (Удовлетворительно)', color: '#FFC107' };
    return { grade: '2 (Неудовлетворительно)', color: '#F44336' };
  };
  
  const rating = getRating(percentage);
  
  return (
    <div className="quiz-results-container">
      <h1>Результаты теста: {quizTitle}</h1>
      
      <div className="results-summary">
        <div className="score-circle" style={{ borderColor: rating.color }}>
          <div className="score-text">
            <span className="score-value">{score}</span>
            <span className="score-divider">/</span>
            <span className="max-score">{maxScore}</span>
          </div>
          <div className="score-percentage" style={{ color: rating.color }}>
            {percentage}%
          </div>
        </div>
        
        <div className="rating-box" style={{ backgroundColor: rating.color }}>
          <div className="rating-label">Оценка:</div>
          <div className="rating-value">{rating.grade}</div>
        </div>
      </div>
      
      {saveError && (
        <div className="error-message">
          Ошибка при сохранении результата: {saveError}
        </div>
      )}
      
      {resultSaved && (
        <div className="success-message">
          Результат успешно сохранен!
        </div>
      )}
      
      <h2>Детали ответов:</h2>
      <div className="answers-details">
        {answersDetails.map((detail, index) => (
          <div 
            key={index} 
            className={`answer-item ${detail.isCorrect ? 'correct' : 'incorrect'}`}
          >
            <div className="question-text">
              <span className="question-number">Вопрос {index + 1}:</span> {detail.questionText}
            </div>
            <div className="answer-details">
              <div className="user-answer">
                <span className="answer-label">Ваш ответ:</span> 
                <span className={detail.isCorrect ? 'correct-text' : 'incorrect-text'}>
                  {detail.userAnswer}
                </span>
              </div>
              {!detail.isCorrect && (
                <div className="correct-answer">
                  <span className="answer-label">Правильный ответ:</span> 
                  <span className="correct-text">{detail.correctAnswers}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="action-buttons">
        <button 
          className="retry-button"
          onClick={() => navigate(`/quiz/${quizId}`)}
        >
          Пройти тест заново
        </button>
        <button 
          className="home-button"
          onClick={() => navigate('/')}
        >
          Вернуться к списку тестов
        </button>
      </div>
    </div>
  );
};

export default QuizResults; 