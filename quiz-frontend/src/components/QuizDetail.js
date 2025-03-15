import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchQuizDetails } from '../api';
import './QuizDetail.css';

const QuizDetail = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadQuizDetails = async () => {
      try {
        setLoading(true);
        const quizData = await fetchQuizDetails(quizId);
        setQuiz(quizData);
        setError(null);
      } catch (err) {
        setError('Ошибка при загрузке квиза. Пожалуйста, попробуйте позже.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadQuizDetails();
  }, [quizId]);

  const startQuiz = () => {
    navigate(`/quizzes/${quizId}/questions/0`);
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!quiz) {
    return <div className="error">Квиз не найден</div>;
  }

  return (
    <div className="quiz-detail-container">
      <h1>{quiz.title}</h1>
      <p>Автор: {quiz.author}</p>
      <p>Дата создания: {new Date(quiz.created_at).toLocaleDateString()}</p>
      
      <div className="quiz-info">
        <p>Количество вопросов: {quiz.questions.length}</p>
      </div>

      <button 
        className="start-quiz-button" 
        onClick={startQuiz}
      >
        Начать тест
      </button>
    </div>
  );
};

export default QuizDetail; 