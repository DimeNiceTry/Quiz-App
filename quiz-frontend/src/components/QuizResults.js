import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './QuizResults.css';
import { saveQuizResult } from '../api';

const QuizResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { quizId, quizTitle, userAnswers: initialUserAnswers, questions, score: initialScore, maxScore: initialMaxScore, hideAnswers, timeExpired } = location.state || {};
  const [userAnswers, setUserAnswers] = useState(initialUserAnswers || []);
  const [score, setScore] = useState(initialScore || 0);
  const [maxScore, setMaxScore] = useState(initialMaxScore || 0);
  const [resultSaved, setResultSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [hideAnswersState, setHideAnswersState] = useState(hideAnswers);
  const [timeExpiredState, setTimeExpiredState] = useState(timeExpired || false);
  
  // Проверяем, что все нужные данные переданы
  useEffect(() => {
    if (!quizId || !quizTitle || !userAnswers || !questions) {
      navigate('/');
    }
  }, [quizId, quizTitle, userAnswers, questions, navigate]);
  
  useEffect(() => {
    if (location.state) {
      const { userAnswers, score, maxScore, hideAnswers, timeExpired } = location.state;
      setUserAnswers(userAnswers);
      setScore(score);
      setMaxScore(maxScore);
      setHideAnswersState(hideAnswers);
      setTimeExpiredState(timeExpired || false);
    }
  }, []);
  
  // Вычисляем результаты
  const calculateResults = () => {
    console.log("===== Начало расчета результатов =====");
    console.log("userAnswers:", userAnswers);
    console.log("questions:", questions);
    console.log("initialScore:", initialScore);
    console.log("initialMaxScore:", initialMaxScore);
    
    if (!questions || !userAnswers) return { score: 0, maxScore: 0, answersDetails: [] };
    
    // Если questions - массив с одним элементом (текущий вопрос),
    // используем переданные score и maxScore
    if (questions.length === 1 && initialScore !== undefined && initialMaxScore !== undefined) {
      // Создадим детали для отображения, даже если это только последний вопрос
      const answersDetails = [];
      
      // Проверяем, какой тип у userAnswers: массив или объект
      const isArrayAnswers = Array.isArray(userAnswers);
      const answersArray = isArrayAnswers ? userAnswers : Object.values(userAnswers);
      
      console.log("Тип ответов:", isArrayAnswers ? "массив" : "объект");
      console.log("Ответы:", answersArray);
      
      // Добавляем детали ответа, если они доступны
      if (answersArray.length > 0 && questions[0]) {
        for (let i = 0; i < answersArray.length; i++) {
          const userAnswer = answersArray[i];
          if (!userAnswer) continue;
          
          // Используем сохраненный текст вопроса, если он есть
          const questionText = userAnswer.questionText || questions[0].text;
          
          // Используем сохраненный текст ответа, если он есть
          let answerText = 'Не найдено';
          if (userAnswer.answerText) {
            answerText = userAnswer.answerText;
          } else if (userAnswer.text) {
            answerText = userAnswer.text;
          } else {
            // Иначе ищем ответ по ID
            const question = questions.find(q => q.id === userAnswer.questionId) || questions[0];
            const answerObj = question.answers.find(a => a.id === userAnswer.answerId);
            if (answerObj) {
              answerText = answerObj.text;
            }
          }
          
          // Находим правильные ответы для текущего вопроса
          let correctAnswers = '';
          const question = questions.find(q => q.id === userAnswer.questionId) || questions[0];
          if (question && question.answers) {
            correctAnswers = question.answers
              .filter(a => a.is_correct)
              .map(a => a.text)
              .join(', ');
          }
          
          answersDetails.push({
            questionText: questionText,
            userAnswer: answerText,
            correctAnswers,
            isCorrect: userAnswer.isCorrect
          });
        }
        
        // Сортируем ответы по индексу вопроса, если он есть
        answersDetails.sort((a, b) => {
          const indexA = answersArray.find(ans => ans.questionText === a.questionText)?.questionIndex || 0;
          const indexB = answersArray.find(ans => ans.questionText === b.questionText)?.questionIndex || 0;
          return indexA - indexB;
        });
      }
      
      return { 
        score: initialScore, 
        maxScore: initialMaxScore, 
        answersDetails 
      };
    }
    
    let score = 0;
    const maxScore = questions.length;
    const answersDetails = [];
    
    // Обычная обработка для полного набора вопросов
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (!question) continue;
      
      // Пользовательский ответ на этот вопрос
      let userAnswer;
      if (Array.isArray(userAnswers)) {
        userAnswer = userAnswers[i];
      } else if (typeof userAnswers === 'object') {
        userAnswer = userAnswers[question.id];
      }
      
      if (!userAnswer) {
        answersDetails.push({
          questionText: question.text,
          userAnswer: 'Не отвечено',
          correctAnswers: question.answers.filter(a => a.is_correct).map(a => a.text).join(', '),
          isCorrect: false
        });
        continue;
      }
      
      // Проверяем правильность ответа
      const isCorrect = userAnswer.isCorrect;
      if (isCorrect) {
        score++;
      }
      
      // Находим текст ответа пользователя
      let answerText = 'Не найдено';
      if (userAnswer.answerText) {
        answerText = userAnswer.answerText;
      } else if (userAnswer.text) {
        answerText = userAnswer.text;
      } else {
        // Иначе ищем ответ по ID
        const answerObj = question.answers.find(a => a.id === userAnswer.answerId);
        if (answerObj) {
          answerText = answerObj.text;
        }
      }
      
      answersDetails.push({
        questionText: question.text,
        userAnswer: answerText,
        correctAnswers: question.answers.filter(a => a.is_correct).map(a => a.text).join(', '),
        isCorrect
      });
    }
    
    // Сортируем ответы по индексу вопроса, если он есть
    answersDetails.sort((a, b) => {
      // Находим соответствующие ответы пользователя
      const answersArray = Array.isArray(userAnswers) ? userAnswers : Object.values(userAnswers);
      const answerA = answersArray.find(ans => ans.questionText === a.questionText);
      const answerB = answersArray.find(ans => ans.questionText === b.questionText);
      const indexA = answerA?.questionIndex !== undefined ? answerA.questionIndex : 0;
      const indexB = answerB?.questionIndex !== undefined ? answerB.questionIndex : 0;
      return indexA - indexB;
    });
    
    return { score, maxScore, answersDetails };
  };
  
  const { score: calculatedScore, maxScore: calculatedMaxScore, answersDetails } = calculateResults();
  
  // Убедимся, что делитель не равен нулю
  const percentage = calculatedMaxScore > 0 ? Math.round((calculatedScore / calculatedMaxScore) * 100) : 0;
  
  // Сохраняем результат в БД
  useEffect(() => {
    const saveResult = async () => {
      if (quizId && !resultSaved && calculatedScore !== undefined && calculatedMaxScore !== undefined) {
        try {
          console.log('Сохранение результатов:', {
            quizId,
            calculatedScore,
            calculatedMaxScore,
            answersDetails
          });

          // Преобразуем answersDetails в формат для сохранения
          const detailedAnswers = answersDetails.map(detail => ({
            question_text: detail.questionText,
            user_answer: detail.userAnswer,
            correct_answer: detail.correctAnswers,
            is_correct: detail.isCorrect
          }));
          
          await saveQuizResult(quizId, calculatedScore, calculatedMaxScore, detailedAnswers);
          setResultSaved(true);
        } catch (error) {
          console.error('Ошибка при сохранении результата:', error);
          setSaveError(error.message);
        }
      }
    };
    
    saveResult();
  }, [quizId, calculatedScore, calculatedMaxScore, resultSaved, answersDetails]);
  
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
            <span className="score-value">{calculatedScore}</span>
            <span className="score-divider">/</span>
            <span className="max-score">{calculatedMaxScore}</span>
          </div>
          <div className="score-percentage" style={{ color: rating.color }}>
            {percentage}%
          </div>
        </div>
        
        <div className="rating-box" style={{ backgroundColor: rating.color }}>
          <div className="rating-label">Оценка:</div>
          <div className="rating-value">{rating.grade}</div>
        </div>
        
        <h3>Ваш результат: {calculatedScore} из {calculatedMaxScore}</h3>
        <p>Процент правильных ответов: {Math.round((calculatedScore / calculatedMaxScore) * 100)}%</p>
        
        {timeExpiredState && (
          <div className="time-expired-message">
            <p>Тест был завершен автоматически из-за истечения отведенного времени.</p>
          </div>
        )}
        
        {hideAnswersState && (
          <div className="info-box">
            <p>В этом тесте правильные ответы скрыты от пользователей. После завершения теста вы можете увидеть только общий счет.</p>
          </div>
        )}
      </div>
      
      {!hideAnswersState && (
        <div className="questions-results">
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
        </div>
      )}
      
      {saveError && (
        <div className="error-message">
          Ошибка при сохранении результата: {saveError}
        </div>
      )}
      
      <div className="results-actions">
        <button 
          className="retry-button"
          onClick={() => navigate(`/quiz/${quizId}`)}
        >
          Попробовать еще раз
        </button>
      </div>
    </div>
  );
};

export default QuizResults;