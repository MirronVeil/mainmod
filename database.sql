-- Создание таблиц для проекта MineMods (PostgreSQL)

DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS mods CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(30)  NOT NULL UNIQUE,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE mods (
    id           SERIAL PRIMARY KEY,
    title        VARCHAR(100) NOT NULL,
    description  TEXT         NOT NULL,
    category     VARCHAR(40)  NOT NULL,
    mc_version   VARCHAR(20)  NOT NULL,
    loader       VARCHAR(20)  NOT NULL,
    download_url VARCHAR(500) NOT NULL,
    downloads    INTEGER      NOT NULL DEFAULT 0,
    author_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE likes (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mod_id  INTEGER NOT NULL REFERENCES mods(id)  ON DELETE CASCADE,
    PRIMARY KEY (user_id, mod_id)
);

-- Начальные пользователи
INSERT INTO users (username, email, password_hash) VALUES
('SteveCraft', 'steve@minemods.ru', 'hash_steve_123'),
('AlexBuilder', 'alex@minemods.ru', 'hash_alex_123'),
('RedstonePro', 'redstone@minemods.ru', 'hash_redstone_123'),
('CreeperKing', 'creeper@minemods.ru', 'hash_creeper_123'),
('EnderDev', 'ender@minemods.ru', 'hash_ender_123');

-- Начальные моды (10 записей)
INSERT INTO mods (title, description, category, mc_version, loader, download_url, downloads, author_id) VALUES
('Sodium FPS Boost', 'Мощная оптимизация движка рендеринга, повышает FPS в 3 раза без потери качества картинки.', 'Оптимизация', '1.21.1', 'Fabric', 'https://modrinth.com/mod/sodium', 15420, 1),
('Create: Steam & Rails', 'Добавляет шестерёнки, поезда, конвейеры и сложные кинетические механизмы в мир Minecraft.', 'Технологии', '1.20.1', 'Forge', 'https://modrinth.com/mod/create', 12890, 3),
('Biomes O Plenty', 'Более 80 новых уникальных биомов в Верхнем мире и Незере с новыми деревьями и блоками.', 'Мир и биомы', '1.20.4', 'NeoForge', 'https://modrinth.com/mod/biomes-o-plenty', 9430, 2),
('Just Enough Items (JEI)', 'Удобный просмотр всех рецептов крафта, плавки и зельеварения прямо в инвентаре.', 'Утилиты', '1.21.1', 'Forge', 'https://modrinth.com/mod/jei', 21300, 5),
('Twilight Forest', 'Легендарное измерение Сумеречного леса с боссами, данжами и уникальными артефактами.', 'Приключения', '1.20.1', 'Forge', 'https://modrinth.com/mod/twilightforest', 11200, 4),
('Iris Shaders', 'Поддержка шейдеров OptiFine на Fabric с высокой производительностью и совместимостью с Sodium.', 'Графика', '1.21.1', 'Fabric', 'https://modrinth.com/mod/iris', 14100, 1),
('Applied Energistics 2', 'Цифровое хранение предметов в МЭ-сети и автоматизация крафтов любой сложности.', 'Технологии', '1.20.1', 'NeoForge', 'https://modrinth.com/mod/ae2', 8750, 3),
('Waystones', 'Телепорты-обелиски для быстрого перемещения между базами и деревнями.', 'Приключения', '1.20.4', 'Fabric', 'https://modrinth.com/mod/waystones', 7640, 2),
('Appleskin', 'Показывает точное восстановление сытости и насыщения от еды в интерфейсе.', 'Утилиты', '1.21.1', 'Fabric', 'https://modrinth.com/mod/appleskin', 10500, 5),
('Mekanism', 'Высокотехнологичные реакторы, джетпаки, рудообработка x5 и цифровая шахта.', 'Технологии', '1.20.1', 'Forge', 'https://modrinth.com/mod/mekanism', 9800, 3);

-- Лайки (связь многие-ко-многим)
INSERT INTO likes (user_id, mod_id) VALUES
(1, 2), (1, 4), (2, 1), (2, 3), (3, 1), (3, 6), (4, 5), (5, 2), (5, 7);
