/* Escuela de Verano · recibe los trabajos de los chicos y los guarda en una carpeta de Drive.
   1) FOLDER_ID ya tiene el ID de la carpeta (revisalo).
   2) Inventá un código en TOKEN y copialo igual en assets/config.js (driveToken).
   Acepta: PNG, JPG, WEBP, PDF, audio (mp3/wav/webm/ogg/m4a) y video corto (mp4/webm). Máx. ~8 MB. */
const FOLDER_ID = '17dkeb-cNfg2JTapyw9oeuRw85M49FgCV';
const TOKEN = 'cambiar-este-codigo';
const TIPOS = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'application/pdf': 'pdf',
  'audio/mpeg': 'mp3', 'audio/wav': 'wav', 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a',
  'video/mp4': 'mp4', 'video/webm': 'webm' };

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.token !== TOKEN) return out({ ok: false, error: 'token' });
    if (d.test) return out({ ok: true, test: true });
    const s = String(d.image || '');
    const k = s.indexOf(';base64,');
    if (s.indexOf('data:') !== 0 || k < 0) return out({ ok: false, error: 'imagen' });
    const mime = s.slice(5, k).split(';')[0];
    const b64 = s.slice(k + 8);
    if (!TIPOS[mime] || !b64 || b64.length > 15000000) return out({ ok: false, error: 'tipo' });
    const clean = t => String(t || '').replace(/[^\w.\- áéíóúñÁÉÍÓÚÑ]/g, '_');
    const base = clean(d.file || 'trabajo').replace(/\.[A-Za-z0-9]+$/, '').slice(0, 76);
    const name = base + '.' + TIPOS[mime];
    let folder = DriveApp.getFolderById(FOLDER_ID);
    if (d.folder) {                       // subcarpeta por actividad (ej. "AutoDraw"), se crea sola
      const sub = clean(d.folder).slice(0, 40);
      const it = folder.getFoldersByName(sub);
      folder = it.hasNext() ? it.next() : folder.createFolder(sub);
    }
    const old = folder.getFilesByName(name);
    while (old.hasNext()) old.next().setTrashed(true); // mismo equipo y clase = reemplaza la versión anterior
    folder.createFile(Utilities.newBlob(Utilities.base64Decode(b64), mime, name));
    return out({ ok: true });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}
function doGet() { return out({ ok: true, msg: 'activo' }); }
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
