from rest_framework import serializers
from .models import Quiz, Question, Answer, QuizResult
from django.contrib.auth.models import User

class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ('id', 'text', 'is_correct')

class QuestionSerializer(serializers.ModelSerializer):
    answers = AnswerSerializer(many=True, read_only=True)
    
    class Meta:
        model = Question
        fields = ('id', 'text', 'answers')

class QuizSerializer(serializers.ModelSerializer):
    author = serializers.ReadOnlyField(source='author.username')
    questions_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Quiz
        fields = ('id', 'title', 'author', 'created_at', 'questions_count')
    
    def get_questions_count(self, obj):
        return obj.questions.count()

class QuizDetailSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    author = serializers.ReadOnlyField(source='author.username')
    
    class Meta:
        model = Quiz
        fields = ('id', 'title', 'author', 'created_at', 'questions')
        read_only_fields = ('author',)

class QuizResultSerializer(serializers.ModelSerializer):
    quiz_title = serializers.ReadOnlyField(source='quiz.title')
    username = serializers.ReadOnlyField(source='user.username')
    
    class Meta:
        model = QuizResult
        fields = ['id', 'quiz', 'quiz_title', 'user', 'username', 'score', 'max_score', 'completed_at']
        read_only_fields = ['completed_at']