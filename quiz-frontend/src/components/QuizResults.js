import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { fetchQuizDetails } from '../api';
import './QuizResults.css';

const QuizResults = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Получаем результаты из состояния location
  const userAnswers = location.state?.userAnswers || [];
  const totalQuestions = location.state?.totalQuestions || 0;
  
  useEffect(() => {
    // Если нет данных о результатах, перенаправляем на страницу теста
    if (!location.state || !location.state.userAnswers) {
      navigate(`/quizzes/${quizId}/details`);
      return;
    }
    
    const loadQuizDetails = async () => {
      try {
        setLoading(true);
        const quizData = await fetchQuizDetails(quizId);
        setQuiz(quizData);
        setError(null);
      } catch (err) {
        setError('Ошибка при загрузке данных квиза. Пожалуйста, попробуйте позже.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadQuizDetails();
  }, [quizId, navigate, location.state]);

  // Подсчет количества правильных ответов
  const correctAnswers = userAnswers.filter(answer => answer.isCorrect).length;
  
  // Рассчитываем процент правильных ответов
  const percentageCorrect = totalQuestions > 0 
    ? Math.round((correctAnswers / totalQuestions) * 100) 
    : 0;
  
  // Определяем оценку в зависимости от процента правильных ответов
  const getGrade = (percentage) => {
    if (percentage >= 90) return { text: 'Отлично!', class: 'excellent' };
    if (percentage >= 70) return { text: 'Хорошо!', class: 'good' };
    if (percentage >= 50) return { text: 'Удовлетворительно', class: 'satisfactory' };
    return { text: 'Нужно больше практики', class: 'needs-practice' };
  };
  
  const grade = getGrade(percentageCorrect);
  
  const handleRetry = () => {
    navigate(`/quizzes/${quizId}/questions/0`);
  };
  
  const handleBackToQuizzes = () => {
    navigate('/quizzes');
  };

  if (loading) {
    return <div className="loading">Загрузка результатов...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="quiz-results-container">
      <h1>Результаты теста</h1>
      
      {quiz && (
        <div className="quiz-info">
          <h2>{quiz.title}</h2>
          <p>Автор: {quiz.author}</p>
        </div>
      )}
      
      <div className="score-container">
        <div className="score-circle">
          <div className="score-percentage">{percentageCorrect}%</div>
          <div className="score-text">
            {correctAnswers} из {totalQuestions} верно
          </div>
        </div>
        
        <div className={`grade ${grade.class}`}>
          {grade.text}
        </div>
      </div>
      
      <div className="answers-review">
        <h3>Обзор ответов:</h3>
        {userAnswers.map((answer, index) => (
          <div 
            key={index} 
            className={`answer-item ${answer.isCorrect ? 'correct' : 'incorrect'}`}
          >
            <span className="question-number">Вопрос {index + 1}:</span>
            <span className="answer-status">
              {answer.isCorrect ? '✓ Верно' : '✗ Неверно'}
            </span>
            <div className="answer-details">
              <p>{answer.questionText}</p>
              <p className="small">Ваш ответ: {answer.userAnswerText}</p>
              {!answer.isCorrect && (
                <p className="small correct-text">Правильный ответ: {answer.correctAnswerText}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="action-buttons">
        <button 
          className="retry-button" 
          onClick={handleRetry}
        >
          Пройти еще раз
        </button>
        
        <button 
          className="back-button" 
          onClick={handleBackToQuizzes}
        >
          К списку тестов
        </button>
      </div>
    </div>
  );
};

export default QuizResults; 