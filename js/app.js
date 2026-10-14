// ============================================================
// LÓGICA PRINCIPAL - IMPULSO (PRODUCTIVIDAD & CRECIMIENTO)
// ============================================================

let appData = null;
let currentTab = 'hoy';
let currentFilter = 'todas';
let currentSuggestion = null;

function ensureAppDataStructure(data) {
  if (!data || typeof data !== 'object') {
    data = getDefaultData();
  }
  if (!Array.isArray(data.improvements)) data.improvements = [];
  if (!Array.isArray(data.habits)) data.habits = [];
  if (!Array.isArray(data.todayTasks)) data.todayTasks = [];
  if (!Array.isArray(data.quickNotes)) data.quickNotes = [];
  if (!Array.isArray(data.categories) || data.categories.length === 0) {
    data.categories = ["Salud", "Hábitos", "Mentalidad", "Finanzas", "Trabajo / Estudio", "Personal"];
  }
  return data;
}

document.addEventListener('DOMContentLoaded', () => {
  // Inicializar componentes base
  initHeaderAndDate();
  initNavigation();
  initTodayView();
  initImprovementsView();
  initHabitsView();
  initNotesView();
  initSettingsAndProfile();
  initModals();
  initReminderAlertSystem();
  removeNetlifyBadge();
  setInterval(removeNetlifyBadge, 15000);
  registerServiceWorker();

  // Sistema de autenticación previa y cuentas privadas por PIN
  initAuth();
});

// ============================================================
// 0. CONTROL DE ACCESO, CUENTAS Y PRIVACIDAD POR PIN
// ============================================================
function initAuth() {
  const authScreen = document.getElementById('authScreen');
  const appShell = document.getElementById('appShell');
  const tabLoginBtn = document.getElementById('tabLoginBtn');
  const tabRegisterBtn = document.getElementById('tabRegisterBtn');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginErrorMsg = document.getElementById('loginErrorMsg');
  const registerErrorMsg = document.getElementById('registerErrorMsg');
  const loginUserInput = document.getElementById('loginUserInput');
  const loginPinInput = document.getElementById('loginPinInput');
  const regUserInput = document.getElementById('regUserInput');
  const regPinInput = document.getElementById('regPinInput');
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');
  const registerSubmitBtn = document.getElementById('registerSubmitBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  // Alternar pestañas (Iniciar Sesión vs Crear Cuenta)
  if (tabLoginBtn && tabRegisterBtn) {
    tabLoginBtn.addEventListener('click', () => {
      tabLoginBtn.classList.add('active');
      tabRegisterBtn.classList.remove('active');
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
      if (loginErrorMsg) loginErrorMsg.classList.add('hidden');
    });

    tabRegisterBtn.addEventListener('click', () => {
      tabRegisterBtn.classList.add('active');
      tabLoginBtn.classList.remove('active');
      registerForm.classList.remove('hidden');
      loginForm.classList.add('hidden');
      if (registerErrorMsg) registerErrorMsg.classList.add('hidden');
    });
  }

  // Estilos visuales para selector de plantilla
  document.querySelectorAll('input[name="regTemplate"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.radio-card').forEach((card) => {
        card.classList.toggle('active', card.querySelector('input').checked);
      });
    });
  });

  // Enviar formulario de Iniciar Sesión
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (loginErrorMsg) loginErrorMsg.classList.add('hidden');
      loginSubmitBtn.disabled = true;
      loginSubmitBtn.innerHTML = `<span>Entrando...</span> <span>⏳</span>`;

      const userVal = loginUserInput.value.trim();
      const pinVal = loginPinInput.value.trim();
      const rememberMe = document.getElementById('loginRememberMe')?.checked ?? true;

      const result = await AppStorage.login(userVal, pinVal, rememberMe);
      loginSubmitBtn.disabled = false;
      loginSubmitBtn.innerHTML = `<span>Entrar a mi espacio</span> <span>🚀</span>`;

      if (result.success) {
        appData = ensureAppDataStructure(result.data);
        enterApp(AppStorage.getActiveSession());
        showToast(`✨ ¡Bienvenido/a de nuevo, ${result.userName}!`);
      } else {
        if (loginErrorMsg) {
          loginErrorMsg.textContent = result.error || 'PIN o usuario incorrecto.';
          loginErrorMsg.classList.remove('hidden');
        }
      }
    });
  }

  // Enviar formulario de Crear Cuenta Nueva
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (registerErrorMsg) registerErrorMsg.classList.add('hidden');
      registerSubmitBtn.disabled = true;
      registerSubmitBtn.innerHTML = `<span>Creando cuenta...</span> <span>⏳</span>`;

      const userVal = regUserInput.value.trim();
      const pinVal = regPinInput.value.trim();
      const templateChoice = document.querySelector('input[name="regTemplate"]:checked')?.value || 'ejemplo';
      const rememberMe = document.getElementById('regRememberMe')?.checked ?? true;

      const result = await AppStorage.register(userVal, pinVal, templateChoice, rememberMe);
      registerSubmitBtn.disabled = false;
      registerSubmitBtn.innerHTML = `<span>Crear mi cuenta privada</span> <span>✨</span>`;

      if (result.success) {
        appData = ensureAppDataStructure(result.data);
        enterApp(AppStorage.getActiveSession());
        showToast(`🎉 ¡Cuenta creada con éxito!`);
      } else {
        if (registerErrorMsg) {
          registerErrorMsg.textContent = result.error || 'Error al crear la cuenta.';
          registerErrorMsg.classList.remove('hidden');
        }
      }
    });
  }

  // Botón Salir / Logout en cabecera
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      AppStorage.logout();
      authScreen.classList.remove('hidden');
      appShell.classList.add('hidden');
      if (loginUserInput) loginUserInput.value = '';
      if (loginPinInput) loginPinInput.value = '';
      if (regUserInput) regUserInput.value = '';
      if (regPinInput) regPinInput.value = '';
      showToast('🔒 Sesión cerrada');
    });
  }

  // Comprobar si ya existe sesión activa recordada
  const activeSession = AppStorage.getActiveSession();
  if (activeSession) {
    const cached = AppStorage.loadLocalCache();
    appData = ensureAppDataStructure((cached && cached.data) ? cached.data : getDefaultData());
    enterApp(activeSession);
  } else {
    // Si no hay sesión, mostrar exclusivamente la pantalla de acceso
    authScreen.classList.remove('hidden');
    appShell.classList.add('hidden');
  }
}

function enterApp(session) {
  const authScreen = document.getElementById('authScreen');
  const appShell = document.getElementById('appShell');

  if (authScreen) authScreen.classList.add('hidden');
  if (appShell) appShell.classList.remove('hidden');

  updateHeaderName();
  renderAllViews();

  // Actualizar indicador de cuenta en modal de sincronización
  const syncDisplay = document.getElementById('syncUserAccountDisplay');
  if (syncDisplay && session) {
    syncDisplay.textContent = session.userName || session.username;
  }

  // Conectar sincronización en vivo con Firebase
  AppStorage.connectLiveSync((remoteData) => {
    if (remoteData) {
      appData = ensureAppDataStructure(remoteData);
      renderAllViews();
    }
  });
}

function renderAllViews() {
  if (!appData) return;
  updateHeaderName();
  renderTodayTasks();
  renderTodayHabitsRow();
  renderImprovementCategoryFilters();
  renderImprovements();
  renderHabitsDetailed();
  renderNotes();
}

function getDefaultData() {
  return {
    improvements: SEED_DATA.initialImprovements,
    habits: SEED_DATA.initialHabits,
    todayTasks: [
      { id: "t-1", text: "Completar mi primer hábito del día", done: false },
      { id: "t-2", text: "Dedicar 15 minutos a una mejora personal", done: false }
    ],
    quickNotes: [
      { id: "n-1", text: "La constancia siempre le gana a la intensidad momentánea.", date: AppStorage.getTodayString() }
    ],
    categories: ["Salud", "Hábitos", "Mentalidad", "Finanzas", "Trabajo / Estudio", "Personal"]
  };
}

// ============================================================
// 1. CABECERA, NOMBRE Y FECHA
// ============================================================
function initHeaderAndDate() {
  updateHeaderName();

  const dateEl = document.getElementById('currentDateDisplay');
  const quoteEl = document.getElementById('quoteText');

  const options = { weekday: 'long', day: 'numeric', month: 'long' };
  const todayStr = new Date().toLocaleDateString('es-ES', options);
  if (dateEl) dateEl.textContent = todayStr;

  if (quoteEl && SEED_DATA.motivationalQuotes.length > 0) {
    const dayIndex = new Date().getDate() % SEED_DATA.motivationalQuotes.length;
    quoteEl.textContent = `"${SEED_DATA.motivationalQuotes[dayIndex]}"`;
  }
}

function updateHeaderName() {
  const nameDisplay = document.getElementById('userNameDisplay');
  const session = AppStorage.getActiveSession();
  if (nameDisplay) {
    nameDisplay.textContent = (session && session.userName) || (appData && appData.userName) || 'Usuario';
  }
}

// ============================================================
// 2. SISTEMA DE NAVEGACIÓN
// ============================================================
function initNavigation() {
  const desktopBtns = document.querySelectorAll('.nav-tab-btn');
  const mobileBtns = document.querySelectorAll('.mobile-nav-btn');
  const panels = document.querySelectorAll('.view-panel');

  function switchTab(tabId) {
    currentTab = tabId;

    desktopBtns.forEach((b) => b.classList.toggle('active', b.dataset.tab === tabId));
    mobileBtns.forEach((b) => b.classList.toggle('active', b.dataset.tab === tabId));

    panels.forEach((p) => {
      p.classList.toggle('active', p.id === `view${capitalize(tabId)}`);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  desktopBtns.forEach((b) => b.addEventListener('click', () => switchTab(b.dataset.tab)));
  mobileBtns.forEach((b) => b.addEventListener('click', () => switchTab(b.dataset.tab)));

  const goToHabits = document.getElementById('goToHabitsLink');
  if (goToHabits) {
    goToHabits.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab('habitos');
    });
  }
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ============================================================
// 3. VISTA 1: HOY (FOCO Y PRODUCTIVIDAD)
// ============================================================
function initTodayView() {
  renderTodayTasks();
  renderTodayHabitsRow();

  const suggestBtn = document.getElementById('suggestActionBtn');
  if (suggestBtn) {
    suggestBtn.addEventListener('click', () => openSuggestionModal());
  }

  // Añadir foco
  const addTaskBtn = document.getElementById('addTodayTaskBtn');
  if (addTaskBtn) {
    addTaskBtn.addEventListener('click', () => {
      const text = prompt('¿Qué tarea o foco quieres marcarte para hoy?');
      if (text && text.trim()) {
        appData.todayTasks.push({
          id: 't-' + Date.now(),
          text: text.trim(),
          done: false
        });
        AppStorage.saveData(appData);
        renderTodayTasks();
        showToast('🎯 Foco añadido para hoy');
      }
    });
  }
}

function renderTodayTasks() {
  const list = document.getElementById('todayTasksList');
  if (!list || !appData || !appData.todayTasks) return;

  list.innerHTML = '';

  if (appData.todayTasks.length === 0) {
    list.innerHTML = `<p style="color:var(--text-dim);font-size:0.9rem;text-align:center;padding:1rem;">No tienes focos fijados hoy. Añade uno con el botón superior.</p>`;
    return;
  }

  appData.todayTasks.forEach((task) => {
    const item = document.createElement('div');
    item.className = `task-item ${task.done ? 'completed' : ''}`;

    item.innerHTML = `
      <div class="task-left">
        <div class="task-check-circle">${task.done ? '✓' : ''}</div>
        <span class="task-text">${escapeHtml(task.text)}</span>
      </div>
      <div class="task-actions">
        <button class="btn-item-action btn-edit-task" title="Editar tarea">✏️</button>
        <button class="btn-item-action delete btn-del-task" title="Eliminar tarea">🗑️</button>
      </div>
    `;

    // Toggle completed
    item.querySelector('.task-left').addEventListener('click', () => {
      task.done = !task.done;
      AppStorage.saveData(appData);
      renderTodayTasks();
      if (task.done) {
        playTone(600, 800);
        showToast('¡Foco completado! Gran trabajo 👏');
      }
    });

    // Editar tarea
    item.querySelector('.btn-edit-task').addEventListener('click', (e) => {
      e.stopPropagation();
      const updated = prompt('Editar foco de hoy:', task.text);
      if (updated !== null && updated.trim()) {
        task.text = updated.trim();
        AppStorage.saveData(appData);
        renderTodayTasks();
        showToast('✏️ Foco actualizado');
      }
    });

    // Eliminar tarea
    item.querySelector('.btn-del-task').addEventListener('click', (e) => {
      e.stopPropagation();
      appData.todayTasks = appData.todayTasks.filter((t) => t.id !== task.id);
      AppStorage.saveData(appData);
      renderTodayTasks();
      showToast('🗑️ Foco eliminado');
    });

    list.appendChild(item);
  });
}

function renderTodayHabitsRow() {
  const row = document.getElementById('todayHabitsRow');
  if (!row || !appData || !appData.habits) return;

  row.innerHTML = '';
  const todayKey = AppStorage.getTodayString();

  if (appData.habits.length === 0) {
    row.innerHTML = `<p style="color:var(--text-dim);font-size:0.85rem;grid-column:1/-1;text-align:center;">No tienes hábitos creados. Ve a la pestaña Hábitos para añadir uno.</p>`;
    return;
  }

  appData.habits.forEach((habit) => {
    const isDone = habit.history && habit.history[todayKey];
    const pill = document.createElement('div');
    pill.className = `quick-habit-pill ${isDone ? 'completed' : ''}`;

    pill.innerHTML = `
      <span class="quick-habit-icon">${habit.icon || '⚡'}</span>
      <span class="quick-habit-name">${escapeHtml(habit.name)}</span>
      <div class="quick-habit-meta">
        <span class="quick-habit-streak">🔥 ${habit.streak || 0}d</span>
        ${habit.reminderTime && habit.reminderEnabled ? `<span class="quick-habit-time">⏰ ${habit.reminderTime}</span>` : ''}
      </div>
    `;

    pill.addEventListener('click', () => {
      toggleHabitForToday(habit);
      renderTodayHabitsRow();
      renderHabitsDetailed();
    });

    row.appendChild(pill);
  });
}

function toggleHabitForToday(habit) {
  const todayKey = AppStorage.getTodayString();
  if (!habit.history) habit.history = {};

  const wasDone = habit.history[todayKey];
  if (wasDone) {
    delete habit.history[todayKey];
    habit.streak = Math.max(0, (habit.streak || 1) - 1);
  } else {
    habit.history[todayKey] = true;
    habit.streak = (habit.streak || 0) + 1;
    playTone(523, 784);
    showToast(`🔥 ¡Racha de "${habit.name}" aumentada a ${habit.streak} días!`);
  }

  AppStorage.saveData(appData);
}

// ============================================================
// 4. MODAL: ¿QUÉ HAGO PRODUCTIVO AHORA?
// ============================================================
function openSuggestionModal() {
  const pool = SEED_DATA.quickProductiveIdeas;
  currentSuggestion = pool[Math.floor(Math.random() * pool.length)];

  document.getElementById('suggestTitle').textContent = currentSuggestion.title;
  document.getElementById('suggestDesc').textContent = currentSuggestion.desc;
  document.getElementById('suggestTime').textContent = `⏱️ ${currentSuggestion.time}`;
  document.getElementById('suggestTag').textContent = `🏷️ ${currentSuggestion.tag}`;

  document.getElementById('suggestModal').classList.remove('hidden');
}

// ============================================================
// 5. VISTA 2: COSAS PARA MEJORAR (CRECIMIENTO Y ÁREAS LIBRES)
// ============================================================
function initImprovementsView() {
  renderImprovementCategoryFilters();
  renderImprovements();

  // Abrir modal nueva mejora
  const openBtn = document.getElementById('openAddImprovementBtn');
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      document.getElementById('improvementModalTitle').textContent = 'Añadir Algo para Mejorar 🎯';
      document.getElementById('editImpId').value = '';
      document.getElementById('addImprovementForm').reset();
      populateCategorySelect();
      document.getElementById('customCategoryInput').classList.add('hidden');
      document.getElementById('addImprovementModal').classList.remove('hidden');
    });
  }

  // Alternar campo de categoría personalizada
  const toggleCatBtn = document.getElementById('toggleCustomCatBtn');
  if (toggleCatBtn) {
    toggleCatBtn.addEventListener('click', () => {
      const customInput = document.getElementById('customCategoryInput');
      const select = document.getElementById('impCategorySelect');
      if (customInput.classList.contains('hidden')) {
        customInput.classList.remove('hidden');
        customInput.focus();
        select.disabled = true;
        toggleCatBtn.textContent = '← Elegir de la lista';
      } else {
        customInput.classList.add('hidden');
        customInput.value = '';
        select.disabled = false;
        toggleCatBtn.textContent = '+ Escribir una nueva área';
      }
    });
  }

  // Guardar mejora (nueva o editada)
  const form = document.getElementById('addImprovementForm');
  const submitBtn = document.getElementById('submitImpBtn');
  let isSavingImp = false;

  function handleSaveImprovement(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (isSavingImp) return;

    if (!appData) appData = ensureAppDataStructure({});
    ensureAppDataStructure(appData);

    const editId = document.getElementById('editImpId').value;
    const titleInput = document.getElementById('impTitleInput');
    const actionInput = document.getElementById('impActionInput');
    const title = titleInput ? titleInput.value.trim() : '';
    const action = actionInput ? actionInput.value.trim() : '';

    if (!title) {
      showToast('⚠️ Por favor, escribe qué quieres mejorar');
      if (titleInput) {
        titleInput.focus();
        titleInput.style.borderColor = 'var(--accent-rose)';
        setTimeout(() => { titleInput.style.borderColor = ''; }, 2200);
      }
      return;
    }

    if (!action) {
      showToast('⚠️ Por favor, escribe una micro-acción para lograrlo');
      if (actionInput) {
        actionInput.focus();
        actionInput.style.borderColor = 'var(--accent-rose)';
        setTimeout(() => { actionInput.style.borderColor = ''; }, 2200);
      }
      return;
    }

    isSavingImp = true;

    const customInput = document.getElementById('customCategoryInput');
    let category = '';
    if (customInput && !customInput.classList.contains('hidden') && customInput.value.trim()) {
      category = customInput.value.trim();
      if (!appData.categories.includes(category)) {
        appData.categories.push(category);
      }
    } else {
      category = (document.getElementById('impCategorySelect')?.value) || 'Salud';
    }

    if (editId) {
      // Editando existente
      const target = appData.improvements.find((i) => i.id === editId);
      if (target) {
        target.title = title;
        target.category = category;
        target.action = action;
        showToast('✏️ Mejora actualizada');
      }
    } else {
      // Creando nueva
      appData.improvements.push({
        id: 'imp-' + Date.now(),
        title,
        category,
        action,
        status: 'en_progreso',
        progress: 0,
        createdAt: new Date().toISOString()
      });
      showToast('🎯 Nueva área de mejora registrada');
    }

    AppStorage.saveData(appData);
    renderImprovementCategoryFilters();
    renderImprovements();
    document.getElementById('addImprovementModal').classList.add('hidden');

    setTimeout(() => { isSavingImp = false; }, 300);
  }

  if (form) {
    form.addEventListener('submit', handleSaveImprovement);
  }
  if (submitBtn) {
    submitBtn.addEventListener('click', handleSaveImprovement);
  }
}

function populateCategorySelect(selectedCategory = '') {
  const select = document.getElementById('impCategorySelect');
  if (!select) return;

  select.innerHTML = '';
  select.disabled = false;

  const categories = appData.categories || ["Salud", "Hábitos", "Mentalidad", "Finanzas", "Trabajo / Estudio", "Personal"];

  categories.forEach((cat) => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    if (cat === selectedCategory) opt.selected = true;
    select.appendChild(opt);
  });
}

function renderImprovementCategoryFilters() {
  const container = document.getElementById('improvementFilters');
  if (!container || !appData || !appData.improvements) return;

  container.innerHTML = '';

  // Botón "Todas"
  const allBtn = document.createElement('button');
  allBtn.className = `chip-btn ${currentFilter === 'todas' ? 'active' : ''}`;
  allBtn.textContent = 'Todas';
  allBtn.addEventListener('click', () => {
    currentFilter = 'todas';
    renderImprovementCategoryFilters();
    renderImprovements();
  });
  container.appendChild(allBtn);

  // Obtener categorías presentes
  const usedCategories = new Set();
  appData.improvements.forEach((i) => {
    if (i.category) usedCategories.add(i.category);
  });

  usedCategories.forEach((cat) => {
    const btn = document.createElement('button');
    btn.className = `chip-btn ${currentFilter === cat ? 'active' : ''}`;
    btn.textContent = cat;
    btn.addEventListener('click', () => {
      currentFilter = cat;
      renderImprovementCategoryFilters();
      renderImprovements();
    });
    container.appendChild(btn);
  });
}

function renderImprovements() {
  const grid = document.getElementById('improvementsGrid');
  if (!grid || !appData || !appData.improvements) return;

  grid.innerHTML = '';

  const filtered = appData.improvements.filter((imp) => {
    if (currentFilter === 'todas') return true;
    return imp.category === currentFilter;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<p style="color:var(--text-dim);font-size:0.9rem;text-align:center;padding:2rem;">No hay elementos en esta área todavía. Pulsa "+ Nueva mejora" para añadir uno.</p>`;
    return;
  }

  filtered.forEach((imp) => {
    const card = document.createElement('div');
    card.className = 'improvement-card';

    card.innerHTML = `
      <div class="imp-header">
        <span class="imp-category-tag">${escapeHtml(imp.category || 'General')}</span>
        <div class="imp-actions-footer">
          <button class="btn-small-control btn-edit-imp" title="Editar mejora">✏️ Editar</button>
          <button class="btn-small-control btn-prog-down" title="Reducir progreso">-10%</button>
          <button class="btn-small-control btn-prog-up" title="Aumentar progreso">+10%</button>
          <button class="btn-small-control btn-del-imp" title="Eliminar mejora">🗑️</button>
        </div>
      </div>

      <h3 class="imp-title">${escapeHtml(imp.title)}</h3>

      <div class="imp-action-box">
        <span class="imp-action-label">Acción diaria para mejorar esto:</span>
        <p class="imp-action-text">${escapeHtml(imp.action)}</p>
      </div>

      <div class="imp-progress-row">
        <div class="imp-progress-bar">
          <div class="imp-progress-fill" style="width: ${imp.progress || 0}%"></div>
        </div>
        <span class="imp-progress-text">${imp.progress || 0}%</span>
      </div>
    `;

    // Editar
    card.querySelector('.btn-edit-imp').addEventListener('click', () => {
      document.getElementById('improvementModalTitle').textContent = 'Editar Mejora ✏️';
      document.getElementById('editImpId').value = imp.id;
      document.getElementById('impTitleInput').value = imp.title;
      document.getElementById('impActionInput').value = imp.action;

      populateCategorySelect(imp.category);
      document.getElementById('customCategoryInput').classList.add('hidden');
      document.getElementById('toggleCustomCatBtn').textContent = '+ Escribir una nueva área';

      document.getElementById('addImprovementModal').classList.remove('hidden');
    });

    // Controles de progreso
    card.querySelector('.btn-prog-up').addEventListener('click', () => {
      imp.progress = Math.min(100, (imp.progress || 0) + 10);
      AppStorage.saveData(appData);
      renderImprovements();
      if (imp.progress === 100) {
        showToast('🏆 ¡Objetivo de mejora completado al 100%!');
      }
    });

    card.querySelector('.btn-prog-down').addEventListener('click', () => {
      imp.progress = Math.max(0, (imp.progress || 0) - 10);
      AppStorage.saveData(appData);
      renderImprovements();
    });

    // Eliminar con confirmación
    card.querySelector('.btn-del-imp').addEventListener('click', () => {
      if (confirm(`¿Eliminar la mejora "${imp.title}"?`)) {
        appData.improvements = appData.improvements.filter((i) => i.id !== imp.id);
        AppStorage.saveData(appData);
        renderImprovementCategoryFilters();
        renderImprovements();
        showToast('🗑️ Mejora eliminada');
      }
    });

    grid.appendChild(card);
  });
}

// ============================================================
// 6. VISTA 3: HÁBITOS DETALLADOS (CREAR, EDITAR, ELIMINAR)
// ============================================================
function initHabitsView() {
  renderHabitsDetailed();

  // Selector de emojis rápidos
  const emojiSpans = document.querySelectorAll('.emoji-pick');
  emojiSpans.forEach((s) => {
    s.addEventListener('click', () => {
      document.getElementById('habitIconInput').value = s.textContent;
    });
  });

  const openBtn = document.getElementById('openAddHabitBtn');
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      document.getElementById('habitModalTitle').textContent = 'Nuevo Hábito Diario 🔥';
      document.getElementById('editHabitId').value = '';
      document.getElementById('addHabitForm').reset();
      document.getElementById('habitDescInput').value = '';
      document.getElementById('habitTimeInput').value = '';
      document.getElementById('habitNotifyCheck').checked = false;
      document.getElementById('habitIconInput').value = '💧';
      document.getElementById('addHabitModal').classList.remove('hidden');
    });
  }

  const form = document.getElementById('addHabitForm');
  const submitHabitBtn = document.getElementById('submitHabitBtn');
  let isSavingHabit = false;

  function handleSaveHabit(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (isSavingHabit) return;

    if (!appData) appData = ensureAppDataStructure({});
    ensureAppDataStructure(appData);

    const editId = document.getElementById('editHabitId').value;
    const nameInput = document.getElementById('habitNameInput');
    const name = nameInput ? nameInput.value.trim() : '';
    const desc = (document.getElementById('habitDescInput')?.value || '').trim();
    const reminderTime = document.getElementById('habitTimeInput')?.value || '';
    const reminderEnabled = document.getElementById('habitNotifyCheck')?.checked ?? false;
    const icon = (document.getElementById('habitIconInput')?.value || '').trim() || '⚡';

    if (!name) {
      showToast('⚠️ Por favor, escribe el nombre del hábito');
      if (nameInput) {
        nameInput.focus();
        nameInput.style.borderColor = 'var(--accent-rose)';
        setTimeout(() => { nameInput.style.borderColor = ''; }, 2200);
      }
      return;
    }

    isSavingHabit = true;

    // Solicitar permiso de notificaciones nativas si el usuario las activa
    if (reminderEnabled && reminderTime && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    if (editId) {
      // Editando hábito
      const target = appData.habits.find((h) => h.id === editId);
      if (target) {
        target.name = name;
        target.desc = desc;
        target.reminderTime = reminderTime;
        target.reminderEnabled = reminderEnabled;
        target.icon = icon;
        showToast('✏️ Hábito actualizado');
      }
    } else {
      // Creando hábito
      appData.habits.push({
        id: 'hab-' + Date.now(),
        name,
        desc,
        reminderTime,
        reminderEnabled,
        icon,
        streak: 0,
        history: {}
      });
      showToast('🔥 Nuevo hábito creado');
    }

    AppStorage.saveData(appData);
    renderHabitsDetailed();
    renderTodayHabitsRow();
    document.getElementById('addHabitModal').classList.add('hidden');

    setTimeout(() => { isSavingHabit = false; }, 300);
  }

  if (form) {
    form.addEventListener('submit', handleSaveHabit);
  }
  if (submitHabitBtn) {
    submitHabitBtn.addEventListener('click', handleSaveHabit);
  }
}

function renderHabitsDetailed() {
  const container = document.getElementById('habitsDetailedList');
  if (!container || !appData || !appData.habits) return;

  container.innerHTML = '';
  const todayKey = AppStorage.getTodayString();

  if (appData.habits.length === 0) {
    container.innerHTML = `<p style="color:var(--text-dim);font-size:0.9rem;text-align:center;padding:2rem;">No tienes ningún hábito configurado. Pulsa "+ Nuevo hábito" para empezar.</p>`;
    return;
  }

  appData.habits.forEach((habit) => {
    const isDone = habit.history && habit.history[todayKey];
    const card = document.createElement('div');
    card.className = 'habit-card-detailed';

    card.innerHTML = `
      <div class="habit-card-left">
        <div class="habit-big-icon">${habit.icon || '⚡'}</div>
        <div class="habit-info-col">
          <h3>${escapeHtml(habit.name)}</h3>
          ${habit.desc ? `<p class="habit-desc">${escapeHtml(habit.desc)}</p>` : ''}
          <div class="habit-meta-row">
            <span class="habit-streak-badge">🔥 Racha: ${habit.streak || 0} días</span>
            ${habit.reminderTime ? `
              <span class="habit-time-badge ${habit.reminderEnabled ? 'active' : 'disabled'}" title="${habit.reminderEnabled ? 'Aviso activo a las ' + habit.reminderTime : 'Aviso desactivado'}">
                ${habit.reminderEnabled ? '🔔' : '🔕'} ${habit.reminderTime}
              </span>
            ` : ''}
          </div>
        </div>
      </div>
      <div class="habit-card-right">
        <button class="habit-toggle-btn ${isDone ? 'completed' : ''}">
          ${isDone ? '✓ Hecho Hoy' : 'Marcar Hoy'}
        </button>
        <button class="btn-item-action btn-edit-habit" title="Editar hábito">✏️</button>
        <button class="btn-item-action delete btn-del-habit" title="Eliminar hábito">🗑️</button>
      </div>
    `;

    // Marcar hábito
    card.querySelector('.habit-toggle-btn').addEventListener('click', () => {
      toggleHabitForToday(habit);
      renderHabitsDetailed();
      renderTodayHabitsRow();
    });

    // Editar hábito
    card.querySelector('.btn-edit-habit').addEventListener('click', () => {
      document.getElementById('habitModalTitle').textContent = 'Editar Hábito ✏️';
      document.getElementById('editHabitId').value = habit.id;
      document.getElementById('habitNameInput').value = habit.name || '';
      document.getElementById('habitDescInput').value = habit.desc || '';
      document.getElementById('habitTimeInput').value = habit.reminderTime || '';
      document.getElementById('habitNotifyCheck').checked = !!habit.reminderEnabled;
      document.getElementById('habitIconInput').value = habit.icon || '⚡';
      document.getElementById('addHabitModal').classList.remove('hidden');
    });

    // Eliminar hábito
    card.querySelector('.btn-del-habit').addEventListener('click', () => {
      if (confirm(`¿Eliminar el hábito "${habit.name}"?`)) {
        appData.habits = appData.habits.filter((h) => h.id !== habit.id);
        AppStorage.saveData(appData);
        renderHabitsDetailed();
        renderTodayHabitsRow();
        showToast('🗑️ Hábito eliminado');
      }
    });

    container.appendChild(card);
  });
}

// ============================================================
// 7. VISTA 4: RECORDATORIOS Y NOTAS RÁPIDAS
// ============================================================
function initNotesView() {
  renderNotes();

  const input = document.getElementById('quickNoteInput');
  const submitBtn = document.getElementById('submitQuickNoteBtn');

  function addNote() {
    const text = input.value.trim();
    if (text) {
      if (!appData.quickNotes) appData.quickNotes = [];
      appData.quickNotes.unshift({
        id: 'n-' + Date.now(),
        text,
        date: AppStorage.getTodayString()
      });

      AppStorage.saveData(appData);
      renderNotes();
      input.value = '';
      showToast('📝 Recordatorio guardado');
    }
  }

  if (submitBtn) submitBtn.addEventListener('click', addNote);
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addNote();
    });
  }
}

function renderNotes() {
  const grid = document.getElementById('notesGrid');
  if (!grid || !appData || !appData.quickNotes) return;

  grid.innerHTML = '';
  const notes = appData.quickNotes || [];

  if (notes.length === 0) {
    grid.innerHTML = `<p style="color:var(--text-dim);font-size:0.9rem;text-align:center;grid-column:1/-1;padding:2rem;">No tienes recordatorios pendientes. Escribe uno arriba para guardarlo.</p>`;
    return;
  }

  notes.forEach((note) => {
    const card = document.createElement('div');
    card.className = 'note-card';

    card.innerHTML = `
      <p class="note-text">${escapeHtml(note.text)}</p>
      <div class="note-footer">
        <span class="note-date">${note.date || 'Reciente'}</span>
        <div style="display:flex; gap:0.25rem;">
          <button class="btn-item-action btn-edit-note" title="Editar">✏️</button>
          <button class="btn-item-action delete btn-delete-note" title="Eliminar">🗑️</button>
        </div>
      </div>
    `;

    card.querySelector('.btn-edit-note').addEventListener('click', () => {
      const updated = prompt('Editar recordatorio:', note.text);
      if (updated !== null && updated.trim()) {
        note.text = updated.trim();
        AppStorage.saveData(appData);
        renderNotes();
        showToast('✏️ Recordatorio actualizado');
      }
    });

    card.querySelector('.btn-delete-note').addEventListener('click', () => {
      appData.quickNotes = appData.quickNotes.filter((n) => n.id !== note.id);
      AppStorage.saveData(appData);
      renderNotes();
      showToast('🗑️ Recordatorio eliminado');
    });

    grid.appendChild(card);
  });
}

// ============================================================
// 8. AJUSTES Y PERFIL (CAMBIAR NOMBRE VISIBLE)
// ============================================================
function initSettingsAndProfile() {
  const greetingBtn = document.getElementById('greetingContainer');
  if (greetingBtn) {
    greetingBtn.style.cursor = 'pointer';
    greetingBtn.title = 'Haz clic para cambiar tu nombre';
    greetingBtn.addEventListener('click', () => {
      const session = AppStorage.getActiveSession();
      const current = (session && session.userName) || (appData && appData.userName) || 'Usuario';
      const newName = prompt('¿Cómo quieres que te llame la app?', current);
      if (newName && newName.trim()) {
        const cleanName = newName.trim();
        if (session) {
          session.userName = cleanName;
          AppStorage.setActiveSession(session);
        }
        if (appData) {
          appData.userName = cleanName;
          AppStorage.saveData(appData);
        }
        updateHeaderName();
        showToast(`👤 Nombre actualizado: ¡Hola, ${cleanName}!`);
      }
    });
  }
}

// ============================================================
// 9. MODALES Y ACCIONES (SUGERENCIA Y SINCRONIZACIÓN)
// ============================================================
function initModals() {
  const suggestModal = document.getElementById('suggestModal');
  const closeSuggestBtn = document.getElementById('closeSuggestModalBtn');
  if (closeSuggestBtn && suggestModal) {
    closeSuggestBtn.addEventListener('click', () => {
      suggestModal.classList.add('hidden');
    });
  }

  const anotherBtn = document.getElementById('anotherSuggestionBtn');
  if (anotherBtn) {
    anotherBtn.addEventListener('click', () => {
      openSuggestionModal();
    });
  }

  const doneSuggestedBtn = document.getElementById('doneSuggestedActionBtn');
  if (doneSuggestedBtn) {
    doneSuggestedBtn.addEventListener('click', () => {
      if (currentSuggestion && appData) {
        if (!appData.todayTasks) appData.todayTasks = [];
        appData.todayTasks.unshift({
          id: 't-' + Date.now(),
          text: `✨ Completado: ${currentSuggestion.title}`,
          done: true
        });
        AppStorage.saveData(appData);
        renderTodayTasks();
        playTone(523, 1046);
        showToast('🎉 ¡Micro-victoria completada y anotada en tu día!');
        if (suggestModal) suggestModal.classList.add('hidden');
      }
    });
  }

  const closeImpBtn = document.getElementById('closeImprovementModalBtn');
  if (closeImpBtn) {
    closeImpBtn.addEventListener('click', () => {
      const modal = document.getElementById('addImprovementModal');
      if (modal) modal.classList.add('hidden');
    });
  }

  const closeHabitBtn = document.getElementById('closeHabitModalBtn');
  if (closeHabitBtn) {
    closeHabitBtn.addEventListener('click', () => {
      const modal = document.getElementById('addHabitModal');
      if (modal) modal.classList.add('hidden');
    });
  }

  // Modal Sincronización
  const syncModal = document.getElementById('syncModal');
  const openSyncBtn = document.getElementById('openSyncModalBtn');
  const closeSyncBtn = document.getElementById('closeSyncModalBtn');

  if (openSyncBtn && syncModal) {
    openSyncBtn.addEventListener('click', () => {
      const session = AppStorage.getActiveSession();
      const syncDisplay = document.getElementById('syncUserAccountDisplay');
      if (syncDisplay) {
        syncDisplay.textContent = session ? (session.userName || session.username) : 'Sin sesión';
      }
      syncModal.classList.remove('hidden');
    });
  }

  if (closeSyncBtn && syncModal) {
    closeSyncBtn.addEventListener('click', () => syncModal.classList.add('hidden'));
  }

  const exportBtn = document.getElementById('exportBackupBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      if (appData) {
        AppStorage.exportBackup(appData);
        showToast('💾 Copia de respaldo descargada');
      }
    });
  }

  const importInput = document.getElementById('importBackupInput');
  if (importInput) {
    importInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const success = AppStorage.importBackup(event.target.result);
          if (success) {
            const cached = AppStorage.loadLocalCache();
            if (cached && cached.data) appData = cached.data;
            renderAllViews();
            showToast('✅ Datos importados correctamente');
            if (syncModal) syncModal.classList.add('hidden');
          } else {
            alert('El archivo no tiene un formato válido.');
          }
        };
        reader.readAsText(file);
      }
    });
  }

  // Modal Eliminar Cuenta Definitivamente
  const deleteModal = document.getElementById('deleteAccountModal');
  const openDeleteBtn = document.getElementById('openDeleteModalBtn');
  const closeDeleteBtn = document.getElementById('closeDeleteModalBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const deleteForm = document.getElementById('deleteAccountForm');
  const deletePinInput = document.getElementById('deleteConfirmPinInput');
  const deleteErrorMsg = document.getElementById('deleteAccountErrorMsg');
  const deleteSubmitBtn = document.getElementById('confirmDeleteSubmitBtn');
  const deleteAccountNameDisplay = document.getElementById('deleteModalAccountName');

  function openDeleteModal() {
    const session = AppStorage.getActiveSession();
    if (session && deleteAccountNameDisplay) {
      deleteAccountNameDisplay.textContent = session.userName || session.username;
    }
    if (deletePinInput) deletePinInput.value = '';
    if (deleteErrorMsg) deleteErrorMsg.classList.add('hidden');
    if (deleteModal) deleteModal.classList.remove('hidden');
  }

  function closeDeleteModal() {
    if (deleteModal) deleteModal.classList.add('hidden');
  }

  if (openDeleteBtn) openDeleteBtn.addEventListener('click', openDeleteModal);
  if (closeDeleteBtn) closeDeleteBtn.addEventListener('click', closeDeleteModal);
  if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);

  if (deleteForm) {
    deleteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const session = AppStorage.getActiveSession();
      if (!session) return;

      const pinVal = deletePinInput.value.trim();
      if (!pinVal) {
        if (deleteErrorMsg) {
          deleteErrorMsg.textContent = 'Escribe tu PIN de 4 dígitos.';
          deleteErrorMsg.classList.remove('hidden');
        }
        return;
      }

      if (deleteErrorMsg) deleteErrorMsg.classList.add('hidden');
      deleteSubmitBtn.disabled = true;
      deleteSubmitBtn.innerHTML = `<span>Borrando cuenta...</span> <span>⏳</span>`;

      const result = await AppStorage.deleteAccount(session.username, pinVal);
      deleteSubmitBtn.disabled = false;
      deleteSubmitBtn.innerHTML = `<span>Sí, borrar cuenta</span> <span>🗑️</span>`;

      if (result.success) {
        closeDeleteModal();
        if (syncModal) syncModal.classList.add('hidden');

        // Volver a la pantalla de acceso
        const authScreen = document.getElementById('authScreen');
        const appShell = document.getElementById('appShell');
        if (authScreen) authScreen.classList.remove('hidden');
        if (appShell) appShell.classList.add('hidden');

        appData = null;
        showToast('🗑️ Tu cuenta ha sido eliminada por completo');
      } else {
        if (deleteErrorMsg) {
          deleteErrorMsg.textContent = result.error || 'PIN incorrecto.';
          deleteErrorMsg.classList.remove('hidden');
        }
      }
    });
  }

  // Cerrar al hacer clic en el fondo oscuro
  const modalOverlays = [
    suggestModal,
    document.getElementById('addImprovementModal'),
    document.getElementById('addHabitModal'),
    syncModal,
    deleteModal
  ];
  modalOverlays.forEach((m) => {
    if (m) {
      m.addEventListener('click', (e) => {
        if (e.target === m) m.classList.add('hidden');
      });
    }
  });
}

// ============================================================
// 10. TOAST Y SONIDOS SINTETIZADOS
// ============================================================
function showToast(msg) {
  const toast = document.getElementById('appToast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove('hidden');

  if (window.appToastTimer) clearTimeout(window.appToastTimer);
  window.appToastTimer = setTimeout(() => {
    toast.classList.add('hidden');
  }, 2800);
}

function playTone(freq1, freq2) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq1, now);
    if (freq2) osc.frequency.exponentialRampToValueAtTime(freq2, now + 0.15);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  } catch (e) {}
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ============================================================
// 11. SERVICE WORKER PWA
// ============================================================
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js?v=3').then((reg) => {
      if (reg) reg.update();
    }).catch(() => {});
  }
}

// ============================================================
// 12. SISTEMA DE RECORDATORIOS, NOTIFICACIONES Y ALARMA DE HÁBITOS
// ============================================================
let currentPendingReminderHabitId = null;

function playAlarmChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // Acorde armonioso Do, Mi, Sol, Do agudo
    notes.forEach((freq, idx) => {
      const startTime = ctx.currentTime + idx * 0.14;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.22, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.45);
    });
  } catch (e) {}
}

function initReminderAlertSystem() {
  const modal = document.getElementById('reminderAlertModal');
  const closeBtn = document.getElementById('closeReminderAlertBtn');
  const dismissBtn = document.getElementById('dismissReminderAlertBtn');
  const doneBtn = document.getElementById('doneReminderAlertBtn');

  function hideModal() {
    if (modal) modal.classList.add('hidden');
    currentPendingReminderHabitId = null;
  }

  if (closeBtn) closeBtn.addEventListener('click', hideModal);
  if (dismissBtn) dismissBtn.addEventListener('click', hideModal);

  if (doneBtn) {
    doneBtn.addEventListener('click', () => {
      if (currentPendingReminderHabitId && appData && appData.habits) {
        const habit = appData.habits.find((h) => h.id === currentPendingReminderHabitId);
        if (habit) {
          const todayKey = AppStorage.getTodayString();
          if (!habit.history || !habit.history[todayKey]) {
            toggleHabitForToday(habit);
            renderHabitsDetailed();
            renderTodayHabitsRow();
          }
        }
      }
      hideModal();
      showToast('🎉 ¡Excelente! Hábito completado');
    });
  }

  // Vigilante recurrente cada 20 segundos
  setInterval(checkHabitReminders, 20000);
  // Chequeo inicial poco después de cargar
  setTimeout(checkHabitReminders, 2500);
}

function checkHabitReminders() {
  if (!appData || !appData.habits || !Array.isArray(appData.habits)) return;

  const now = new Date();
  const currentHHMM = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  const todayKey = AppStorage.getTodayString();

  appData.habits.forEach((habit) => {
    if (!habit.reminderEnabled || !habit.reminderTime) return;

    if (habit.reminderTime === currentHHMM) {
      // Si ya está completado hoy, no interrumpir
      if (habit.history && habit.history[todayKey]) return;

      // Si ya sonó hoy, evitar duplicados durante el mismo minuto
      if (habit.lastRemindedDate === todayKey) return;

      habit.lastRemindedDate = todayKey;
      AppStorage.saveData(appData);

      triggerHabitAlarm(habit);
    }
  });
}

function triggerHabitAlarm(habit) {
  currentPendingReminderHabitId = habit.id;

  // Sonar aviso audible melodioso
  playAlarmChime();

  // Enviar notificación del sistema operativo / navegador si hay permiso
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(`Impulso: ¡Hora de ${habit.name}! ${habit.icon || '🔥'}`, {
        body: habit.desc ? habit.desc : `Recuerda cumplir tu hábito diario. ¡Llevas racha de ${habit.streak || 0} días!`,
        icon: './assets/icon-192.png',
        badge: './assets/icon-192.png',
        tag: 'habit-alarm-' + habit.id
      });
    } catch (e) {}
  }

  // Abrir modal destacado en la app
  const modal = document.getElementById('reminderAlertModal');
  const icon = document.getElementById('reminderAlertIcon');
  const title = document.getElementById('reminderAlertTitle');
  const desc = document.getElementById('reminderAlertDesc');

  if (icon) icon.textContent = habit.icon || '⏰';
  if (title) title.textContent = `¡Es hora de ${habit.name}! 🔥`;
  if (desc) {
    desc.textContent = habit.desc ? habit.desc : `Recuerda realizar este hábito para mantener tu racha de ${habit.streak || 0} días.`;
  }

  if (modal) modal.classList.remove('hidden');
}

// ============================================================
// 13. LIMPIEZA DE WIDGETS INYECTADOS EXTERNOS (NETLIFY BADGE)
// ============================================================
function removeNetlifyBadge() {
  try {
    const candidates = document.querySelectorAll(
      '[class*="netlify"], [id*="netlify"], a[href*="netlify.com"], iframe[src*="netlify"]'
    );
    candidates.forEach((el) => {
      if (!el.closest('.app-shell') && !el.closest('.auth-card')) {
        const topContainer = el.closest('div');
        if (topContainer && topContainer !== document.body && topContainer.parentNode) {
          topContainer.remove();
        } else {
          el.remove();
        }
      }
    });
  } catch (e) {}
}
