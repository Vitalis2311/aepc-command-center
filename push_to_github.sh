#!/bin/bash
# Скрипт для загрузки изменений на GitHub
# Запусти его из папки aepc-command-center-main

echo "=== Загружаем изменения на GitHub ==="

git add aepc-command-center/src/authConfig.js
git add aepc-command-center/src/App.jsx
git add aepc-command-center/src/main.jsx
git add aepc-command-center/package.json

git commit -m "feat: add Microsoft login + Dataverse scopes"

git push origin main

echo "=== Готово! ==="
