<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" persistent>
    <q-card style="min-width: 580px; max-width: 820px; width: 95vw; max-height: 90vh;" class="column no-wrap">
      <!-- HEADER CON DATOS DEL TRABAJADOR -->
      <q-card-section class="bg-primary text-white col-auto q-py-sm">
        <div class="row items-center justify-between no-wrap">
          <div class="row items-center no-wrap">
            <div class="kardex-numero-big q-mr-md">{{ kardex?.numero_unico || kardex?.id }}</div>
            <div>
              <div class="text-h6 text-weight-bolder">{{ kardex?.nombre_completo }}</div>
              <div class="row items-center q-gutter-x-sm text-caption q-mt-xs">
                <span><strong>Código:</strong> {{ kardex?.codigo_archivo }}</span>
                <span v-if="kardex?.documento_identidad">• <strong>CI:</strong> {{ kardex?.documento_identidad }}</span>
                <span v-if="kardex?.cargo">• <strong>Cargo:</strong> {{ kardex?.cargo }}</span>
              </div>
              <div class="row items-center q-gutter-x-sm q-mt-xs">
                <q-badge
                  v-if="kardex?.tipo_contrato"
                  :color="kardex.tipo_contrato.color || 'primary'"
                  text-color="white"
                  class="text-weight-bold"
                >
                  {{ kardex.tipo_contrato.nombre }}
                </q-badge>
                <span v-if="kardex?.sede?.nombre" class="text-caption text-blue-grey-1">
                  Sede: {{ kardex?.sede?.nombre }}
                </span>
                <q-badge
                  :color="kardex?.estado === 0 ? 'primary' : kardex?.estado === 1 ? 'negative' : 'slate-7'"
                  text-color="white"
                  class="text-weight-bold"
                >
                  {{ kardex?.estado === 0 ? 'PRESENTE EN GAVETA' : kardex?.estado === 1 ? 'AUSENTE' : 'PRESTADO' }}
                </q-badge>
              </div>
            </div>
          </div>
          <div class="row items-center q-gutter-xs">
            <q-btn
              unelevated
              size="sm"
              icon="menu_book"
              label="Ver como Libro"
              color="white"
              text-color="primary"
              class="text-weight-bold"
              @click="abrirVisorLibroCompleto"
            >
              <q-tooltip>Abrir y ojear el expediente completo como un libro digital / cartapacio</q-tooltip>
            </q-btn>
            <q-btn
              flat
              size="sm"
              icon="label"
              label="Rótulo Folder"
              color="white"
              class="text-weight-bold"
              @click="showRotulo = true"
            >
              <q-tooltip>Imprimir rótulo adhesivo con Código QR para la carpeta física</q-tooltip>
            </q-btn>
            <q-btn
              flat
              size="sm"
              icon="print"
              label="Ficha A4"
              color="white"
              class="text-weight-bold"
              @click="showFicha = true"
            >
              <q-tooltip>Imprimir ficha oficial con las 13 secciones</q-tooltip>
            </q-btn>
            <q-btn icon="close" flat round @click="$emit('update:modelValue', false)" />
          </div>
        </div>
      </q-card-section>

      <!-- BARRA DE PESTAÑAS (13 SECCIONES VS MOVIMIENTOS) -->
      <q-tabs
        v-model="activeTab"
        dense
        class="bg-slate-100 text-slate-700 border-bottom col-auto"
        active-color="primary"
        indicator-color="primary"
        align="justify"
      >
        <q-tab name="secciones" icon="folder_open" label="File Físico (13 Secciones)">
          <q-badge
            :color="resumenFile.porcentaje >= 75 ? 'positive' : 'warning'"
            floating
            class="text-weight-bold"
            style="top: 4px; right: 8px;"
          >
            {{ resumenFile.porcentaje }}%
          </q-badge>
        </q-tab>
        <q-tab name="movimientos" icon="history" label="Movimientos & Estado" />
      </q-tabs>

      <!-- CONTENIDO DE PESTAÑAS (SCROLLABLE) -->
      <q-tab-panels v-model="activeTab" animated class="col scroll q-pa-none">
        
        <!-- PESTAÑA 1: AUDITORÍA DE LAS 13 SECCIONES FÍSICAS -->
        <q-tab-panel name="secciones" class="q-pa-md">
          <!-- PANEL RESUMEN DE AUDITORÍA -->
          <div class="audit-summary-box q-pa-sm q-mb-md">
            <div class="row items-center justify-between q-col-gutter-sm">
              <div class="col-12 col-sm-6">
                <div class="row items-center justify-between text-caption q-mb-xs">
                  <span class="text-weight-bold text-slate-700">Completitud del Legajo Físico:</span>
                  <span class="text-weight-bolder text-primary" style="font-size: 13px;">
                    {{ resumenFile.porcentaje }}%
                  </span>
                </div>
                <q-linear-progress
                  :value="resumenFile.porcentaje / 100"
                  rounded
                  :color="resumenFile.porcentaje >= 75 ? 'primary' : 'slate-6'"
                  track-color="grey-3"
                  style="height: 8px; border-radius: 999px;"
                />
              </div>

              <div class="col-12 col-sm-6 row justify-end q-gutter-x-sm">
                <div class="metric-pill">
                  <span class="metric-lbl">Total Fojas:</span>
                  <b class="text-primary font-mono">{{ resumenFile.totalFojas }}</b>
                </div>
                <div class="metric-pill">
                  <span class="metric-lbl">Archivadas:</span>
                  <b class="text-positive font-mono">{{ resumenFile.presentes }} / 13</b>
                </div>
                <div class="metric-pill" v-if="resumenFile.pendientes > 0">
                  <span class="metric-lbl">Faltantes:</span>
                  <b class="text-negative font-mono">{{ resumenFile.pendientes }}</b>
                </div>
              </div>
            </div>

            <div class="row items-center justify-between q-mt-sm border-top q-pt-xs">
              <div class="text-caption text-slate-600">
                Dictamen: <b class="text-slate-800">{{ resumenFile.estadoGeneral }}</b>
              </div>
              <div class="row q-gutter-xs">
                <q-btn
                  dense
                  no-caps
                  unelevated
                  color="primary"
                  icon="menu_book"
                  label="Ver como Libro"
                  class="q-px-sm text-weight-bold"
                  size="sm"
                  @click="abrirVisorLibroCompleto"
                >
                  <q-tooltip>Abrir visor interactivo en modo libro / cartapacio</q-tooltip>
                </q-btn>

                <q-btn
                  dense
                  no-caps
                  outline
                  color="primary"
                  icon="content_cut"
                  label="Desglosar PDF"
                  class="q-px-sm text-weight-bold"
                  size="sm"
                  @click="showDesglosador = true"
                >
                  <q-tooltip>Cargar un PDF escaneado completo y clasificarlo en las 13 secciones</q-tooltip>
                </q-btn>

                <q-btn
                  dense
                  no-caps
                  flat
                  color="primary"
                  icon="cloud_sync"
                  label="Sincronizar Nube"
                  :loading="isSyncingCloud"
                  class="q-px-sm text-weight-bold"
                  size="sm"
                  @click="forzarSincronizacionNube"
                >
                  <q-tooltip>Verificar y respaldar todos los archivos locales en Supabase Cloud Storage</q-tooltip>
                </q-btn>

                <q-btn
                  dense
                  no-caps
                  unelevated
                  color="primary"
                  icon="save"
                  label="Guardar"
                  class="q-px-sm text-weight-bold"
                  size="sm"
                  @click="guardarSecciones"
                />
                <q-btn
                  dense
                  no-caps
                  flat
                  color="slate-600"
                  icon="refresh"
                  label="Restablecer"
                  size="sm"
                  @click="restablecerSecciones"
                />
              </div>
            </div>
          </div>

          <!-- LISTA DE LAS 13 SECCIONES -->
          <div class="q-gutter-y-xs">
            <div
              v-for="sec in secciones"
              :key="sec.id"
              class="seccion-item-row row items-center justify-between q-pa-sm"
              :class="{
                'sec-presente': sec.estado === 'presente',
                'sec-pendiente': sec.estado === 'pendiente',
                'sec-noaplica': sec.estado === 'no_aplica'
              }"
            >
              <!-- NÚMERO Y TÍTULO -->
              <div class="col-12 col-md-5 q-pr-sm">
                <div class="row items-center no-wrap">
                  <span class="sec-number-badge q-mr-sm">{{ String(sec.id).padStart(2, '0') }}</span>
                  <div class="ellipsis">
                    <div class="text-weight-bold text-slate-900" style="font-size: 12.5px;">
                      {{ sec.nombre }}
                    </div>
                    <div class="text-caption text-slate-500 ellipsis" style="font-size: 10.5px;">
                      {{ sec.descripcion }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- SELECTOR DE ESTADO (PRESENTE / PENDIENTE / NO APLICA) -->
              <div class="col-6 col-md-3 row items-center justify-center q-gutter-x-xs">
                <q-btn-toggle
                  v-model="sec.estado"
                  dense
                  no-caps
                  unelevated
                  toggle-color="primary"
                  size="xs"
                  class="custom-btn-toggle"
                  :options="[
                    { label: 'Presente', value: 'presente', icon: 'check_circle' },
                    { label: 'Pendiente', value: 'pendiente', icon: 'error_outline' },
                    { label: 'N/A', value: 'no_aplica' }
                  ]"
                />
              </div>

              <!-- CONTADOR DE FOJAS Y OBSERVACIÓN -->
              <div class="col-6 col-md-4 row items-center justify-end q-gutter-x-xs">
                <q-input
                  v-model.number="sec.fojas"
                  type="number"
                  dense
                  outlined
                  min="0"
                  class="fojas-input"
                  style="width: 75px;"
                  suffix="fojas"
                >
                  <q-tooltip>Cantidad de hojas físicas archivadas</q-tooltip>
                </q-input>

                <q-input
                  v-model="sec.observacion"
                  dense
                  outlined
                  placeholder="Observación..."
                  class="obs-input"
                  style="width: 140px; font-size: 11px;"
                >
                  <q-tooltip>Detalle o número de documento de respaldo</q-tooltip>
                </q-input>

                <!-- BADGE ESTADO NUBE / LOCAL -->
                <q-badge
                  v-if="pdfsMap[sec.codigo]"
                  color="slate-800"
                  text-color="white"
                  class="q-mr-xs text-weight-bold"
                  style="font-size: 9.5px;"
                >
                  <q-icon :name="pdfsMap[sec.codigo]?.isCloud ? 'cloud_done' : 'save'" size="10px" class="q-mr-xs" />
                  {{ pdfsMap[sec.codigo]?.isCloud ? 'Nube' : 'Local' }}
                </q-badge>

                <!-- BOTÓN PARA PREVISUALIZAR EL PDF DE ESTA SECCIÓN -->
                <q-btn
                  v-if="pdfsMap[sec.codigo]"
                  flat
                  round
                  dense
                  size="sm"
                  icon="visibility"
                  color="primary"
                  @click="previsualizarPdfSeccion(sec.codigo)"
                >
                  <q-tooltip>Previsualizar PDF interactivo de esta sección ({{ pdfsMap[sec.codigo]?.pagesCount || 0 }} fojas)</q-tooltip>
                </q-btn>

                <!-- BOTÓN PARA ADJUNTAR O SUMAR FOJAS DIRECTAMENTE A ESTA SECCIÓN -->
                <q-btn
                  flat
                  round
                  dense
                  size="sm"
                  icon="note_add"
                  color="primary"
                  @click="iniciarSubidaSeccion(sec)"
                >
                  <q-tooltip>
                    {{ pdfsMap[sec.codigo] ? `Anexar / sumar más fojas a ${sec.nombre}` : `Adjuntar PDF a ${sec.nombre}` }}
                  </q-tooltip>
                </q-btn>
              </div>
            </div>
          </div>
        </q-tab-panel>

        <!-- PESTAÑA 2: MOVIMIENTOS & ESTADO -->
        <q-tab-panel name="movimientos" class="q-pa-md">
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-6">
              <q-select
                v-model="localEstado"
                :options="estadoOptions"
                emit-value
                map-options
                outlined
                dense
                label="Estado actual del expediente"
              />
            </div>
            <div class="col-6">
              <q-input v-model="comentario" outlined dense label="Comentario del movimiento" />
            </div>
          </div>

          <q-btn
            color="primary"
            unelevated
            label="Registrar Movimiento"
            @click="registrarMovimiento"
            :loading="loading"
            class="q-mb-md"
          />

          <q-separator class="q-my-md" />

          <div class="text-subtitle1 text-weight-bold q-mb-sm">Historial Cronológico de Movimientos</div>

          <q-timeline color="primary" dense>
            <q-timeline-entry
              v-for="mov in historial"
              :key="mov.id"
              :icon="getMovIcon(mov)"
              :color="getMovColor(mov)"
              :subtitle="formatDate(mov.created_at)"
            >
              <template v-slot:title>
                <div class="row items-center q-gutter-xs">
                  <span class="text-weight-bold">{{ getMovTitle(mov) }}</span>
                </div>
              </template>

              <div v-if="mov.comentario" class="text-body2 text-grey-8 q-my-xs">
                {{ mov.comentario }}
              </div>

              <!-- DETALLES DE UBICACIÓN ORIGEN / DESTINO -->
              <div v-if="mov.tipo_movimiento === 'ubicacion' && (mov.cajon_origen || mov.cajon_destino)" class="q-mt-xs bg-grey-2 q-pa-xs rounded-borders text-caption text-grey-8">
                <span v-if="mov.cajon_origen">
                  <strong>Origen:</strong> Gaveta F{{ mov.cajon_origen.fila }}-C{{ mov.cajon_origen.columna }} ({{ mov.cajon_origen.mueble?.nombre || 'Archivador' }})
                </span>
                <span v-if="mov.cajon_origen && mov.cajon_destino"> ➔ </span>
                <span v-if="mov.cajon_destino">
                  <strong>Destino:</strong> Gaveta F{{ mov.cajon_destino.fila }}-C{{ mov.cajon_destino.columna }} ({{ mov.cajon_destino.mueble?.nombre || 'Archivador' }})
                </span>
              </div>

              <!-- DETALLES DE CONTRATO ANTERIOR / NUEVO -->
              <div v-if="mov.tipo_movimiento === 'contrato' && (mov.tipo_contrato_anterior || mov.tipo_contrato_nuevo)" class="q-mt-xs text-caption">
                <q-badge color="grey-6" text-color="white" class="q-mr-xs">
                  {{ mov.tipo_contrato_anterior?.nombre || 'Sin contrato previo' }}
                </q-badge>
                <span>➔</span>
                <q-badge :color="mov.tipo_contrato_nuevo?.color || 'primary'" text-color="white" class="q-ml-xs">
                  {{ mov.tipo_contrato_nuevo?.nombre || 'Nuevo contrato' }}
                </q-badge>
              </div>
            </q-timeline-entry>
          </q-timeline>

          <div v-if="historial.length === 0" class="text-center q-pa-md text-grey-5">
            Sin historial de movimientos registrados
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>

    <!-- FICHA OFICIAL DE KARDEX (IMPRIMIBLE / PDF) -->
    <FichaKardexDialog v-model="showFicha" :empleado="kardex" />

    <!-- DESGLOSADOR VISUAL DE FILE PDF -->
    <DesglosadorPdfDialog
      v-model="showDesglosador"
      :empleado="kardex"
      @saved="onDesgloseSaved"
    />

    <!-- VISOR DIGITAL MODO LIBRO & PREVISUALIZADOR PDF -->
    <VisorLibroPdfDialog
      v-model="showVisorLibro"
      :empleado="kardex"
      :seccion-codigo-inicial="seccionSeleccionadaVisor"
    />

    <!-- RÓTULO ADHESIVO CON QR PARA EL FOLDER FÍSICO -->
    <RotuloFolderDialog v-model="showRotulo" :empleado="kardex" />

    <!-- MODAL DE ADJUNCIÓN / ACUMULACIÓN DE FOJAS EN SECCIÓN ESPECÍFICA -->
    <q-dialog v-model="showSubidaSeccionModal">
      <q-card style="min-width: 440px; max-width: 520px; width: 95vw;" class="bg-slate-900 text-white q-pa-sm">
        <q-card-section class="q-pb-none row items-center justify-between">
          <div class="row items-center q-gutter-x-sm">
            <q-icon name="note_add" size="24px" color="primary" />
            <div>
              <div class="text-subtitle1 text-weight-bolder text-white">
                {{ seccionSubidaActual?.nombre }}
              </div>
              <div class="text-caption text-slate-400 font-mono" style="font-size: 11px;">
                Sección {{ String(seccionSubidaActual?.id).padStart(2, '0') }} • {{ kardex?.nombre_completo }}
              </div>
            </div>
          </div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-gutter-y-sm">
          <div class="row items-center justify-between bg-slate-950 q-pa-sm rounded-borders border border-slate-800">
            <span class="text-caption text-slate-300">Fojas físicas actuales:</span>
            <q-badge color="slate-800" text-color="white" class="text-weight-bold font-mono" style="font-size: 12px;">
              {{ seccionSubidaActual?.fojas || 0 }} fojas
            </q-badge>
          </div>

          <div class="q-py-xs">
            <div class="text-caption text-slate-400 q-mb-xs text-weight-bold">
              ¿Cómo deseas incorporar el nuevo documento?
            </div>
            <q-btn-toggle
              v-model="modoSubidaDirecta"
              spread
              dense
              no-caps
              rounded
              unelevated
              toggle-color="primary"
              color="slate-800"
              text-color="slate-300"
              :options="[
                { label: 'Acumular / Sumar fojas', value: 'acumular', icon: 'library_add' },
                { label: 'Reemplazar documento', value: 'reemplazar', icon: 'sync' }
              ]"
            />
            <div class="text-caption q-mt-xs font-mono text-slate-300" style="font-size: 10.5px;">
              {{ modoSubidaDirecta === 'acumular'
                ? 'El nuevo archivo se anexará al final de los documentos existentes sin borrar nada.'
                : 'El nuevo archivo reemplazará los documentos previos de esta sección.' }}
            </div>
          </div>

          <q-file
            v-model="archivoSeccionDirecto"
            dark
            outlined
            dense
            label="Seleccionar archivo PDF"
            accept=".pdf"
            color="primary"
          >
            <template v-slot:prepend>
              <q-icon name="attach_file" color="primary" />
            </template>
          </q-file>
        </q-card-section>

        <q-card-actions align="right" class="q-pt-none">
          <q-btn flat label="Cancelar" color="slate-400" v-close-popup />
          <q-btn
            unelevated
            color="primary"
            text-color="white"
            icon="save"
            :label="modoSubidaDirecta === 'acumular' ? 'Anexar Fojas' : 'Guardar y Reemplazar'"
            :loading="guardandoArchivoSeccion"
            :disable="!archivoSeccionDirecto"
            class="text-weight-bolder"
            @click="confirmarSubidaDirecta"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { useGeosStore } from 'src/stores/geosStore';
import FichaKardexDialog from 'src/components/Kardex/FichaKardexDialog.vue';
import DesglosadorPdfDialog from 'src/components/Kardex/DesglosadorPdfDialog.vue';
import VisorLibroPdfDialog from 'src/components/Kardex/VisorLibroPdfDialog.vue';
import RotuloFolderDialog from 'src/components/Kardex/RotuloFolderDialog.vue';
import {
  getEmpleadoSecciones,
  saveEmpleadoSecciones,
  calcularResumenFile,
  SECCIONES_FILE_DEFAULT
} from 'src/utils/fileSectionsHelper';
import {
  getEmpleadoPdfsMap,
  syncEmpleadoFilesToCloud,
  appendSectionPdf,
  saveSectionPdf
} from 'src/utils/pdfStorageHelper';
import { PDFDocument } from 'pdf-lib/dist/pdf-lib.min.js';

const $q = useQuasar();
const store = useGeosStore();
const showFicha = ref(false);
const showDesglosador = ref(false);
const showVisorLibro = ref(false);
const showRotulo = ref(false);
const seccionSeleccionadaVisor = ref(null);
const pdfsMap = ref({});
const activeTab = ref('secciones');
const isSyncingCloud = ref(false);

// Estado para adjunción / acumulación directa de fojas
const showSubidaSeccionModal = ref(false);
const seccionSubidaActual = ref(null);
const archivoSeccionDirecto = ref(null);
const modoSubidaDirecta = ref('acumular');
const guardandoArchivoSeccion = ref(false);

const props = defineProps({
  modelValue: Boolean,
  kardex: Object
});

defineEmits(['update:modelValue']);

// Iniciar adjunción de archivo a una sección específica
const iniciarSubidaSeccion = (sec) => {
  seccionSubidaActual.value = sec;
  archivoSeccionDirecto.value = null;
  modoSubidaDirecta.value = 'acumular';
  showSubidaSeccionModal.value = true;
};

// Confirmar y guardar fojas (acumular o reemplazar)
const confirmarSubidaDirecta = async () => {
  if (!archivoSeccionDirecto.value || !seccionSubidaActual.value || !props.kardex?.id) return;
  guardandoArchivoSeccion.value = true;
  try {
    const buffer = await archivoSeccionDirecto.value.arrayBuffer();
    const codigo = seccionSubidaActual.value.codigo;
    let totalFojasActualizadas = 0;

    if (modoSubidaDirecta.value === 'acumular') {
      const res = await appendSectionPdf(props.kardex.id, codigo, buffer, {
        filename: archivoSeccionDirecto.value.name,
      });
      totalFojasActualizadas = res.totalPages;
      $q.notify({
        type: 'positive',
        message: `¡Fojas anexadas con éxito! Se sumaron ${res.addedPages} fojas (Total en esta sección: ${res.totalPages} fojas).`,
        icon: 'library_add',
        timeout: 2500,
      });
    } else {
      const doc = await PDFDocument.load(buffer);
      const count = doc.getPageCount();
      await saveSectionPdf(props.kardex.id, codigo, buffer, {
        filename: archivoSeccionDirecto.value.name,
        pagesCount: count,
      });
      totalFojasActualizadas = count;
      $q.notify({
        type: 'positive',
        message: `¡Documento reemplazado con éxito! Total: ${count} fojas.`,
        icon: 'check_circle',
        timeout: 2500,
      });
    }

    // Actualizar sección reactiva en la lista
    const targetSec = secciones.value.find((s) => s.codigo === codigo);
    if (targetSec) {
      targetSec.fojas = totalFojasActualizadas;
      targetSec.estado = 'presente';
      if (!targetSec.observacion) {
        targetSec.observacion = `Documento digital adjuntado (${archivoSeccionDirecto.value.name})`;
      }
    }

    // Guardar metadata del file
    saveEmpleadoSecciones(props.kardex.id, secciones.value);
    await cargarPdfsMap();
    showSubidaSeccionModal.value = false;
  } catch (err) {
    console.error('Error adjuntando archivo a sección:', err);
    $q.notify({
      type: 'negative',
      message: 'No se pudo adjuntar el archivo. Asegúrate de que sea un PDF válido.',
    });
  } finally {
    guardandoArchivoSeccion.value = false;
  }
};

// Abrir visor de libro completo
const abrirVisorLibroCompleto = () => {
  seccionSeleccionadaVisor.value = null;
  showVisorLibro.value = true;
};

// Previsualizar PDF de una sección específica
const previsualizarPdfSeccion = (codigo) => {
  seccionSeleccionadaVisor.value = codigo;
  showVisorLibro.value = true;
};

// Forzar sincronización manual con Supabase Cloud
const forzarSincronizacionNube = async () => {
  if (!props.kardex?.id) return;
  try {
    isSyncingCloud.value = true;
    const res = await syncEmpleadoFilesToCloud(props.kardex.id);
    await cargarPdfsMap();
    $q.notify({
      type: 'positive',
      message: `¡Sincronización en la nube completada! (${res.uploaded} archivos verificados/subidos a Supabase Storage)`,
      icon: 'cloud_done',
      timeout: 2500
    });
  } catch (err) {
    console.error('Error sincronizando con la nube:', err);
    $q.notify({ type: 'negative', message: 'Error de conexión al sincronizar con Supabase Cloud.' });
  } finally {
    isSyncingCloud.value = false;
  }
};

// Estados: 0 = Presente, 1 = Ausente, 2 = Prestado
const estadoOptions = [
  { label: 'Presente en Gaveta', value: 0 },
  { label: 'Ausente (Fuera de Gaveta)', value: 1 },
  { label: 'Prestado (En Consulta)', value: 2 },
];

const estadoLabels = { 0: 'Presente', 1: 'Ausente', 2: 'Prestado' };

const localEstado = ref(0);
const comentario = ref('');
const historial = ref([]);
const loading = ref(false);
const secciones = ref([]);

// Resumen reactivo de las 13 secciones
const resumenFile = computed(() => {
  return calcularResumenFile(secciones.value);
});

const cargarPdfsMap = async () => {
  if (!props.kardex?.id) return;
  pdfsMap.value = await getEmpleadoPdfsMap(props.kardex.id);
};

const onDesgloseSaved = async (nuevasSecciones) => {
  secciones.value = nuevasSecciones;
  await cargarPdfsMap();
};

watch(() => props.kardex, async (newKardex) => {
  if (newKardex) {
    localEstado.value = newKardex.estado ?? 0;
    comentario.value = '';
    secciones.value = getEmpleadoSecciones(newKardex.id);
    await Promise.all([loadHistorial(), cargarPdfsMap()]);
  }
}, { immediate: true });

const guardarSecciones = () => {
  if (!props.kardex?.id) return;
  const ok = saveEmpleadoSecciones(props.kardex.id, secciones.value);
  if (ok) {
    $q.notify({
      type: 'positive',
      message: 'Auditoría del file guardada correctamente',
      icon: 'check_circle',
      timeout: 1300
    });
  } else {
    $q.notify({
      type: 'negative',
      message: 'Error al guardar los datos del file',
      timeout: 1500
    });
  }
};

const restablecerSecciones = () => {
  secciones.value = JSON.parse(JSON.stringify(SECCIONES_FILE_DEFAULT));
  guardarSecciones();
};

const loadHistorial = async () => {
  if (!props.kardex?.id) return;
  try {
    const response = await api.get(`/empleados/${props.kardex.id}/movimientos`);
    historial.value = response.data;
  } catch {
    historial.value = [];
  }
};

const registrarMovimiento = async () => {
  if (!props.kardex) return;
  loading.value = true;
  try {
    await api.post(`/empleados/${props.kardex.id}/movimientos`, {
      comentario: comentario.value,
      estado_nuevo: localEstado.value,
    });
    comentario.value = '';
    await loadHistorial();
    await store.fetchMuebles();
    $q.notify({ type: 'positive', message: 'Movimiento registrado con éxito' });
  } catch {
    $q.notify({ type: 'negative', message: 'Error al registrar movimiento' });
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('es-ES');
};

const getEstadoLabel = (estado) => {
  return estadoLabels[estado] ?? 'N/A';
};

const getMovIcon = (mov) => {
  switch (mov.tipo_movimiento) {
    case 'contrato': return 'work_history';
    case 'cargo': return 'badge';
    case 'ubicacion': return 'drive_file_move';
    case 'estado': return 'swap_horiz';
    default: return 'event';
  }
};

const getMovColor = (mov) => {
  switch (mov.tipo_movimiento) {
    case 'contrato': return 'primary';
    case 'cargo': return 'slate-7';
    case 'ubicacion': return 'primary';
    case 'estado': return 'primary';
    default: return 'primary';
  }
};

const getMovTitle = (mov) => {
  if (mov.tipo_movimiento === 'contrato') {
    return 'Transición de Régimen Contractual';
  }
  if (mov.tipo_movimiento === 'cargo') {
    return 'Ascenso o Modificación de Cargo';
  }
  if (mov.tipo_movimiento === 'ubicacion') {
    return 'Reubicación de Expediente entre Gavetas';
  }
  if (mov.estado_nuevo !== null && mov.estado_nuevo !== undefined) {
    return `Estado: ${getEstadoLabel(mov.estado_anterior)} → ${getEstadoLabel(mov.estado_nuevo)}`;
  }
  return 'Movimiento registrado';
};
</script>

<style scoped>
.kardex-numero-big {
  font-size: 26px;
  font-weight: 900;
  background: rgba(255,255,255,0.2);
  padding: 6px 14px;
  border-radius: 10px;
}

.audit-summary-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.metric-pill {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 11px;
}
.metric-lbl {
  color: #64748b;
  margin-right: 4px;
}

.seccion-item-row {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #ffffff;
  transition: all 0.2s ease;
}
.seccion-item-row:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.sec-presente {
  border-left: 3px solid #10b981;
}
.sec-pendiente {
  border-left: 3px solid #ef4444;
  background: #fffafa;
}
.sec-noaplica {
  border-left: 3px solid #94a3b8;
  opacity: 0.75;
}

.sec-number-badge {
  background: #1e1b4b;
  color: #ffffff;
  font-size: 10.5px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.custom-btn-toggle :deep(.q-btn) {
  font-size: 10px;
  padding: 2px 6px;
}

.fojas-input :deep(.q-field__native) {
  font-family: monospace;
  font-weight: 700;
  text-align: center;
  font-size: 11.5px;
}

.border-bottom {
  border-bottom: 1px solid #e2e8f0;
}
.border-top {
  border-top: 1px solid #e2e8f0;
}
</style>
