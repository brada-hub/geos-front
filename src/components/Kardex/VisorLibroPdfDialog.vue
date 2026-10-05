<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    maximized
    persistent
    transition-show="slide-up"
    transition-hide="slide-down"
    class="visor-libro-dialog"
  >
    <q-card class="column no-wrap full-height bg-slate-950 text-white overflow-hidden">
      <!-- HEADER CONSOLA / BARRA DE HERRAMIENTAS -->
      <div class="row items-center justify-between q-px-md q-py-xs bg-slate-900 border-bottom col-auto z-top shadow-3">
        <!-- TÍTULO Y METADATOS -->
        <div class="row items-center q-gutter-sm">
          <q-btn flat round dense icon="arrow_back" color="white" v-close-popup>
            <q-tooltip>Volver al expediente</q-tooltip>
          </q-btn>

          <div class="book-icon-badge flex flex-center">
            <q-icon :name="viewMode === 'book' ? 'menu_book' : 'picture_as_pdf'" size="20px" color="amber-4" />
          </div>

          <div>
            <div class="row items-center q-gutter-x-sm">
              <span class="text-subtitle2 text-weight-bolder text-white">
                {{ tituloDocumento }}
              </span>
              <q-badge color="indigo-7" class="text-weight-bold font-mono">
                {{ empleado?.codigo_archivo || `EXP-${empleado?.numero_unico || empleado?.id}` }}
              </q-badge>
              <q-badge v-if="viewMode === 'book'" color="amber-9" text-color="dark" class="text-weight-bold">
                Modo Libro / Cartapacio
              </q-badge>
            </div>
            <div class="text-caption text-slate-400 ellipsis" style="max-width: 450px;">
              {{ empleado?.nombre_completo }} • {{ totalPages > 0 ? `${totalPages} fojas en total` : 'Cargando archivo...' }}
            </div>
          </div>
        </div>

        <!-- CONTROLES CENTRALES DE NAVEGACIÓN DE PÁGINAS -->
        <div v-if="totalPages > 0" class="row items-center q-gutter-x-xs bg-slate-950 q-px-sm q-py-xs rounded-borders border">
          <q-btn
            flat
            dense
            round
            icon="first_page"
            size="sm"
            color="slate-300"
            :disable="currentPage <= 1"
            @click="goToPage(1)"
          >
            <q-tooltip>Primera página (Portada)</q-tooltip>
          </q-btn>

          <q-btn
            flat
            dense
            round
            icon="chevron_left"
            size="md"
            color="amber-4"
            :disable="currentPage <= 1"
            @click="prevPage"
          >
            <q-tooltip>Página anterior (Tecla ←)</q-tooltip>
          </q-btn>

          <!-- INDICADOR DE PÁGINA ACTUAL -->
          <div class="row items-center q-px-xs text-caption font-mono text-weight-bold">
            <template v-if="viewMode === 'book' && currentPage > 1">
              <span class="text-amber-4">{{ currentPage }} - {{ Math.min(currentPage + 1, totalPages) }}</span>
            </template>
            <template v-else>
              <span class="text-amber-4">{{ currentPage }}</span>
            </template>
            <span class="text-slate-500 q-mx-xs">/</span>
            <span class="text-slate-300">{{ totalPages }}</span>
          </div>

          <q-btn
            flat
            dense
            round
            icon="chevron_right"
            size="md"
            color="amber-4"
            :disable="currentPage >= totalPages || (viewMode === 'book' && currentPage + 1 >= totalPages)"
            @click="nextPage"
          >
            <q-tooltip>Página siguiente (Tecla →)</q-tooltip>
          </q-btn>

          <q-btn
            flat
            dense
            round
            icon="last_page"
            size="sm"
            color="slate-300"
            :disable="currentPage >= totalPages"
            @click="goToPage(totalPages)"
          >
            <q-tooltip>Última página</q-tooltip>
          </q-btn>
        </div>

        <!-- ACCIONES Y HERRAMIENTAS DERECHA -->
        <div class="row items-center q-gutter-x-xs">
          <!-- CONMUTADOR MODO LIBRO VS MODO INDIVIDUAL -->
          <q-btn-toggle
            v-model="viewMode"
            dense
            no-caps
            rounded
            unelevated
            size="xs"
            toggle-color="indigo-7"
            color="slate-800"
            text-color="slate-300"
            class="gt-xs"
            :options="[
              { label: 'Libro (2 págs)', value: 'book', icon: 'menu_book' },
              { label: 'Hoja simple', value: 'single', icon: 'description' }
            ]"
            @update:model-value="onModeChange"
          />

          <q-separator vertical inset class="q-mx-xs bg-slate-700 gt-xs" />

          <!-- ZOOM -->
          <div class="row items-center q-gutter-x-none bg-slate-950 rounded-borders border gt-sm">
            <q-btn flat dense icon="remove" size="xs" color="slate-300" @click="zoomOut">
              <q-tooltip>Reducir zoom</q-tooltip>
            </q-btn>
            <span class="text-caption font-mono q-px-xs" style="font-size: 11px; min-width: 42px; text-align: center;">
              {{ Math.round(zoomScale * 100) }}%
            </span>
            <q-btn flat dense icon="add" size="xs" color="slate-300" @click="zoomIn">
              <q-tooltip>Aumentar zoom</q-tooltip>
            </q-btn>
            <q-btn flat dense icon="aspect_ratio" size="xs" color="slate-400" @click="resetZoom">
              <q-tooltip>Restablecer tamaño</q-tooltip>
            </q-btn>
          </div>

          <q-separator vertical inset class="q-mx-xs bg-slate-700 gt-xs" />

          <!-- BOTÓN ÍNDICE DE SECCIONES -->
          <q-btn
            flat
            dense
            no-caps
            size="sm"
            color="amber-4"
            icon="format_list_bulleted"
            label="Índice"
            @click="showSidebar = !showSidebar"
          >
            <q-tooltip>Ver índice de las 13 secciones del legajo</q-tooltip>
          </q-btn>

          <!-- DESCARGAR / IMPRIMIR -->
          <q-btn flat round dense icon="print" size="sm" color="slate-300" @click="imprimirDocumento">
            <q-tooltip>Imprimir documento</q-tooltip>
          </q-btn>

          <q-btn flat round dense icon="download" size="sm" color="slate-300" @click="descargarPdf">
            <q-tooltip>Descargar archivo PDF</q-tooltip>
          </q-btn>

          <q-btn
            flat
            round
            dense
            :icon="isFullscreen ? 'fullscreen_exit' : 'fullscreen'"
            size="sm"
            color="slate-300"
            @click="toggleFullscreen"
          >
            <q-tooltip>{{ isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa' }}</q-tooltip>
          </q-btn>

          <q-btn flat round dense icon="close" size="sm" color="white" v-close-popup />
        </div>
      </div>

      <!-- ÁREA PRINCIPAL: VISOR Y SIDEBAR LATERAL -->
      <div class="col row no-wrap overflow-hidden relative-position">
        
        <!-- SIDEBAR: ÍNDICE DE LAS 13 SECCIONES (TIPO PESTAÑAS DE ARCHIVADOR) -->
        <transition name="slide-sidebar">
          <div v-if="showSidebar" class="col-auto column no-wrap bg-slate-900 border-right sidebar-sections shadow-5">
            <div class="row items-center justify-between q-pa-sm bg-slate-950 border-bottom col-auto">
              <div class="row items-center q-gutter-x-xs">
                <q-icon name="bookmarks" size="18px" color="amber-4" />
                <span class="text-caption text-weight-bolder text-white">Índice del Legajo</span>
              </div>
              <q-btn flat round dense icon="chevron_left" size="xs" color="slate-400" @click="showSidebar = false" />
            </div>

            <!-- LISTA DE SECCIONES -->
            <div class="col scroll q-pa-xs q-gutter-y-xs">
              <div
                v-for="sec in secciones"
                :key="sec.id"
                class="sidebar-section-item q-pa-xs cursor-pointer"
                :class="{
                  'item-active': seccionActivaCodigo === sec.codigo,
                  'item-has-pdf': pdfsDisponibles[sec.codigo] || (seccionPageMap[sec.codigo] && seccionPageMap[sec.codigo].length > 0)
                }"
                @click="seleccionarSeccion(sec)"
              >
                <div class="row items-center justify-between no-wrap">
                  <div class="row items-center no-wrap q-gutter-x-xs">
                    <span class="sidebar-sec-num">{{ String(sec.id).padStart(2, '0') }}</span>
                    <span class="text-caption text-weight-medium ellipsis text-slate-200" style="max-width: 140px; font-size: 11px;">
                      {{ sec.nombre }}
                    </span>
                  </div>

                  <!-- BADGE DE PÁGINA O ESTADO -->
                  <div class="row items-center q-gutter-x-xs">
                    <q-badge
                      v-if="seccionPageMap[sec.codigo] && seccionPageMap[sec.codigo].length > 0"
                      color="indigo-9"
                      class="text-weight-bold"
                      style="font-size: 9.5px;"
                    >
                      Pág. {{ seccionPageMap[sec.codigo][0] }}
                    </q-badge>
                    <q-icon
                      v-else-if="pdfsDisponibles[sec.codigo]"
                      name="picture_as_pdf"
                      size="14px"
                      color="red-4"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- ACCIÓN RÁPIDA: CAMBIAR / SUBIR PDF SI NO TIENE -->
            <div class="q-pa-sm bg-slate-950 border-top col-auto text-center">
              <q-btn
                flat
                dense
                no-caps
                size="xs"
                color="slate-400"
                icon="upload_file"
                label="Cargar otro PDF"
                class="full-width"
                @click="triggerFileInput"
              />
            </div>
          </div>
        </transition>

        <!-- ZONA DE LECTURA (CANVAS MODO LIBRO O HOJA) -->
        <div
          ref="viewerContainerRef"
          class="col column flex-center scroll viewer-viewport"
          :class="{ 'book-desk-bg': viewMode === 'book' }"
          @click="onBackgroundClick"
        >
          <!-- CARGANDO -->
          <div v-if="isLoading" class="column items-center justify-center q-pa-xl text-center">
            <q-spinner-cube size="56px" color="amber-4" />
            <div class="text-subtitle2 text-slate-200 q-mt-md text-weight-bold">
              Abriendo documento en alta definición...
            </div>
            <div class="text-caption text-slate-400">
              Procesando páginas y texturas de encuadernación
            </div>
          </div>

          <!-- ESTADO SIN PDF -->
          <div v-else-if="!pdfDocProxy" class="column items-center justify-center q-pa-xl text-center">
            <q-icon name="menu_book" size="72px" color="slate-600" class="q-mb-md" />
            <div class="text-h6 text-white text-weight-bolder q-mb-xs">
              No hay documento cargado para previsualizar
            </div>
            <div class="text-caption text-slate-400 q-mb-md" style="max-width: 420px;">
              Este empleado aún no tiene un archivo PDF maestro guardado. Puedes subir el archivo escaneado ahora mismo para explorarlo como un libro digital.
            </div>
            <q-btn
              unelevated
              no-caps
              color="amber-8"
              text-color="dark"
              icon="upload_file"
              label="Seleccionar archivo PDF"
              class="text-weight-bolder"
              @click="triggerFileInput"
            />
          </div>

          <!-- MODO LIBRO (ENCUADERNADO 2 PÁGINAS / PORTADA) -->
          <div
            v-else-if="viewMode === 'book'"
            class="book-spread-wrapper row items-center justify-center relative-position"
            :style="{ transform: `scale(${zoomScale})`, transformOrigin: 'center center' }"
          >
            <!-- BOTÓN FLOTANTE ANTERIOR (IZQUIERDA) -->
            <button
              v-if="currentPage > 1"
              class="book-nav-arrow book-nav-prev"
              title="Página anterior (←)"
              @click.stop="prevPage"
            >
              <q-icon name="chevron_left" size="32px" />
            </button>

            <!-- PORTADA INDIVIDUAL (SI ESTÁ EN PÁGINA 1) -->
            <div v-if="currentPage === 1" class="book-cover-container column items-center">
              <div class="book-single-page book-shadow-heavy relative-position">
                <canvas id="page-canvas-1" class="page-canvas-rendered"></canvas>
                <div class="book-page-folio">Pág. 1 (Carátula)</div>
              </div>
            </div>

            <!-- ENCUADERNACIÓN 2 PÁGINAS (PÁGINA IZQUIERDA Y PÁGINA DERECHA) -->
            <div v-else class="book-binder-spread row no-wrap items-stretch shadow-24">
              <!-- HOJA IZQUIERDA (PÁGINA PAR O ANVERSO) -->
              <div class="book-page-left column relative-position">
                <canvas id="page-canvas-left" class="page-canvas-rendered"></canvas>
                <div class="book-page-folio-left font-mono">Pág. {{ currentPage }}</div>
              </div>

              <!-- LOMO / ESPINA CENTRAL CON SOMBRA 3D -->
              <div class="book-spine-crease">
                <div class="spine-line"></div>
              </div>

              <!-- HOJA DERECHA (PÁGINA IMPAR O REVERSO) -->
              <div class="book-page-right column relative-position">
                <canvas
                  v-if="currentPage + 1 <= totalPages"
                  id="page-canvas-right"
                  class="page-canvas-rendered"
                ></canvas>
                <div v-else class="book-blank-page flex flex-center text-slate-400">
                  <div class="text-caption text-italic">Fin del expediente</div>
                </div>
                <div v-if="currentPage + 1 <= totalPages" class="book-page-folio-right font-mono">
                  Pág. {{ currentPage + 1 }}
                </div>
              </div>
            </div>

            <!-- BOTÓN FLOTANTE SIGUIENTE (DERECHA) -->
            <button
              v-if="currentPage < totalPages && (currentPage === 1 ? true : currentPage + 1 < totalPages)"
              class="book-nav-arrow book-nav-next"
              title="Página siguiente (→)"
              @click.stop="nextPage"
            >
              <q-icon name="chevron_right" size="32px" />
            </button>
          </div>

          <!-- MODO HOJA SIMPLE (1 PÁGINA TRADICIONAL) -->
          <div
            v-else
            class="single-page-wrapper column items-center justify-center relative-position"
            :style="{ transform: `scale(${zoomScale})`, transformOrigin: 'top center' }"
          >
            <!-- BOTONES LATERALES -->
            <button
              v-if="currentPage > 1"
              class="book-nav-arrow book-nav-prev"
              title="Página anterior (←)"
              @click.stop="prevPage"
            >
              <q-icon name="chevron_left" size="32px" />
            </button>

            <div class="single-page-card shadow-12 relative-position">
              <canvas id="page-canvas-single" class="page-canvas-rendered"></canvas>
              <div class="book-page-folio font-mono">Pág. {{ currentPage }} de {{ totalPages }}</div>
            </div>

            <button
              v-if="currentPage < totalPages"
              class="book-nav-arrow book-nav-next"
              title="Página siguiente (→)"
              @click.stop="nextPage"
            >
              <q-icon name="chevron_right" size="32px" />
            </button>
          </div>
        </div>
      </div>

      <!-- INPUT OCULTO PARA CARGAR ARCHIVO DIRECTAMENTE SI LO DESEA -->
      <input
        ref="fileInputRef"
        type="file"
        accept="application/pdf"
        class="hidden"
        @change="handleFileInput"
      />
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useQuasar } from 'quasar';
import * as pdfjsLib from 'pdfjs-dist';
import {
  getEmpleadoSecciones,
  SECCIONES_FILE_DEFAULT
} from 'src/utils/fileSectionsHelper';
import {
  getMasterPdf,
  getSectionPdf,
  saveMasterPdf,
  getEmpleadoPdfsMap
} from 'src/utils/pdfStorageHelper';

// Configurar worker de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.10.38'}/build/pdf.worker.min.mjs`;

const props = defineProps({
  modelValue: Boolean,
  empleado: Object,
  seccionCodigoInicial: {
    type: String,
    default: null
  },
  pdfDataBuffer: {
    type: Object, // ArrayBuffer o Uint8Array opcional
    default: null
  }
});

defineEmits(['update:modelValue']);
const $q = useQuasar();

// Estado del visor
const isLoading = ref(false);
const viewMode = ref('book'); // 'book' (2 páginas) | 'single' (1 página)
const zoomScale = ref(1.0);
const isFullscreen = ref(false);
const showSidebar = ref(false);
const fileInputRef = ref(null);
const viewerContainerRef = ref(null);

// Datos del documento
const totalPages = ref(0);
const currentPage = ref(1);
const tituloDocumento = ref('Libro de Expediente');
const currentBlob = ref(null);
const currentFilename = ref('EXPEDIENTE.pdf');
let pdfDocProxy = ref(null);

// Metadatos de secciones
const secciones = ref(JSON.parse(JSON.stringify(SECCIONES_FILE_DEFAULT)));
const pdfsDisponibles = ref({});
const seccionActivaCodigo = ref(null);

// Mapeo de secciones a páginas (si fueron desglosadas con páginas indicadas)
const seccionPageMap = computed(() => {
  const map = {};
  Object.entries(pdfsDisponibles.value).forEach(([codigo, meta]) => {
    if (meta.pageNumbers && meta.pageNumbers.length > 0) {
      map[codigo] = meta.pageNumbers;
    }
  });
  return map;
});

// Watch para cuando se abre el diálogo o cambia el empleado
watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeydown);
      await inicializarVisor();
    } else {
      document.removeEventListener('keydown', handleKeydown);
      limpiarInstancia();
    }
  }
);

const limpiarInstancia = () => {
  pdfDocProxy.value = null;
  totalPages.value = 0;
  currentPage.value = 1;
};

// Inicializar y cargar el documento correspondiente
const inicializarVisor = async () => {
  if (!props.empleado?.id) return;
  isLoading.value = true;

  try {
    secciones.value = getEmpleadoSecciones(props.empleado.id);
    pdfsDisponibles.value = await getEmpleadoPdfsMap(props.empleado.id);

    // Caso 1: Se pasó un código de sección específico
    if (props.seccionCodigoInicial) {
      await cargarSeccionEspecifica(props.seccionCodigoInicial);
    }
    // Caso 2: Se pasó un buffer directamente por prop
    else if (props.pdfDataBuffer) {
      await cargarPdfDesdeBuffer(props.pdfDataBuffer, 'Expediente Completo');
    }
    // Caso 3: Buscar si hay Master PDF guardado en IndexedDB
    else {
      const master = await getMasterPdf(props.empleado.id);
      if (master && master.blob) {
        currentBlob.value = master.blob;
        currentFilename.value = master.filename || `EXP_${props.empleado.id}_COMPLETO.pdf`;
        tituloDocumento.value = 'Expediente Completo Digital (Modo Libro)';
        const buf = await master.blob.arrayBuffer();
        await cargarPdfDesdeBuffer(buf, tituloDocumento.value);
      } else {
        // Si no hay master, buscar si hay al menos una sección con PDF para abrirla
        const codigosConPdf = Object.keys(pdfsDisponibles.value);
        if (codigosConPdf.length > 0) {
          await cargarSeccionEspecifica(codigosConPdf[0]);
        } else {
          isLoading.value = false;
        }
      }
    }
  } catch (error) {
    console.error('Error inicializando visor:', error);
    $q.notify({ type: 'negative', message: 'No se pudo cargar el documento para el visor.' });
  } finally {
    isLoading.value = false;
  }
};

const cargarSeccionEspecifica = async (codigo) => {
  seccionActivaCodigo.value = codigo;
  const sec = secciones.value.find((s) => s.codigo === codigo);
  tituloDocumento.value = sec ? `Sección ${String(sec.id).padStart(2, '0')}: ${sec.nombre}` : `Sección ${codigo}`;

  const record = await getSectionPdf(props.empleado.id, codigo);
  if (record && record.blob) {
    currentBlob.value = record.blob;
    currentFilename.value = record.filename || `${codigo}_EXP_${props.empleado.id}.pdf`;
    const buf = await record.blob.arrayBuffer();
    await cargarPdfDesdeBuffer(buf, tituloDocumento.value);
  } else {
    $q.notify({ type: 'warning', message: `No hay PDF guardado para la sección "${sec?.nombre || codigo}"` });
  }
};

const cargarPdfDesdeBuffer = async (buffer, titulo = 'Documento PDF') => {
  try {
    isLoading.value = true;
    tituloDocumento.value = titulo;

    // Cargar con PDF.js
    const proxy = await pdfjsLib.getDocument({ data: buffer }).promise;
    pdfDocProxy.value = proxy;
    totalPages.value = proxy.numPages;
    currentPage.value = 1;

    // Ajustar zoom inicial óptimo según tamaño de pantalla
    ajustarZoomOptimo();

    await nextTick();
    await renderizarPaginasActuales();
  } catch (error) {
    console.error('Error cargando PDF en PDF.js:', error);
    $q.notify({ type: 'negative', message: 'Error procesando páginas del PDF.' });
  } finally {
    isLoading.value = false;
  }
};

// Renderizado con alta nitidez (devicePixelRatio)
const renderizarPaginasActuales = async () => {
  if (!pdfDocProxy.value) return;

  const dpr = window.devicePixelRatio || 1;

  if (viewMode.value === 'book') {
    if (currentPage.value === 1) {
      // Portada única centrada
      await renderizarCanvas('page-canvas-1', 1, dpr);
    } else {
      // 2 Páginas lado a lado
      await renderizarCanvas('page-canvas-left', currentPage.value, dpr);
      if (currentPage.value + 1 <= totalPages.value) {
        await renderizarCanvas('page-canvas-right', currentPage.value + 1, dpr);
      }
    }
  } else {
    // Modo página simple
    await renderizarCanvas('page-canvas-single', currentPage.value, dpr);
  }
};

const renderizarCanvas = async (canvasId, pageNum, dpr) => {
  try {
    const page = await pdfDocProxy.value.getPage(pageNum);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Escala base para buena lectura en pantalla (1.4 da excelente definición para texto de oficios)
    const baseScale = 1.35;
    const viewport = page.getViewport({ scale: baseScale });

    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    const context = canvas.getContext('2d');
    context.scale(dpr, dpr);

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;
  } catch (err) {
    console.warn(`Error renderizando canvas ${canvasId} en pág ${pageNum}:`, err);
  }
};

// NAVEGACIÓN
const nextPage = async () => {
  if (viewMode.value === 'book') {
    if (currentPage.value === 1) {
      currentPage.value = 2;
    } else if (currentPage.value + 2 <= totalPages.value) {
      currentPage.value += 2;
    } else if (currentPage.value + 1 <= totalPages.value) {
      currentPage.value += 1;
    }
  } else {
    if (currentPage.value < totalPages.value) {
      currentPage.value++;
    }
  }
  await nextTick();
  await renderizarPaginasActuales();
};

const prevPage = async () => {
  if (viewMode.value === 'book') {
    if (currentPage.value <= 2) {
      currentPage.value = 1;
    } else {
      currentPage.value = Math.max(2, currentPage.value - 2);
    }
  } else {
    if (currentPage.value > 1) {
      currentPage.value--;
    }
  }
  await nextTick();
  await renderizarPaginasActuales();
};

const goToPage = async (num) => {
  const p = Math.max(1, Math.min(num, totalPages.value));
  if (viewMode.value === 'book') {
    if (p === 1) {
      currentPage.value = 1;
    } else {
      // Redondear a par si estamos en libro para mantener la lectura coherente
      currentPage.value = p % 2 === 0 ? p : p - 1;
    }
  } else {
    currentPage.value = p;
  }
  await nextTick();
  await renderizarPaginasActuales();
};

// SELECCIÓN DESDE EL ÍNDICE LATERAL DE 13 SECCIONES
const seleccionarSeccion = async (sec) => {
  seccionActivaCodigo.value = sec.codigo;

  // Si tenemos un mapa de páginas donde arranca esta sección en el master:
  const pages = seccionPageMap.value[sec.codigo];
  if (pages && pages.length > 0) {
    // Si estamos viendo el libro completo, saltar directo a esa hoja:
    if (tituloDocumento.value.includes('Completo') || tituloDocumento.value.includes('Libro')) {
      await goToPage(pages[0]);
      $q.notify({
        type: 'info',
        message: `Saltando a Sección ${sec.id}: ${sec.nombre} (Pág. ${pages[0]})`,
        timeout: 1000,
        dense: true
      });
      return;
    }
  }

  // De lo contrario, cargar el PDF recortado individual de esa sección:
  await cargarSeccionEspecifica(sec.codigo);
};

// MANEJO DE TECLADO (Flechas ← y →)
const handleKeydown = (e) => {
  if (!props.modelValue) return;
  if (e.key === 'ArrowRight' || e.key === 'PageDown') {
    nextPage();
  } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
    prevPage();
  } else if (e.key === 'Home') {
    goToPage(1);
  } else if (e.key === 'End') {
    goToPage(totalPages.value);
  }
};

// ZOOM
const zoomIn = () => {
  zoomScale.value = Math.min(2.0, +(zoomScale.value + 0.15).toFixed(2));
};

const zoomOut = () => {
  zoomScale.value = Math.max(0.4, +(zoomScale.value - 0.15).toFixed(2));
};

const resetZoom = () => {
  ajustarZoomOptimo();
};

const ajustarZoomOptimo = () => {
  // En modo libro en pantallas estándar, 0.85 a 0.95 luce como un libro real
  if (window.innerWidth < 1024) {
    zoomScale.value = 0.65;
  } else if (window.innerWidth < 1440) {
    zoomScale.value = viewMode.value === 'book' ? 0.82 : 0.95;
  } else {
    zoomScale.value = viewMode.value === 'book' ? 0.92 : 1.05;
  }
};

const onModeChange = async () => {
  ajustarZoomOptimo();
  await nextTick();
  await renderizarPaginasActuales();
};

// PANTALLA COMPLETA
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
    isFullscreen.value = true;
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    isFullscreen.value = false;
  }
};

// DESCARGAR / IMPRIMIR
const descargarPdf = () => {
  if (!currentBlob.value) {
    $q.notify({ type: 'warning', message: 'No hay archivo binario disponible para descargar' });
    return;
  }
  const url = URL.createObjectURL(currentBlob.value);
  const a = document.createElement('a');
  a.href = url;
  a.download = currentFilename.value || 'EXPEDIENTE.pdf';
  a.click();
  URL.revokeObjectURL(url);
};

const imprimirDocumento = () => {
  if (!currentBlob.value) {
    $q.notify({ type: 'warning', message: 'No hay archivo para imprimir' });
    return;
  }
  const url = URL.createObjectURL(currentBlob.value);
  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 1000);
  }
};

// CARGAR ARCHIVO PDF MANUALMENTE SI LO DESEA
const triggerFileInput = () => {
  fileInputRef.value?.click();
};

const handleFileInput = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    isLoading.value = true;
    currentBlob.value = file;
    currentFilename.value = file.name;
    const buf = await file.arrayBuffer();

    // Guardar como master PDF del empleado
    if (props.empleado?.id) {
      await saveMasterPdf(props.empleado.id, buf, {
        filename: file.name,
        pagesCount: 0
      });
    }

    await cargarPdfDesdeBuffer(buf, `Expediente: ${file.name}`);
    $q.notify({
      type: 'positive',
      message: 'PDF cargado y guardado como documento principal del empleado',
      icon: 'menu_book'
    });
  } catch (err) {
    console.error('Error cargando archivo manual:', err);
    $q.notify({ type: 'negative', message: 'Error al abrir el PDF seleccionado.' });
  } finally {
    isLoading.value = false;
  }
};

const onBackgroundClick = () => {
  // Opcional para cerrar sidebar si se hace click afuera en pantallas pequeñas
  if (window.innerWidth < 768 && showSidebar.value) {
    showSidebar.value = false;
  }
};

onMounted(() => {
  if (props.modelValue) {
    document.addEventListener('keydown', handleKeydown);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.visor-libro-dialog {
  user-select: none;
}

.book-icon-badge {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.viewer-viewport {
  position: relative;
  background-color: #0b1120;
  width: 100%;
  height: 100%;
  overflow: auto;
  perspective: 1200px;
}

/* Textura suave de escritorio para modo libro */
.book-desk-bg {
  background: radial-gradient(circle at center, #1e293b 0%, #0f172a 70%, #020617 100%);
}

/* CONTENEDOR DEL LIBRO (2 PÁGINAS) */
.book-spread-wrapper {
  transition: transform 0.2s ease-out;
  padding: 40px 60px;
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.book-binder-spread {
  display: flex;
  background: #ffffff;
  border-radius: 6px;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.75),
    0 0 0 1px rgba(0, 0, 0, 0.3),
    inset 0 0 40px rgba(0, 0, 0, 0.05);
  position: relative;
}

/* PÁGINAS IZQUIERDA Y DERECHA */
.book-page-left,
.book-page-right {
  background: #ffffff;
  position: relative;
  box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.02);
}

.book-page-left {
  border-top-left-radius: 6px;
  border-bottom-left-radius: 6px;
  /* Sombra sutil en el borde izquierdo simulando páginas inferiores */
  box-shadow:
    -4px 0 8px rgba(0, 0, 0, 0.15),
    inset -15px 0 20px rgba(0, 0, 0, 0.04);
}

.book-page-right {
  border-top-right-radius: 6px;
  border-bottom-right-radius: 6px;
  /* Sombra sutil en el borde derecho simulando páginas inferiores */
  box-shadow:
    4px 0 8px rgba(0, 0, 0, 0.15),
    inset 15px 0 20px rgba(0, 0, 0, 0.04);
}

/* LOMO / ESPINA CENTRAL CON PROFUNDIDAD 3D */
.book-spine-crease {
  width: 24px;
  background: linear-gradient(
    to right,
    rgba(0, 0, 0, 0.28) 0%,
    rgba(0, 0, 0, 0.15) 20%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(0, 0, 0, 0.15) 80%,
    rgba(0, 0, 0, 0.28) 100%
  );
  box-shadow:
    inset -2px 0 5px rgba(0, 0, 0, 0.4),
    inset 2px 0 5px rgba(0, 0, 0, 0.4);
  position: relative;
  z-index: 5;
}

.spine-line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
  background: rgba(0, 0, 0, 0.35);
}

/* PORTADA Y HOJA SIMPLE */
.book-cover-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.book-single-page {
  background: #ffffff;
  border-radius: 6px;
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(0, 0, 0, 0.2);
}

.single-page-wrapper {
  padding: 30px;
  transition: transform 0.2s ease-out;
  min-height: 100%;
}

.single-page-card {
  background: #ffffff;
  border-radius: 6px;
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(0, 0, 0, 0.2);
}

.page-canvas-rendered {
  display: block;
  max-width: 100%;
  height: auto;
}

/* NÚMEROS DE PÁGINA (FOLIOS) */
.book-page-folio {
  text-align: center;
  font-size: 11px;
  color: #64748b;
  padding: 6px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  border-radius: 0 0 6px 6px;
}

.book-page-folio-left {
  text-align: left;
  font-size: 11px;
  color: #64748b;
  padding: 6px 16px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  border-bottom-left-radius: 6px;
}

.book-page-folio-right {
  text-align: right;
  font-size: 11px;
  color: #64748b;
  padding: 6px 16px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  border-bottom-right-radius: 6px;
}

.book-blank-page {
  min-width: 480px;
  min-height: 680px;
  background: #f8fafc;
}

/* BOTONES FLOTANTES DE PASAR PÁGINA */
.book-nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fbbf24;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 30;
  transition: all 0.2s ease;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.6);
}

.book-nav-arrow:hover {
  background: #fbbf24;
  color: #0f172a;
  transform: translateY(-50%) scale(1.12);
  box-shadow: 0 15px 30px rgba(251, 191, 36, 0.4);
}

.book-nav-prev {
  left: 8px;
}

.book-nav-next {
  right: 8px;
}

/* SIDEBAR DE LAS 13 SECCIONES */
.sidebar-sections {
  width: 250px;
  background: #0f172a;
  z-index: 40;
}

.sidebar-section-item {
  border-radius: 6px;
  background: #1e293b;
  border: 1px solid #334155;
  transition: all 0.15s ease;
}

.sidebar-section-item:hover {
  background: #334155;
  border-color: #64748b;
}

.sidebar-section-item.item-active {
  background: #312e81;
  border-color: #818cf8;
}

.sidebar-section-item.item-has-pdf {
  border-left: 3px solid #fbbf24;
}

.sidebar-sec-num {
  font-family: monospace;
  font-weight: 800;
  font-size: 11px;
  background: #0f172a;
  color: #93c5fd;
  padding: 1px 4px;
  border-radius: 4px;
}

/* ANIMACIONES */
.slide-sidebar-enter-active,
.slide-sidebar-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.slide-sidebar-enter-from,
.slide-sidebar-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}
</style>
