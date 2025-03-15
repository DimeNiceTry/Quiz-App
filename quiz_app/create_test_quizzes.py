import os
import django

# Настроить окружение Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from django.contrib.auth.models import User
from quiz.models import Quiz, Question, Answer

def create_test_quizzes():
    # Получаем пользователя-администратора (предполагается, что он уже создан)
    try:
        admin_user = User.objects.get(is_superuser=True)
    except User.DoesNotExist:
        print("Ошибка: пользователь-администратор не найден!")
        return
    except User.MultipleObjectsReturned:
        admin_user = User.objects.filter(is_superuser=True).first()
    
    print(f"Будем использовать пользователя: {admin_user.username}")
    
    # Создаем первый тестовый квиз: "Программирование на Python"
    quiz1, created = Quiz.objects.get_or_create(
        title="Программирование на Python",
        author=admin_user
    )
    if created:
        print(f"Создан новый квиз: {quiz1.title}")
    else:
        print(f"Квиз уже существует: {quiz1.title}")
        
    # Добавляем вопросы и ответы к первому квизу
    if created:
        # Вопрос 1
        q1 = Question.objects.create(quiz=quiz1, text="Что такое Python?")
        Answer.objects.create(question=q1, text="Язык программирования", is_correct=True)
        Answer.objects.create(question=q1, text="Тип змеи", is_correct=False)
        Answer.objects.create(question=q1, text="Операционная система", is_correct=False)
        
        # Вопрос 2
        q2 = Question.objects.create(quiz=quiz1, text="Какой тип данных используется для хранения целых чисел в Python?")
        Answer.objects.create(question=q2, text="int", is_correct=True)
        Answer.objects.create(question=q2, text="float", is_correct=False)
        Answer.objects.create(question=q2, text="str", is_correct=False)
        Answer.objects.create(question=q2, text="bool", is_correct=False)
        
        # Вопрос 3
        q3 = Question.objects.create(quiz=quiz1, text="Какая функция используется для вывода данных в консоль?")
        Answer.objects.create(question=q3, text="print()", is_correct=True)
        Answer.objects.create(question=q3, text="console.log()", is_correct=False)
        Answer.objects.create(question=q3, text="write()", is_correct=False)
        Answer.objects.create(question=q3, text="output()", is_correct=False)
    
    # Создаем второй тестовый квиз: "Основы JavaScript"
    quiz2, created = Quiz.objects.get_or_create(
        title="Основы JavaScript",
        author=admin_user
    )
    if created:
        print(f"Создан новый квиз: {quiz2.title}")
    else:
        print(f"Квиз уже существует: {quiz2.title}")
        
    # Добавляем вопросы и ответы ко второму квизу
    if created:
        # Вопрос 1
        q1 = Question.objects.create(quiz=quiz2, text="Какой оператор используется для сравнения значения и типа в JavaScript?")
        Answer.objects.create(question=q1, text="===", is_correct=True)
        Answer.objects.create(question=q1, text="==", is_correct=False)
        Answer.objects.create(question=q1, text="=", is_correct=False)
        Answer.objects.create(question=q1, text="!=", is_correct=False)
        
        # Вопрос 2
        q2 = Question.objects.create(quiz=quiz2, text="Какая функция используется для вывода в консоль в JavaScript?")
        Answer.objects.create(question=q2, text="console.log()", is_correct=True)
        Answer.objects.create(question=q2, text="print()", is_correct=False)
        Answer.objects.create(question=q2, text="System.out.println()", is_correct=False)
        Answer.objects.create(question=q2, text="echo", is_correct=False)
        
        # Вопрос 3
        q3 = Question.objects.create(quiz=quiz2, text="Что такое DOM в JavaScript?")
        Answer.objects.create(question=q3, text="Document Object Model", is_correct=True)
        Answer.objects.create(question=q3, text="Data Object Model", is_correct=False)
        Answer.objects.create(question=q3, text="Document Orient Model", is_correct=False)
        Answer.objects.create(question=q3, text="Digital Object Model", is_correct=False)
    
    # Создаем третий тестовый квиз: "Алгоритмы и структуры данных"
    quiz3, created = Quiz.objects.get_or_create(
        title="Алгоритмы и структуры данных",
        author=admin_user
    )
    if created:
        print(f"Создан новый квиз: {quiz3.title}")
    else:
        print(f"Квиз уже существует: {quiz3.title}")
        
    # Добавляем вопросы и ответы к третьему квизу
    if created:
        # Вопрос 1
        q1 = Question.objects.create(quiz=quiz3, text="Какова сложность поиска в хэш-таблице в среднем случае?")
        Answer.objects.create(question=q1, text="O(1)", is_correct=True)
        Answer.objects.create(question=q1, text="O(n)", is_correct=False)
        Answer.objects.create(question=q1, text="O(log n)", is_correct=False)
        Answer.objects.create(question=q1, text="O(n log n)", is_correct=False)
        
        # Вопрос 2
        q2 = Question.objects.create(quiz=quiz3, text="Какой алгоритм сортировки имеет сложность O(n²) в худшем случае?")
        Answer.objects.create(question=q2, text="Пузырьковая сортировка", is_correct=True)
        Answer.objects.create(question=q2, text="Быстрая сортировка", is_correct=False)
        Answer.objects.create(question=q2, text="Сортировка слиянием", is_correct=False)
        Answer.objects.create(question=q2, text="Сортировка кучей", is_correct=False)
        
        # Вопрос 3
        q3 = Question.objects.create(quiz=quiz3, text="Какая структура данных работает по принципу LIFO?")
        Answer.objects.create(question=q3, text="Стек", is_correct=True)
        Answer.objects.create(question=q3, text="Очередь", is_correct=False)
        Answer.objects.create(question=q3, text="Связный список", is_correct=False)
        Answer.objects.create(question=q3, text="Граф", is_correct=False)
    
    print("Создание тестовых квизов завершено!")

if __name__ == "__main__":
    create_test_quizzes() 