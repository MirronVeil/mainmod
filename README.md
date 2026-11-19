# MineMods — Каталог модов Minecraft (Node.js + Express + PostgreSQL)

Проект переведён на стек **Node.js + Express + PostgreSQL** (аналогично структуре CyberArena).

## Быстрый запуск за 3 шага:

1. **Создайте базу в pgAdmin 4:**
   - Создайте пустую базу данных **`minemods`**.
   - Откройте **Query Tool** для базы `minemods`, вставьте содержимое файла **`database.sql`** и нажмите **Play (▶)**.

2. **Проверьте пароль в файле `.env`:**
   - Откройте файл **`.env`** в корне папки и впишите в `DB_PASSWORD=` свой пароль от PostgreSQL (по умолчанию стоит `12345`).

3. **Установите пакеты и запустите сервер в терминале VS Code:**
   ```bash
   npm install
   npm start
   ```
   После этого откройте в браузере: **http://localhost:3000**
