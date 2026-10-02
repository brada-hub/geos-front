<template>
  <q-dialog v-model="isOpen" max-width="850px" class="ficha-kardex-dialog">
    <q-card class="ficha-card column" style="max-height: 90vh;">
      <!-- BARRA DE ACCIONES SUPERIOR (SE OCULTA AL IMPRIMIR) -->
      <div class="row items-center justify-between q-pa-sm bg-slate-900 text-white no-print">
        <div class="row items-center q-gutter-sm">
          <q-icon name="picture_as_pdf" size="20px" color="amber-5" />
          <span class="text-subtitle2 font-weight-bold">Ficha Oficial de Kardex & Archivo</span>
        </div>
        <div class="row items-center q-gutter-xs">
          <q-btn
            unelevated
            no-caps
            color="primary"
            icon="print"
            label="Imprimir / Guardar como PDF"
            class="text-weight-bold"
            @click="imprimirFicha"
          />
          <q-btn flat round dense icon="close" color="white" v-close-popup />
        </div>
      </div>

      <!-- CONTENIDO DE LA FICHA A4 (IMPRIMIBLE) -->
      <q-scroll-area class="col q-pa-md ficha-scroll-area">
        <div ref="fichaPrintRef" class="ficha-paper">
          <!-- CABECERA INSTITUCIONAL -->
          <div class="row items-center justify-between border-bottom q-pb-md q-mb-md">
            <div class="row items-center q-gutter-md">
              <div class="ficha-logo-box flex flex-center">
                <q-icon name="inventory_2" size="32px" color="indigo-9" />
              </div>
              <div>
                <div class="text-h6 text-weight-bolder text-slate-900" style="line-height: 1.1;">
                  DOCUS RRHH
                </div>
                <div class="text-caption text-weight-bold text-indigo-9" style="letter-spacing: 0.5px;">
                  SISTEMA CENTRAL DE GESTIÓN ARCHIVÍSTICA & KARDEX
                </div>
                <div class="text-caption text-slate-500" style="font-size: 11px;">
                  DOCUMENTO OFICIAL DE CONTROL DE EXPEDIENTE
                </div>
              </div>
            </div>

            <!-- CÓDIGO ARCHIVO Y QR/BARCODE SIMULADO -->
            <div class="column items-end">
              <div class="ficha-code-badge">
                {{ empleado?.codigo_archivo || `EXP-${empleado?.numero_unico || empleado?.id}` }}
              </div>
              <div class="barcode-container q-mt-xs">
                <div class="barcode-lines"></div>
                <span class="barcode-text">CI: {{ empleado?.documento_identidad }}</span>
              </div>
              <div class="text-caption text-slate-400" style="font-size: 10px;">
                Emisión: {{ fechaEmision }}
              </div>
            </div>
          </div>

          <!-- TÍTULO CENTRAL -->
          <div class="text-center q-mb-md">
            <h5 class="q-ma-none text-weight-bolder text-slate-900" style="letter-spacing: 0.5px; font-size: 17px;">
              FICHA DE REGISTRO ARCHIVÍSTICO Y UBICACIÓN FÍSICA
            </h5>
            <div class="text-caption text-slate-500">
              Expediente Único N° {{ empleado?.numero_unico || empleado?.id }}
            </div>
          </div>

          <!-- SECCIÓN 1: DATOS PERSONALES -->
          <div class="ficha-section-box q-mb-md">
            <div class="ficha-section-title">
              1. INFORMACIÓN PERSONAL DEL TITULAR
            </div>
            <div class="row q-col-gutter-sm q-pa-sm">
              <div class="col-4">
                <span class="field-label">Primer Apellido:</span>
                <div class="field-value">{{ empleado?.primer_apellido || '-' }}</div>
              </div>
              <div class="col-4">
                <span class="field-label">Segundo Apellido:</span>
                <div class="field-value">{{ empleado?.segundo_apellido || '-' }}</div>
              </div>
              <div class="col-4">
                <span class="field-label">Nombres:</span>
                <div class="field-value">{{ empleado?.nombres || '-' }}</div>
              </div>

              <div class="col-4">
                <span class="field-label">Documento de Identidad (CI):</span>
                <div class="field-value text-weight-bold text-indigo-9">{{ empleado?.documento_identidad || '-' }}</div>
              </div>
              <div class="col-4">
                <span class="field-label">Fecha de Nacimiento:</span>
                <div class="field-value">{{ empleado?.fecha_nacimiento || '-' }}</div>
              </div>
              <div class="col-4">
                <span class="field-label">Sexo:</span>
                <div class="field-value">{{ empleado?.sexo_relacion?.nombre || empleado?.sexo || '-' }}</div>
              </div>
            </div>
          </div>

          <!-- SECCIÓN 2: DATOS LABORALES Y UBICACIÓN FÍSICA -->
          <div class="ficha-section-box q-mb-md">
            <div class="ficha-section-title">
              2. ASIGNACIÓN LABORAL Y UBICACIÓN ARCHIVÍSTICA
            </div>
            <div class="row q-col-gutter-sm q-pa-sm">
              <div class="col-6">
                <span class="field-label">Cargo / Función:</span>
                <div class="field-value">{{ empleado?.cargo_relacion?.nombre || empleado?.cargo || '-' }}</div>
              </div>
              <div class="col-6">
                <span class="field-label">Tipo de Contrato:</span>
                <div class="field-value text-weight-bold text-teal-9">
                  {{ empleado?.tipo_contrato?.nombre || '-' }}
                </div>
              </div>

              <div class="col-6">
                <span class="field-label">Sede Asignada:</span>
                <div class="field-value text-weight-bold text-indigo-9">
                  {{ empleado?.sede?.nombre || 'SEDE CENTRAL' }}
                </div>
              </div>
              <div class="col-6">
                <span class="field-label">Ubicación Física Actual:</span>
                <div class="field-value physical-location-highlight">
                  <q-icon name="folder_open" size="14px" class="q-mr-xs" />
                  {{ ubicacionFisicaTexto }}
                </div>
              </div>
            </div>
          </div>

          <!-- SECCIÓN 3: HISTORIAL DE MOVIMIENTOS -->
          <div class="ficha-section-box q-mb-md">
            <div class="ficha-section-title">
              3. HISTORIAL DE TRASLADOS Y MOVIMIENTOS ARCHIVÍSTICOS
            </div>
            <div v-if="movimientosList.length > 0" class="q-pa-xs">
              <table class="ficha-table">
                <thead>
                  <tr>
                    <th style="width: 15%;">Fecha</th>
                    <th style="width: 20%;">Tipo</th>
                    <th style="width: 30%;">Ubicación / Destino</th>
                    <th style="width: 35%;">Observación</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="m in movimientosList" :key="m.id">
                    <td class="text-caption">{{ formatDate(m.created_at) }}</td>
                    <td class="text-caption text-weight-bold">{{ m.tipo_movimiento || 'Traslado' }}</td>
                    <td class="text-caption">{{ m.cajon_destino?.mueble?.nombre || 'Gaveta Virtual' }}</td>
                    <td class="text-caption">{{ m.comentario || 'Actualización de expediente' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="text-caption text-slate-400 q-pa-sm text-center">
              No registra movimientos históricos adicionales. Expediente en su posición de origen.
            </div>
          </div>

          <!-- SECCIÓN 4: FIRMAS Y CONFORMIDAD -->
          <div class="ficha-firmas-box q-mt-xl">
            <div class="row justify-around text-center">
              <div class="col-5">
                <div class="firma-line"></div>
                <div class="text-caption text-weight-bold text-slate-800">Responsable de Archivo Central</div>
                <div class="text-caption text-slate-500" style="font-size: 10px;">Firma, Sello & Fecha</div>
              </div>
              <div class="col-5">
                <div class="firma-line"></div>
                <div class="text-caption text-weight-bold text-slate-800">V° B° Recursos Humanos</div>
                <div class="text-caption text-slate-500" style="font-size: 10px;">Control & Auditoría Documental</div>
              </div>
            </div>
          </div>

          <!-- PIE DE PÁGINA -->
          <div class="border-top q-mt-lg q-pt-xs row justify-between text-caption text-slate-400" style="font-size: 9.5px;">
            <span>DOCUS RRHH • Sistema de Gestión de Expedientes</span>
            <span>Documento generado para fines de control de archivo físico</span>
          </div>
        </div>
      </q-scroll-area>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  empleado: {
    type: Object,
    default: () => null
  },
  drawer: {
    type: Object,
    default: () => null
  }
});

const emit = defineEmits(['update:modelValue']);

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const fechaEmision = computed(() => {
  const d = new Date();
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
});

const ubicacionFisicaTexto = computed(() => {
  if (!props.empleado) return 'Sin asignar';
  if (props.empleado.isVirtual || !props.empleado.cajon_id) {
    return 'Gaveta Virtual (Bandeja de Entrada)';
  }
  if (props.drawer) {
    const muebleNom = props.drawer.mueble?.nombre || 'Archivador';
    return `${muebleNom} • Gaveta Fila ${props.drawer.fila} (Col ${String.fromCharCode(64 + props.drawer.columna)})${props.drawer.etiqueta ? ` - "${props.drawer.etiqueta}"` : ''}`;
  }
  if (props.empleado.mueble_nombre) {
    return `${props.empleado.mueble_nombre} • Gaveta Fila ${props.empleado.fila}${props.empleado.cajon_etiqueta ? ` - "${props.empleado.cajon_etiqueta}"` : ''}`;
  }
  return 'Archivado Físicamente';
});

const movimientosList = computed(() => {
  return props.empleado?.movimientos || [];
});

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString();
};

const imprimirFicha = () => {
  window.print();
};
</script>

<style scoped>
.ficha-card {
  border-radius: 12px;
  background: #f8fafc;
  overflow: hidden;
}

.ficha-paper {
  background: #ffffff;
  padding: 30px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #1e293b;
}

.ficha-logo-box {
  width: 52px;
  height: 52px;
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  border-radius: 10px;
}

.ficha-code-badge {
  background: #1e1b4b;
  color: #ffffff;
  font-size: 13px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 4px;
  font-family: monospace;
}

.barcode-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.barcode-lines {
  width: 110px;
  height: 20px;
  background: repeating-linear-gradient(
    90deg,
    #0f172a,
    #0f172a 2px,
    transparent 2px,
    transparent 4px,
    #0f172a 4px,
    #0f172a 7px,
    transparent 7px,
    transparent 9px
  );
}

.barcode-text {
  font-size: 9px;
  font-family: monospace;
  color: #475569;
}

.ficha-section-box {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  overflow: hidden;
}

.ficha-section-title {
  background: #f1f5f9;
  padding: 5px 10px;
  font-size: 11.5px;
  font-weight: 800;
  color: #334155;
  border-bottom: 1px solid #cbd5e1;
  letter-spacing: 0.3px;
}

.field-label {
  display: block;
  font-size: 10.5px;
  color: #64748b;
  font-weight: 600;
  margin-bottom: 2px;
}

.field-value {
  font-size: 12.5px;
  color: #0f172a;
  font-weight: 500;
}

.physical-location-highlight {
  background: #f0fdf4;
  color: #166534;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #bbf7d0;
  display: inline-flex;
  align-items: center;
}

.ficha-table {
  width: 100%;
  border-collapse: collapse;
}

.ficha-table th, .ficha-table td {
  padding: 6px 8px;
  border: 1px solid #e2e8f0;
  text-align: left;
}

.ficha-table th {
  background: #f8fafc;
  font-weight: 700;
  font-size: 11px;
}

.firma-line {
  border-top: 1px solid #64748b;
  width: 80%;
  margin: 0 auto 6px auto;
}

/* REGLAS PARA IMPRESIÓN LIMPIA */
@media print {
  body * {
    visibility: hidden;
  }
  .ficha-kardex-dialog,
  .ficha-kardex-dialog :deep(.q-dialog__inner),
  .ficha-card,
  .ficha-scroll-area,
  .ficha-paper,
  .ficha-paper * {
    visibility: visible;
  }
  .no-print {
    display: none !important;
  }
  .ficha-kardex-dialog :deep(.q-dialog__inner) {
    padding: 0 !important;
    margin: 0 !important;
  }
  .ficha-card {
    box-shadow: none !important;
    border: none !important;
    max-height: none !important;
    position: absolute;
    left: 0;
    top: 0;
    width: 100% !important;
  }
  .ficha-paper {
    border: none !important;
    box-shadow: none !important;
    padding: 10mm 15mm !important;
  }
}
</style>
