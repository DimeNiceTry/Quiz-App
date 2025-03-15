import axios from 'axios';

const API_URL = 'http://localhost:8000/api/';

// Функция для получения CSRF-токена из cookies
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

const csrftoken = getCookie('csrftoken');

// Настройка axios для отправки CSRF-токена
const axiosInstance = axios.create({
    baseURL: API_URL,
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken,  // Добавляем CSRF-токен в заголовки
    },
    withCredentials: true  // Включаем отправку cookies с запросами
});

// Функция для получения заголовка авторизации
export const getAuthHeader = () => {
    const token = getCookie('sessionid');
    return token ? `Bearer ${token}` : '';
};

// Функция для проверки статуса авторизации
export const checkAuthStatus = async () => {
    try {
        console.log('Проверка авторизации...');
        const cookieValue = getCookie('is_authenticated');
        console.log('Cookie is_authenticated:', cookieValue);
        
        if (cookieValue === 'true') {
            console.log('Пользователь авторизован через cookie');
            return { authenticated: true };
        }
        
        console.log('Запрос на сервер для проверки авторизации...');
        const response = await axiosInstance.get('auth/check/', { withCredentials: true });
        console.log('Ответ сервера:', response.data);
        
        if (response.data.authenticated) {
            console.log('Пользователь авторизован через API');
        } else {
            console.log('Пользователь НЕ авторизован через API');
        }
        
        return response.data;
    } catch (error) {
        console.error('Ошибка при проверке авторизации:', error);
        
        // Проверим cookie даже если запрос к API не удался
        const cookieValue = getCookie('is_authenticated');
        if (cookieValue === 'true') {
            console.log('Пользователь авторизован через cookie (после ошибки API)');
            return { authenticated: true };
        }
        
        return { authenticated: false };
    }
};

export const fetchQuizzes = async () => {
    try {
        console.log('Выполняем запрос списка квизов через fetch...');
        
        const response = await fetch(`${API_URL}quizzes/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': getAuthHeader()
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Ошибка при получении квизов: ${response.status}`);
        }

        const data = await response.json();
        console.log('Получены квизы:', data);
        return data;
    } catch (error) {
        console.error('Ошибка при получении квизов:', error);
        throw error;
    }
};

// Пример POST запроса
export const createQuiz = async (quizData) => {
    try {
        const response = await axiosInstance.post('quizzes/', quizData);
        return response.data;
    } catch (error) {
        console.error('Ошибка при создании квиза:', error);
        throw error;
    }
};

// Получить детали квиза с вопросами
export const fetchQuizDetails = async (quizId) => {
  try {
    const response = await fetch(`http://localhost:8000/api/quizzes/${quizId}/details/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader()
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching quiz details:', error);
    throw error;
  }
};

// Получить вопрос квиза по индексу
export const fetchQuizQuestion = async (quizId, questionIndex) => {
  try {
    const response = await fetch(`http://localhost:8000/api/quizzes/${quizId}/questions/${questionIndex}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader()
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching quiz question:', error);
    throw error;
  }
};