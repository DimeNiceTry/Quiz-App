# Руководство по деплою Quiz App на Render

## Подготовка

1. Убедитесь, что у вас есть аккаунты:
   - [GitHub](https://github.com/)
   - [Render](https://render.com/)
   - [Aiven](https://aiven.io/)

2. Проверьте, что ваша база данных на Aiven уже настроена и работает.

## Деплой бэкенда на Render

1. Войдите в свой аккаунт на Render.

2. Нажмите **New +** > **Blueprint**.

3. Выберите свой GitHub репозиторий с кодом проекта.

4. Render автоматически обнаружит файл `render.yaml` и предложит создать сервисы.

5. Настройте переменные окружения через UI Render:
   - `SECRET_KEY`: уникальный сложный ключ
   - `GOOGLE_OAUTH2_CLIENT_ID`: ID вашего клиента Google OAuth
   - `GOOGLE_OAUTH2_CLIENT_SECRET`: секрет вашего клиента Google OAuth
   
6. Подключите вашу базу данных Aiven:
   - Выберите "External Database"
   - Введите информацию о подключении из Aiven

7. Нажмите **Apply** для создания сервиса.

8. После успешного деплоя, запишите URL вашего бэкенда (будет в формате `https://quiz-app-backend.onrender.com`).

## Настройка фронтенда для деплоя на GitHub Pages

1. Обновите файл `.env.production` в вашем фронтенд-проекте:
   ```
   REACT_APP_API_URL=https://quiz-app-backend.onrender.com
   PUBLIC_URL=.
   GENERATE_SOURCEMAP=false
   ```

2. Обновите настройки CORS в файле `settings_render.py`:
   ```python
   CORS_ALLOWED_ORIGINS = [
       "https://ваше-имя-пользователя.github.io",
   ]
   
   CSRF_TRUSTED_ORIGINS = [
       "https://ваше-имя-пользователя.github.io",
   ]
   
   LOGIN_REDIRECT_URL = 'https://ваше-имя-пользователя.github.io/quiz-frontend'
   ACCOUNT_SIGNUP_REDIRECT_URL = 'https://ваше-имя-пользователя.github.io/quiz-frontend'
   ```

3. Соберите фронтенд для продакшена:
   ```
   cd quiz-frontend
   npm run build
   ```

4. Создайте новый репозиторий на GitHub с именем `ваше-имя-пользователя.github.io` или `quiz-frontend`.

5. Отправьте содержимое папки `build` в этот репозиторий.

6. Настройте GitHub Pages в настройках репозитория:
   - Source: "Deploy from a branch"
   - Branch: "main" или "master"

## Проверка деплоя

1. Откройте ваш фронтенд по адресу `https://ваше-имя-пользователя.github.io/quiz-frontend`.

2. Убедитесь, что фронтенд может подключиться к бэкенду и получать данные.

3. Проверьте, что авторизация через Google работает.

## Устранение неполадок

### Проблемы с CORS

Если вы видите ошибки CORS в консоли браузера:

1. Проверьте настройки CORS в `settings_render.py`.
2. Убедитесь, что доменное имя вашего фронтенда точно указано в `CORS_ALLOWED_ORIGINS`.

### Проблемы с базой данных

1. Проверьте соединение с базой данных через панель управления Render.
2. Проверьте логи сервиса на Render для выявления ошибок.

### Проблемы с аутентификацией Google

1. Убедитесь, что в настройках приложения Google OAuth разрешены соответствующие URI перенаправления.
2. Добавьте URI перенаправления для вашего домена на Render в консоли Google Cloud. 