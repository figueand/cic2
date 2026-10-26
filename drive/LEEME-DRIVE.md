# Guardar los dibujos automáticamente en Google Drive

Un link de Drive solo no alcanza para que la página escriba en la carpeta (Google no lo permite sin iniciar sesión). Lo resolvemos con un mini-programa de Google (Apps Script) que es de la cuenta docente y recibe los dibujos. Son 5 minutos, una sola vez.

## Pasos
1. En Drive creá una carpeta (ej. "Dibujos Escuela de Verano"). Mantenela **privada**.
2. Abrila y copiá el **ID** de la barra de direcciones: `drive.google.com/drive/folders/`**ESTE_ES_EL_ID**
3. Entrá a https://script.google.com → **Nuevo proyecto**. Borrá lo que haya y pegá todo el contenido de `guardar-dibujos.gs`.
4. Reemplazá `FOLDER_ID` por el ID de la carpeta y `TOKEN` por un código inventado (ej. `verano-2026-xk9`).
5. **Implementar → Nueva implementación → Aplicación web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona**
   - Implementar y **autorizar** los permisos (Drive). Copiá la **URL de la aplicación web** (termina en `/exec`).
6. En `assets/config.js` completá:
   - `driveUrl`: la URL del paso 5
   - `driveToken`: el mismo código del paso 4
   - `driveFolderUrl`: el link normal de la carpeta (para el botón "Abrir carpeta")
7. Subí todo a GitHub Pages. En **Panel docente → 🖼️ Dibujos** tocá **Probar conexión**: debe decir ✅.

## Cómo se usa
- En la Clase 7 de cada nivel hay un editor de dibujo (lápiz, aerosol, goma, balde, líneas, figuras, sellos, deshacer). Los botones 💾 Guardar y 🖨️ Imprimir sirven siempre.
- Al tocar **¡Terminé mi obra!** el dibujo se envía solo. Si no hay internet, queda en espera y se manda cuando vuelve la conexión.
- Cada equipo genera un archivo por clase, por ejemplo `N2-C7_Ana-y-Leo.png`. Si repiten, reemplaza el anterior.
- Para imprimir después: abrí la carpeta en Drive, seleccioná las imágenes y usá Imprimir.

## Si cambiás el script
Implementar → **Gestionar implementaciones** → editar (lápiz) → Versión: **Nueva versión**. La URL no cambia.

## Privacidad
- El nombre del archivo lleva los nombres que los chicos escriben al armar su equipo. No compartas la carpeta públicamente y avisá a las familias según la política de la escuela.
- El `driveToken` queda visible en el código de la página: sirve para evitar envíos accidentales, no es una clave fuerte. Por eso el script solo puede escribir imágenes PNG en esa única carpeta.

## Actividades con herramientas externas (v18)
Al final de varias clases hay un paso nuevo que abre la herramienta **dentro de la página** (con botón de respaldo "Abrir en pestaña nueva"), un reloj de 20 min y un botón **📤 Subir mi trabajo**:
- Nivel 1 y 2 · Clase 7: AutoDraw (los chicos descargan el dibujo y lo suben). Nivel 3 · Clase 7: gesture.live (graban con el botón de grabar de la propia herramienta, guardan el archivo y lo suben).
- Nivel 2 y 3 · Clase 6: Pilas Bloques (sin subida).
- Nivel 2 y 3 · Clases 2, 3, 8 y 9: Interland (Mindful Mountain, Tower of Treasure, Reality River, Kind Kingdom). Suben una captura final o el certificado.
Los archivos van a una subcarpeta por herramienta (AutoDraw, Interland, gesture.live) dentro de tu carpeta.

**Importante:** el script cambió (ahora acepta imágenes, PDF, audio y video corto). Pegá el nuevo `guardar-dibujos.gs` en Apps Script y hacé *Implementar → Gestionar implementaciones → editar → Nueva versión*.

Para ocultar el botón de Poki del final de cada clase, poné `"showPoki": false` en `assets/config.js`.

**Límites a tener en cuenta**
- Algunos sitios no permiten mostrarse dentro de otra página: si pasa, usar la pestaña nueva. Probalos todos antes de la primera clase.
- El marco no impide que los chicos salgan de la página. Para eso hace falta modo quiosco o una lista de sitios permitidos en la compu (o la app de escritorio de Pilas Bloques).
