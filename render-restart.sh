#!/bin/bash
# Скрипт для запуска пустого коммита для пересоздания приложения на Render
git commit --allow-empty -m "Force Render rebuild"
git push origin main 