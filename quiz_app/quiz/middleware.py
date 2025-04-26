from django.utils.deprecation import MiddlewareMixin
from django.middleware.csrf import get_token

class CSRFMiddleware(MiddlewareMixin):
    """
    Middleware для добавления CSRF-токена в заголовок ответа.
    Это помогает клиенту получить токен даже при CORS-запросах.
    """
    def process_request(self, request):
        # Получаем CSRF-токен и сразу же устанавливаем в cookie
        csrf_token = get_token(request)
        print(f"[CSRFMiddleware] Установлен CSRF-токен: {csrf_token}")
        print(f"[CSRFMiddleware] Метод запроса: {request.method}")
        if request.method == 'POST':
            csrf_header = request.META.get('HTTP_X_CSRFTOKEN', None)
            print(f"[CSRFMiddleware] CSRF-токен в заголовке: {csrf_header}")
            print(f"[CSRFMiddleware] CSRF-токен совпадает: {csrf_header == csrf_token}")
        return None
        
    def process_response(self, request, response):
        # Получаем CSRF-токен
        csrf_token = get_token(request)
        
        # Добавляем его в заголовок ответа
        response['X-CSRFToken'] = csrf_token
        
        # Дополнительные заголовки для CORS
        response['Access-Control-Expose-Headers'] = 'X-CSRFToken, Content-Type'
        if request.method == 'OPTIONS':
            response['Access-Control-Allow-Headers'] = 'X-CSRFToken, Content-Type'
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        
        return response 