// Utilidad para almacenamiento híbrido de PDFs (Cloud Supabase Storage + Caché Local IndexedDB)
// Garantiza persistencia en la nube compartida entre equipos y acceso local de alta velocidad sin bloqueos

const DB_NAME = 'DOCUS_FILE_STORAGE';
const DB_VERSION = 2;
const STORE_NAME = 'secciones_pdf';

// Configuración de Supabase Storage en la Nube
const SUPABASE_URL = 'https://xmqcarehbyyqhzgwubhd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_jIoZ6rFXA1tgVDzpFMLzgQ_GjHJMu8p';
const BUCKET_NAME = 'expedientes';

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
 * Sube un archivo binario a Supabase Storage con soporte para sobrescritura (upsert)
 */
async function uploadToCloud(path, dataBuffer, contentType = 'application/pdf') {
  try {
    const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${path}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': contentType,
        'x-upsert': 'true',
      },
      body: dataBuffer,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.warn(`[Cloud Storage] Aviso al subir ${path}:`, errData);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[Cloud Storage] Error de conexión al subir ${path}:`, err);
    return false;
  }
}

/**
 * Descarga un archivo binario de Supabase Storage desde su CDN público
 */
async function downloadFromCloud(path) {
  try {
    const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${path}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch (err) {
    console.warn(`[Cloud Storage] Error al descargar ${path}:`, err);
    return null;
  }
}

/**
 * Lista los archivos de un empleado en Supabase Storage
 */
async function listFromCloud(empleadoId) {
  try {
    const url = `${SUPABASE_URL}/storage/v1/object/list/${BUCKET_NAME}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prefix: `${String(empleadoId)}/`, limit: 100 }),
    });

    if (!res.ok) return [];
    const files = await res.json();
    return Array.isArray(files) ? files : [];
  } catch (err) {
    console.warn(`[Cloud Storage] Error al listar archivos de empleado ${empleadoId}:`, err);
    return [];
  }
}

/**
 * Guarda el archivo PDF de una sección en IndexedDB y lo sincroniza con Supabase Storage
 */
export async function saveSectionPdf(empleadoId, seccionCodigo, pdfBytesOrBlob, meta = {}) {
  try {
    const cleanId = String(empleadoId);
    const cleanCod = String(seccionCodigo);
    const key = `${cleanId}_${cleanCod}`;

    // Convertir a ArrayBuffer puro para evitar cualquier DataCloneError con Vue Proxies
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

    const cleanPages = Array.isArray(meta.pageNumbers)
      ? Array.from(meta.pageNumbers).map((n) => Number(n))
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
      updatedAt: new Date().toISOString(),
    };

    // 1. Guardar en caché local IndexedDB
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    await new Promise((resolve, reject) => {
      const req = store.put(record);
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e);
    });

    // 2. Subir en la Nube a Supabase Storage (en segundo plano)
    const cloudPath = `${cleanId}/sec_${cleanCod}.pdf`;
    uploadToCloud(cloudPath, dataBuffer);

    return true;
  } catch (error) {
    console.error('Error guardando PDF:', error);
    return false;
  }
}

/**
 * Obtiene el PDF de una sección (primero desde caché local, si no está lo descarga de Supabase)
 */
export async function getSectionPdf(empleadoId, seccionCodigo) {
  try {
    const cleanId = String(empleadoId);
    const cleanCod = String(seccionCodigo);
    const key = `${cleanId}_${cleanCod}`;

    // 1. Intentar desde caché local IndexedDB
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const localItem = await new Promise((resolve) => {
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });

    if (localItem && localItem.dataBuffer && localItem.dataBuffer.byteLength > 0) {
      return {
        ...localItem,
        blob: new Blob([localItem.dataBuffer], { type: 'application/pdf' }),
      };
    }

    // 2. Si no está en este equipo, descargarlo de Supabase Cloud Storage
    const cloudPath = `${cleanId}/sec_${cleanCod}.pdf`;
    const cloudBuffer = await downloadFromCloud(cloudPath);

    if (cloudBuffer && cloudBuffer.byteLength > 0) {
      const cloudBlob = new Blob([cloudBuffer], { type: 'application/pdf' });

      // Guardar en la caché local para que la próxima lectura sea instantánea
      saveSectionPdf(cleanId, cleanCod, cloudBuffer, {
        filename: `${cleanCod}_EXP_${cleanId}.pdf`,
      }).catch(() => {});

      return {
        key,
        empleadoId: cleanId,
        seccionCodigo: cleanCod,
        dataBuffer: cloudBuffer,
        blob: cloudBlob,
        filename: `${cleanCod}_EXP_${cleanId}.pdf`,
      };
    }

    return null;
  } catch (error) {
    console.error('Error obteniendo PDF de sección:', error);
    return null;
  }
}

/**
 * Guarda el archivo PDF maestro completo en IndexedDB y Supabase Storage
 */
export async function saveMasterPdf(empleadoId, pdfBytesOrBlob, meta = {}) {
  try {
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
      updatedAt: new Date().toISOString(),
    };

    // 1. Guardar en local
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    await new Promise((resolve, reject) => {
      const req = store.put(record);
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e);
    });

    // 2. Subir expediente maestro a Supabase Cloud Storage
    const cloudPath = `${cleanId}/MASTER.pdf`;
    uploadToCloud(cloudPath, dataBuffer);

    return true;
  } catch (error) {
    console.error('Error guardando Master PDF:', error);
    return false;
  }
}

/**
 * Obtiene el archivo PDF maestro completo (local o nube)
 */
export async function getMasterPdf(empleadoId) {
  try {
    const cleanId = String(empleadoId);
    const key = `${cleanId}_MASTER`;

    // 1. Revisar caché local
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const localItem = await new Promise((resolve) => {
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });

    if (localItem && localItem.dataBuffer && localItem.dataBuffer.byteLength > 0) {
      return {
        ...localItem,
        blob: new Blob([localItem.dataBuffer], { type: 'application/pdf' }),
      };
    }

    // 2. Descargar de Supabase Cloud Storage
    const cloudPath = `${cleanId}/MASTER.pdf`;
    const cloudBuffer = await downloadFromCloud(cloudPath);

    if (cloudBuffer && cloudBuffer.byteLength > 0) {
      const cloudBlob = new Blob([cloudBuffer], { type: 'application/pdf' });

      // Guardar en caché local
      saveMasterPdf(cleanId, cloudBuffer, {
        filename: `FILE_COMPLETO_EXP_${cleanId}.pdf`,
      }).catch(() => {});

      return {
        key,
        empleadoId: cleanId,
        seccionCodigo: 'MASTER',
        dataBuffer: cloudBuffer,
        blob: cloudBlob,
        filename: `FILE_COMPLETO_EXP_${cleanId}.pdf`,
      };
    }

    return null;
  } catch (error) {
    console.error('Error obteniendo Master PDF:', error);
    return null;
  }
}

/**
 * Obtiene el mapa unificado de PDFs de un empleado (unifica local + Supabase Cloud)
 */
export async function getEmpleadoPdfsMap(empleadoId) {
  try {
    const cleanId = String(empleadoId);
    const map = {};

    // 1. Leer mapa local
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const all = await new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });

    all.forEach((item) => {
      if (String(item.empleadoId) === cleanId) {
        map[item.seccionCodigo] = {
          hasPdf: true,
          filename: item.filename,
          pagesCount: item.pagesCount,
          pageNumbers: item.pageNumbers,
          updatedAt: item.updatedAt,
        };
      }
    });

    // 2. Consultar archivos en la Nube (Supabase)
    const cloudFiles = await listFromCloud(cleanId);
    cloudFiles.forEach((file) => {
      // Formato: sec_11_CONTRATOS.pdf o MASTER.pdf
      if (file.name.startsWith('sec_') && file.name.endsWith('.pdf')) {
        const codigo = file.name.replace('sec_', '').replace('.pdf', '');
        if (!map[codigo]) {
          map[codigo] = {
            hasPdf: true,
            filename: file.name,
            pagesCount: 0,
            pageNumbers: [],
            updatedAt: file.updated_at,
            isCloud: true,
          };
        }
      } else if (file.name === 'MASTER.pdf') {
        map['MASTER'] = {
          hasPdf: true,
          filename: 'MASTER.pdf',
          updatedAt: file.updated_at,
          isCloud: true,
        };
      }
    });

    return map;
  } catch (error) {
    console.error('Error obteniendo mapa de PDFs:', error);
    return {};
  }
}

/**
 * Elimina un PDF (local y en Supabase)
 */
export async function deleteSectionPdf(empleadoId, seccionCodigo) {
  try {
    const cleanId = String(empleadoId);
    const cleanCod = String(seccionCodigo);
    const key = `${cleanId}_${cleanCod}`;

    // 1. Eliminar local
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(key);

    // 2. Eliminar de Supabase Cloud
    const cloudPath = `${cleanId}/sec_${cleanCod}.pdf`;
    fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}`, {
      method: 'DELETE',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prefixes: [cloudPath] }),
    }).catch(() => {});

    return true;
  } catch (error) {
    console.error('Error eliminando PDF:', error);
    return false;
  }
}
