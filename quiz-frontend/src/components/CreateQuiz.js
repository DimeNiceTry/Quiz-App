import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createQuiz } from '../api';
import './CreateQuiz.css';

const CreateQuiz = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [hideAnswers, setHideAnswers] = useState(true);
  const [timeLimit, setTimeLimit] = useState(0);
  const [questions, setQuestions] = useState([
    { text: '', answers: [{ text: '', is_correct: false }, { text: '', is_correct: false }] }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Добавление нового вопроса
  const addQuestion = () => {
    setQuestions([...questions, { 
      text: '', 
      answers: [{ text: '', is_correct: false }, { text: '', is_correct: false }] 
    }]);
  };

  // Удаление вопроса
  const removeQuestion = (questionIndex) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, index) => index !== questionIndex));
    } else {
      setError('Квиз должен содержать хотя бы один вопрос');
    }
  };

  // Обновление текста вопроса
  const updateQuestionText = (index, text) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index].text = text;
    setQuestions(updatedQuestions);
  };

  // Добавление ответа к вопросу
  const addAnswer = (questionIndex) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].answers.push({ text: '', is_correct: false });
    setQuestions(updatedQuestions);
  };

  // Удаление ответа
  const removeAnswer = (questionIndex, answerIndex) => {
    const updatedQuestions = [...questions];
    if (updatedQuestions[questionIndex].answers.length > 2) {
      updatedQuestions[questionIndex].answers = updatedQuestions[questionIndex].answers
        .filter((_, index) => index !== answerIndex);
      setQuestions(updatedQuestions);
    } else {
      setError('Вопрос должен содержать хотя бы два варианта ответа');
    }
  };

  // Обновление текста ответа
  const updateAnswerText = (questionIndex, answerIndex, text) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].answers[answerIndex].text = text;
    setQuestions(updatedQuestions);
  };

  // Обновление флага правильности ответа
  const updateAnswerCorrectness = (questionIndex, answerIndex) => {
    const updatedQuestions = [...questions];
    // Сначала сбрасываем все ответы на false
    updatedQuestions[questionIndex].answers.forEach(answer => {
      answer.is_correct = false;
    });
    // Устанавливаем выбранный ответ как правильный
    updatedQuestions[questionIndex].answers[answerIndex].is_correct = true;
    setQuestions(updatedQuestions);
  };

  // Проверяем, что каждый вопрос имеет хотя бы один правильный ответ
  const validateQuiz = () => {
    let valid = true;
    let errorMessage = '';

    if (!title.trim()) {
      errorMessage = 'Пожалуйста, введите название квиза';
      valid = false;
    } else {
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        if (!question.text.trim()) {
          errorMessage = `Пожалуйста, введите текст для вопроса ${i + 1}`;
          valid = false;
          break;
        }

        const hasCorrectAnswer = question.answers.some(answer => answer.is_correct);
        if (!hasCorrectAnswer) {
          errorMessage = `Пожалуйста, отметьте правильный ответ для вопроса ${i + 1}`;
          valid = false;
          break;
        }

        for (let j = 0; j < question.answers.length; j++) {
          if (!question.answers[j].text.trim()) {
            errorMessage = `Пожалуйста, введите текст для ответа ${j + 1} в вопросе ${i + 1}`;
            valid = false;
            break;
          }
        }

        if (!valid) break;
      }
    }

    if (!valid) {
      setError(errorMessage);
    }
    return valid;
  };

  // Отправка формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateQuiz()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const quizData = {
        title,
        hide_answers: hideAnswers,
        time_limit: timeLimit,
        questions
      };

      await createQuiz(quizData);
      navigate('/quizzes'); // Перенаправляем на страницу со списком квизов
    } catch (error) {
      console.error('Ошибка при создании квиза:', error);
      setError('Произошла ошибка при создании квиза');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-quiz-container">
      <h2>Создание нового теста</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="quiz-title">Название теста:</label>
          <input
            type="text"
            id="quiz-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Введите название теста"
            required
          />
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={hideAnswers}
              onChange={(e) => setHideAnswers(e.target.checked)}
            />
            Скрывать правильные ответы до окончания теста
          </label>
        </div>

        <div className="form-group">
          <label htmlFor="time-limit">Ограничение времени (в минутах):</label>
          <input
            type="number"
            id="time-limit"
            value={timeLimit}
            onChange={(e) => setTimeLimit(Number(e.target.value))}
            min="0"
            placeholder="0 - без ограничения"
          />
          <small className="form-text">0 - без ограничения времени</small>
        </div>

        <div className="questions-container">
          <h3>Вопросы:</h3>
          
          {questions.map((question, questionIndex) => (
            <div key={questionIndex} className="question-block">
              <div className="question-header">
                <span>Вопрос {questionIndex + 1}</span>
                <button 
                  type="button" 
                  className="remove-button"
                  onClick={() => removeQuestion(questionIndex)}
                >
                  Удалить вопрос
                </button>
              </div>
              
              <div className="form-group">
                <label htmlFor={`question-${questionIndex}`}>Текст вопроса:</label>
                <input
                  type="text"
                  id={`question-${questionIndex}`}
                  value={question.text}
                  onChange={(e) => updateQuestionText(questionIndex, e.target.value)}
                  placeholder="Введите текст вопроса"
                  required
                />
              </div>

              <div className="answers-container">
                <h4>Варианты ответов:</h4>
                
                {question.answers.map((answer, answerIndex) => (
                  <div key={answerIndex} className="answer-block">
                    <div className="form-group">
                      <input
                        type="text"
                        value={answer.text}
                        onChange={(e) => updateAnswerText(questionIndex, answerIndex, e.target.value)}
                        placeholder={`Вариант ответа ${answerIndex + 1}`}
                        required
                      />
                    </div>
                    
                    <div className="answer-controls">
                      <label className="radio-label">
                        <input
                          type="radio"
                          name={`correct-answer-${questionIndex}`}
                          checked={answer.is_correct}
                          onChange={() => updateAnswerCorrectness(questionIndex, answerIndex)}
                        />
                        Правильный ответ
                      </label>
                      
                      <button
                        type="button"
                        className="remove-button small"
                        onClick={() => removeAnswer(questionIndex, answerIndex)}
                      >
                        Удалить ответ
                      </button>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  className="add-button"
                  onClick={() => addAnswer(questionIndex)}
                >
                  Добавить вариант ответа
                </button>
              </div>
            </div>
          ))}
          
          <button
            type="button"
            className="add-button"
            onClick={addQuestion}
          >
            Добавить вопрос
          </button>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Создание...' : 'Создать тест'}
          </button>
          <button
            type="button"
            className="cancel-button"
            onClick={() => navigate('/quizzes')}
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateQuiz; 