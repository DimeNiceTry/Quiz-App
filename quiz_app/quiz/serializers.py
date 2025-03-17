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

# Сериализатор для создания ответов
class AnswerCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ('text', 'is_correct')

# Сериализатор для создания вопросов с ответами
class QuestionCreateSerializer(serializers.ModelSerializer):
    answers = AnswerCreateSerializer(many=True)
    
    class Meta:
        model = Question
        fields = ('text', 'answers')
    
    def create(self, validated_data):
        answers_data = validated_data.pop('answers')
        question = Question.objects.create(**validated_data)
        
        for answer_data in answers_data:
            Answer.objects.create(question=question, **answer_data)
            
        return question

# Сериализатор для создания квиза с вопросами и ответами
class QuizCreateSerializer(serializers.ModelSerializer):
    questions = QuestionCreateSerializer(many=True)
    
    class Meta:
        model = Quiz
        fields = ('title', 'hide_answers', 'time_limit', 'questions')
    
    def create(self, validated_data):
        questions_data = validated_data.pop('questions')
        quiz = Quiz.objects.create(**validated_data)
        
        for question_data in questions_data:
            answers_data = question_data.pop('answers')
            question = Question.objects.create(quiz=quiz, **question_data)
            
            for answer_data in answers_data:
                Answer.objects.create(question=question, **answer_data)
                
        return quiz

class QuizSerializer(serializers.ModelSerializer):
    author = serializers.ReadOnlyField(source='author.username')
    questions_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Quiz
        fields = ('id', 'title', 'author', 'created_at', 'questions_count', 'hide_answers', 'time_limit')
    
    def get_questions_count(self, obj):
        return obj.questions.count()

class QuizDetailSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    author = serializers.ReadOnlyField(source='author.username')
    
    class Meta:
        model = Quiz
        fields = ('id', 'title', 'author', 'created_at', 'questions', 'hide_answers', 'time_limit')
        read_only_fields = ('author',)

class QuizResultSerializer(serializers.ModelSerializer):
    quiz_title = serializers.ReadOnlyField(source='quiz.title')
    username = serializers.ReadOnlyField(source='user.username')
    
    class Meta:
        model = QuizResult
        fields = ['id', 'quiz', 'quiz_title', 'user', 'username', 'score', 'max_score', 'completed_at', 'user_answers']
        read_only_fields = ['completed_at']