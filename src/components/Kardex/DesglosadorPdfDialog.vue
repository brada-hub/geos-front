<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
    class="desglosador-dialog"
  >
    <q-card class="column no-wrap full-height bg-slate-900 text-white">
      <!-- HEADER PRINCIPAL -->
      <div class="row items-center justify-between q-px-md q-py-sm border-bottom col-auto bg-slate-950">
        <div class="row items-center q-gutter-sm">
          <q-btn flat round dense icon="arrow_back" color="white" v-close-popup>
            <q-tooltip>Volver al expediente</q-tooltip>
          </q-btn>

          <div class="desglosador-icon-box flex flex-center">
            <q-icon name="content_cut" size="20px" color="amber-4" />
          </div>

          <div>
            <div class="row items-center q-gutter-x-sm">
              <span class="text-subtitle1 text-weight-bolder">Desglosador & Clasificador de File PDF</span>
              <q-badge color="indigo-7" class="text-weight-bold">
                {{ empleado?.codigo_archivo || `EXP-${empleado?.numero_unico || empleado?.id}` }}
              </q-badge>
            </div>
            <div class="text-caption text-slate-400">
              Titular: <b>{{ empleado?.nombre_completo }}</b> • CI: {{ empleado?.documento_identidad || '-' }}
            </div>
          </div>
        </div>

        <!-- ACCIONES SUPERIORES -->
        <div class="row items-center q-gutter-sm">
          <span v-if="totalPages > 0" class="text-caption text-slate-400 gt-xs">
            Total páginas detectadas: <b class="text-amber-4 font-mono">{{ totalPages }}</b>
          </span>

          <q-btn
            v-if="pdfFile"
            flat
            dense
            no-caps
            icon="upload_file"
            label="Cambiar PDF"
            color="slate-300"
            size="sm"
            @click="triggerFileInput"
          />

          <q-btn
            unelevated
            no-caps
            color="positive"
            icon="save"
            label="Guardar y Desglosar File"
            class="text-weight-bolder"
            :loading="isProcessing"
            :disable="!hasAnyAssignment"
            @click="ejecutarDesglose"
          >
            <q-tooltip v-if="!hasAnyAssignment">Asigna al menos una página a una sección para guardar</q-tooltip>
          </q-btn>

          <q-btn flat round dense icon="close" color="white" v-close-popup />
        </div>
      </div>

      <input
        ref="fileInputRef"
        type="file"
        accept="application/pdf"
        class="hidden"
        @change="handleFileSelected"
      />

      <!-- ESTADO 1: SIN ARCHIVO CARGADO (ZONA DRAG & DROP) -->
      <div v-if="!pdfFile" class="col flex flex-center q-pa-lg">
        <div
          class="upload-dropzone column items-center justify-center q-pa-xl text-center cursor-pointer"
          :class="{ 'dropzone-active': isDragging }"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          @click="triggerFileInput"
        >
          <div class="upload-icon-circle flex flex-center q-mb-md">
            <q-icon name="cloud_upload" size="48px" color="indigo-4" />
          </div>

          <div class="text-h6 text-weight-bolder text-white q-mb-xs">
            Arrastra aquí el archivo PDF del File Escaneado
          </div>
          <div class="text-caption text-slate-400 q-mb-md" style="max-width: 460px;">
            Sube el archivo único con todas las hojas del expediente (por ejemplo el escaneo completo de 30 o 50 hojas).
            El sistema te permitirá clasificar cada hoja en sus 13 secciones.
          </div>

          <q-btn
            unelevated
            no-caps
            color="primary"
            icon="folder_open"
            label="Seleccionar archivo PDF del equipo"
            class="text-weight-bold"
          />
        </div>
      </div>

      <!-- ESTADO 2: MESA DE TRABAJO CON EL PDF CARGADO -->
      <div v-else class="col row no-wrap overflow-hidden">
        
        <!-- PANEL IZQUIERDO: MOSAICO DE HOJAS / MESA DE LUZ -->
        <div class="col-8 column no-wrap border-right">
          <!-- BARRA DE HERRAMIENTAS DEL MOSAICO -->
          <div class="row items-center justify-between q-px-md q-py-xs bg-slate-950 border-bottom col-auto">
            <div class="row items-center q-gutter-xs">
              <span class="text-caption text-slate-300 text-weight-bold">
                Seleccionadas: <b class="text-amber-4 font-mono">{{ selectedPages.length }}</b> de {{ totalPages }}
              </span>
              <q-separator vertical inset class="q-mx-xs bg-slate-700" />
              <q-btn flat dense no-caps size="xs" color="slate-300" label="Todas" @click="selectAllPages" />
              <q-btn flat dense no-caps size="xs" color="slate-300" label="Ninguna" @click="clearSelection" />
              <q-btn flat dense no-caps size="xs" color="slate-300" label="Invertir" @click="invertSelection" />
            </div>

            <!-- SELECCIONAR POR RANGO -->
            <div class="row items-center q-gutter-xs">
              <span class="text-caption text-slate-400 gt-xs">Rango:</span>
              <q-input
                v-model.number="rangoDesde"
                type="number"
                dense
                outlined
                dark
                min="1"
                :max="totalPages"
                placeholder="Desde"
                class="range-input"
                style="width: 65px;"
              />
              <span class="text-caption text-slate-400">-</span>
              <q-input
                v-model.number="rangoHasta"
                type="number"
                dense
                outlined
                dark
                min="1"
                :max="totalPages"
                placeholder="Hasta"
                class="range-input"
                style="width: 65px;"
              />
              <q-btn
                unelevated
                no-caps
                size="xs"
                color="indigo-7"
                label="Marcar Rango"
                class="text-weight-bold q-px-sm"
                @click="seleccionarRango"
              />
            </div>
          </div>

          <!-- CONTENIDO SCROLLABLE CON LAS MINIATURAS DE CADA PÁGINA -->
          <div class="col scroll q-pa-md pages-grid-container">
            <div v-if="isLoadingPages" class="column items-center justify-center q-py-xl">
              <q-spinner-dots size="48px" color="indigo-4" />
              <div class="text-caption text-slate-400 q-mt-sm">
                Generando miniaturas de las hojas del expediente ({{ renderedCount }}/{{ totalPages }})...
              </div>
            </div>

            <div v-else class="pages-grid">
              <div
                v-for="page in pagesList"
                :key="page.num"
                class="page-card column items-center cursor-pointer"
                :class="{
                  'page-selected': selectedPages.includes(page.num),
                  'page-assigned': pageAssignedMap[page.num]
                }"
                @click="togglePageSelection(page.num)"
              >
                <!-- CABECERA DE LA PÁGINA -->
                <div class="page-card-header row items-center justify-between full-width q-px-xs">
                  <span class="page-number-tag font-mono">Pág. {{ page.num }}</span>
                  <q-checkbox
                    :model-value="selectedPages.includes(page.num)"
                    dense
                    dark
                    size="xs"
                    @click.stop="togglePageSelection(page.num)"
                  />
                </div>

                <!-- CANVAS DE PREVISUALIZACIÓN -->
                <div class="page-canvas-wrapper flex flex-center">
                  <canvas :id="`page-thumb-${page.num}`" class="page-canvas"></canvas>
                  <!-- BADGE SI YA ESTÁ ASIGNADA -->
                  <div v-if="pageAssignedMap[page.num]" class="page-assigned-banner ellipsis">
                    {{ pageAssignedMap[page.num].nombreCorto }}
                  </div>
                </div>

                <!-- ACCIÓN RÁPIDA: VER GRANDE -->
                <div class="page-card-footer row items-center justify-between full-width q-px-xs">
                  <span class="text-caption" style="font-size: 10px; color: #94a3b8;">
                    {{ pageAssignedMap[page.num] ? `#${pageAssignedMap[page.num].id}` : 'Sin asignar' }}
                  </span>
                  <q-btn
                    flat
                    round
                    dense
                    size="xs"
                    icon="zoom_in"
                    color="slate-300"
                    @click.stop="openZoomPage(page.num)"
                  >
                    <q-tooltip>Ver página completa</q-tooltip>
                  </q-btn>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- PANEL DERECHO: LAS 13 SECCIONES A CLASIFICAR -->
        <div class="col-4 column no-wrap bg-slate-950">
          <div class="q-px-md q-py-sm border-bottom col-auto">
            <div class="row items-center justify-between no-wrap">
              <div class="text-subtitle2 text-weight-bolder text-white">
                13 Secciones del Legajo
              </div>
              <q-badge color="indigo-9" class="text-weight-bold font-mono">
                {{ Object.keys(asignaciones).filter(k => (asignaciones[k] || []).length > 0).length }} asignadas
              </q-badge>
            </div>
            <div class="text-caption text-slate-400" style="font-size: 10.5px;">
              Selecciona hojas a la izquierda y presiona "Asignar":
            </div>
          </div>

          <!-- SELECTOR DE MODO: ACUMULAR VS REEMPLAZAR -->
          <div class="q-px-sm q-py-xs bg-slate-900 border-bottom col-auto row items-center justify-between">
            <span class="text-caption text-slate-300 font-mono text-weight-bold" style="font-size: 10px;">
              Modo:
            </span>
            <q-btn-toggle
              v-model="modoGuardado"
              dense
              no-caps
              rounded
              unelevated
              size="xs"
              toggle-color="teal-8"
              color="slate-800"
              text-color="slate-300"
              :options="[
                { label: 'Acumular / Sumar', value: 'acumular', icon: 'library_add' },
                { label: 'Reemplazar', value: 'reemplazar', icon: 'sync' }
              ]"
            >
              <q-tooltip>
                {{ modoGuardado === 'acumular' 
                  ? 'Acumular: Conserva los documentos previos en cada sección y anexa las nuevas páginas al final' 
                  : 'Reemplazar: Sobrescribe los documentos anteriores de las secciones que asignes' }}
              </q-tooltip>
            </q-btn-toggle>
          </div>

          <!-- LISTA SCROLLABLE DE LAS 13 SECCIONES -->
          <div class="col scroll q-pa-sm q-gutter-y-xs">
            <div
              v-for="sec in secciones"
              :key="sec.id"
              class="section-classifier-box q-pa-sm"
              :class="{
                'section-has-pages': (asignaciones[sec.codigo] || []).length > 0
              }"
            >
              <div class="row items-center justify-between no-wrap">
                <div class="row items-center q-gutter-xs ellipsis col">
                  <span class="sec-badge-num">{{ String(sec.id).padStart(2, '0') }}</span>
                  <div class="ellipsis">
                    <div class="text-weight-bold text-white ellipsis" style="font-size: 12px;">
                      {{ sec.nombre }}
                    </div>
                    <div class="text-caption text-slate-400 ellipsis" style="font-size: 10px;">
                      {{ sec.descripcion }}
                    </div>
                  </div>
                </div>

                <!-- BOTÓN PARA ASIGNAR LAS SELECCIONADAS -->
                <q-btn
                  unelevated
                  dense
                  no-caps
                  size="sm"
                  color="indigo-7"
                  icon="add"
                  :label="selectedPages.length > 0 ? `Asignar (${selectedPages.length})` : 'Asignar'"
                  class="text-weight-bold q-px-xs col-auto"
                  :disable="selectedPages.length === 0"
                  @click="asignarASeccion(sec.codigo)"
                >
                  <q-tooltip>Asignar las páginas seleccionadas a {{ sec.nombre }}</q-tooltip>
                </q-btn>
              </div>

              <!-- PÁGINAS YA ASIGNADAS A ESTA SECCIÓN -->
              <div
                v-if="(asignaciones[sec.codigo] || []).length > 0"
                class="row items-center justify-between q-mt-xs q-pt-xs border-top-dark text-caption"
              >
                <div class="row items-center q-gutter-xs">
                  <q-badge color="teal-8" class="text-weight-bold">
                    {{ (asignaciones[sec.codigo] || []).length }} Fojas
                  </q-badge>
                  <span class="text-slate-400" style="font-size: 10px;">
                    Págs: {{ (asignaciones[sec.codigo] || []).join(', ') }}
                  </span>
                </div>

                <q-btn
                  flat
                  dense
                  round
                  size="xs"
                  icon="close"
                  color="negative"
                  @click="removerAsignacion(sec.codigo)"
                >
                  <q-tooltip>Quitar asignación de páginas de esta sección</q-tooltip>
                </q-btn>
              </div>
            </div>
          </div>
        </div>
      </div>
    </q-card>

    <!-- MODAL DE ZOOM DE PÁGINA -->
    <q-dialog v-model="showZoom" max-width="800px">
      <q-card class="bg-slate-900 text-white q-pa-sm">
        <div class="row items-center justify-between q-mb-xs">
          <span class="text-subtitle2 text-weight-bold">Previsualización - Página {{ zoomPageNum }}</span>
          <q-btn icon="close" flat round dense color="white" v-close-popup />
        </div>
        <div class="flex flex-center" style="max-height: 80vh; overflow: auto;">
          <canvas id="zoom-canvas" style="max-width: 100%; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);"></canvas>
        </div>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { useQuasar } from 'quasar';
import { PDFDocument } from 'pdf-lib/dist/pdf-lib.min.js';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
  getEmpleadoSecciones,
  saveEmpleadoSecciones,
  SECCIONES_FILE_DEFAULT
} from 'src/utils/fileSectionsHelper';
import { saveSectionPdf, saveMasterPdf, appendSectionPdf } from 'src/utils/pdfStorageHelper';

// Polyfill preventivo para navegadores sin Uint8Array.prototype.toHex
if (typeof Uint8Array !== 'undefined' && !Uint8Array.prototype.toHex) {
  Uint8Array.prototype.toHex = function () {
    return Array.from(this)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  };
}

// Configurar worker de PDF.js local empaquetado por Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker || 'https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';

const props = defineProps({
  modelValue: Boolean,
  empleado: Object
});

const emit = defineEmits(['update:modelValue', 'saved']);

const $q = useQuasar();

const modoGuardado = ref('acumular'); // 'acumular' | 'reemplazar'
const fileInputRef = ref(null);
const isDragging = ref(false);
const isProcessing = ref(false);
const isLoadingPages = ref(false);
const renderedCount = ref(0);

const pdfFile = ref(null);
const pdfArrayBuffer = ref(null);
let pdfDocProxy = null; // Instancia de pdfjs
let pdfLibDoc = null; // Instancia de pdf-lib

const totalPages = ref(0);
const pagesList = ref([]);
const selectedPages = ref([]);

const rangoDesde = ref(1);
const rangoHasta = ref(1);

const showZoom = ref(false);
const zoomPageNum = ref(1);

// Secciones del empleado (13)
const secciones = ref(JSON.parse(JSON.stringify(SECCIONES_FILE_DEFAULT)));

// Mapa de asignaciones: { 'CONTRATOS': [1, 2, 3], 'CNS': [4, 5] }
const asignaciones = ref({});

// Mapa inverso rápido: página -> objeto sección
const pageAssignedMap = computed(() => {
  const map = {};
  Object.entries(asignaciones.value).forEach(([codigo, pages]) => {
    const sec = secciones.value.find(s => s.codigo === codigo);
    if (sec && Array.isArray(pages)) {
      pages.forEach(pNum => {
        map[pNum] = {
          codigo,
          id: sec.id,
          nombreCorto: sec.nombre.length > 18 ? sec.nombre.substring(0, 16) + '...' : sec.nombre
        };
      });
    }
  });
  return map;
});

const hasAnyAssignment = computed(() => {
  return Object.values(asignaciones.value).some(arr => Array.isArray(arr) && arr.length > 0);
});

watch(() => props.empleado, (newEmp) => {
  if (newEmp?.id) {
    secciones.value = getEmpleadoSecciones(newEmp.id);
  }
}, { immediate: true });

const triggerFileInput = () => {
  fileInputRef.value?.click();
};

const handleFileSelected = (e) => {
  const file = e.target.files?.[0];
  if (file) loadPdfFile(file);
};

const handleDrop = (e) => {
  isDragging.value = false;
  const file = e.dataTransfer.files?.[0];
  if (file && file.type === 'application/pdf') {
    loadPdfFile(file);
  } else {
    $q.notify({ type: 'warning', message: 'Por favor arrastra un archivo PDF válido' });
  }
};

const loadPdfFile = async (file) => {
  try {
    isLoadingPages.value = true;
    pdfFile.value = file;
    asignaciones.value = {};
    selectedPages.value = [];

    const buffer = await file.arrayBuffer();
    pdfArrayBuffer.value = buffer;

    // Cargar con pdf-lib para futuras manipulaciones y extracciones
    pdfLibDoc = await PDFDocument.load(buffer);

    // Cargar con PDF.js para renderizar miniaturas
    pdfDocProxy = await pdfjsLib.getDocument({ data: buffer }).promise;
    totalPages.value = pdfDocProxy.numPages;

    rangoDesde.value = 1;
    rangoHasta.value = Math.min(2, totalPages.value);

    const list = [];
    for (let i = 1; i <= totalPages.value; i++) {
      list.push({ num: i });
    }
    pagesList.value = list;

    $q.notify({
      type: 'info',
      message: `PDF cargado: ${totalPages.value} páginas listas para clasificar`,
      icon: 'file_present',
      timeout: 1500
    });

    await nextTick();
    renderAllThumbnails();
  } catch (error) {
    console.error('Error cargando PDF:', error);
    $q.notify({ type: 'negative', message: 'Error al abrir el PDF. Verifica que no esté dañado o protegido con contraseña.' });
    pdfFile.value = null;
  } finally {
    isLoadingPages.value = false;
  }
};

const renderAllThumbnails = async () => {
  if (!pdfDocProxy) return;
  renderedCount.value = 0;

  for (let i = 1; i <= totalPages.value; i++) {
    try {
      const page = await pdfDocProxy.getPage(i);
      const viewport = page.getViewport({ scale: 0.28 });
      const canvas = document.getElementById(`page-thumb-${i}`);
      if (canvas) {
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
      }
      renderedCount.value++;
    } catch (e) {
      console.warn(`Error renderizando miniatura de página ${i}:`, e);
    }
  }
};

// SELECCIÓN DE PÁGINAS
const togglePageSelection = (pNum) => {
  const idx = selectedPages.value.indexOf(pNum);
  if (idx > -1) {
    selectedPages.value.splice(idx, 1);
  } else {
    selectedPages.value.push(pNum);
    selectedPages.value.sort((a, b) => a - b);
  }
};

const selectAllPages = () => {
  selectedPages.value = pagesList.value.map(p => p.num);
};

const clearSelection = () => {
  selectedPages.value = [];
};

const invertSelection = () => {
  const current = new Set(selectedPages.value);
  selectedPages.value = pagesList.value
    .map(p => p.num)
    .filter(n => !current.has(n));
};

const seleccionarRango = () => {
  const d = Math.max(1, Math.min(Number(rangoDesde.value), totalPages.value));
  const h = Math.max(d, Math.min(Number(rangoHasta.value), totalPages.value));

  const set = new Set(selectedPages.value);
  for (let i = d; i <= h; i++) {
    set.add(i);
  }
  selectedPages.value = Array.from(set).sort((a, b) => a - b);
};

// ASIGNAR PÁGINAS A SECCIÓN
const asignarASeccion = (codigo) => {
  if (selectedPages.value.length === 0) return;

  // Primero quitamos estas páginas de cualquier otra sección para evitar duplicados
  Object.keys(asignaciones.value).forEach(k => {
    asignaciones.value[k] = (asignaciones.value[k] || []).filter(p => !selectedPages.value.includes(p));
  });

  const existing = asignaciones.value[codigo] || [];
  const merged = Array.from(new Set([...existing, ...selectedPages.value])).sort((a, b) => a - b);
  asignaciones.value[codigo] = merged;

  const sec = secciones.value.find(s => s.codigo === codigo);
  $q.notify({
    type: 'positive',
    message: `${selectedPages.value.length} páginas asignadas a "${sec?.nombre}"`,
    timeout: 1000,
    dense: true
  });

  clearSelection();
};

const removerAsignacion = (codigo) => {
  delete asignaciones.value[codigo];
};

// PREVISUALIZAR PÁGINA EN GRANDE
const openZoomPage = async (pNum) => {
  zoomPageNum.value = pNum;
  showZoom.value = true;
  await nextTick();

  if (pdfDocProxy) {
    try {
      const page = await pdfDocProxy.getPage(pNum);
      const viewport = page.getViewport({ scale: 1.2 });
      const canvas = document.getElementById('zoom-canvas');
      if (canvas) {
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        const context = canvas.getContext('2d');
        await page.render({ canvasContext: context, viewport }).promise;
      }
    } catch (e) {
      console.error('Error en zoom de página:', e);
    }
  }
};

// EJECUTAR DESGLOSE Y CORTE AUTOMÁTICO DE CADA SECCIÓN
const ejecutarDesglose = async () => {
  if (!pdfLibDoc || !props.empleado?.id) return;
  isProcessing.value = true;

  try {
    const codigosAsignados = Object.keys(asignaciones.value).filter(
      k => Array.isArray(asignaciones.value[k]) && asignaciones.value[k].length > 0
    );

    let totalDesglosados = 0;
    const seccionesActualizadas = JSON.parse(JSON.stringify(secciones.value));

    for (const codigo of codigosAsignados) {
      const pageNums = Array.from(asignaciones.value[codigo] || []).map(Number);
      // Convertir a índices 0-based para pdf-lib
      const pageIndices = pageNums.map(n => n - 1);

      // Crear nuevo documento PDF recortado para esta sección
      const subDoc = await PDFDocument.create();
      const copiedPages = await subDoc.copyPages(pdfLibDoc, pageIndices);
      copiedPages.forEach(p => subDoc.addPage(p));

      const subPdfBytes = await subDoc.save();

      let totalFojasSec = pageNums.length;
      if (modoGuardado.value === 'acumular') {
        const res = await appendSectionPdf(props.empleado.id, codigo, subPdfBytes, {
          filename: `${codigo}_EXP_${props.empleado.id}.pdf`,
          pagesCount: pageNums.length,
          pageNumbers: pageNums
        });
        totalFojasSec = res.totalPages;
      } else {
        await saveSectionPdf(props.empleado.id, codigo, subPdfBytes, {
          filename: `${codigo}_EXP_${props.empleado.id}.pdf`,
          pagesCount: pageNums.length,
          pageNumbers: pageNums
        });
      }

      // Actualizar metadata de la sección
      const targetSec = seccionesActualizadas.find(s => s.codigo === codigo);
      if (targetSec) {
        targetSec.fojas = totalFojasSec;
        targetSec.estado = 'presente';
        const obsAppend = modoGuardado.value === 'acumular' && totalFojasSec > pageNums.length
          ? ` (Acumulado: ${totalFojasSec} fojas)`
          : ` (${pageNums.length} fojas)`;
        targetSec.observacion = `Documento escaneado desglosado${obsAppend}`;
      }

      totalDesglosados++;
    }

    // Guardar también el PDF maestro completo escaneado para el Visor Modo Libro
    if (pdfArrayBuffer.value) {
      await saveMasterPdf(props.empleado.id, pdfArrayBuffer.value, {
        filename: pdfFile.value?.name || `EXP_${props.empleado.id}_COMPLETO.pdf`,
        pagesCount: totalPages.value
      });
    }

    // Guardar metadata actualizada del file
    saveEmpleadoSecciones(props.empleado.id, seccionesActualizadas);

    $q.notify({
      type: 'positive',
      message: `¡File desglosado con éxito! Se crearon ${totalDesglosados} secciones con sus fojas físicas actualizadas.`,
      icon: 'check_circle',
      timeout: 2500
    });

    emit('saved', seccionesActualizadas);
    emit('update:modelValue', false);
  } catch (error) {
    console.error('Error desglosando PDF:', error);
    $q.notify({ type: 'negative', message: 'Ocurrió un error al recortar las secciones del PDF.' });
  } finally {
    isProcessing.value = false;
  }
};
</script>

<style scoped>
.desglosador-dialog :deep(.q-dialog__inner) {
  padding: 0 !important;
}

.desglosador-icon-box {
  width: 36px;
  height: 36px;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 8px;
}

.border-bottom {
  border-bottom: 1px solid #1e293b;
}
.border-right {
  border-right: 1px solid #1e293b;
}
.border-top-dark {
  border-top: 1px solid #1e293b;
}

/* DROPZONE */
.upload-dropzone {
  border: 2px dashed #475569;
  border-radius: 16px;
  background: rgba(30, 41, 59, 0.5);
  max-width: 600px;
  width: 90vw;
  transition: all 0.25s ease;
}
.upload-dropzone:hover, .dropzone-active {
  border-color: #6366f1;
  background: rgba(49, 46, 129, 0.25);
  transform: scale(1.01);
}

.upload-icon-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
}

/* MOSAICO DE PÁGINAS */
.pages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 12px;
}

.page-card {
  background: #1e293b;
  border: 2px solid #334155;
  border-radius: 8px;
  padding: 4px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.page-card:hover {
  border-color: #64748b;
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
}

.page-selected {
  border-color: #f59e0b !important;
  background: #2b2214 !important;
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.5);
}

.page-assigned {
  border-color: #10b981;
}

.page-number-tag {
  font-size: 10px;
  font-weight: 800;
  color: #94a3b8;
}

.page-canvas-wrapper {
  width: 100%;
  height: 160px;
  background: #0f172a;
  border-radius: 4px;
  margin: 4px 0;
  position: relative;
  overflow: hidden;
}

.page-canvas {
  max-width: 100%;
  max-height: 100%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.page-assigned-banner {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(16, 185, 129, 0.9);
  color: white;
  font-size: 9px;
  font-weight: 800;
  padding: 2px 4px;
  text-align: center;
}

/* PANEL DERECHO DE SECCIONES */
.section-classifier-box {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.section-classifier-box:hover {
  border-color: #475569;
}

.section-has-pages {
  border-color: #059669;
  background: #062a22;
}

.sec-badge-num {
  background: #312e81;
  color: #ffffff;
  font-size: 10px;
  font-weight: 800;
  padding: 2px 5px;
  border-radius: 4px;
  font-family: monospace;
}

.range-input :deep(.q-field__native) {
  text-align: center;
  font-family: monospace;
  font-weight: 700;
  font-size: 11px;
}
</style>
