// ============================================================
// CAPA DE ALMACENAMIENTO, CUENTAS Y FIREBASE PRIVADO (IMPULSO)
// ============================================================

const SESSION_KEY = 'impulso_active_session_v1';
const LOCAL_BACKUP_KEY = 'impulso_local_cache_v1';

// Configuración oficial de Firebase de Google (servidores en Europa)
const firebaseConfig = {
  apiKey: "AIzaSyCeoQWqLqz6EA_dIjCKyMKSZkIvXgL7Pwc",
  authDomain: "impulso-app-81e78.firebaseapp.com",
  databaseURL: "https://impulso-app-81e78-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "impulso-app-81e78",
  storageBucket: "impulso-app-81e78.firebasestorage.app",
  messagingSenderId: "961826031350",
  appId: "1:961826031350:web:095e06268e44ba2a280ed7"
};

let firebaseDb = null;
let currentDbRef = null;
let isRemoteUpdating = false;

class AppStorage {
  static getTodayString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  static cleanId(str) {
    return (str || '').toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
  }

  // Inicializar Firebase
  static initFirebase() {
    try {
      if (typeof firebase !== 'undefined' && !firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        firebaseDb = firebase.database();
      } else if (typeof firebase !== 'undefined') {
        firebaseDb = firebase.database();
      }
    } catch (e) {
      console.error('Error al inicializar Firebase:', e);
    }
  }

  // Sesión activa local (permanente en localStorage o temporal en sessionStorage)
  static getActiveSession() {
    // 1. Sesión temporal en esta pestaña/navegador
    const rawSession = sessionStorage.getItem(SESSION_KEY);
    if (rawSession) {
      try {
        return JSON.parse(rawSession);
      } catch (e) {}
    }

    // 2. Sesión recordada de forma persistente
    const rawLocal = localStorage.getItem(SESSION_KEY);
    if (rawLocal) {
      try {
        return JSON.parse(rawLocal);
      } catch (e) {}
    }

    return null;
  }

  static setActiveSession(session, rememberMe = true) {
    if (session) {
      const payload = JSON.stringify({ ...session, remember: !!rememberMe });
      if (rememberMe) {
        localStorage.setItem(SESSION_KEY, payload);
        sessionStorage.removeItem(SESSION_KEY);
      } else {
        sessionStorage.setItem(SESSION_KEY, payload);
        localStorage.removeItem(SESSION_KEY);
      }
    } else {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
    }
  }

  static logout() {
    if (currentDbRef) {
      currentDbRef.off();
      currentDbRef = null;
    }
    AppStorage.setActiveSession(null);
  }

  // Eliminar Cuenta y todos los datos asociados definitivamente
  static async deleteAccount(username, pin) {
    AppStorage.initFirebase();
    const cleanUser = AppStorage.cleanId(username);
    const cleanPin = String(pin).trim();

    if (!cleanUser) {
      return { success: false, error: 'Usuario no válido.' };
    }
    if (!cleanPin) {
      return { success: false, error: 'Debes introducir tu PIN para autorizar el borrado.' };
    }

    if (!firebaseDb) {
      // Si no hay Firebase activo, borrar sesión y caché local
      AppStorage.logout();
      localStorage.removeItem(LOCAL_BACKUP_KEY);
      return { success: true };
    }

    try {
      const snapshot = await firebaseDb.ref('cuentas/' + cleanUser).once('value');
      const account = snapshot.val();

      if (!account) {
        return { success: false, error: `La cuenta "${cleanUser}" no existe en la nube.` };
      }

      if (account.pin && String(account.pin).trim() !== cleanPin) {
        return { success: false, error: 'PIN incorrecto. El borrado no fue autorizado.' };
      }

      // Desconectar listener en vivo
      if (currentDbRef) {
        currentDbRef.off();
        currentDbRef = null;
      }

      // Eliminar de Firebase
      await firebaseDb.ref('cuentas/' + cleanUser).remove();

      // Limpiar sesión local y caché
      AppStorage.logout();
      localStorage.removeItem(LOCAL_BACKUP_KEY);

      return { success: true };
    } catch (e) {
      console.error('Error al borrar cuenta en Firebase:', e);
      return { success: false, error: 'Error al borrar en la nube: ' + (e.message || 'Inténtalo de nuevo.') };
    }
  }

  // Iniciar Sesión con Usuario y PIN
  static async login(username, pin, rememberMe = true) {
    AppStorage.initFirebase();
    const cleanUser = AppStorage.cleanId(username);
    const cleanPin = String(pin).trim();

    if (!cleanUser) {
      return { success: false, error: 'Por favor, escribe un nombre de usuario.' };
    }
    if (!cleanPin) {
      return { success: false, error: 'Por favor, escribe tu PIN de acceso.' };
    }

    if (!firebaseDb) {
      // Modo local si no hay conexión
      const local = AppStorage.loadLocalCache();
      if (local && local.userName && AppStorage.cleanId(local.userName) === cleanUser) {
        if (local.pin && local.pin !== cleanPin) {
          return { success: false, error: 'PIN incorrecto.' };
        }
        AppStorage.setActiveSession({ username: cleanUser, pin: cleanPin, userName: local.userName }, rememberMe);
        return { success: true, data: local.data };
      }
      return { success: false, error: 'No hay conexión con la base de datos de Google.' };
    }

    try {
      const snapshot = await firebaseDb.ref('cuentas/' + cleanUser).once('value');
      const account = snapshot.val();

      if (!account) {
        return { success: false, error: `La cuenta "${cleanUser}" no existe. Pulsa en "Crear Cuenta Nueva".` };
      }

      if (account.pin && String(account.pin).trim() !== cleanPin) {
        return { success: false, error: 'PIN de acceso incorrecto. Verifica tus 4 dígitos.' };
      }

      // Login correcto
      const session = {
        username: cleanUser,
        pin: cleanPin,
        userName: account.userName || capitalizeWord(cleanUser)
      };
      AppStorage.setActiveSession(session, rememberMe);
      AppStorage.saveLocalCache({ userName: session.userName, pin: cleanPin, data: account.data });

      return { success: true, data: account.data, userName: session.userName };
    } catch (e) {
      console.error(e);
      return { success: false, error: 'Error de conexión: ' + (e.message || 'Inténtalo de nuevo.') };
    }
  }

  // Crear Cuenta Nueva con Usuario y PIN
  static async register(username, pin, templateMode = 'ejemplo', rememberMe = true) {
    AppStorage.initFirebase();
    const cleanUser = AppStorage.cleanId(username);
    const cleanPin = String(pin).trim();

    if (!cleanUser || cleanUser.length < 3) {
      return { success: false, error: 'El nombre de usuario debe tener al menos 3 letras o números.' };
    }
    if (!cleanPin || cleanPin.length < 4) {
      return { success: false, error: 'El PIN debe tener al menos 4 dígitos para tu seguridad.' };
    }

    if (!firebaseDb) {
      return { success: false, error: 'No hay conexión con la base de datos de Google.' };
    }

    try {
      const snapshot = await firebaseDb.ref('cuentas/' + cleanUser).once('value');
      if (snapshot.exists()) {
        return { success: false, error: `El nombre "${cleanUser}" ya está en uso. Elige otro nombre.` };
      }

      // Crear estructura de datos según plantilla
      let initialData = null;
      if (templateMode === 'blanco') {
        initialData = {
          improvements: [],
          habits: [],
          todayTasks: [],
          quickNotes: [],
          categories: ["Salud", "Hábitos", "Mentalidad", "Finanzas", "Trabajo / Estudio", "Personal"]
        };
      } else {
        initialData = {
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

      const displayName = capitalizeWord(username);
      const newAccount = {
        userName: displayName,
        pin: cleanPin,
        createdAt: new Date().toISOString(),
        data: initialData
      };

      await firebaseDb.ref('cuentas/' + cleanUser).set(newAccount);

      const session = {
        username: cleanUser,
        pin: cleanPin,
        userName: displayName
      };
      AppStorage.setActiveSession(session, rememberMe);
      AppStorage.saveLocalCache({ userName: displayName, pin: cleanPin, data: initialData });

      return { success: true, data: initialData, userName: displayName };
    } catch (e) {
      console.error(e);
      return { success: false, error: 'Error al registrar: ' + (e.message || 'Inténtalo de nuevo.') };
    }
  }

  // Conectar listener en tiempo real a la cuenta activa
  static connectLiveSync(onRemoteChangeCallback) {
    const session = AppStorage.getActiveSession();
    if (!session || !firebaseDb) return;

    if (currentDbRef) {
      currentDbRef.off();
    }

    currentDbRef = firebaseDb.ref('cuentas/' + session.username + '/data');
    AppStorage.updateSyncStatusIndicator('connecting', 'Conectando a la nube...');

    currentDbRef.on('value', (snapshot) => {
      const cloudData = snapshot.val();
      if (cloudData && typeof cloudData === 'object') {
        AppStorage.updateSyncStatusIndicator('online', '🟢 Sincronizado en vivo');
        if (!isRemoteUpdating) {
          isRemoteUpdating = true;
          AppStorage.saveLocalCache({ userName: session.userName, pin: session.pin, data: cloudData });
          if (onRemoteChangeCallback) {
            onRemoteChangeCallback(cloudData);
          }
          setTimeout(() => { isRemoteUpdating = false; }, 300);
        }
      }
    }, (error) => {
      console.error(error);
      AppStorage.updateSyncStatusIndicator('offline', 'Modo sin conexión');
    });
  }

  // Guardar datos
  static saveData(data) {
    const session = AppStorage.getActiveSession();
    if (!session) return;

    AppStorage.saveLocalCache({ userName: session.userName, pin: session.pin, data });

    if (firebaseDb && currentDbRef && !isRemoteUpdating) {
      isRemoteUpdating = true;
      currentDbRef.set(data).then(() => {
        setTimeout(() => { isRemoteUpdating = false; }, 200);
      }).catch((err) => {
        console.error('Error al guardar en Firebase:', err);
        isRemoteUpdating = false;
      });
    }
  }

  static saveLocalCache(fullObj) {
    localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(fullObj));
  }

  static loadLocalCache() {
    const raw = localStorage.getItem(LOCAL_BACKUP_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  static updateSyncStatusIndicator(status, text) {
    const indicator = document.getElementById('cloudStatusIndicator');
    if (indicator) {
      indicator.className = `cloud-status-pill status-${status}`;
      indicator.innerHTML = `<span class="status-dot"></span> <span class="status-text">${text}</span>`;
    }
  }

  // Exportar respaldo JSON
  static exportBackup(data) {
    const session = AppStorage.getActiveSession();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `impulso-${session ? session.username : 'datos'}-${AppStorage.getTodayString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Importar respaldo JSON
  static importBackup(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && Array.isArray(parsed.improvements) && Array.isArray(parsed.habits)) {
        AppStorage.saveData(parsed);
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  }
}

function capitalizeWord(s) {
  if (!s) return 'Usuario';
  return s.charAt(0).toUpperCase() + s.slice(1);
}
