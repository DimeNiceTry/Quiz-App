import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    return savedAnswers ? JSON.parse(savedAnswers) : {};
  });
  const [canAnswer, setCanAnswer] = useState(true);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(null);
  // Таймер
  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef(null);

  // Функция загрузки данных вопроса
  const loadQuestionData = useCallback(async () => {
    try {
      setLoading(true);
      
      const data = await fetchQuizQuestion(quizId, questionIndex);
      setQuestionData(data);
      setError(null);
      
      // Инициализация таймера, если у теста есть ограничение времени
      if (data.time_limit && data.time_limit > 0) {
        // Проверяем, есть ли сохраненное время начала теста
        const startTime = sessionStorage.getItem(`quiz_${quizId}_start_time`);
        
        if (!startTime) {
          // Если это первый вопрос, устанавливаем время начала
          const now = new Date().getTime();
          sessionStorage.setItem(`quiz_${quizId}_start_time`, now);
          
          // Устанавливаем таймер на все время теста в секундах
          setTimeLeft(data.time_limit * 60);
        } else {
          // Если тест уже был начат, вычисляем оставшееся время
          const elapsedSeconds = Math.floor((new Date().getTime() - startTime) / 1000);
          const totalSeconds = data.time_limit * 60;
          const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
          
          setTimeLeft(remainingSeconds);
          
          // Если время уже вышло, автоматически завершаем тест
          if (remainingSeconds <= 0) {
            handleTimeUp();
          }
        }
      } else {
        setTimeLeft(null); // Нет ограничения времени
      }
      
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
    setCanAnswer(true); // Сбрасываем флаг, чтобы можно было отвечать на следующий вопрос
    
    // Загрузка данных вопроса
    loadQuestionData().then(data => {
      if (!data) return;
      
      // После успешной загрузки данных - восстанавливаем ответ пользователя из sessionStorage
      const savedAnswers = JSON.parse(sessionStorage.getItem(`quiz_${quizId}_answers`) || '{}');
      if (savedAnswers && savedAnswers[data.question.id]) {
        const savedAnswer = savedAnswers[data.question.id];
        setSelectedAnswer(savedAnswer.answerId);
        if (!data.hide_answers) {
          setIsCorrectAnswer(savedAnswer.isCorrect);
          setCanAnswer(!savedAnswer.showResult);
        }
      }
    });
  }, [quizId, questionIndex, loadQuestionData]);

  // Отдельный эффект для восстановления сохраненных ответов
  useEffect(() => {
    if (!questionData) return;
    
    // Проверяем, есть ли уже ответ на этот вопрос
    if (userAnswers[questionData.question.id]) {
      const savedAnswer = userAnswers[questionData.question.id];
      const answerObj = questionData.question.answers.find(a => a.id === savedAnswer.answerId);
      if (answerObj) {
        setSelectedAnswer(answerObj.id);
        if (savedAnswer.checked) {
          setShowResult(true);
        }
      }
    }
  }, [questionData, userAnswers]);

  // Обратный отсчет времени
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timerRef.current);
  }, [timeLeft]);

  // Обработчик окончания времени
  const handleTimeUp = () => {
    // Подготовим данные о завершенном тесте
    // Подсчитываем правильные ответы
    const updatedAnswers = {...userAnswers};
    // Если пользователь выбрал ответ на текущий вопрос, добавляем его
    if (selectedAnswer) {
      const selectedAnswerObj = questionData.question.answers.find(a => a.id === selectedAnswer);
      const isCorrect = selectedAnswerObj?.is_correct || false;
      
      updatedAnswers[questionData.question.id] = { 
        questionId: questionData.question.id, 
        questionIndex: parseInt(questionIndex),
        questionText: questionData.question.text,
        answerId: selectedAnswer,
        answerText: selectedAnswerObj?.text || 'Не найдено',
        isCorrect: isCorrect,
        showResult: false
      };
    }
    
    const correctAnswers = Object.values(updatedAnswers).filter(a => a && a.isCorrect).length;
    
    // Переход к результатам с текущими ответами
    navigate(`/quizzes/${quizId}/results`, { 
      state: { 
        quizId: quizId,
        quizTitle: questionData.quiz_title,
        userAnswers: updatedAnswers,
        score: correctAnswers,
        maxScore: questionData?.total_questions || 0,
        hideAnswers: questionData?.hide_answers,
        timeExpired: true,
        questions: [questionData.question]
      } 
    });
  };

  // Форматирование времени в MM:SS
  const formatTime = (seconds) => {
    if (seconds === null) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answerId) => {
    if (!canAnswer) return;
    
    // Обновляем выбранный ответ
    setSelectedAnswer(answerId);
    
    // Сохраняем в локальное состояние
    const selectedAnswerObj = questionData.question.answers.find(a => a.id === answerId);
    const isCorrect = selectedAnswerObj?.is_correct || false;
    
    // Если включен автоматический переход к следующему вопросу, вызываем checkAnswer
    if (questionData.auto_next_question) {
      checkAnswer(answerId);
    }
  };

  // Функция для проверки ответа
  const checkAnswer = (answerId) => {
    if (!canAnswer) return;
    
    setSelectedAnswer(answerId);
    
    // Находим выбранный ответ и проверяем его правильность
    const selectedAnswerObj = questionData.question.answers.find(a => a.id === answerId);
    
    // Добавляем отладочную информацию
    console.log('Выбранный ответ:', selectedAnswerObj);
    console.log('Свойства ответа:', Object.keys(selectedAnswerObj));
    console.log('Правильный ответ?', selectedAnswerObj.is_correct);
    
    const isCorrect = selectedAnswerObj && 'is_correct' in selectedAnswerObj ? selectedAnswerObj.is_correct : false;
    console.log('Определено как правильный?', isCorrect);
    
    // Используем более надежную структуру для хранения ответов
    // Теперь вместо индексированного массива используем объект, где ключи - это ID вопросов
    const updatedAnswers = {...userAnswers};
    
    // Сохраняем ответ с явной привязкой к ID вопроса
    updatedAnswers[questionData.question.id] = { 
      questionId: questionData.question.id, 
      questionIndex: parseInt(questionIndex), // Сохраняем для сортировки
      questionText: questionData.question.text, // Сохраняем текст вопроса
      answerId: answerId,
      answerText: selectedAnswerObj?.text || 'Не найдено', // Сохраняем текст ответа
      isCorrect: isCorrect,
      showResult: questionData.hide_answers ? false : true
    };
    
    console.log('Сохраняем ответ с ID вопроса:', questionData.question.id);
    console.log('Обновленные ответы:', updatedAnswers);
    
    setUserAnswers(updatedAnswers);
    
    // Сохраняем ответы в sessionStorage после обновления
    sessionStorage.setItem(`quiz_${quizId}_answers`, JSON.stringify(updatedAnswers));
    
    // Если hide_answers включен, не показываем результат сразу
    if (questionData.hide_answers) {
      setCanAnswer(false);
      
      // Короткая пауза перед переходом к следующему вопросу
      setTimeout(() => {
        if (parseInt(questionIndex) < questionData.total_questions - 1) {
          // Переходим к следующему вопросу
          navigate(`/quizzes/${quizId}/questions/${parseInt(questionIndex) + 1}`);
        } else {
          // Это был последний вопрос, переходим к результатам
          // Преобразуем объект ответов в массив для подсчета
          const answersArray = Object.values(updatedAnswers);
          // Подсчитываем правильные ответы
          const correctAnswers = answersArray.filter(a => a && a.isCorrect).length;
          
          navigate(`/quizzes/${quizId}/results`, { 
            state: { 
              quizId: quizId,
              quizTitle: questionData.quiz_title,
              userAnswers: updatedAnswers,
              score: correctAnswers,
              maxScore: questionData.total_questions,
              hideAnswers: questionData.hide_answers,
              questions: [questionData.question]
            } 
          });
        }
      }, 500);
      
      return;
    }
    
    // Старое поведение (когда hide_answers выключен)
    setIsCorrectAnswer(isCorrect);
    setCanAnswer(false);
    
    // Показываем результат на 2 секунды перед переходом
    setTimeout(() => {
      if (parseInt(questionIndex) < questionData.total_questions - 1) {
        // Переходим к следующему вопросу
        navigate(`/quizzes/${quizId}/questions/${parseInt(questionIndex) + 1}`);
      } else {
        // Это был последний вопрос, переходим к результатам
        // Преобразуем объект ответов в массив для подсчета
        const answersArray = Object.values(updatedAnswers);
        // Подсчитываем правильные ответы
        const correctAnswers = answersArray.filter(a => a && a.isCorrect).length;
        
        navigate(`/quizzes/${quizId}/results`, { 
          state: { 
            quizId: quizId,
            quizTitle: questionData.quiz_title,
            userAnswers: updatedAnswers,
            score: correctAnswers,
            maxScore: questionData.total_questions,
            hideAnswers: false,
            questions: [questionData.question]
          } 
        });
      }
    }, 2000);
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
          userAnswers: Object.values(userAnswers).filter(answer => answer), // Убираем пустые элементы
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

  // Обработчик кнопки завершения теста
  const handleFinishQuiz = () => {
    // Добавляем текущий ответ, если он выбран
    if (selectedAnswer && questionData) {
      const selectedAnswerObj = questionData.question.answers.find(a => a.id === selectedAnswer);
      const isCorrect = selectedAnswerObj?.is_correct || false;
      
      const updatedAnswers = {...userAnswers};
      updatedAnswers[questionData.question.id] = { 
        questionId: questionData.question.id, 
        questionIndex: parseInt(questionIndex),
        questionText: questionData.question.text,
        answerId: selectedAnswer,
        answerText: selectedAnswerObj?.text || 'Не найдено',
        isCorrect: isCorrect,
        showResult: false
      };
      
      setUserAnswers(updatedAnswers);
      
      // Сохраняем ответы в sessionStorage
      sessionStorage.setItem(`quiz_${quizId}_answers`, JSON.stringify(updatedAnswers));
    }
    
    // Получаем данные о всех вопросах теста
    const loadAllQuestions = async () => {
      try {
        const allQuestions = [];
        const totalQuestions = questionData.total_questions;
        
        // Загружаем все вопросы
        for (let i = 0; i < totalQuestions; i++) {
          const questionData = await fetchQuizQuestion(quizId, i);
          allQuestions.push(questionData.question);
        }
        
        // Вычисляем количество правильных ответов
        const updatedUserAnswers = Object.values(userAnswers).filter(answer => answer); // Убираем пустые элементы
        const correctAnswers = updatedUserAnswers.filter(a => a.isCorrect).length;
        
        // Перенаправляем на страницу результатов
        navigate(`/quizzes/${quizId}/results`, {
          state: {
            quizId: quizId,
            quizTitle: questionData.quiz_title,
            userAnswers: updatedUserAnswers,
            score: correctAnswers,
            maxScore: totalQuestions,
            questions: allQuestions
          }
        });
      } catch (error) {
        console.error("Ошибка при загрузке всех вопросов:", error);
        setError("Не удалось загрузить все вопросы для подсчета результатов");
      }
    };
    
    loadAllQuestions();
  };

  // Обработчик кнопки досрочного завершения
  const handleFinish = () => {
    if (window.confirm('Вы уверены, что хотите завершить тест? Все несохраненные ответы будут потеряны.')) {
      handleFinishQuiz();
    }
  };

  // Стили для отображения результата
  const getAnswerClassName = (answer) => {
    // Если ответ выбран, но кнопка "Ответить" еще не нажата
    if (canAnswer && selectedAnswer === answer.id) {
      return 'answer-option selected';
    }
    
    // Если кнопка "Ответить" уже нажата (canAnswer = false)
    if (!canAnswer && selectedAnswer === answer.id) {
      // Если hide_answers включен, не показываем правильность
      if (questionData.hide_answers) {
        return 'answer-option selected';
      }
      
      return answer.is_correct 
        ? 'answer-option selected correct' 
        : 'answer-option selected incorrect';
    } else if (!canAnswer && answer.is_correct) {
      // Если hide_answers включен, не показываем правильный ответ
      if (questionData.hide_answers) {
        return 'answer-option';
      }
      
      return 'answer-option correct';
    }
    
    // Обычный вариант ответа
    return 'answer-option';
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
  const progressPercent = Math.round((currentQuestionNumber / total_questions) * 100);

  return (
    <div className="quiz-question-container">
      {/* Таймер */}
      {timeLeft !== null && (
        <div className={`timer ${timeLeft < 60 ? 'timer-warning' : ''}`}>
          Оставшееся время: {formatTime(timeLeft)}
        </div>
      )}
      
      <h1>{quiz_title}</h1>
      
      <div className="quiz-progress">
        <div className="progress-text">
          Вопрос {parseInt(questionIndex) + 1} из {questionData?.total_questions}
        </div>
        <div className="progress-bar-container">
          <div 
            className="progress-bar" 
            style={{ width: `${(parseInt(questionIndex) + 1) / questionData?.total_questions * 100}%` }}
          ></div>
        </div>
      </div>

      <h2 className="question-text">{questionData?.question?.text}</h2>

      <div className="answers-container">
        {questionData?.question?.answers.map(answer => (
          <div 
            key={answer.id} 
            className={getAnswerClassName(answer)}
            onClick={() => canAnswer && handleAnswerSelect(answer.id)}
          >
            {answer.text}
          </div>
        ))}
      </div>

      <div className="navigation-buttons">
        <button 
          className="check-button"
          onClick={() => canAnswer && checkAnswer(selectedAnswer)}
          disabled={selectedAnswer === null || !canAnswer}
        >
          Ответить
        </button>
      </div>
    </div>
  );
};

export default QuizQuestion; 