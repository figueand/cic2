/* ============================================================
   CONFIGURACIÓN DE LA ESCUELA DE VERANO  (editable por el/la docente)
   - masterPin : clave maestra del docente (abre cualquier candado y el Panel Docente)
   - passwords : contraseña que el/la profe da para abrir cada clase (nXcY = nivel X, clase Y)
                 y para abrir cada nivel (L2, L3). Mayúsculas y tildes no importan.
   Después de cambiar algo, subí este archivo a GitHub Pages y listo.
   ============================================================ */
window.EV_CONFIG = {
 "noLocks": false, /* true = todo abierto, sin contraseñas (para probar). Poné false para volver a usar los candados */
 /* Dibujos en Drive (ver drive/LEEME-DRIVE.md). Dejá driveUrl vacío para desactivar el envío */
 "driveUrl": "",
 "driveToken": "",
 "driveFolderUrl": "https://drive.google.com/drive/folders/17dkeb-cNfg2JTapyw9oeuRw85M49FgCV?usp=sharing",
 /* true = al final de cada clase aparece el botón de Poki (sitio externo de juegos). Poné false para que no salgan de la propuesta */
 "showPoki": true,
 "masterPin": "profe2026",
 "minutes": 15,
 "levels": {
  "1": {
   "name": "Infancias",
   "emoji": "🟣",
   "age": "4 a 6 años",
   "desc": "¡Toca, mira y escucha! Misiones con dibujos y voz.",
   "mascot": {
    "emoji": "🦉",
    "name": "Lumi"
   }
  },
  "2": {
   "name": "Exploradores",
   "emoji": "🟢",
   "age": "7 a 9 años",
   "desc": "Aventuras, trivias y retos con tu mascota Bit.",
   "mascot": {
    "emoji": "🤖",
    "name": "Bit"
   }
  },
  "3": {
   "name": "Cyber-Pro",
   "emoji": "🔵",
   "age": "10 a 12 años",
   "desc": "Misiones de cyber-detective: chats, perfiles y logros.",
   "mascot": {
    "emoji": "🕵️",
    "name": "Agente Nova"
   }
  }
 },
 "passwords": {
  "n1c2": "sol",
  "n1c3": "luna",
  "n1c4": "gato",
  "n1c5": "pez",
  "n1c6": "flor",
  "n1c7": "oso",
  "n1c8": "rana",
  "n1c9": "nube",
  "n1c10": "estrella",
  "n2c2": "cohete",
  "n2c3": "dragon",
  "n2c4": "volcan",
  "n2c5": "delfin",
  "n2c6": "brujula",
  "n2c7": "tesoro",
  "n2c8": "faro",
  "n2c9": "trueno",
  "n2c10": "galaxia",
  "n3c2": "radar",
  "n3c3": "cifra",
  "n3c4": "enigma",
  "n3c5": "firewall",
  "n3c6": "token",
  "n3c7": "pixel",
  "n3c8": "cobalto",
  "n3c9": "zenit",
  "n3c10": "titan",
  "L2": "aventura",
  "L3": "agente"
 },
 "classes": {
  "1": [
   {
    "t": "👋 Bienvenida e Introducción",
    "d": "Conoce la compu y las reglas de la escuela."
   },
   {
    "t": "👣 Mi Huella Digital",
    "d": "Lo que subimos a internet deja huellas. ¡Aprende qué es seguro!"
   },
   {
    "t": "🔑 Contraseñas Seguras",
    "d": "Crea tu llave mágica secreta."
   },
   {
    "t": "🛑 ¿Quién está en la red?",
    "d": "Aprende a reconocer a los desconocidos en internet."
   },
   {
    "t": "💛 Regla de Confianza",
    "d": "Los secretos que dan miedo se cuentan siempre."
   },
   {
    "t": "🤖 Pensamiento Computacional",
    "d": "Dale órdenes al robot con flechas."
   },
   {
    "t": "🎨 Creación vs. Consumo",
    "d": "Crear es más divertido que solo mirar."
   },
   {
    "t": "🔍 Detectives de la Red",
    "d": "¿Real o inventado? Aprende a dudar."
   },
   {
    "t": "🤗 Ciudadanía y Convivencia Digital",
    "d": "En internet también somos amables."
   },
   {
    "t": "🏆 Feria Tecnológica y Cierre",
    "d": "¡Repasamos todo y recibes tu diploma!"
   }
  ],
  "2": [
   {
    "t": "👋 Bienvenida e Introducción",
    "d": "Reglas de la sala y cómo moverte en la compu."
   },
   {
    "t": "👣 Mi Huella Digital",
    "d": "Detective de fotos: ¿qué se puede publicar?"
   },
   {
    "t": "🔑 Contraseñas Seguras",
    "d": "Armá claves con el generador de superhéroes."
   },
   {
    "t": "🛑 ¿Quién está en la red?",
    "d": "Aprendé a reconocer a desconocidos en los juegos."
   },
   {
    "t": "💛 Regla de Confianza",
    "d": "¿A quién contarle cuando algo incomoda?"
   },
   {
    "t": "🤖 Pensamiento Computacional",
    "d": "Programá a Bit y descubrí qué es un algoritmo."
   },
   {
    "t": "🎨 Creación vs. Consumo",
    "d": "Crear o solo mirar: ¡hacé tu propia obra!"
   },
   {
    "t": "🔍 Detectives de la Red",
    "d": "Encontrá las pistas raras en mensajes y noticias."
   },
   {
    "t": "🤗 Ciudadanía y Convivencia Digital",
    "d": "Cómo ser buen compañero también en el chat."
   },
   {
    "t": "🏆 Feria Tecnológica y Cierre",
    "d": "Repaso final y diploma de explorador/a."
   }
  ],
  "3": [
   {
    "t": "👋 Bienvenida e Introducción",
    "d": "Tu misión, tus reglas y el glosario del agente."
   },
   {
    "t": "👣 Mi Huella Digital",
    "d": "Analizá un feed simulado y detectá datos expuestos."
   },
   {
    "t": "🔑 Contraseñas Seguras",
    "d": "Medidor de claves y verificación en 2 pasos."
   },
   {
    "t": "🛑 ¿Quién está en la red?",
    "d": "Chat simulado: señales de alerta de grooming."
   },
   {
    "t": "💛 Regla de Confianza",
    "d": "Tu red de apoyo y cómo actuar ante un chantaje."
   },
   {
    "t": "🤖 Pensamiento Computacional",
    "d": "Depurá código y ordená algoritmos."
   },
   {
    "t": "🎨 Creación vs. Consumo",
    "d": "De consumir a crear: tu proyecto propio."
   },
   {
    "t": "🔍 Detectives de la Red",
    "d": "Fake news: verificá fuentes como un detective."
   },
   {
    "t": "🤗 Ciudadanía y Convivencia Digital",
    "d": "Ciberacoso, respeto y ser aliado/a."
   },
   {
    "t": "🏆 Feria Tecnológica y Cierre",
    "d": "Repaso final y Diploma Cyber-Pro."
   }
  ]
 }
};
