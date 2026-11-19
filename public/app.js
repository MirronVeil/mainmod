let allMods = [];
let allUsers = [];

async function loadUsers() {
  const res = await fetch('/api/users');
  allUsers = await res.json();
  const select = document.getElementById('author_id');
  select.innerHTML = allUsers.map(u => `<option value="${u.id}">${u.username} (${u.email})</option>`).join('');
}

async function loadMods() {
  const search = document.getElementById('searchInput').value;
  const category = document.getElementById('categoryFilter').value;
  const loader = document.getElementById('loaderFilter').value;
  const sort = document.getElementById('sortFilter').value;

  const params = new URLSearchParams({ search, category, loader, sort });
  const res = await fetch('/api/mods?' + params.toString());
  allMods = await res.json();

  const grid = document.getElementById('modsGrid');
  if (!allMods.length) {
    grid.innerHTML = '<p style="color:#9eb096">Моды не найдены.</p>';
    return;
  }

  grid.innerHTML = allMods.map(m => `
    <article class="card">
      <div>
        <div class="tags">
          <span class="tag">${m.loader}</span>
          <span class="tag">${m.mc_version}</span>
          <span class="tag green">${m.category}</span>
        </div>
        <h3>${escapeHtml(m.title)}</h3>
        <p>${escapeHtml(m.description)}</p>
      </div>
      <div>
        <div class="meta" style="margin-bottom:10px">
          Автор: <b>${escapeHtml(m.author_name)}</b> · ⬇ ${m.downloads} · ♥ ${m.likes_count}
        </div>
        <div class="card-actions">
          <button class="btn primary small" onclick="downloadMod(${m.id}, '${escapeHtml(m.download_url)}')">⬇ Скачать</button>
          <button class="btn ghost small" onclick="likeMod(${m.id})">♥ Лайк</button>
          <button class="btn ghost small" onclick="editMod(${m.id})">✏️</button>
          <button class="btn danger small" onclick="deleteMod(${m.id})">🗑</button>
        </div>
      </div>
    </article>
  `).join('');
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s]));
}

function openModModal() {
  document.getElementById('modalTitle').textContent = 'Добавить мод';
  document.getElementById('modForm').reset();
  document.getElementById('modId').value = '';
  document.getElementById('authorLabel').style.display = 'block';
  document.getElementById('modModal').classList.remove('hidden');
}

function editMod(id) {
  const m = allMods.find(item => item.id === id);
  if (!m) return;
  document.getElementById('modalTitle').textContent = 'Редактировать мод';
  document.getElementById('modId').value = m.id;
  document.getElementById('title').value = m.title;
  document.getElementById('description').value = m.description;
  document.getElementById('category').value = m.category;
  document.getElementById('mc_version').value = m.mc_version;
  document.getElementById('loader').value = m.loader;
  document.getElementById('download_url').value = m.download_url;
  document.getElementById('authorLabel').style.display = 'none';
  document.getElementById('modModal').classList.remove('hidden');
}

function closeModModal() {
  document.getElementById('modModal').classList.add('hidden');
}

async function saveMod(e) {
  e.preventDefault();
  const id = document.getElementById('modId').value;
  const payload = {
    title: document.getElementById('title').value,
    description: document.getElementById('description').value,
    category: document.getElementById('category').value,
    mc_version: document.getElementById('mc_version').value,
    loader: document.getElementById('loader').value,
    download_url: document.getElementById('download_url').value,
    author_id: document.getElementById('author_id').value
  };

  if (id) {
    await fetch('/api/mods/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } else {
    await fetch('/api/mods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }
  closeModModal();
  loadMods();
}

async function downloadMod(id, url) {
  await fetch('/api/mods/' + id + '/download', { method: 'POST' });
  loadMods();
  window.open(url, '_blank');
}

async function likeMod(id) {
  const userId = allUsers.length ? allUsers[0].id : 1;
  await fetch('/api/mods/' + id + '/like', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId })
  });
  loadMods();
}

async function deleteMod(id) {
  if (!confirm('Удалить этот мод из базы данных?')) return;
  await fetch('/api/mods/' + id, { method: 'DELETE' });
  loadMods();
}

function openUserModal() {
  document.getElementById('userModal').classList.remove('hidden');
}
function closeUserModal() {
  document.getElementById('userModal').classList.add('hidden');
}

async function saveUser(e) {
  e.preventDefault();
  const payload = {
    username: document.getElementById('username').value,
    email: document.getElementById('email').value,
    password: document.getElementById('password').value
  };
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    alert(err.error || 'Ошибка создания автора');
    return;
  }
  closeUserModal();
  await loadUsers();
}

loadUsers().then(loadMods);
