// Utilidad para almacenamiento local de PDFs de secciones de expedientes usando IndexedDB
// Diseñado con ArrayBuffer puro para garantizar compatibilidad con el Structured Clone Algorithm

const DB_NAME = 'DOCUS_FILE_STORAGE';
const DB_VERSION = 2; // Actualizamos versión para asegurar esquema limpio
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
 * Guarda el archivo PDF de una sección en IndexedDB de forma 100% segura frente a DataCloneError
 */
export async function saveSectionPdf(empleadoId, seccionCodigo, pdfBytesOrBlob, meta = {}) {
  try {
    const db = await openDB();
    const cleanId = String(empleadoId);
    const cleanCod = String(seccionCodigo);
    const key = `${cleanId}_${cleanCod}`;

    // Convertir a ArrayBuffer puro para evitar cualquier DataCloneError con Vue Proxies o Blobs
    let dataBuffer;
    if (pdfBytesOrBlob instanceof Blob) {
      dataBuffer = await pdfBytesOrBlob.arrayBuffer();
    } else if (pdfBytesOrBlob instanceof Uint8Array) {
      dataBuffer = pdfBytesOrBlob.buffer.slice(
        pdfBytesOrBlob.byteOffset,
        pdfBytesOrBlob.byteOffset + pdfBytesOrBlob.byteLength
      );
    } else if (pdfBytesOrBlob instanceof ArrayBuffer) {
      dataBuffer = pdfBytesOrBlob;
    } else {
      dataBuffer = new ArrayBuffer(0);
    }

    // Limpiar metadatos de posibles proxies reactivos de Vue 3
    const cleanPages = Array.isArray(meta.pageNumbers)
      ? Array.from(meta.pageNumbers).map(n => Number(n))
      : [];
    const cleanFilename = String(meta.filename || `${cleanCod}_EXP_${cleanId}.pdf`);
    const cleanPagesCount = Number(meta.pagesCount || cleanPages.length || 0);

    const record = {
      key,
      empleadoId: cleanId,
      seccionCodigo: cleanCod,
      dataBuffer,
      filename: cleanFilename,
      pagesCount: cleanPagesCount,
      pageNumbers: cleanPages,
      updatedAt: new Date().toISOString()
    };

    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const req = store.put(record);
      req.onsuccess = () => resolve(true);
      req.onerror = (err) => {
        console.error('Error al guardar en IndexedDB store.put:', err);
        reject(err);
      };
    });
  } catch (error) {
    console.error('Error guardando PDF en IndexedDB:', error);
    return false;
  }
}

/**
 * Obtiene el archivo PDF de una sección reconstruyendo el Blob desde el ArrayBuffer
 */
export async function getSectionPdf(empleadoId, seccionCodigo) {
  try {
    const db = await openDB();
    const key = `${String(empleadoId)}_${String(seccionCodigo)}`;
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve) => {
      const req = store.get(key);
      req.onsuccess = () => {
        const item = req.result;
        if (!item) return resolve(null);

        // Reconstruir el Blob al vuelo para que sea utilizable por URL.createObjectURL
        let blob = null;
        if (item.dataBuffer && item.dataBuffer.byteLength > 0) {
          blob = new Blob([item.dataBuffer], { type: 'application/pdf' });
        } else if (item.blob instanceof Blob) {
          blob = item.blob;
        }

        resolve({
          ...item,
          blob
        });
      };
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
 * Guarda el archivo PDF maestro (el expediente completo escaneado) de un empleado
 */
export async function saveMasterPdf(empleadoId, pdfBytesOrBlob, meta = {}) {
  try {
    const db = await openDB();
    const cleanId = String(empleadoId);
    const key = `${cleanId}_MASTER`;

    let dataBuffer;
    if (pdfBytesOrBlob instanceof Blob) {
      dataBuffer = await pdfBytesOrBlob.arrayBuffer();
    } else if (pdfBytesOrBlob instanceof Uint8Array) {
      dataBuffer = pdfBytesOrBlob.buffer.slice(
        pdfBytesOrBlob.byteOffset,
        pdfBytesOrBlob.byteOffset + pdfBytesOrBlob.byteLength
      );
    } else if (pdfBytesOrBlob instanceof ArrayBuffer) {
      dataBuffer = pdfBytesOrBlob;
    } else {
      dataBuffer = new ArrayBuffer(0);
    }

    const cleanFilename = String(meta.filename || `FILE_COMPLETO_EXP_${cleanId}.pdf`);
    const cleanPagesCount = Number(meta.pagesCount || 0);

    const record = {
      key,
      empleadoId: cleanId,
      seccionCodigo: 'MASTER',
      dataBuffer,
      filename: cleanFilename,
      pagesCount: cleanPagesCount,
      updatedAt: new Date().toISOString()
    };

    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const req = store.put(record);
      req.onsuccess = () => resolve(true);
      req.onerror = (err) => {
        console.error('Error al guardar Master PDF en IndexedDB:', err);
        reject(err);
      };
    });
  } catch (error) {
    console.error('Error guardando Master PDF:', error);
    return false;
  }
}

/**
 * Obtiene el archivo PDF maestro de un empleado
 */
export async function getMasterPdf(empleadoId) {
  try {
    const db = await openDB();
    const key = `${String(empleadoId)}_MASTER`;
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve) => {
      const req = store.get(key);
      req.onsuccess = () => {
        const item = req.result;
        if (!item) return resolve(null);

        let blob = null;
        if (item.dataBuffer && item.dataBuffer.byteLength > 0) {
          blob = new Blob([item.dataBuffer], { type: 'application/pdf' });
        } else if (item.blob instanceof Blob) {
          blob = item.blob;
        }

        resolve({
          ...item,
          blob
        });
      };
      req.onerror = () => resolve(null);
    });
  } catch (error) {
    console.error('Error obteniendo Master PDF:', error);
    return null;
  }
}

/**
 * Verifica si existe un PDF maestro para el empleado
 */
export async function hasMasterPdf(empleadoId) {
  const master = await getMasterPdf(empleadoId);
  return Boolean(master && master.blob);
}

/**
 * Elimina el PDF de una sección
 */
export async function deleteSectionPdf(empleadoId, seccionCodigo) {
  try {
    const db = await openDB();
    const key = `${String(empleadoId)}_${String(seccionCodigo)}`;
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
