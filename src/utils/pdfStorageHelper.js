// Utilidad para almacenamiento local de PDFs de secciones de expedientes usando IndexedDB

const DB_NAME = 'DOCUS_FILE_STORAGE';
const DB_VERSION = 1;
const STORE_NAME = 'secciones_pdf';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e);
  });
}

/**
 * Guarda el archivo PDF de una sección en IndexedDB
 */
export async function saveSectionPdf(empleadoId, seccionCodigo, pdfBlob, meta = {}) {
  try {
    const db = await openDB();
    const key = `${empleadoId}_${seccionCodigo}`;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const record = {
      key,
      empleadoId,
      seccionCodigo,
      blob: pdfBlob,
      filename: meta.filename || `${seccionCodigo}_EXP_${empleadoId}.pdf`,
      pagesCount: meta.pagesCount || 0,
      pageNumbers: meta.pageNumbers || [],
      updatedAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const req = store.put(record);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(false);
    });
  } catch (error) {
    console.error('Error guardando PDF en IndexedDB:', error);
    return false;
  }
}

/**
 * Obtiene el archivo PDF de una sección
 */
export async function getSectionPdf(empleadoId, seccionCodigo) {
  try {
    const db = await openDB();
    const key = `${empleadoId}_${seccionCodigo}`;
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve) => {
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (error) {
    console.error('Error obteniendo PDF desde IndexedDB:', error);
    return null;
  }
}

/**
 * Obtiene un resumen de todas las secciones que tienen PDF guardado para un empleado
 */
export async function getEmpleadoPdfsMap(empleadoId) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => {
        const all = req.result || [];
        const map = {};
        all.forEach(item => {
          if (String(item.empleadoId) === String(empleadoId)) {
            map[item.seccionCodigo] = {
              hasPdf: true,
              filename: item.filename,
              pagesCount: item.pagesCount,
              pageNumbers: item.pageNumbers,
              updatedAt: item.updatedAt
            };
          }
        });
        resolve(map);
      };
      req.onerror = () => resolve({});
    });
  } catch (error) {
    console.error('Error obteniendo mapa de PDFs:', error);
    return {};
  }
}

/**
 * Elimina el PDF de una sección
 */
export async function deleteSectionPdf(empleadoId, seccionCodigo) {
  try {
    const db = await openDB();
    const key = `${empleadoId}_${seccionCodigo}`;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve) => {
      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (error) {
    console.error('Error eliminando PDF:', error);
    return false;
  }
}
