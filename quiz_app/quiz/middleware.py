class AllowedHostsOverrideMiddleware:
    """
    Middleware, который гарантирует, что домен будет в ALLOWED_HOSTS
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        from django.conf import settings
        if 'quiz-app-w21h.onrender.com' not in settings.ALLOWED_HOSTS:
            settings.ALLOWED_HOSTS.append('quiz-app-w21h.onrender.com')
        return self.get_response(request) 