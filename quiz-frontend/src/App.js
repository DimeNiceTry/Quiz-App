import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import QuizList from './QuizList';
import QuizDetail from './components/QuizDetail';
import QuizQuestion from './components/QuizQuestion';
import QuizResults from './components/QuizResults';
import UserResults from './components/UserResults';
import AdminResults from './components/AdminResults';
import CreateQuiz from './components/CreateQuiz';
import { checkAuthStatus, logout } from './api';
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
        
        // Получаем параметры из фрагмента URL (после #)
        const hashSearch = location.hash.split('?')[1] || '';
        const hashParams = new URLSearchParams(hashSearch);
        const hashAuthParam = hashParams.get('auth');
        
        // Объединяем проверки для лучшей совместимости
        const isAuthSuccess = authParam === 'success' || 
                            hashAuthParam === 'success' || 
                            location.hash.includes('auth=success');

        // Проверяем, есть ли параметр auth=success в URL или hash
        if (isAuthSuccess) {
            console.log('Обнаружен параметр auth=success в URL');
            setAuthenticated(true);
            // Устанавливаем cookie для будущих сессий
            document.cookie = 'is_authenticated=true; path=/; secure; samesite=none; max-age=2592000'; // 30 дней
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
    }, [location.search, location.hash]);

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
                        {/* Временно скрыто для обычных пользователей 
                        <Link to="/results-history" className="nav-link">История результатов</Link>
                        */}
                        {isAdmin && (
                            <>
                                <Link to="/results-history" className="nav-link">История результатов</Link>
                                <Link to="/admin/results" className="nav-link admin-link">Результаты пользователей</Link>
                            </>
                        )}
                        <Link to="/create-quiz" className="nav-link create-link">Создать тест</Link>
                    </div>
                )}
                <div className="auth-buttons">
                    {authenticated ? (
                        <button className="logout-button" onClick={() => logout()}>Выйти</button>
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
                <Route path="/create-quiz" element={authenticated ? <CreateQuiz /> : <Navigate to="/login" />} />
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
                        <a href="#" className="google-login-button" onClick={(e) => {
                            e.preventDefault();
                            
                            // Простое перенаправление на URL авторизации
                            const loginUrl = process.env.NODE_ENV === 'production'
                                ? "https://quiz-app-km8k.onrender.com/accounts/google/login/"
                                : "http://localhost:8000/accounts/google/login/";
                            
                            console.log('Перенаправление на авторизацию Google:', loginUrl);
                            
                            // Создаем куку для обнаружения успешного возврата
                            document.cookie = 'login_pending=true; path=/; secure; samesite=none; max-age=600'; // 10 минут
                            
                            // Прямой переход на страницу авторизации
                            window.location.href = loginUrl;
                        }}>
                            Войти через Google
                        </a>
                        <p className="login-info">
                            Этот сервис использует аутентификацию через Google для обеспечения безопасного входа
                        </p>
                        {process.env.NODE_ENV === 'development' && (
                            <div className="debug-info">
                                <h3>Отладочная информация:</h3>
                                <p>Окружение: {process.env.NODE_ENV}</p>
                                <p>URL: {window.location.href}</p>
                                <p>Hash: {window.location.hash}</p>
                                <p>API URL: {process.env.REACT_APP_API_URL || "не установлено"}</p>
                            </div>
                        )}
                    </div>
                } />
            </Routes>
        </div>
    );
}

export default App;