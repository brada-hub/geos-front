<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
    class="visor-libro-dialog"
    @keydown.esc="cerrarVisor"
  >
    <q-card class="column no-wrap full-height bg-slate-950 text-white overflow-hidden">
      <!-- HEADER CONSOLA / BARRA DE HERRAMIENTAS RESPONSIVA -->
      <div class="row no-wrap items-center justify-between q-px-sm q-px-md-md q-py-xs bg-slate-900 border-bottom col-auto z-top shadow-3">
        <!-- IZQUIERDA: VOLVER + METADATOS COMPACTOS -->
        <div class="row no-wrap items-center q-gutter-x-xs q-gutter-x-sm-sm ellipsis" style="min-width: 0; max-width: 40%;">
          <q-btn
            flat
            dense
            no-caps
            icon="arrow_back"
            label="Volver"
            color="amber-4"
            class="text-weight-bold gt-xs"
            @click="cerrarVisor"
          >
            <q-tooltip>Volver al expediente (Esc)</q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            dense
            icon="arrow_back"
            color="amber-4"
            class="lt-sm"
            @click="cerrarVisor"
          />

          <div class="book-icon-badge flex flex-center gt-xs">
            <q-icon :name="viewMode === 'book' ? 'menu_book' : 'picture_as_pdf'" size="18px" color="amber-4" />
          </div>

          <div class="column justify-center ellipsis" style="min-width: 0;">
            <div class="row no-wrap items-center q-gutter-x-xs">
              <span class="text-weight-bolder text-white ellipsis text-caption" style="font-size: 13px;">
                {{ empleado?.nombre_completo || 'Expediente' }}
              </span>
              <q-badge color="indigo-7" class="text-weight-bold font-mono gt-sm" style="font-size: 10px;">
                {{ empleado?.codigo_archivo || `EXP-${empleado?.numero_unico || empleado?.id}` }}
              </q-badge>
            </div>
            <div class="text-caption text-slate-400 ellipsis font-mono" style="font-size: 10.5px;">
              {{ currentPage === 1 ? 'Portada / Carátula' : `Foja ${currentPage - 1} de ${pdfDocProxy?.numPages || 0}` }}
              <span v-if="pdfDocProxy" class="gt-xs">• {{ (pdfDocProxy?.numPages || 0) }} fojas digitalizadas</span>
            </div>
          </div>
        </div>

        <!-- CENTRO: NAVEGADOR DE PÁGINAS -->
        <div class="row no-wrap items-center q-gutter-x-xs bg-slate-950 q-px-sm q-py-xs rounded-borders border col-auto">
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
            <q-tooltip>Ir a la Carátula (Portada)</q-tooltip>
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

          <!-- INDICADOR VISUAL CLARO -->
          <div class="row items-center q-px-xs text-caption font-mono text-weight-bold text-center" style="min-width: 90px; justify-content: center;">
            <template v-if="currentPage === 1">
              <span class="text-amber-4">Carátula</span>
            </template>
            <template v-else-if="viewMode === 'book'">
              <span class="text-amber-4">Fojas {{ currentPage - 1 }} - {{ Math.min(currentPage, totalPages - 1) }}</span>
            </template>
            <template v-else>
              <span class="text-amber-4">Foja {{ currentPage - 1 }}</span>
            </template>
            <span class="text-slate-500 q-mx-xs">/</span>
            <span class="text-slate-300">{{ totalPages > 1 ? `${totalPages - 1} f.` : '1 p.' }}</span>
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

        <!-- DERECHA: CONMUTADORES, HERRAMIENTAS Y BOTÓN SALIR FIJO -->
        <div class="row no-wrap items-center q-gutter-x-xs col-auto" style="flex-shrink: 0;">
          <!-- MODO LIBRO VS MODO HOJA SIMPLE -->
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

          <!-- ZOOM -->
          <div class="row items-center q-gutter-x-none bg-slate-950 rounded-borders border gt-md">
            <q-btn flat dense icon="remove" size="xs" color="slate-300" @click="zoomOut">
              <q-tooltip>Reducir zoom</q-tooltip>
            </q-btn>
            <span class="text-caption font-mono q-px-xs" style="font-size: 11px; min-width: 38px; text-align: center;">
              {{ Math.round(zoomScale * 100) }}%
            </span>
            <q-btn flat dense icon="add" size="xs" color="slate-300" @click="zoomIn">
              <q-tooltip>Aumentar zoom</q-tooltip>
            </q-btn>
          </div>

          <!-- BOTÓN ÍNDICE -->
          <q-btn
            flat
            dense
            no-caps
            size="sm"
            color="amber-4"
            icon="format_list_bulleted"
            label="Índice"
            class="gt-xs"
            @click="showSidebar = !showSidebar"
          >
            <q-tooltip>Ver las 13 secciones del legajo</q-tooltip>
          </q-btn>

          <!-- BOTÓN MINIATURAS -->
          <q-btn
            flat
            dense
            no-caps
            size="sm"
            :color="showFilmstrip ? 'amber-4' : 'slate-400'"
            icon="view_carousel"
            label="Miniaturas"
            class="gt-sm"
            @click="toggleFilmstrip"
          >
            <q-tooltip>Mostrar / Ocultar carrusel inferior de páginas</q-tooltip>
          </q-btn>

          <!-- BOTÓN SALIR / CERRAR SIEMPRE VISIBLE Y DESTACADO -->
          <q-btn
            unelevated
            no-caps
            color="negative"
            text-color="white"
            icon="close"
            label="Cerrar"
            class="text-weight-bolder q-px-sm q-ml-xs shadow-2 exit-button-fixed"
            @click="cerrarVisor"
          >
            <q-tooltip>Cerrar visor (Esc)</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- ÁREA PRINCIPAL: VISOR Y SIDEBAR LATERAL -->
      <div class="col row no-wrap overflow-hidden relative-position">
        <!-- SIDEBAR: ÍNDICE DE LAS 13 SECCIONES -->
        <transition name="slide-sidebar">
          <div v-if="showSidebar" class="col-auto column no-wrap bg-slate-900 border-right sidebar-sections shadow-5">
            <div class="row items-center justify-between q-pa-sm bg-slate-950 border-bottom col-auto">
              <div class="row items-center q-gutter-x-xs">
                <q-icon name="bookmarks" size="18px" color="amber-4" />
                <span class="text-caption text-weight-bolder text-white">Índice del Legajo</span>
              </div>
              <q-btn flat round dense icon="chevron_left" size="xs" color="slate-400" @click="showSidebar = false" />
            </div>

            <!-- BOTÓN CARÁTULA EN EL ÍNDICE -->
            <div class="q-pa-xs">
              <div
                class="sidebar-section-item q-pa-xs cursor-pointer row items-center justify-between"
                :class="{ 'item-active': currentPage === 1 }"
                @click="goToPage(1)"
              >
                <div class="row items-center q-gutter-xs ellipsis">
                  <q-icon name="folder_shared" size="16px" color="amber-4" />
                  <span class="text-caption text-weight-bold text-slate-200">00. Carátula Oficial</span>
                </div>
                <q-badge color="amber-9" text-color="dark" label="Portada" class="text-weight-bold" />
              </div>
            </div>

            <q-scroll-area class="col q-px-xs">
              <div class="q-gutter-y-xs q-py-xs">
                <div
                  v-for="sec in secciones"
                  :key="sec.codigo"
                  class="sidebar-section-item q-pa-xs cursor-pointer row items-center justify-between"
                  :class="{
                    'item-active': seccionActivaCodigo === sec.codigo,
                    'item-has-pdf': pdfsDisponibles[sec.codigo]
                  }"
                  @click="cargarSeccionEspecifica(sec.codigo)"
                >
                  <div class="row items-center q-gutter-xs ellipsis col">
                    <span class="sidebar-sec-num">{{ String(sec.id).padStart(2, '0') }}</span>
                    <span class="sidebar-sec-name text-caption ellipsis text-slate-200" :title="sec.nombre">
                      {{ sec.nombre }}
                    </span>
                  </div>
                  <div class="row items-center q-gutter-xs">
                    <q-badge
                      v-if="sec.fojas > 0"
                      color="indigo-9"
                      text-color="white"
                      class="text-weight-bold"
                      style="font-size: 9.5px;"
                    >
                      {{ sec.fojas }} f.
                    </q-badge>
                    <q-icon
                      v-if="pdfsDisponibles[sec.codigo]"
                      name="description"
                      size="14px"
                      color="amber-4"
                      title="Tiene archivo PDF adjunto"
                    />
                  </div>
                </div>
              </div>
            </q-scroll-area>
          </div>
        </transition>

        <!-- VIEWPORT PRINCIPAL DEL LIBRO -->
        <div
          ref="viewerContainerRef"
          class="col viewer-viewport book-desk-bg flex flex-center relative-position"
          @click="onBackgroundClick"
        >
          <!-- SPINNER DE CARGA -->
          <div v-if="isLoading" class="absolute-full flex flex-center bg-slate-950 bg-opacity-80 z-top">
            <div class="column items-center q-gutter-y-sm">
              <q-spinner-dots size="56px" color="amber-4" />
              <div class="text-caption text-amber-3 font-mono text-weight-bold">
                Renderizando fojas en alta definición...
              </div>
            </div>
          </div>

          <!-- ========================================== -->
          <!-- PÁGINA 1: PORTADA / CARÁTULA OFICIAL FILE -->
          <!-- ========================================== -->
          <div
            v-if="currentPage === 1"
            class="book-spread-wrapper row items-center justify-center relative-position"
            :style="{ transform: `scale(${zoomScale})`, transformOrigin: 'center center' }"
          >
            <div class="book-cover-folder shadow-24 relative-position column justify-between">
              <!-- CABECERA INSTITUCIONAL CON BORDE DORADO -->
              <div class="cover-header-section q-pa-md text-center">
                <div class="row items-center justify-between q-mb-sm">
                  <div class="row items-center q-gutter-xs">
                    <img :src="docusLogo" alt="DOCUS" style="height: 34px;" />
                    <span class="text-weight-bolder text-amber-5 font-mono text-h6">DOCUS</span>
                  </div>
                  <div class="column items-end" style="line-height: 1.15;">
                    <span class="cover-inst-badge">ESTADO PLURINACIONAL DE BOLIVIA</span>
                    <span class="cover-sub-badge">RECURSOS HUMANOS • ARCHIVO CENTRAL</span>
                  </div>
                </div>

                <div class="cover-title-box q-py-xs">
                  <div class="cover-super-title">LEGAJO INSTITUCIONAL PERSONAL</div>
                  <div class="cover-main-title">CARÁTULA DE EXPEDIENTE</div>
                  <div class="cover-code-pill font-mono">
                    {{ empleado?.codigo_archivo || `EXP-${empleado?.numero_unico || empleado?.id}` }}
                  </div>
                </div>
              </div>

              <!-- CUERPO PRINCIPAL DE LA CARÁTULA -->
              <div class="cover-body-section q-px-lg q-py-sm col column justify-center">
                <!-- TARJETA FILIACIÓN DEL FUNCIONARIO -->
                <div class="cover-person-card q-pa-md row items-center q-gutter-md q-mb-sm">
                  <div class="cover-avatar-box flex flex-center">
                    <q-icon name="folder_shared" size="42px" color="amber-8" />
                  </div>
                  <div class="col" style="min-width: 0;">
                    <div class="cover-name-text ellipsis">{{ empleado?.nombre_completo }}</div>
                    <div class="cover-detail-row row items-center q-gutter-x-sm q-mt-xs">
                      <span><strong>C.I.:</strong> {{ empleado?.documento_identidad || 'Sin CI' }}</span>
                      <span>•</span>
                      <span><strong>Cargo:</strong> {{ empleado?.cargo || 'Funcionario Registrado' }}</span>
                    </div>
                    <div class="cover-detail-row row items-center q-gutter-x-sm q-mt-xs">
                      <q-badge color="indigo-9" text-color="white" class="text-weight-bold">
                        {{ empleado?.tipo_contrato?.nombre || 'Planta' }}
                      </q-badge>
                      <span v-if="empleado?.sede?.nombre">• Sede: {{ empleado?.sede?.nombre }}</span>
                    </div>
                    <div class="cover-location-badge q-mt-xs">
                      <q-icon name="inbox" size="13px" color="amber-9" class="q-mr-xs" />
                      <span><strong>Ubicación Archivística:</strong> {{ ubicacionTextoEmpleado }}</span>
                    </div>
                  </div>
                  <!-- CÓDIGO QR REAL DE VERIFICACIÓN -->
                  <div class="col-auto column items-center">
                    <img v-if="qrDataUrl" :src="qrDataUrl" class="cover-qr-img shadow-2" alt="QR" />
                    <span class="cover-qr-caption font-mono">VERIFICACIÓN QR</span>
                  </div>
                </div>

                <!-- ÍNDICE RESUMIDO DE LAS 13 SECCIONES DEL LEGAJO -->
                <div class="cover-sections-table q-pa-sm rounded-borders">
                  <div class="row items-center justify-between q-mb-xs q-px-xs">
                    <span class="cover-sections-header">REGISTRO DE SECCIONES DEL ARCHIVO</span>
                    <span class="cover-sections-badge">{{ resumenFile.totalFojas }} fojas físicas • {{ resumenFile.porcentaje }}% completitud</span>
                  </div>
                  <div class="row q-col-gutter-xs">
                    <div
                      v-for="sec in secciones"
                      :key="sec.codigo"
                      class="col-6"
                    >
                      <div class="cover-sec-mini-item row items-center justify-between q-px-xs">
                        <span class="ellipsis" style="font-size: 10px; max-width: 170px;">
                          {{ String(sec.id).padStart(2, '0') }}. {{ sec.nombre }}
                        </span>
                        <span class="cover-sec-fojas-badge">
                          {{ sec.fojas || 0 }} f.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- PIE DE CARÁTULA CON ACCIÓN PARA ENTRAR AL LEGAJO -->
              <div class="cover-footer-section q-pa-md row items-center justify-between">
                <div class="text-caption text-slate-500 font-mono" style="font-size: 10.5px;">
                  DOCUS RRHH • EXPEDIENTE DIGITALIZADO
                </div>
                <q-btn
                  unelevated
                  no-caps
                  color="amber-9"
                  text-color="dark"
                  icon-right="arrow_forward"
                  label="Abrir Fojas del Expediente"
                  class="text-weight-bolder cover-open-btn shadow-3"
                  @click="nextPage"
                />
              </div>
            </div>

            <!-- FLECHA SIGUIENTE FLOTANTE -->
            <button
              v-if="totalPages > 1"
              class="book-nav-arrow book-nav-next"
              title="Abrir expediente (Pág. siguiente →)"
              @click.stop="nextPage"
            >
              <q-icon name="chevron_right" size="32px" />
            </button>
          </div>

          <!-- ========================================== -->
          <!-- PÁGINAS 2+: DOCUMENTOS DIGITALES ADJUNTOS -->
          <!-- ========================================== -->
          <!-- MODO LIBRO (2 PÁGINAS LADO A LADO) -->
          <div
            v-else-if="viewMode === 'book'"
            class="book-spread-wrapper row items-center justify-center relative-position"
            :style="{ transform: `scale(${zoomScale})`, transformOrigin: 'center center' }"
          >
            <!-- BOTÓN FLOTANTE ANTERIOR (IZQUIERDA) -->
            <button
              class="book-nav-arrow book-nav-prev"
              title="Página anterior (←)"
              @click.stop="prevPage"
            >
              <q-icon name="chevron_left" size="32px" />
            </button>

            <!-- ENCUADERNACIÓN 2 PÁGINAS -->
            <div class="book-binder-spread row no-wrap items-stretch shadow-24">
              <!-- HOJA IZQUIERDA -->
              <div class="book-page-left column relative-position">
                <canvas id="page-canvas-left" class="page-canvas-rendered"></canvas>
                <div class="book-page-folio-left font-mono">
                  Foja {{ currentPage - 1 }}
                </div>
              </div>

              <!-- LOMO / ESPINA CENTRAL CON SOMBRA 3D -->
              <div class="book-spine-crease">
                <div class="spine-line"></div>
              </div>

              <!-- HOJA DERECHA -->
              <div class="book-page-right column relative-position">
                <canvas
                  v-if="currentPage <= totalPages - 1"
                  id="page-canvas-right"
                  class="page-canvas-rendered"
                ></canvas>
                <div v-else class="book-blank-page flex flex-center text-slate-400">
                  <div class="column items-center q-gutter-xs">
                    <q-icon name="done_all" size="36px" color="slate-400" />
                    <div class="text-caption text-italic text-weight-bold">Fin de las fojas digitalizadas</div>
                    <div class="text-caption text-slate-400" style="font-size: 10px;">Expediente archivado conforme a ley</div>
                  </div>
                </div>
                <div v-if="currentPage <= totalPages - 1" class="book-page-folio-right font-mono">
                  Foja {{ currentPage }}
                </div>
              </div>
            </div>

            <!-- BOTÓN FLOTANTE SIGUIENTE (DERECHA) -->
            <button
              v-if="currentPage < totalPages"
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
            <button
              class="book-nav-arrow book-nav-prev"
              title="Página anterior (←)"
              @click.stop="prevPage"
            >
              <q-icon name="chevron_left" size="32px" />
            </button>

            <div class="single-page-card shadow-12 relative-position">
              <canvas id="page-canvas-single" class="page-canvas-rendered"></canvas>
              <div class="book-page-folio font-mono">
                Foja {{ currentPage - 1 }} de {{ totalPages - 1 }}
              </div>
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

      <!-- CINTA INFERIOR DE MINIATURAS (FILMSTRIP) -->
      <transition name="slide-up">
        <div v-if="showFilmstrip" class="filmstrip-drawer row no-wrap items-center q-px-sm q-py-xs bg-slate-900 border-top col-auto z-top shadow-8">
          <div class="row items-center no-wrap q-gutter-x-sm scroll full-width filmstrip-scroll-area">
            <!-- MINIATURA 1: CARÁTULA -->
            <div
              class="filmstrip-item column items-center cursor-pointer"
              :class="{ 'filmstrip-active': currentPage === 1 }"
              @click="goToPage(1)"
            >
              <div class="filmstrip-thumb-box flex flex-center bg-amber-9 text-dark text-weight-bolder">
                <q-icon name="folder_shared" size="26px" color="amber-1" />
              </div>
              <span class="filmstrip-num font-mono">Carátula</span>
            </div>

            <!-- MINIATURAS 2..N: FOJAS DEL PDF -->
            <div
              v-for="p in (pdfDocProxy?.numPages || 0)"
              :key="p"
              class="filmstrip-item column items-center cursor-pointer"
              :class="{
                'filmstrip-active': viewMode === 'book' ? (currentPage === p + 1 || (currentPage > 1 && currentPage === p)) : currentPage === p + 1
              }"
              @click="goToPage(p + 1)"
            >
              <div class="filmstrip-thumb-box flex flex-center">
                <canvas :id="`filmstrip-canvas-${p}`" class="filmstrip-canvas"></canvas>
              </div>
              <span class="filmstrip-num font-mono">Foja {{ p }}</span>
            </div>
          </div>
        </div>
      </transition>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useQuasar } from 'quasar';
import * as pdfjsLib from 'pdfjs-dist';
import QRCode from 'qrcode';
import docusLogo from 'src/assets/docus-app-icon.png';
import {
  getEmpleadoSecciones,
  calcularResumenFile,
  SECCIONES_FILE_DEFAULT
} from 'src/utils/fileSectionsHelper';
import {
  getMasterPdf,
  getSectionPdf,
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
    type: Object,
    default: null
  }
});

const emit = defineEmits(['update:modelValue']);
const $q = useQuasar();

// Estado del visor
const isLoading = ref(false);
const viewMode = ref('book'); // 'book' (2 páginas) | 'single' (1 página)
const zoomScale = ref(1.0);
const showSidebar = ref(false);
const showFilmstrip = ref(true);
const viewerContainerRef = ref(null);

// Datos del documento
const totalPages = ref(1); // Mínimo 1 por la Carátula
const currentPage = ref(1); // 1 = Carátula, 2 = Foja 1, 3 = Foja 2...
const tituloDocumento = ref('Libro de Expediente');
let pdfDocProxy = ref(null);
const qrDataUrl = ref('');

// Metadatos de secciones
const secciones = ref(JSON.parse(JSON.stringify(SECCIONES_FILE_DEFAULT)));
const pdfsDisponibles = ref({});
const seccionActivaCodigo = ref(null);

const resumenFile = computed(() => {
  return calcularResumenFile(secciones.value);
});

const ubicacionTextoEmpleado = computed(() => {
  if (!props.empleado) return 'Sin asignar';
  if (props.empleado.cajon) {
    const c = props.empleado.cajon;
    const colText = c.columna === 1 ? '' : `Col ${String.fromCharCode(64 + c.columna)} • `;
    return `${c.mueble?.nombre || 'Archivador'} • ${colText}Gaveta ${c.fila}`;
  }
  return 'Gaveta Virtual (Sin asignar a mueble físico)';
});

const cerrarVisor = () => {
  emit('update:modelValue', false);
};

// Generar QR de la Carátula
const generarQrCaratula = async () => {
  if (!props.empleado) return;
  try {
    const payload = JSON.stringify({
      id: props.empleado.id,
      codigo: props.empleado.codigo_archivo,
      ci: props.empleado.documento_identidad,
      empleado: props.empleado.nombre_completo,
      sede: props.empleado.sede?.nombre
    });
    qrDataUrl.value = await QRCode.toDataURL(payload, {
      width: 140,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' }
    });
  } catch (err) {
    console.warn('Error generando QR de carátula:', err);
  }
};

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
  totalPages.value = 1;
  currentPage.value = 1;
};

// Inicializar y cargar el documento correspondiente
const inicializarVisor = async () => {
  if (!props.empleado?.id) return;
  isLoading.value = true;
  currentPage.value = 1;

  try {
    secciones.value = getEmpleadoSecciones(props.empleado.id);
    pdfsDisponibles.value = await getEmpleadoPdfsMap(props.empleado.id);
    await generarQrCaratula();

    // Caso 1: Se pasó un código de sección específico
    if (props.seccionCodigoInicial) {
      await cargarSeccionEspecifica(props.seccionCodigoInicial);
    }
    // Caso 2: Se pasó un buffer directamente por prop
    else if (props.pdfDataBuffer) {
      await cargarPdfDesdeBuffer(props.pdfDataBuffer, 'Expediente Completo');
    }
    // Caso 3: Buscar si hay Master PDF guardado en Supabase / IndexedDB
    else {
      const master = await getMasterPdf(props.empleado.id);
      if (master && master.blob) {
        tituloDocumento.value = 'Expediente Completo Digital (Modo Libro)';
        const buf = await master.blob.arrayBuffer();
        await cargarPdfDesdeBuffer(buf, tituloDocumento.value);
      } else {
        // Si no hay master, buscar si hay al menos una sección con PDF para abrirla
        const codigosConPdf = Object.keys(pdfsDisponibles.value);
        if (codigosConPdf.length > 0) {
          await cargarSeccionEspecifica(codigosConPdf[0]);
        } else {
          totalPages.value = 1; // Solo carátula
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
    const buf = await record.blob.arrayBuffer();
    await cargarPdfDesdeBuffer(buf, tituloDocumento.value);
  } else {
    $q.notify({ type: 'info', message: `La sección "${sec?.nombre || codigo}" no tiene archivo digital adjunto aún.` });
  }
};

const cargarPdfDesdeBuffer = async (buffer, titulo = 'Documento PDF') => {
  try {
    isLoading.value = true;
    tituloDocumento.value = titulo;

    // Cargar con PDF.js
    const proxy = await pdfjsLib.getDocument({ data: buffer }).promise;
    pdfDocProxy.value = proxy;
    // Total de páginas = 1 (Carátula) + páginas del PDF
    totalPages.value = proxy.numPages + 1;
    currentPage.value = 1;

    ajustarZoomOptimo();

    await nextTick();
    if (showFilmstrip.value) {
      renderFilmstrip();
    }
  } catch (error) {
    console.error('Error cargando PDF en PDF.js:', error);
    $q.notify({ type: 'negative', message: 'Error procesando páginas del PDF.' });
  } finally {
    isLoading.value = false;
  }
};

const toggleFilmstrip = async () => {
  showFilmstrip.value = !showFilmstrip.value;
  if (showFilmstrip.value) {
    await nextTick();
    renderFilmstrip();
  }
};

const renderFilmstrip = async () => {
  if (!pdfDocProxy.value || !showFilmstrip.value) return;
  await nextTick();
  await new Promise((r) => setTimeout(r, 150));

  for (let i = 1; i <= pdfDocProxy.value.numPages; i++) {
    try {
      const page = await pdfDocProxy.value.getPage(i);
      const canvas = document.getElementById(`filmstrip-canvas-${i}`);
      if (canvas) {
        const viewport = page.getViewport({ scale: 0.16 });
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: context, viewport }).promise;
      }
    } catch {
      // Ignorar error individual en miniatura
    }
  }
};

// Renderizado con alta nitidez (Retina / HiDPI seguro)
const renderizarPaginasActuales = async () => {
  if (!pdfDocProxy.value) return;

  if (currentPage.value === 1) {
    // La carátula se renderiza con HTML vectorial, no necesita canvas
    return;
  }

  await nextTick();

  if (viewMode.value === 'book') {
    // Modo libro: Pág izquierda = currentPage - 1
    const leftPdfPage = currentPage.value - 1;
    await renderizarCanvas('page-canvas-left', leftPdfPage);

    // Pág derecha = currentPage
    const rightPdfPage = currentPage.value;
    if (rightPdfPage <= pdfDocProxy.value.numPages) {
      await renderizarCanvas('page-canvas-right', rightPdfPage);
    }
  } else {
    // Modo página simple
    const pdfPage = currentPage.value - 1;
    await renderizarCanvas('page-canvas-single', pdfPage);
  }
};

const renderizarCanvas = async (canvasId, pdfPageNum) => {
  if (!pdfDocProxy.value || pdfPageNum < 1 || pdfPageNum > pdfDocProxy.value.numPages) return;
  try {
    const page = await pdfDocProxy.value.getPage(pdfPageNum);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const baseScale = 1.35;
    const scale = baseScale * dpr;
    const viewport = page.getViewport({ scale });

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    canvas.style.width = `${Math.floor(viewport.width / dpr)}px`;
    canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;

    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;
  } catch (err) {
    console.error(`Error renderizando canvas ${canvasId} en pág ${pdfPageNum}:`, err);
  }
};

// NAVEGACIÓN
const nextPage = async () => {
  if (viewMode.value === 'book') {
    if (currentPage.value === 1) {
      currentPage.value = 2; // Salta de Carátula a fojas 1 y 2
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
      currentPage.value = 1; // Vuelve a la Carátula
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

const goToPage = async (page) => {
  let target = Math.max(1, Math.min(page, totalPages.value));
  // En modo libro, si la página es par (excepto 1), alinear a la apertura del par
  if (viewMode.value === 'book' && target > 1 && target % 2 !== 0 && target > 2) {
    target = target - 1;
  }
  currentPage.value = target;
  await nextTick();
  await renderizarPaginasActuales();
};

const onModeChange = async () => {
  await nextTick();
  ajustarZoomOptimo();
  await renderizarPaginasActuales();
};

// ZOOM
const zoomIn = () => {
  zoomScale.value = Math.min(2.0, +(zoomScale.value + 0.1).toFixed(2));
};

const zoomOut = () => {
  zoomScale.value = Math.max(0.5, +(zoomScale.value - 0.1).toFixed(2));
};

const ajustarZoomOptimo = () => {
  const w = window.innerWidth;
  if (w < 768) {
    zoomScale.value = 0.65;
  } else if (w < 1200) {
    zoomScale.value = 0.82;
  } else {
    zoomScale.value = 0.95;
  }
};

// TECLADO
const handleKeydown = (e) => {
  if (e.key === 'ArrowRight' || e.key === 'PageDown') {
    nextPage();
  } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
    prevPage();
  } else if (e.key === 'Escape') {
    cerrarVisor();
  }
};

const onBackgroundClick = () => {
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
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.exit-button-fixed {
  flex-shrink: 0;
  white-space: nowrap;
}

.viewer-viewport {
  position: relative;
  background-color: #0b1120;
  width: 100%;
  height: 100%;
  overflow: auto;
  perspective: 1200px;
}

.book-desk-bg {
  background: radial-gradient(circle at center, #1e293b 0%, #0f172a 70%, #020617 100%);
}

.book-spread-wrapper {
  transition: transform 0.2s ease-out;
  padding: 20px 40px;
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ========================================= */
/* CARÁTULA OFICIAL DEL EXPEDIENTE (PÁG 1)   */
/* ========================================= */
.book-cover-folder {
  width: 540px;
  min-height: 760px;
  background: #fdfbf7;
  color: #0f172a;
  border-radius: 8px;
  border: 3px double #d97706;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.75),
    0 0 0 1px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
}

.cover-header-section {
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  color: #ffffff;
  border-bottom: 2px solid #f59e0b;
}

.cover-inst-badge {
  font-size: 11px;
  font-weight: 900;
  color: #fbbf24;
  letter-spacing: 0.05em;
}

.cover-sub-badge {
  font-size: 9.5px;
  color: #94a3b8;
  letter-spacing: 0.03em;
}

.cover-super-title {
  font-size: 11px;
  font-weight: 700;
  color: #cbd5e1;
  letter-spacing: 0.08em;
}

.cover-main-title {
  font-size: 20px;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: 0.03em;
  margin: 2px 0;
}

.cover-code-pill {
  display: inline-block;
  background: #f59e0b;
  color: #0f172a;
  font-size: 12px;
  font-weight: 900;
  padding: 2px 12px;
  border-radius: 999px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
}

.cover-person-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.cover-avatar-box {
  width: 58px;
  height: 58px;
  border-radius: 8px;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.cover-name-text {
  font-size: 16px;
  font-weight: 900;
  color: #0f172a;
  line-height: 1.2;
}

.cover-detail-row {
  font-size: 11.5px;
  color: #334155;
}

.cover-location-badge {
  font-size: 11px;
  background: #f8fafc;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 2px 6px;
  display: inline-flex;
  align-items: center;
}

.cover-qr-img {
  width: 72px;
  height: 72px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

.cover-qr-caption {
  font-size: 8px;
  font-weight: 800;
  color: #64748b;
  margin-top: 2px;
}

.cover-sections-table {
  background: #ffffff;
  border: 1px solid #e2e8f0;
}

.cover-sections-header {
  font-size: 10px;
  font-weight: 800;
  color: #475569;
  letter-spacing: 0.05em;
}

.cover-sections-badge {
  font-size: 10px;
  font-weight: 800;
  color: #d97706;
}

.cover-sec-mini-item {
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 4px;
  padding: 2px 4px;
}

.cover-sec-fojas-badge {
  font-size: 9px;
  font-weight: 800;
  color: #1e40af;
  background: #eff6ff;
  border-radius: 3px;
  padding: 1px 4px;
}

.cover-footer-section {
  background: #f1f5f9;
  border-top: 1px solid #e2e8f0;
}

.cover-open-btn {
  font-size: 12px;
}

/* ========================================= */
/* ENCUADERNACIÓN 2 PÁGINAS (FOJAS DEL LEGAJO)*/
/* ========================================= */
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

.book-page-left,
.book-page-right {
  background: #ffffff;
  position: relative;
  box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.02);
}

.book-page-left {
  border-top-left-radius: 6px;
  border-bottom-left-radius: 6px;
  box-shadow:
    -4px 0 8px rgba(0, 0, 0, 0.15),
    inset -15px 0 20px rgba(0, 0, 0, 0.04);
}

.book-page-right {
  border-top-right-radius: 6px;
  border-bottom-right-radius: 6px;
  box-shadow:
    4px 0 8px rgba(0, 0, 0, 0.15),
    inset 15px 0 20px rgba(0, 0, 0, 0.04);
}

.book-spine-crease {
  width: 22px;
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

.page-canvas-rendered {
  display: block;
  max-width: 100%;
}

.book-page-folio-left,
.book-page-folio-right,
.book-page-folio {
  font-size: 11px;
  color: #94a3b8;
  padding: 4px 10px;
  text-align: center;
  border-top: 1px solid #f1f5f9;
  background: #ffffff;
}

.book-blank-page {
  width: 480px;
  height: 680px;
  background: #fafafa;
}

.book-nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.75);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 30;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
  transition: all 0.2s ease;
}

.book-nav-arrow:hover {
  background: #f59e0b;
  color: #0f172a;
  transform: translateY(-50%) scale(1.1);
}

.book-nav-prev {
  left: 8px;
}

.book-nav-next {
  right: 8px;
}

/* HOJA SIMPLE */
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

/* FILMSTRIP (CARRUSEL INFERIOR) */
.filmstrip-drawer {
  height: 115px;
  background: #090d16;
  border-top: 1px solid #1e293b;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.filmstrip-scroll-area {
  padding-bottom: 4px;
}

.filmstrip-item {
  flex-shrink: 0;
  padding: 4px;
  border-radius: 6px;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  user-select: none;
}

.filmstrip-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: #475569;
}

.filmstrip-item.filmstrip-active {
  background: rgba(251, 191, 36, 0.1);
  border-color: #fbbf24;
}

.filmstrip-thumb-box {
  width: 58px;
  height: 74px;
  background: #1e293b;
  border-radius: 3px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0,0,0,0.4);
}

.filmstrip-canvas {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.filmstrip-num {
  font-size: 10px;
  font-weight: 700;
  color: #94a3b8;
  margin-top: 3px;
}

.filmstrip-active .filmstrip-num {
  color: #fbbf24;
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

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
