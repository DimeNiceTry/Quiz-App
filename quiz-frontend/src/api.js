import axios from 'axios';

// Определяем базовый URL API в зависимости от окружения
const isProduction = process.env.NODE_ENV === 'production';
const API_URL = isProduction 
  ? 'https://quiz-app-w21h.onrender.com/api/'
  : 'http://localhost:8000/api/';

console.log('Окружение:', process.env.NODE_ENV);
console.log('Используется API URL:', API_URL);

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

// В продакшне добавляем обработку ошибок, связанных с CORS
if (isProduction) {
    axiosInstance.interceptors.response.use(
        (response) => response,
        (error) => {
            console.error('API Error:', error.message);
            // Обработка CORS ошибок
            if (error.message.includes('Network Error') || error.message.includes('CORS')) {
                console.log('Обнаружена CORS ошибка, используем резервный подход...');
                // Возвращаем базовый ответ для продолжения работы приложения
                return Promise.resolve({
                    data: { authenticated: false }
                });
            }
            return Promise.reject(error);
        }
    );
}

// Функция для получения заголовка авторизации
export const getAuthHeader = () => {
    // Для SessionAuthentication не нужно явно передавать токен
    // Куки сессии будут отправлены автоматически с опцией credentials: 'include'
    return '';
};

// Функция для проверки статуса авторизации
export const checkAuthStatus = async () => {
    try {
        console.log('Проверка авторизации...');
        // Сначала проверяем cookie
        const cookieValue = getCookie('is_authenticated');
        console.log('Cookie is_authenticated:', cookieValue);
        
        if (cookieValue === 'true') {
            console.log('Пользователь авторизован через cookie');
            return { authenticated: true };
        }
        
        // Затем проверяем URL-параметры
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
        const authParam = urlParams.get('auth') || hashParams.get('auth');
        
        if (authParam === 'success' || window.location.hash.includes('auth=success')) {
            console.log('Параметр auth=success найден в URL/hash, автоматически авторизуем');
            // Устанавливаем cookie для дальнейшего использования
            document.cookie = 'is_authenticated=true; path=/; secure; samesite=none; max-age=2592000'; // 30 дней
            return { authenticated: true };
        }
        
        // В production не делаем запрос к API для проверки авторизации
        if (isProduction) {
            console.log('В production не делаем запрос к API для проверки авторизации');
            return { authenticated: false };
        }
        
        // В development используем стандартную проверку
        console.log('Запрос на сервер для проверки авторизации...');
        try {
            const response = await axios.get(`${API_URL}auth/check/`, {
                withCredentials: true  // Важно для передачи cookie
            });
            
            console.log('Ответ сервера:', response.data);
            
            if (response.data.authenticated) {
                console.log('Пользователь авторизован через API');
                // Устанавливаем cookie для будущих проверок
                document.cookie = 'is_authenticated=true; path=/; secure; samesite=none; max-age=2592000'; // 30 дней
            } else {
                console.log('Пользователь НЕ авторизован через API');
            }
            
            return response.data;
        } catch (apiError) {
            console.error('Ошибка при запросе к API:', apiError);
            
            // Повторная проверка URL параметров на случай, если первая проверка пропустила
            if (authParam === 'success' || window.location.hash.includes('auth=success')) {
                console.log('Параметр auth=success найден после ошибки API');
                document.cookie = 'is_authenticated=true; path=/; secure; samesite=none; max-age=2592000';
                return { authenticated: true };
            }
            
            return { authenticated: false };
        }
    } catch (error) {
        console.error('Ошибка при проверке авторизации:', error);
        return { authenticated: false };
    }
};

export const fetchQuizzes = async () => {
    try {
        console.log('Выполняем запрос списка квизов через fetch...');
        
        const response = await fetch(`${API_URL}quizzes/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
                // Не используем Authorization с Bearer токеном
            },
            credentials: 'include' // Для отправки куки сессии
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
        console.log('Создание нового квиза:', quizData);
        const response = await fetch(`${API_URL}quizzes/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            credentials: 'include',
            body: JSON.stringify(quizData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Ошибка: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Ошибка при создании квиза:', error);
        throw error;
    }
};

// Получить детали квиза с вопросами
export const fetchQuizDetails = async (quizId) => {
  try {
    const response = await fetch(`${API_URL}quizzes/${quizId}/details/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
        // Не используем Authorization
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
    const response = await fetch(`${API_URL}quizzes/${quizId}/questions/${questionIndex}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
        // Не используем Authorization
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

// Функция для сохранения результата теста
export const saveQuizResult = async (quizId, score, maxScore, userAnswers = null) => {
  try {
    const response = await fetch(`${API_URL}save-quiz-result/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken') // Добавляем CSRF-токен напрямую
      },
      credentials: 'include', // Важно для отправки куки сессии
      body: JSON.stringify({
        quiz_id: quizId,
        score: score,
        max_score: maxScore,
        user_answers: userAnswers
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Ошибка при сохранении результата');
    }

    return await response.json();
  } catch (error) {
    console.error('Ошибка при сохранении результата:', error);
    throw error;
  }
};

// Функция для получения всех результатов пользователя
export const getUserQuizResults = async () => {
  try {
    const response = await fetch(`${API_URL}quiz-results/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
        // Не добавляем заголовок Authorization
      },
      credentials: 'include' // Важно для отправки куки сессии
    });

    if (!response.ok) {
      throw new Error('Ошибка при получении результатов');
    }

    return await response.json();
  } catch (error) {
    console.error('Ошибка при получении результатов:', error);
    throw error;
  }
};

// Функция для получения конкретного результата
export const getQuizResult = async (resultId) => {
  try {
    const response = await fetch(`${API_URL}quiz-results/${resultId}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
        // Не добавляем заголовок Authorization
      },
      credentials: 'include' // Важно для отправки куки сессии
    });

    if (!response.ok) {
      throw new Error('Ошибка при получении результата');
    }

    return await response.json();
  } catch (error) {
    console.error('Ошибка при получении результата:', error);
    throw error;
  }
};

// --- API функции для администраторов ---

// Получить список всех пользователей (только для админов)
export const getAllUsers = async () => {
  try {
    const response = await fetch(`${API_URL}admin/users/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('У вас нет прав администратора для выполнения этого действия');
      }
      throw new Error('Ошибка при получении списка пользователей');
    }

    return await response.json();
  } catch (error) {
    console.error('Ошибка при получении списка пользователей:', error);
    throw error;
  }
};

// Получить результаты всех пользователей (только для админов)
export const getAllUsersResults = async (userId = null) => {
  try {
    let url = `${API_URL}admin/quiz-results/`;
    if (userId) {
      url += `?user_id=${userId}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('У вас нет прав администратора для выполнения этого действия');
      }
      throw new Error('Ошибка при получении результатов');
    }

    return await response.json();
  } catch (error) {
    console.error('Ошибка при получении результатов всех пользователей:', error);
    throw error;
  }
};

// Получить детальную информацию о результате (только для админов)
export const getAdminQuizResultDetail = async (resultId) => {
  try {
    const response = await fetch(`${API_URL}admin/quiz-results/${resultId}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('У вас нет прав администратора для выполнения этого действия');
      }
      throw new Error('Ошибка при получении детальной информации о результате');
    }

    return await response.json();
  } catch (error) {
    console.error('Ошибка при получении детальной информации о результате:', error);
    throw error;
  }
};
                                                                          
// Функция для выхода из системы
export const logout = async () => {
  try {
    // Вызываем API-эндпоинт для выхода из системы
    const response = await fetch(`${API_URL}auth/logout/`, {
      method: 'GET',
      credentials: 'include'
    });

    // Удаляем cookie is_authenticated локально
    document.cookie = "is_authenticated=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    
    // Перенаправляем на страницу логина
    window.location.href = '/login';
    
    return true;
  } catch (error) {
    console.error('Ошибка при выходе из системы:', error);
    return false;
  }
};