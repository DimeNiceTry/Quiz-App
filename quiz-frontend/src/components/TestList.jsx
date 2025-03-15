import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

function TestList() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Проверка параметров URL для успешной авторизации
    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get('auth') === 'success';
    
    if (authSuccess) {
      localStorage.setItem('isAuthenticated', 'true');
      // Удаляем параметр из URL без перезагрузки страницы
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Проверка аутентификации через API
    axios.get('http://localhost:8000/api/auth/check/', { 
      withCredentials: true
    })
      .then(response => {
        console.log('Проверка аутентификации:', response.data);
        if (response.data.authenticated) {
          setIsAuthenticated(true);
          localStorage.setItem('isAuthenticated', 'true');
          
          // Если пользователь аутентифицирован, загружаем тесты
          return axios.get('http://localhost:8000/api/quizzes/', { 
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
            }
          });
        } else {
          // Проверяем локальное хранилище как запасной вариант
          const isAuthLocal = localStorage.getItem('isAuthenticated') === 'true';
          setIsAuthenticated(isAuthLocal);
          
          if (isAuthLocal) {
            // Если в localStorage есть флаг авторизации, пробуем загрузить тесты
            return axios.get('http://localhost:8000/api/quizzes/', { 
              withCredentials: true,
              headers: {
                'Content-Type': 'application/json',
              }
            });
          } else {
            throw new Error('Не авторизован');
          }
        }
      })
      .then(response => {
        if (response) {
          setTests(response.data);
        }
        setLoading(false);
        setAuthChecked(true);
      })
      .catch(error => {
        console.error('Ошибка при проверке аутентификации или загрузке тестов:', error);
        setIsAuthenticated(false);
        setLoading(false);
        setAuthChecked(true);
      });
  }, []);

  if (!authChecked) {
    return <div>Проверка авторизации...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div>
        <p>Пожалуйста, авторизуйтесь для просмотра списка квизов</p>
        <button onClick={() => window.location.href = 'http://localhost:8000/accounts/google/login/'}>
          Войти через Google
        </button>
      </div>
    );
  }

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="tests-container">
      <h1>Доступные тесты</h1>
      {tests.length > 0 ? (
        <div className="tests-list">
          {tests.map(test => (
            <div key={test.id} className="test-card">
              <h2>{test.title}</h2>
              <p>{test.description}</p>
              <button>Начать тест</button>
            </div>
          ))}
        </div>
      ) : (
        <p>Нет доступных тестов</p>
      )}
    </div>
  );
}

export default TestList;
