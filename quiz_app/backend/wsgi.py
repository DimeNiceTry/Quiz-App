"""
WSGI config for backend project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/wsgi/
"""

import os
import sys

from django.core.wsgi import get_wsgi_application

# Определяем, находимся ли мы на Render
is_render = 'RENDER' in os.environ

if is_render:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings_render')
else:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

application = get_wsgi_application()
