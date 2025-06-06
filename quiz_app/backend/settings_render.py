from .settings import *

# Настройки для среды Render
DEBUG = False

# Настройки безопасности для продакшн
ALLOWED_HOSTS = ['*', 'quiz-app-km8k.onrender.com']  

# Добавляем whitenoise для статических файлов
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # CORS должен быть первым
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'allauth.account.middleware.AccountMiddleware',
    'quiz.middleware.CSRFMiddleware',  # Наш собственный middleware
]
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Настройки CORS для продакшн
CORS_ALLOWED_ORIGINS = [
    "https://dimenicetry.github.io",  # URL вашего GitHub Pages
]

# Настройки CORS
CORS_ALLOW_ALL_ORIGINS = False  # Не разрешаем все источники
CORS_ALLOW_CREDENTIALS = True

# Разрешить все заголовки в CORS-запросах
CORS_ALLOW_ALL_HEADERS = True

# Добавляем дополнительные настройки CORS для public URLs
CORS_EXPOSE_HEADERS = [
    "Content-Type", 
    "X-CSRFToken",
]

# Какие заголовки разрешены с клиента
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

# Разрешаем все необходимые HTTP методы
CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]

# Увеличиваем время жизни preflight-запросов
CORS_PREFLIGHT_MAX_AGE = 86400  # 24 часа

# Специфические URLs, которые должны поддерживать CORS
CORS_URLS_REGEX = r'^.*$'  # Все URLs поддерживают CORS

# Настройки CSRF
CSRF_TRUSTED_ORIGINS = [
    "https://quiz-app-km8k.onrender.com",  # URL вашего бэкенда на Render
    "https://dimenicetry.github.io",  # URL вашего GitHub Pages
]
CSRF_COOKIE_DOMAIN = None
CSRF_USE_SESSIONS = False  # Храним CSRF в cookie
CSRF_COOKIE_HTTPONLY = False  # Разрешаем JavaScript получать CSRF-токен
CSRF_COOKIE_SAMESITE = 'None'  # Разрешаем кросс-сайтовые запросы
CSRF_COOKIE_SECURE = True  # Только по HTTPS

# Настройки перенаправлений
LOGIN_REDIRECT_URL = 'https://dimenicetry.github.io/Quiz-App/#/quizzes?auth=success'  # URL вашего фронтенда
ACCOUNT_SIGNUP_REDIRECT_URL = 'https://dimenicetry.github.io/Quiz-App/#/quizzes?auth=success'  # После регистрации

# Настройки аутентификации для django-allauth
ACCOUNT_EMAIL_VERIFICATION = "none"
ACCOUNT_DEFAULT_HTTP_PROTOCOL = "https"
SOCIALACCOUNT_AUTO_SIGNUP = True
SOCIALACCOUNT_LOGIN_ON_GET = True

# Обновляем настройки Google OAuth
SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'APP': {
            'client_id': os.environ.get('GOOGLE_OAUTH2_CLIENT_ID', ''),
            'secret': os.environ.get('GOOGLE_OAUTH2_CLIENT_SECRET', ''),
            'key': ''
        },
        'SCOPE': ['profile', 'email'],
        'AUTH_PARAMS': {'access_type': 'online'}
    }
}

# Настройки статических файлов
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Настройки сессий и cookies для разрешения передачи между доменами
SESSION_COOKIE_SAMESITE = 'None'
CSRF_COOKIE_SAMESITE = 'None'
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Дополнительные настройки безопасности для продакшена
SECURE_HSTS_SECONDS = 31536000  # 1 год
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_SSL_REDIRECT = False  # Render уже обрабатывает SSL
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY" 