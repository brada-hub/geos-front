<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="680px">
    <q-card class="column no-wrap rotulo-dialog-card bg-slate-900 text-white">
      <!-- CABECERA -->
      <div class="row items-center justify-between q-pa-sm border-bottom bg-slate-950 no-print">
        <div class="row items-center q-gutter-x-sm">
          <q-icon name="label" size="20px" color="primary" />
          <div>
            <div class="text-subtitle2 text-weight-bolder">Rótulo Adhesivo para Folder / Cartapacio Físico</div>
            <div class="text-caption text-slate-400">Etiqueta con Código QR para lomo o cejilla de carpeta</div>
          </div>
        </div>
        <div class="row items-center q-gutter-xs">
          <q-btn
            unelevated
            no-caps
            color="primary"
            icon="print"
            label="Imprimir Rótulo"
            class="text-weight-bolder"
            @click="imprimirRotulo"
          />
          <q-btn flat round dense icon="close" color="white" v-close-popup />
        </div>
      </div>

      <!-- VISTA PREVIA DEL RÓTULO (LISTO PARA RECORTAR) -->
      <div class="q-pa-lg flex flex-center bg-slate-800 rotulo-preview-area">
        <div ref="rotuloPrintRef" class="rotulo-adhesive-strip shadow-10">
          <!-- GUÍA DE CORTE SUPERIOR -->
          <div class="cut-guide-horizontal cut-top"></div>

          <div class="rotulo-content-row row no-wrap items-center justify-between">
            <!-- COLUMNA IZQUIERDA: LOGO Y CÓDIGO GIGANTE -->
            <div class="rotulo-col-left column justify-between">
              <div class="row items-center q-gutter-x-xs">
                <span class="rotulo-brand-pill">DOCUS RRHH</span>
                <span class="rotulo-tag-sub">LEGAJO PERSONAL</span>
              </div>

              <div class="rotulo-exp-code font-mono">
                {{ empleado?.codigo_archivo || `EXP-${String(empleado?.numero_unico || empleado?.id).padStart(4, '0')}` }}
              </div>

              <div class="rotulo-location-pill">
                <q-icon name="folder_open" size="13px" class="q-mr-xs" />
                {{ ubicacionTexto }}
              </div>
            </div>

            <!-- COLUMNA CENTRAL: DATOS DEL TRABAJADOR -->
            <div class="rotulo-col-center column justify-center q-px-sm">
              <div class="rotulo-worker-name ellipsis-2-lines">
                {{ empleado?.nombre_completo || `${empleado?.primer_apellido || ''} ${empleado?.segundo_apellido || ''} ${empleado?.nombres || ''}`.trim() }}
              </div>
              
              <div class="rotulo-meta-grid q-mt-xs">
                <div><b>CI:</b> {{ empleado?.documento_identidad || '-' }}</div>
                <div><b>Cargo:</b> {{ empleado?.cargo_relacion?.nombre || empleado?.cargo || '-' }}</div>
                <div><b>Contrato:</b> {{ empleado?.tipo_contrato?.nombre || '-' }}</div>
                <div><b>Sede:</b> {{ empleado?.sede?.nombre || 'Sede Central' }}</div>
              </div>
            </div>

            <!-- COLUMNA DERECHA: CÓDIGO QR DINÁMICO ESCANEABLE -->
            <div class="rotulo-col-right column items-center justify-center">
              <div class="rotulo-qr-box">
                <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR Expediente" class="rotulo-qr-img" />
                <q-spinner v-else size="24px" color="primary" />
              </div>
              <span class="rotulo-qr-label font-mono">ESCANEAR FILE</span>
            </div>
          </div>

          <!-- GUÍA DE CORTE INFERIOR -->
          <div class="cut-guide-horizontal cut-bottom"></div>
        </div>
      </div>

      <!-- INSTRUCCIONES -->
      <div class="q-pa-sm bg-slate-950 border-top text-caption text-slate-400 row items-center justify-between no-print">
        <span>💡 <b>Tip de Impresión:</b> Puedes imprimirlo en papel adhesivo o cartulina opalina y pegarlo en la cejilla exterior del folder.</span>
        <span class="font-mono text-slate-300">Tamaño estándar: 14 x 4.8 cm</span>
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import QRCode from 'qrcode';

const props = defineProps({
  modelValue: Boolean,
  empleado: Object
});

defineEmits(['update:modelValue']);

const qrDataUrl = ref('');
const rotuloPrintRef = ref(null);

const ubicacionTexto = computed(() => {
  if (props.empleado?.cajon) {
    const c = props.empleado.cajon;
    const muebleNombre = c.mueble?.nombre || 'Archivador';
    return `${muebleNombre} • Gaveta F${c.fila}-C${c.columna}`;
  }
  return 'Sin Asignar (Gaveta Virtual)';
});

watch(
  () => props.empleado,
  async (emp) => {
    if (!emp) return;
    try {
      // Generar URL directa al expediente para que el celular abra directo la ficha
      const appUrl = `${window.location.origin}/#/kardex?id=${emp.id}&ci=${emp.documento_identidad || ''}`;
      qrDataUrl.value = await QRCode.toDataURL(appUrl, {
        width: 130,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
    } catch (e) {
      console.error('Error generando QR para rótulo:', e);
    }
  },
  { immediate: true }
);

const imprimirRotulo = () => {
  window.print();
};
</script>

<style scoped>
.rotulo-preview-area {
  min-height: 200px;
}

/* TIRA ADHESIVA PARA FOLDER / LOMO FÍSICO */
.rotulo-adhesive-strip {
  width: 530px;
  height: 145px;
  background: #ffffff;
  color: #0f172a;
  border-radius: 4px;
  border: 1px dashed #94a3b8;
  padding: 10px 14px;
  position: relative;
  box-sizing: border-box;
}

.rotulo-content-row {
  height: 100%;
}

.rotulo-col-left {
  width: 145px;
  border-right: 1.5px solid #cbd5e1;
  padding-right: 10px;
  height: 100%;
}

.rotulo-brand-pill {
  font-size: 9.5px;
  font-weight: 900;
  background: #1e1b4b;
  color: #ffffff;
  padding: 1px 5px;
  border-radius: 3px;
  letter-spacing: 0.5px;
}

.rotulo-tag-sub {
  font-size: 8.5px;
  font-weight: 700;
  color: #64748b;
}

.rotulo-exp-code {
  font-size: 19px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: 0.5px;
  line-height: 1.1;
}

.rotulo-location-pill {
  font-size: 9.5px;
  font-weight: 700;
  color: #334155;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rotulo-col-center {
  flex: 1;
  height: 100%;
  border-right: 1.5px solid #cbd5e1;
  padding: 0 12px;
}

.rotulo-worker-name {
  font-size: 13.5px;
  font-weight: 900;
  color: #0f172a;
  line-height: 1.2;
  text-transform: uppercase;
}

.rotulo-meta-grid {
  font-size: 10px;
  color: #475569;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px 6px;
}

.rotulo-col-right {
  width: 105px;
  height: 100%;
  padding-left: 10px;
}

.rotulo-qr-box {
  width: 82px;
  height: 82px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 2px;
  background: #ffffff;
}

.rotulo-qr-img {
  width: 100%;
  height: 100%;
  display: block;
}

.rotulo-qr-label {
  font-size: 8px;
  font-weight: 800;
  color: #64748b;
  margin-top: 3px;
  letter-spacing: 0.5px;
}

/* REGLAS PARA IMPRESIÓN EXCLUSIVA DEL RÓTULO */
@media print {
  body * {
    visibility: hidden;
  }
  .rotulo-adhesive-strip,
  .rotulo-adhesive-strip * {
    visibility: visible;
  }
  .rotulo-adhesive-strip {
    position: absolute;
    left: 20px;
    top: 20px;
    box-shadow: none !important;
    border: 1px solid #000000 !important;
  }
}
</style>
