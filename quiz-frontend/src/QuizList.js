import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchQuizzes } from './api'; // Импортируем функцию fetchQuizzes из api.js
import './QuizList.css';

const QuizList = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadQuizzes = async () => {
            try {
                setLoading(true);
                const quizzesData = await fetchQuizzes();
                setQuizzes(quizzesData);
                setError(null);
            } catch (err) {
                setError('Ошибка при загрузке квизов. Пожалуйста, попробуйте позже.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadQuizzes();
    }, []);

    if (loading) {
        return <div className="loading">Загрузка...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="quiz-list-container">
            <h1>Доступные тесты</h1>
            
            {quizzes.length === 0 ? (
                <p className="no-quizzes">Нет доступных тестов</p>
            ) : (
                <div className="quiz-grid">
                    {quizzes.map(quiz => (
                        <Link to={`/quizzes/${quiz.id}/details`} key={quiz.id} className="quiz-card">
                            <h2>{quiz.title}</h2>
                            <p>Автор: {quiz.author}</p>
                            <p>Создан: {new Date(quiz.created_at).toLocaleDateString()}</p>
                            <button className="view-quiz-button">Начать тест</button>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default QuizList;