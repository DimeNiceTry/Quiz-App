from .settings import *

# Настройки для Render
DEBUG = False
ALLOWED_HOSTS = ['.onrender.com', 'localhost', '127.0.0.1']

# Настройка CORS для работы с фронтендом на GitHub Pages
CORS_ALLOWED_ORIGINS = [
    "https://your-github-username.github.io",  # Замените на ваш GitHub Pages URL
]

CSRF_TRUSTED_ORIGINS = [
    "https://your-github-username.github.io",  # Замените на ваш GitHub Pages URL
]

# Перенаправление после авторизации через Google
LOGIN_REDIRECT_URL = 'https://your-github-username.github.io/quiz-frontend'  # Замените на URL вашего фронтенда
ACCOUNT_SIGNUP_REDIRECT_URL = 'https://your-github-username.github.io/quiz-frontend'

# Статические файлы
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Сжатие статики для лучшей производительности
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.ManifestStaticFilesStorage'

# Настройка безопасности
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY' 