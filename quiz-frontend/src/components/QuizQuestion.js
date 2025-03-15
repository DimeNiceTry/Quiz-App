import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchQuizQuestion } from '../api';
import './QuizQuestion.css';

const QuizQuestion = () => {
  const { quizId, questionIndex } = useParams();
  const navigate = useNavigate();
  const [questionData, setQuestionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [userAnswers, setUserAnswers] = useState(() => {
    // Пытаемся получить сохраненные ответы из sessionStorage
    const savedAnswers = sessionStorage.getItem(`quiz_${quizId}_answers`);
    return savedAnswers ? JSON.parse(savedAnswers) : [];
  });

  // Функция загрузки данных вопроса
  const loadQuestionData = useCallback(async () => {
    try {
      setLoading(true);
      
      const data = await fetchQuizQuestion(quizId, questionIndex);
      setQuestionData(data);
      setError(null);
      
      return data;
    } catch (err) {
      setError('Ошибка при загрузке вопроса. Пожалуйста, попробуйте позже.');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [quizId, questionIndex]);

  // Эффект для загрузки данных вопроса при изменении индекса или ID квиза
  useEffect(() => {
    // Сброс состояния при переходе к новому вопросу
    setShowResult(false);
    setSelectedAnswer(null);
    
    // Загрузка данных вопроса
    loadQuestionData();
  }, [quizId, questionIndex, loadQuestionData]);

  // Отдельный эффект для восстановления сохраненных ответов
  useEffect(() => {
    if (!questionData) return;
    
    // Проверяем, есть ли уже ответ на этот вопрос
    const questionIdx = parseInt(questionIndex);
    if (userAnswers[questionIdx]) {
      const savedAnswer = userAnswers[questionIdx];
      const answerObj = questionData.question.answers.find(a => a.id === savedAnswer.answerId);
      if (answerObj) {
        setSelectedAnswer(answerObj.id);
        if (savedAnswer.checked) {
          setShowResult(true);
        }
      }
    }
  }, [questionData, questionIndex, userAnswers]);

  const handleAnswerSelect = (answerId) => {
    setSelectedAnswer(answerId);
  };

  const checkAnswer = () => {
    if (selectedAnswer === null || !questionData) return;
    
    // Находим выбранный ответ
    const selectedAnswerObj = questionData.question.answers.find(a => a.id === selectedAnswer);
    const isCorrect = selectedAnswerObj?.is_correct || false;
    
    // Находим правильный ответ для отображения в результатах
    const correctAnswer = questionData.question.answers.find(a => a.is_correct);
    
    // Сохраняем ответ пользователя
    const newAnswers = [...userAnswers];
    newAnswers[parseInt(questionIndex)] = {
      answerId: selectedAnswer,
      isCorrect,
      checked: true,
      questionText: questionData.question.text,
      userAnswerText: selectedAnswerObj.text,
      correctAnswerText: correctAnswer.text
    };
    
    // Сохраняем ответы в sessionStorage
    sessionStorage.setItem(`quiz_${quizId}_answers`, JSON.stringify(newAnswers));
    
    // Обновляем состояние - сначала показываем результат, потом обновляем ответы
    setShowResult(true);
    setUserAnswers(newAnswers);
  };

  const goToNextQuestion = () => {
    if (!questionData) return;
    
    const nextIndex = parseInt(questionIndex) + 1;
    if (nextIndex < questionData.total_questions) {
      navigate(`/quizzes/${quizId}/questions/${nextIndex}`);
    } else {
      // Перейти к результатам с данными о всех ответах
      navigate(`/quizzes/${quizId}/results`, {
        state: {
          userAnswers: userAnswers.filter(answer => answer), // Убираем пустые элементы
          totalQuestions: questionData.total_questions
        }
      });
    }
  };

  const goToPrevQuestion = () => {
    const prevIndex = parseInt(questionIndex) - 1;
    if (prevIndex >= 0) {
      navigate(`/quizzes/${quizId}/questions/${prevIndex}`);
    }
  };

  if (loading && !questionData) {
    return <div className="loading">Загрузка...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!questionData || !questionData.question) {
    return <div className="error">Вопрос не найден</div>;
  }

  const { question, current_index, total_questions, quiz_title } = questionData;
  const currentQuestionNumber = parseInt(current_index) + 1;

  return (
    <div className="quiz-question-container">
      <h1>{quiz_title}</h1>
      
      <div className="question-progress">
        <div className="progress-text">
          Вопрос {currentQuestionNumber} из {total_questions}
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(currentQuestionNumber / total_questions) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="question-text">
        <h2>{question.text}</h2>
      </div>

      <div className="answer-options">
        {question.answers.map((answer) => (
          <div 
            key={answer.id} 
            className={`answer-option ${selectedAnswer === answer.id ? 'selected' : ''} ${
              showResult && answer.is_correct ? 'correct' : ''
            } ${showResult && selectedAnswer === answer.id && !answer.is_correct ? 'incorrect' : ''}`}
            onClick={() => !showResult && handleAnswerSelect(answer.id)}
          >
            {answer.text}
          </div>
        ))}
      </div>

      <div className="navigation-buttons">
        <button 
          className="nav-button"
          onClick={goToPrevQuestion}
          disabled={current_index <= 0}
        >
          Предыдущий
        </button>

        {!showResult ? (
          <button 
            className="check-button"
            onClick={checkAnswer}
            disabled={selectedAnswer === null}
          >
            Проверить
          </button>
        ) : (
          <button 
            className="next-button"
            onClick={goToNextQuestion}
          >
            {parseInt(current_index) + 1 < total_questions ? 'Следующий' : 'Завершить тест'}
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizQuestion; 