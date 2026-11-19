require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3004;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Автоматически работает и с облаком Render (DATABASE_URL), и с локальным ПК
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '1217gera1419',
      database: process.env.DB_NAME || 'modemain',
    });

// Автоматическая инициализация таблиц, если база ещё пустая (удобно для Render!)
async function initDatabase() {
  try {
    const check = await pool.query("SELECT to_regclass('public.mods') AS exists");
    if (!check.rows[0].exists) {
      console.log('⏳ Таблицы не найдены, заливаем database.sql автоматически...');
      const sql = fs.readFileSync(path.join(__dirname, 'database.sql'), 'utf8');
      await pool.query(sql);
      console.log('✅ База данных успешно инициализирована из database.sql!');
    } else {
      console.log('✅ Подключено к PostgreSQL, таблицы на месте.');
    }
  } catch (err) {
    console.error('❌ Ошибка инициализации БД:', err.message);
  }
}

initDatabase();

// Получить список пользователей
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email FROM users ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Добавить нового пользователя
app.post('/api/users', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email) {
    return res.status(400).json({ error: 'Укажите никнейм и email' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username.trim(), email.trim(), 'hash_' + (password || '1217gera1419')]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: 'Пользователь с таким ником или email уже существует' });
  }
});

// Получить список модов (поиск, фильтрация, сортировка)
app.get('/api/mods', async (req, res) => {
  const { search, category, loader, sort } = req.query;
  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(m.title ILIKE $${params.length} OR m.description ILIKE $${params.length})`);
  }
  if (category) {
    params.push(category);
    conditions.push(`m.category = $${params.length}`);
  }
  if (loader) {
    params.push(loader);
    conditions.push(`m.loader = $${params.length}`);
  }

  let orderBy = 'm.id DESC';
  if (sort === 'downloads') orderBy = 'm.downloads DESC';
  if (sort === 'likes') orderBy = 'likes_count DESC';
  if (sort === 'title') orderBy = 'm.title ASC';

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const sql = `
    SELECT m.*, u.username AS author_name, COUNT(l.user_id)::int AS likes_count
    FROM mods m
    JOIN users u ON m.author_id = u.id
    LEFT JOIN likes l ON m.id = l.mod_id
    ${whereClause}
    GROUP BY m.id, u.username
    ORDER BY ${orderBy}
  `;

  try {
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Создать мод (CREATE)
app.post('/api/mods', async (req, res) => {
  const { title, description, category, mc_version, loader, download_url, author_id } = req.body;
  if (!title || !description || !category || !mc_version || !loader || !download_url || !author_id) {
    return res.status(400).json({ error: 'Заполните все обязательные поля' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO mods (title, description, category, mc_version, loader, download_url, author_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title.trim(), description.trim(), category, mc_version, loader, download_url.trim(), Number(author_id)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Обновить мод (UPDATE)
app.put('/api/mods/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, category, mc_version, loader, download_url } = req.body;
  try {
    const result = await pool.query(
      `UPDATE mods
       SET title = $1, description = $2, category = $3, mc_version = $4, loader = $5, download_url = $6
       WHERE id = $7 RETURNING *`,
      [title, description, category, mc_version, loader, download_url, Number(id)]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Мод не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Счётчик скачиваний
app.post('/api/mods/:id/download', async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE mods SET downloads = downloads + 1 WHERE id = $1 RETURNING downloads',
      [Number(req.params.id)]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Лайк
app.post('/api/mods/:id/like', async (req, res) => {
  const modId = Number(req.params.id);
  const userId = Number(req.body.user_id) || 1;
  try {
    await pool.query(
      'INSERT INTO likes (user_id, mod_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, modId]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Удалить мод (DELETE)
app.delete('/api/mods/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM mods WHERE id = $1', [Number(req.params.id)]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер MineMods запущен на порту ${PORT}`);
});
