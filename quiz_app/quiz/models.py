from django.db import models
from django.contrib.auth.models import User

class Quiz(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(User, on_delete=models.CASCADE)  # Связь с автором
    created_at = models.DateTimeField(auto_now_add=True)
    hide_answers = models.BooleanField(default=True, help_text="Скрывать правильные ответы до завершения теста")
    time_limit = models.IntegerField(default=0, help_text="Ограничение времени в минутах (0 - без ограничения)")

    def __str__(self):
        return self.title

class Question(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()

    def __str__(self):
        return self.text

class Answer(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='answers')
    text = models.CharField(max_length=200)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return self.text

class QuizResult(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='results')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_results')
    score = models.IntegerField()
    max_score = models.IntegerField()
    completed_at = models.DateTimeField(auto_now_add=True)
    user_answers = models.JSONField(null=True, blank=True, help_text="Ответы пользователя в формате JSON")
    
    class Meta:
        unique_together = ['quiz', 'user', 'completed_at']
        
    def __str__(self):
        return f"{self.user.username} - {self.quiz.title} - {self.score}/{self.max_score}"