from rest_framework import generics, permissions, status
from .models import Quiz, Question, Answer, QuizResult
from .serializers import QuizSerializer, QuizDetailSerializer, QuestionSerializer, AnswerSerializer, QuizResultSerializer, QuizCreateSerializer
from django.contrib.auth.models import User
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.shortcuts import redirect, get_object_or_404
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from django.contrib.auth import logout
import copy
import os
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.utils.decorators import method_decorator
import logging

logger = logging.getLogger(__name__)

def home(request):
    # Если пользователь уже вошел в систему, перенаправляем на фронтенд
    if request.user.is_authenticated:
        # Определяем, находимся ли мы в продакшн-окружении
        is_production = 'RENDER' in os.environ
        
        # Выбираем URL в зависимости от окружения
        if is_production:
            redirect_url = 'https://dimenicetry.github.io/Quiz-App/#/quizzes?auth=success'
        else:
            redirect_url = 'http://localhost:3000/quizzes?auth=success'
        
        return redirect(redirect_url)
    else:
        # Вместо рендеринга шаблона, перенаправляем на страницу входа
        is_production = 'RENDER' in os.environ
        
        if is_production:
            return redirect('https://dimenicetry.github.io/Quiz-App/#/login')
        else:
            return redirect('http://localhost:3000/login')


def google_login_callback(request):
    # Теперь этот обработчик используется как дополнительный 
    # после стандартного обработчика callback django-allauth
    
    # Определяем, находимся ли мы в продакшн-окружении
    is_production = 'RENDER' in os.environ
    
    # Проверяем, что пользователь получен и авторизован
    print(f"User authenticated: {request.user.is_authenticated}")
    print(f"User: {request.user.username} / {request.user.email}")
    
    # Создаем сессию для пользователя, если еще не создана
    if not request.session.session_key:
        request.session.save()
        print(f"Created new session: {request.session.session_key}")
    else:
        print(f"Existing session: {request.session.session_key}")

    # Выбираем URL в зависимости от окружения
    if is_production:
        # Используем hash роутер в production
        redirect_url = 'https://dimenicetry.github.io/Quiz-App/#/quizzes?auth=success'
    else:
        redirect_url = 'http://localhost:3000/quizzes?auth=success'
    
    # Перенаправление на URL React-приложения
    response = redirect(redirect_url)

    # Установите cookie без флага httponly, чтобы она была доступна в JavaScript
    response.set_cookie(
        'is_authenticated', 'true', 
        httponly=False, 
        secure=True, 
        samesite='None',
        max_age=2592000  # 30 дней
    )
    
    # Добавляем CORS заголовки
    response["Access-Control-Allow-Origin"] = "https://dimenicetry.github.io"
    response["Access-Control-Allow-Credentials"] = "true"
    response["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-CSRFToken"
    
    # Вывод cookies, которые будут установлены
    print(f"Response cookies: {response.cookies}")
    
    return response

# Новый API-эндпоинт для проверки аутентификации
@api_view(['GET'])
def check_auth(request):
    """
    API-эндпоинт для проверки аутентификации пользователя.
    """
    logger.info(f"[check_auth] User authenticated: {request.user.is_authenticated}")
    logger.info(f"[check_auth] Session key: {request.session.session_key}")
    logger.info(f"[check_auth] Cookies: {request.COOKIES}")
    
    # Добавляем заголовки запроса для отладки
    for key, value in request.META.items():
        if key.startswith('HTTP_'):
            logger.debug(f"[check_auth] Header {key}: {value}")
    
    # Проверка наличия сессии
    if not request.session.session_key:
        # Создаем сессию, если её нет
        request.session.save()
        logger.info(f"[check_auth] Created new session: {request.session.session_key}")
    
    if request.user.is_authenticated:
        # Если у нас есть аутентифицированный пользователь, но нет cookie
        # установим cookie, чтобы frontend мог проверить статус аутентификации
        response = JsonResponse({
            'authenticated': True,
            'username': request.user.username,
            'email': request.user.email,
            'sessionid': request.session.session_key,
            'is_staff': request.user.is_staff,
            'is_superuser': request.user.is_superuser
        })
        
        # Устанавливаем cookie для JS доступа
        response.set_cookie(
            'is_authenticated', 'true', 
            httponly=False, 
            secure=True, 
            samesite='None',
            max_age=2592000  # 30 дней
        )
        
        # Добавляем CORS заголовки
        response["Access-Control-Allow-Origin"] = "https://dimenicetry.github.io"
        response["Access-Control-Allow-Credentials"] = "true"
        
        return response
    else:
        return JsonResponse({
            'authenticated': False,
            'session_exists': bool(request.session.session_key)
        })

@method_decorator(csrf_exempt, name='dispatch')
class QuizListCreate(generics.ListCreateAPIView):
    """
    API endpoint для просмотра списка квизов и создания нового квиза.
    Доступно только авторизованным пользователям.
    Автор квиза устанавливается автоматически как текущий пользователь.
    """
    permission_classes = [permissions.IsAuthenticated]  # Требуется аутентификация

    def get_queryset(self):
        """
        Возвращает все доступные тесты для пользователя.
        """
        return Quiz.objects.all()
        
    def get_serializer_class(self):
        """
        Возвращает разные сериализаторы для чтения и создания
        """
        if self.request.method == 'POST':
            return QuizCreateSerializer
        return QuizSerializer

    def create(self, request, *args, **kwargs):
        """
        Переопределяем метод create для добавления дополнительного логирования
        и обработки ошибок аутентификации
        """
        logger.info(f"[QuizListCreate] Пользователь: {request.user}, авторизован: {request.user.is_authenticated}")
        logger.info(f"[QuizListCreate] Метод: {request.method}")
        logger.info(f"[QuizListCreate] Данные: {request.data}")
        logger.info(f"[QuizListCreate] Заголовки: {request.headers}")
        
        # Проверяем аутентификацию
        if not request.user.is_authenticated:
            logger.error("[QuizListCreate] Пользователь не авторизован")
            return Response(
                {"error": "Пользователь не авторизован"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Проверка CSRF токена
        csrf_token = request.META.get("HTTP_X_CSRFTOKEN")
        logger.info(f"[QuizListCreate] CSRF токен в запросе: {csrf_token}")
        
        # Продолжаем стандартную обработку
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, 
            status=status.HTTP_201_CREATED, 
            headers=headers
        )

    def perform_create(self, serializer):
        """
        Автоматически устанавливаем автора теста как текущего пользователя.
        """
        logger.info(f"[QuizListCreate.perform_create] Сохраняем квиз с автором: {self.request.user}")
        serializer.save(author=self.request.user)


class QuizRetrieveUpdateDestroy(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint для получения, обновления и удаления конкретного квиза.
    Доступно только авторизованным пользователям и только автору квиза.
    """
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
       user = self.request.user
       return Quiz.objects.filter(author=user) # Только свои тесты

class TestListView(generics.ListAPIView):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]

class QuizDetail(generics.RetrieveAPIView):
    """
    API endpoint для получения детальной информации о квизе с вопросами и ответами.
    """
    serializer_class = QuizDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Quiz.objects.all()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_question(request, quiz_id, question_index):
    """
    Получить конкретный вопрос квиза по его индексу.
    """
    quiz = get_object_or_404(Quiz, pk=quiz_id)
    questions = quiz.questions.all()
    
    # Проверяем, что индекс находится в пределах допустимого диапазона
    if question_index < 0 or question_index >= questions.count():
        return Response({"error": "Индекс вопроса вне допустимого диапазона"}, status=400)
    
    question = questions[question_index]
    serializer = QuestionSerializer(question)
    
    # Создаем копию данных, чтобы не модифицировать оригинальный сериализатор
    data = copy.deepcopy(serializer.data)

    # Отладочный вывод
    print("Оригинальные данные вопроса с ответами:")
    for i, answer in enumerate(data['answers']):
        print(f"Ответ {i+1}: {answer['text']} (is_correct: {answer.get('is_correct', 'отсутствует')})")
    
    # Больше не удаляем информацию о правильности, просто отмечаем, что ответы нужно скрыть
    # Фронтенд сам определит, показывать ли правильность ответа пользователю
    
    # Добавляем информацию о текущем индексе и общем количестве вопросов
    result_data = {
        "quiz_id": quiz_id,
        "quiz_title": quiz.title,
        "current_index": question_index,
        "total_questions": questions.count(),
        "question": data,
        "hide_answers": quiz.hide_answers,
        "time_limit": quiz.time_limit
    }
    
    return Response(result_data)

class SaveQuizResult(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        quiz_id = request.data.get('quiz_id')
        score = request.data.get('score')
        max_score = request.data.get('max_score')
        user_answers = request.data.get('user_answers')
        
        print(f"Сохранение результата: quiz_id={quiz_id}, score={score}, max_score={max_score}")
        print(f"Пользователь: {request.user.username}, user_answers: {user_answers}")
        
        if not all([quiz_id, score is not None, max_score is not None]):
            return Response(
                {"error": "Необходимы quiz_id, score и max_score"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            quiz = Quiz.objects.get(id=quiz_id)
        except Quiz.DoesNotExist:
            return Response(
                {"error": "Тест не найден"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Если есть предыдущие результаты с тем же набором полей, удаляем их
        # чтобы избежать дублирования
        existing_results = QuizResult.objects.filter(
            quiz=quiz,
            user=request.user,
            score=score,
            max_score=max_score
        )
        if existing_results.exists():
            print(f"Удаление существующих результатов: {len(existing_results)}")
            existing_results.delete()
        
        quiz_result = QuizResult.objects.create(
            quiz=quiz,
            user=request.user,
            score=score,
            max_score=max_score,
            user_answers=user_answers
        )
        
        print(f"Создан результат: id={quiz_result.id}, score={quiz_result.score}/{quiz_result.max_score}")
        
        serializer = QuizResultSerializer(quiz_result)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class UserQuizResults(generics.ListAPIView):
    serializer_class = QuizResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return QuizResult.objects.filter(user=self.request.user).order_by('-completed_at')

class QuizResultDetail(generics.RetrieveAPIView):
    queryset = QuizResult.objects.all()
    serializer_class = QuizResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Пользователь может видеть только свои результаты
        return QuizResult.objects.filter(user=self.request.user)

# Новые представления для администраторов
class AdminUserQuizResults(generics.ListAPIView):
    """
    API endpoint для получения результатов всех пользователей.
    Доступно только администраторам.
    Поддерживает фильтрацию по пользователю через query-параметр 'user_id'.
    """
    serializer_class = QuizResultSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = QuizResult.objects.all().order_by('-completed_at')
        
        # Фильтрация по пользователю, если указан параметр user_id
        user_id = self.request.query_params.get('user_id', None)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
            
        return queryset

class AdminQuizResultDetail(generics.RetrieveAPIView):
    """
    API endpoint для получения детальной информации о результате теста.
    Доступно только администраторам.
    """
    queryset = QuizResult.objects.all()
    serializer_class = QuizResultSerializer
    permission_classes = [IsAdminUser]

class UsersList(generics.ListAPIView):
    """
    API endpoint для получения списка пользователей.
    Доступно только администраторам.
    Используется для фильтрации результатов тестов по пользователю.
    """
    queryset = User.objects.all().order_by('username')
    permission_classes = [IsAdminUser]
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        users = [{'id': user.id, 'username': user.username, 'email': user.email} 
                 for user in queryset]
        return Response(users)

# Обработчик выхода из системы
@api_view(['GET'])
def logout_view(request):
    # Выход пользователя
    logout(request)
    
    # Создаем ответ для перенаправления
    response = JsonResponse({'success': True, 'message': 'Успешный выход из системы'})
    
    # Удаляем cookie is_authenticated
    response.delete_cookie('is_authenticated')
    
    return response

@api_view(['GET', 'OPTIONS'])
@ensure_csrf_cookie
def get_csrf_token(request):
    """
    Возвращает CSRF-токен. Устанавливает cookie с CSRF-токеном.
    """
    # Устанавливаем CSRF в cookie через ensure_csrf_cookie decorator
    csrf_token = get_token(request)
    logger.info(f"[get_csrf_token] Генерация CSRF токена: {csrf_token}")
    
    # Для OPTIONS запросов возвращаем пустой ответ со статусом 200
    if request.method == 'OPTIONS':
        response = Response(status=status.HTTP_200_OK)
    else:
        response = Response({'csrfToken': csrf_token})
    
    # Добавляем заголовки для CORS
    response["Access-Control-Allow-Origin"] = "https://dimenicetry.github.io"
    response["Access-Control-Allow-Credentials"] = "true"
    response["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response["Access-Control-Allow-Headers"] = "Content-Type, X-CSRFToken"
    response["Access-Control-Expose-Headers"] = "X-CSRFToken"
    
    # Добавляем токен в заголовок
    response["X-CSRFToken"] = csrf_token
    
    return response