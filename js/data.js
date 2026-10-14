// ============================================================
// DATOS INICIALES Y CATÁLOGO DE PRODUCTIVIDAD (IMPULSO)
// ============================================================

const SEED_DATA = {
  // Frases de motivación diaria
  motivationalQuotes: [
    "No tienes que ser increíble para empezar, pero tienes que empezar para ser increíble.",
    "Un 1% mejor cada día equivale a ser 37 veces mejor en un año.",
    "La disciplina es simplemente elegir entre lo que quieres ahora y lo que quieres más.",
    "El éxito es la suma de pequeños esfuerzos repetidos día tras día.",
    "Concéntrate en el proceso diario, los resultados llegarán solos.",
    "Hoy es una nueva oportunidad para estar un paso más cerca de tus metas."
  ],

  // Cosas para mejorar iniciales (organizadas por áreas de vida)
  initialImprovements: [
    {
      id: "imp-1",
      title: "Cuidar el descanso y horarios de sueño",
      category: "salud",
      action: "Dejar las pantallas 30 min antes de acostarse y mantener hora fija.",
      status: "en_progreso",
      progress: 40,
      createdAt: new Date().toISOString()
    },
    {
      id: "imp-2",
      title: "Evitar posponer tareas o caer en la pereza",
      category: "habitos",
      action: "Aplicar la regla de los 2 minutos: si tarda menos de 2 min, hazlo ya.",
      status: "en_progreso",
      progress: 55,
      createdAt: new Date().toISOString()
    },
    {
      id: "imp-3",
      title: "Constancia en el ejercicio físico",
      category: "salud",
      action: "Moverse al menos 30 minutos al día, aunque sea salir a caminar a buen ritmo.",
      status: "en_progreso",
      progress: 60,
      createdAt: new Date().toISOString()
    },
    {
      id: "imp-4",
      title: "Aprender y formarme de manera continua",
      category: "mente",
      action: "Dedicar 15-20 minutos al día a leer o aprender una habilidad práctica.",
      status: "en_progreso",
      progress: 30,
      createdAt: new Date().toISOString()
    },
    {
      id: "imp-5",
      title: "Gestión del tiempo y foco diario",
      category: "habitos",
      action: "Elegir las 3 tareas más importantes de la jornada antes de empezar.",
      status: "en_progreso",
      progress: 70,
      createdAt: new Date().toISOString()
    }
  ],

  // Hábitos diarios iniciales
  initialHabits: [
    {
      id: "hab-1",
      name: "Beber agua al despertar (500ml)",
      desc: "Hidratar el cuerpo en ayunas para activar el metabolismo y despejar la mente.",
      reminderTime: "08:30",
      reminderEnabled: true,
      icon: "💧",
      streak: 4,
      history: {} // clave "YYYY-MM-DD": boolean
    },
    {
      id: "hab-2",
      name: "30 min de actividad o entrenamiento",
      desc: "Mover el cuerpo para generar energía y cuidar la salud física.",
      reminderTime: "18:00",
      reminderEnabled: false,
      icon: "🏃‍♂️",
      streak: 3,
      history: {}
    },
    {
      id: "hab-3",
      name: "15 min de lectura o aprendizaje",
      desc: "Aprender algo nuevo cada día y mantener el foco intelectual.",
      reminderTime: "21:30",
      reminderEnabled: false,
      icon: "📖",
      streak: 2,
      history: {}
    },
    {
      id: "hab-4",
      name: "Definir mis 3 focos del día",
      desc: "Elegir las prioridades antes de empezar a trabajar o estudiar.",
      reminderTime: "09:00",
      reminderEnabled: false,
      icon: "🎯",
      streak: 5,
      history: {}
    },
    {
      id: "hab-5",
      name: "Desconectar del móvil antes de dormir",
      desc: "Dejar pantallas 30 min antes para un descanso profundo y reparador.",
      reminderTime: "23:00",
      reminderEnabled: false,
      icon: "🌙",
      streak: 1,
      history: {}
    }
  ],

  // Banco de ideas de micro-acciones productivas ("¿Qué hago productivo hoy?")
  quickProductiveIdeas: [
    {
      title: "Orden exprés de 10 minutos",
      desc: "Pon un cronómetro de 10 minutos y ordena tu escritorio, habitación o zona de trabajo. El orden físico despeja la mente.",
      time: "10 min",
      tag: "Entorno"
    },
    {
      title: "Paseo de recarga mental",
      desc: "Sal a caminar 15 minutos sin mirar el móvil, escuchando tus pensamientos o tu música favorita.",
      time: "15 min",
      tag: "Salud"
    },
    {
      title: "Limpieza digital rápida",
      desc: "Borra capturas de pantalla viejas, correos spam acumulados o limpia el escritorio de tu ordenador.",
      time: "10 min",
      tag: "Organización"
    },
    {
      title: "Micro-aprendizaje de 15 minutos",
      desc: "Lee un artículo o mira un vídeo educativo sobre algo útil que quieras aprender o dominar.",
      time: "15 min",
      tag: "Mente"
    },
    {
      title: "Revisión de prioridades de mañana",
      desc: "Anota en 2 minutos qué 3 cosas importantes quieres tener hechas mañana. Te quitará estrés nocturno.",
      time: "5 min",
      tag: "Foco"
    },
    {
      title: "Detalle con alguien especial",
      desc: "Mándale un mensaje espontáneo y sincero a alguien importante para ti recordándole lo que significa en tu vida.",
      time: "2 min",
      tag: "Relaciones"
    },
    {
      title: "Estiramientos corporales",
      desc: "Estira cuello, espalda y piernas durante 5 minutos para liberar tensión acumulada.",
      time: "5 min",
      tag: "Cuerpo"
    },
    {
      title: "Hidratación y respiración consciente",
      desc: "Bebe un vaso de agua grande, siéntate con la espalda recta y haz 5 respiraciones profundas y lentas.",
      time: "3 min",
      tag: "Bienestar"
    }
  ]
};
