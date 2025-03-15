from django.urls import path
from . import views

urlpatterns = [
    path('quizzes/', views.QuizListCreate.as_view(), name='quiz-list-create'),
    path('quizzes/<int:pk>/', views.QuizRetrieveUpdateDestroy.as_view(), name='quiz-retrieve-update-destroy'),
    path('accounts/google/login/callback/', views.google_login_callback, name='google_login_callback'), #Убедитесь, что этот путь существует
    path('auth/check/', views.check_auth, name='check-auth'), # Новый маршрут для проверки аутентификации
    path('quizzes/<int:pk>/details/', views.QuizDetail.as_view(), name='quiz-detail'),
    path('quizzes/<int:quiz_id>/questions/<int:question_index>/', views.get_question, name='quiz-question'),
]