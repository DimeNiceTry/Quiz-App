import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import QuizList from './QuizList';
import QuizDetail from './components/QuizDetail';
import QuizQuestion from './components/QuizQuestion';
import QuizResults from './components/QuizResults';
import { checkAuthStatus } from './api';
import './App.css';

function App() {
    const [authenticated, setAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        // Получаем параметры URL
        const searchParams = new URLSearchParams(location.search);
        const authParam = searchParams.get('auth');

        // Проверяем, есть ли параметр auth=success
        if (authParam === 'success') {
            console.log('Обнаружен параметр auth=success в URL');
            setAuthenticated(true);
            setLoading(false);
            return;
        }

        // Проверяем cookie is_authenticated
        const cookies = document.cookie.split('; ');
        const authCookie = cookies.find(cookie => cookie.startsWith('is_authenticated='));
        
        if (authCookie && authCookie.split('=')[1] === 'true') {
            console.log('Обнаружен cookie is_authenticated=true');
            setAuthenticated(true);
            setLoading(false);
            return;
        }

        const checkAuth = async () => {
            try {
                console.log('Выполняем проверку авторизации через API...');
                const authData = await checkAuthStatus();
                console.log('Результат проверки авторизации:', authData);
                setAuthenticated(authData.authenticated);
            } catch (error) {
                console.error('Ошибка при проверке авторизации:', error);
                setAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [location.search]);

    if (loading) {
        return <div className="loading">Загрузка...</div>;
    }

    console.log('Текущее состояние авторизации:', authenticated);

    return (
        <div className="App">
            <Routes>
                <Route path="/" element={authenticated ? <Navigate to="/quizzes" /> : <Navigate to="/login" />} />
                <Route path="/quizzes" element={authenticated ? <QuizList /> : <Navigate to="/login" />} />
                <Route path="/quizzes/:quizId/details" element={authenticated ? <QuizDetail /> : <Navigate to="/login" />} />
                <Route path="/quizzes/:quizId/questions/:questionIndex" element={authenticated ? <QuizQuestion /> : <Navigate to="/login" />} />
                <Route path="/quizzes/:quizId/results" element={authenticated ? <QuizResults /> : <Navigate to="/login" />} />
                <Route path="/login" element={
                    authenticated ? 
                    <Navigate to="/quizzes" /> : 
                    <div className="login-container">
                        <h1>Вход в систему</h1>
                        <a href="http://localhost:8000/accounts/google/login/" className="google-login-button">
                            Войти через Google
                        </a>
                    </div>
                } />
            </Routes>
        </div>
    );
}

export default App;