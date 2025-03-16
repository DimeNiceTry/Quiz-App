import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, getAllUsersResults } from '../api';
import './QuizResults.css';

const AdminResults = () => {
  const [results, setResults] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Загружаем список пользователей
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersData = await getAllUsers();
        setUsers(usersData);
        setError(null);
      } catch (err) {
        setError(`Ошибка при загрузке пользователей: ${err.message}`);
        console.error(err);
      }
    };

    fetchUsers();
  }, []);

  // Загружаем результаты тестов
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const resultsData = await getAllUsersResults(selectedUserId);
        setResults(resultsData);
        setError(null);
      } catch (err) {
        setError(`Ошибка при загрузке результатов: ${err.message}`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [selectedUserId]);

  // Обработчик изменения фильтра по пользователю
  const handleUserFilter = (e) => {
    const userId = e.target.value === 'all' ? null : parseInt(e.target.value);
    setSelectedUserId(userId);
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Расчет процента правильных ответов
  const calculatePercentage = (score, maxScore) => {
    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  };

  // Определение цвета в зависимости от процента
  const getColorForPercentage = (percentage) => {
    if (percentage >= 90) return '#4CAF50'; // Отлично
    if (percentage >= 75) return '#8BC34A'; // Хорошо
    if (percentage >= 60) return '#FFC107'; // Удовлетворительно
    return '#F44336'; // Неудовлетворительно
  };

  if (error && error.includes('прав администратора')) {
    return (
      <div className="quiz-results-container">
        <h1>Доступ запрещен</h1>
        <div className="error-message">
          {error}
        </div>
        <button 
          className="home-button"
          onClick={() => navigate('/')}
        >
          Вернуться на главную
        </button>
      </div>
    );
  }

  if (loading && users.length === 0) {
    return <div className="loading-message">Загрузка данных...</div>;
  }

  return (
    <div className="quiz-results-container">
      <h1>Результаты всех пользователей</h1>
      
      <div className="admin-controls">
        <div className="user-filter">
          <label htmlFor="user-select">Фильтр по пользователю:</label>
          <select 
            id="user-select" 
            onChange={handleUserFilter}
            value={selectedUserId || 'all'}
          >
            <option value="all">Все пользователи</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.username} ({user.email})
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="loading-message">Загрузка результатов...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : results.length === 0 ? (
        <div className="no-results-message">
          Нет результатов для отображения.
        </div>
      ) : (
        <div className="results-list">
          {results.map((result) => {
            const percentage = calculatePercentage(result.score, result.max_score);
            const color = getColorForPercentage(percentage);
            
            return (
              <div key={result.id} className="result-item">
                <div className="result-header">
                  <div className="result-user-info">
                    <h3>{result.quiz_title}</h3>
                    <span className="user-name">Пользователь: {result.username}</span>
                  </div>
                  <span className="result-date">{formatDate(result.completed_at)}</span>
                </div>
                
                <div className="result-details">
                  <div className="result-score">
                    <div className="score-circle mini" style={{ borderColor: color }}>
                      <div className="score-value mini">
                        {result.score}/{result.max_score}
                      </div>
                    </div>
                    <div className="score-percentage mini" style={{ color }}>
                      {percentage}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <button 
        className="home-button"
        onClick={() => navigate('/')}
      >
        Вернуться на главную
      </button>
    </div>
  );
};

export default AdminResults; 