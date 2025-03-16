import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import QuizList from './QuizList';
import QuizDetail from './components/QuizDetail';
import QuizQuestion from './components/QuizQuestion';
import QuizResults from './components/QuizResults';
import UserResults from './components/UserResults';
import AdminResults from './components/AdminResults';
import { checkAuthStatus } from './api';
import './App.css';

function App() {
    const [authenticated, setAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
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
                
                // Проверяем, является ли пользователь администратором
                setIsAdmin(authData.is_staff || authData.is_superuser);
            } catch (error) {
                console.error('Ошибка при проверке авторизации:', error);
                setAuthenticated(false);
                setIsAdmin(false);
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
            <nav className="navbar">
                <div className="navbar-brand">
                    <Link to="/">Quiz App</Link>
                </div>
                {authenticated && (
                    <div className="nav-links">
                        <Link to="/" className="nav-link">Главная</Link>
                        <Link to="/results-history" className="nav-link">История результатов</Link>
                        {isAdmin && (
                            <Link to="/admin/results" className="nav-link admin-link">Результаты пользователей</Link>
                        )}
                    </div>
                )}
                <div className="auth-buttons">
                    {authenticated ? (
                        <button className="logout-button" onClick={() => {}}>Выйти</button>
                    ) : (
                        <button className="login-button" onClick={() => {}}>Войти</button>
                    )}
                </div>
            </nav>
            <Routes>
                <Route path="/" element={authenticated ? <Navigate to="/quizzes" /> : <Navigate to="/login" />} />
                <Route path="/quizzes" element={authenticated ? <QuizList /> : <Navigate to="/login" />} />
                <Route path="/quizzes/:quizId/details" element={authenticated ? <QuizDetail /> : <Navigate to="/login" />} />
                <Route path="/quizzes/:quizId/questions/:questionIndex" element={authenticated ? <QuizQuestion /> : <Navigate to="/login" />} />
                <Route path="/quizzes/:quizId/results" element={authenticated ? <QuizResults /> : <Navigate to="/login" />} />
                <Route path="/results-history" element={authenticated ? <UserResults /> : <Navigate to="/login" />} />
                <Route path="/admin/results" element={
                    authenticated ? (
                        isAdmin ? <AdminResults /> : <Navigate to="/" />
                    ) : <Navigate to="/login" />
                } />
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