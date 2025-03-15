from rest_framework import generics, permissions
from .models import Quiz, Question, Answer
from .serializers import QuizSerializer, QuizDetailSerializer, QuestionSerializer, AnswerSerializer
from django.contrib.auth.models import User
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import redirect, get_object_or_404
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

def home(request):
    return render(request, 'home.html')  # 'home.html' - путь к вашему шаблону


def google_login_callback(request):
    # Проверяем, что пользователь получен и авторизован
    print(f"User authenticated: {request.user.is_authenticated}")
    print(f"User: {request.user.username} / {request.user.email}")
    
    # Создаем сессию для пользователя, если еще не создана
    if not request.session.session_key:
        request.session.save()
        print(f"Created new session: {request.session.session_key}")
    else:
        print(f"Existing session: {request.session.session_key}")

    # Перенаправление на URL React-приложения с параметром для указания успешной авторизации
    response = redirect('http://localhost:3000/quizzes?auth=success')

    # Установите cookie без флага httponly, чтобы она была доступна в JavaScript
    response.set_cookie('is_authenticated', 'true', httponly=False, secure=True if request.is_secure() else False, samesite='Lax')
    
    # Вывод cookies, которые будут установлены
    print(f"Response cookies: {response.cookies}")
    
    return response

# Новый API-эндпоинт для проверки аутентификации
@api_view(['GET'])
def check_auth(request):
    print(f"[check_auth] User authenticated: {request.user.is_authenticated}")
    print(f"[check_auth] Session key: {request.session.session_key}")
    print(f"[check_auth] Cookies: {request.COOKIES}")
    
    if request.user.is_authenticated:
        return JsonResponse({
            'authenticated': True,
            'username': request.user.username,
            'email': request.user.email,
            'sessionid': request.session.session_key
        })
    else:
        return JsonResponse({
            'authenticated': False,
            'session_exists': bool(request.session.session_key)
        })

class QuizListCreate(generics.ListCreateAPIView):
    """
    API endpoint для просмотра списка квизов и создания нового квиза.
    Доступно только авторизованным пользователям.
    Автор квиза устанавливается автоматически как текущий пользователь.
    """
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated] # Требуется аутентификация

    def get_queryset(self):
        """
        Возвращает все доступные тесты для пользователя.
        """
        return Quiz.objects.all()

    def perform_create(self, serializer):
        """
        Автоматически устанавливаем автора теста как текущего пользователя.
        """
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
    
    # Добавляем информацию о текущем индексе и общем количестве вопросов
    data = {
        "quiz_id": quiz_id,
        "quiz_title": quiz.title,
        "current_index": question_index,
        "total_questions": questions.count(),
        "question": serializer.data
    }
    
    return Response(data)