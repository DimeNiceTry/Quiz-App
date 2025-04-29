from django.utils.deprecation import MiddlewareMixin
from django.middleware.csrf import get_token
from django.http import HttpResponse
import logging

logger = logging.getLogger(__name__)

class CSRFMiddleware(MiddlewareMixin):
    """
    Middleware для добавления CSRF-токена в заголовок ответа.
    Это помогает клиенту получить токен даже при CORS-запросах.
    """
    def process_request(self, request):
        # Пропускаем OPTIONS запросы без проверки CSRF
        if request.method == 'OPTIONS':
            logger.info(f"[CSRFMiddleware] Пропускаем OPTIONS запрос")
            return HttpResponse(status=200)
            
        # Получаем CSRF-токен и сразу же устанавливаем в cookie
        csrf_token = get_token(request)
        logger.info(f"[CSRFMiddleware] Установлен CSRF-токен: {csrf_token}")
        logger.info(f"[CSRFMiddleware] Метод запроса: {request.method}")
        
        if request.method == 'POST':
            csrf_header = request.META.get('HTTP_X_CSRFTOKEN', None)
            logger.info(f"[CSRFMiddleware] CSRF-токен в заголовке: {csrf_header}")
            logger.info(f"[CSRFMiddleware] CSRF-токен совпадает: {csrf_header == csrf_token}")
            logger.info(f"[CSRFMiddleware] Пользователь аутентифицирован: {request.user.is_authenticated}")
            logger.info(f"[CSRFMiddleware] Запрос от: {request.META.get('HTTP_ORIGIN', 'unknown')}")
            
            # Для отладки выводим все заголовки запроса
            for key, value in request.META.items():
                if key.startswith('HTTP_'):
                    logger.debug(f"[CSRFMiddleware] Header {key}: {value}")
        
        return None
        
    def process_response(self, request, response):
        # Получаем CSRF-токен
        csrf_token = get_token(request)
        
        # Добавляем его в заголовок ответа
        response['X-CSRFToken'] = csrf_token
        
        # Дополнительные заголовки для CORS
        response['Access-Control-Expose-Headers'] = 'X-CSRFToken, Content-Type'
        
        # Для OPTIONS запросов добавляем все необходимые CORS заголовки
        if request.method == 'OPTIONS':
            response['Access-Control-Allow-Headers'] = 'X-CSRFToken, Content-Type, Authorization'
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Max-Age'] = '86400'  # 24 часа
        
        return response 