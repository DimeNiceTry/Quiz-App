# Инструкция по деплою Quiz App

Эта инструкция описывает как развернуть приложение с использованием:
- Фронтенд на GitHub Pages
- Бэкенд на Render.com
- База данных на Aiven

## 1. Деплой базы данных на Aiven

1. Создайте аккаунт на [Aiven](https://aiven.io/) если еще нет
2. Создайте сервис PostgreSQL
3. После создания, вы получите данные для подключения:
   - Хост: pg-21deb75b-quizappp.c.aivencloud.com (ваш будет отличаться)
   - Порт: 11788
   - База данных: defaultdb
   - Пользователь: avnadmin
   - Пароль: (сгенерированный Aiven)
   - SSL Mode: require

Сохраните эти данные - они понадобятся для настройки бэкенда.

## 2. Деплой бэкенда на Render.com

1. Создайте аккаунт на [Render](https://render.com/)
2. Загрузите бэкенд-код на GitHub
3. На Render выберите "New" > "Web Service"
4. Подключите ваш GitHub репозиторий
5. Настройте сервис:
   - Name: quiz-app-backend
   - Environment: Python
   - Region: (выберите ближайший)
   - Branch: main
   - Root Directory: quiz_app (укажите папку с Django проектом)
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn backend.wsgi:application`

6. Добавьте следующие переменные окружения (Environment Variables):
   - `SECRET_KEY` - уникальный ключ шифрования
   - `DEBUG` - `False`
   - `SQLITE_MODE` - `False`
   - `ALLOWED_HOSTS` - `.onrender.com`
   - `CSRF_TRUSTED_ORIGINS` - `https://вашдомен.onrender.com,https://yourusername.github.io`
   - `GOOGLE_OAUTH2_CLIENT_ID` - ID вашего Google OAuth клиента
   - `GOOGLE_OAUTH2_CLIENT_SECRET` - секрет Google OAuth

   Данные для подключения к Aiven:
   - `DB_ENGINE` - `django.db.backends.postgresql`
   - `DB_NAME` - `defaultdb`
   - `DB_USER` - `avnadmin`
   - `DB_PASSWORD` - (пароль от Aiven)
   - `DB_HOST` - `pg-21deb75b-quizappp.c.aivencloud.com` (замените на ваш)
   - `DB_PORT` - `11788` (замените на ваш)
   - `DB_SSL_MODE` - `require`

7. Примените миграции:
   - В консоли Render выполните `python manage.py migrate`
   - Создайте суперпользователя: `python manage.py createsuperuser`

## 3. Деплой фронтенда на GitHub Pages

1. Установите пакет gh-pages:
   ```
   cd quiz-frontend
   npm install --save-dev gh-pages
   ```

2. Обновите package.json как указано в репозитории

3. В файле src/api.js убедитесь, что URL бэкенда настроен правильно

4. Разверните приложение на GitHub Pages:
   ```
   npm run deploy
   ```

5. Настройте GitHub репозиторий: перейдите в настройки репозитория > Pages > и убедитесь, что выбрана ветка `gh-pages`

## 4. Конфигурация Google OAuth

1. В [Google Cloud Console](https://console.cloud.google.com/):
   - Обновите список разрешенных JavaScript источников:
     - Добавьте `https://yourusername.github.io`
   - Добавьте разрешенные URL перенаправления:
     - `https://quiz-app-backend.onrender.com/accounts/google/login/callback/`

2. Убедитесь, что в настройках Django обновлены URL перенаправления для Google OAuth

## Проверка работоспособности

1. Проверьте, что фронтенд запущен по адресу: `https://yourusername.github.io/quiz-app/`
2. Вы должны иметь возможность войти через Google
3. Убедитесь, что тесты загружаются и работают правильно

## Устранение неполадок

1. Проверьте логи на Render.com в разделе сервиса
2. Проверьте настройки CORS в файле settings.py - домены должны соответствовать вашему GitHub Pages URL
3. Проверьте, что все переменные окружения на Render настроены правильно
4. Убедитесь, что ваша база данных на Aiven активна и доступна 