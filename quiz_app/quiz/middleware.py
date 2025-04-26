from django.utils.deprecation import MiddlewareMixin
from django.middleware.csrf import get_token

class CSRFMiddleware(MiddlewareMixin):
    """
    Middleware для добавления CSRF-токена в заголовок ответа.
    Это помогает клиенту получить токен даже при CORS-запросах.
    """
    def process_response(self, request, response):
        # Получаем CSRF-токен
        csrf_token = get_token(request)
        
        # Добавляем его в заголовок ответа
        response['X-CSRFToken'] = csrf_token
        
        # Дополнительный заголовок для отладки
        response['Access-Control-Expose-Headers'] = 'X-CSRFToken'
        
        return response 