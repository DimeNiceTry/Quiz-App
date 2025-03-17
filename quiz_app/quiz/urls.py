from django.urls import path
from . import views

urlpatterns = [
    path('quizzes/', views.QuizListCreate.as_view(), name='quiz-list-create'),
    path('quizzes/<int:pk>/', views.QuizRetrieveUpdateDestroy.as_view(), name='quiz-retrieve-update-destroy'),
    path('accounts/google/login/callback/', views.google_login_callback, name='google_login_callback'), #Убедитесь, что этот путь существует
    path('auth/check/', views.check_auth, name='check-auth'), # Новый маршрут для проверки аутентификации
    path('auth/logout/', views.logout_view, name='logout'), # Маршрут для выхода из системы
    path('quizzes/<int:pk>/details/', views.QuizDetail.as_view(), name='quiz-detail'),
    path('quizzes/<int:quiz_id>/questions/<int:question_index>/', views.get_question, name='quiz-question'),
    path('quiz-results/', views.UserQuizResults.as_view(), name='user-quiz-results'),
    path('quiz-results/<int:pk>/', views.QuizResultDetail.as_view(), name='quiz-result-detail'),
    path('save-quiz-result/', views.SaveQuizResult.as_view(), name='save-quiz-result'),
    
    # URL для администраторов
    path('admin/users/', views.UsersList.as_view(), name='admin-users-list'),
    path('admin/quiz-results/', views.AdminUserQuizResults.as_view(), name='admin-quiz-results'),
    path('admin/quiz-results/<int:pk>/', views.AdminQuizResultDetail.as_view(), name='admin-quiz-result-detail'),
]