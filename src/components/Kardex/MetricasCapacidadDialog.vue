<template>
  <q-dialog v-model="isOpen" max-width="800px">
    <q-card class="metricas-card" style="width: 780px; max-width: 95vw; border-radius: 16px;">
      <!-- CABECERA -->
      <div class="row items-center justify-between q-pa-md bg-slate-900 text-white">
        <div class="row items-center q-gutter-sm">
          <div class="metricas-header-icon flex flex-center">
            <q-icon name="insights" size="20px" color="white" />
          </div>
          <div>
            <div class="text-subtitle1 text-weight-bolder">Métricas de Capacidad & Ocupación</div>
            <div class="text-caption text-slate-400" style="font-size: 11px;">
              Análisis cuantitativo de archivadores físicos y expedientes
            </div>
          </div>
        </div>
        <q-btn flat round dense icon="close" color="white" v-close-popup />
      </div>

      <!-- CONTENIDO -->
      <q-card-section class="q-pa-md q-gutter-y-md">
        <!-- 4 TARJETAS KPI RESUMEN -->
        <div class="row q-col-gutter-sm">
          <!-- TOTAL EXPEDIENTES -->
          <div class="col-12 col-sm-6 col-md-3">
            <div class="kpi-box kpi-highlight">
              <div class="text-caption text-slate-500 font-weight-bold">TOTAL EXPEDIENTES</div>
              <div class="text-h4 text-weight-bolder text-primary q-my-xs">
                {{ stats.totalExpedientes }}
              </div>
              <div class="text-caption text-slate-500" style="font-size: 10px;">
                {{ stats.expedientesFisicos }} físicos • {{ stats.expedientesVirtuales }} virtuales
              </div>
            </div>
          </div>

          <!-- TOTAL ARCHIVADORES -->
          <div class="col-12 col-sm-6 col-md-3">
            <div class="kpi-box">
              <div class="text-caption text-slate-500 font-weight-bold">ARCHIVADORES</div>
              <div class="text-h4 text-weight-bolder text-slate-900 q-my-xs">
                {{ stats.totalMuebles }}
              </div>
              <div class="text-caption text-slate-500" style="font-size: 10px;">
                {{ stats.totalCajones }} gavetas físicas
              </div>
            </div>
          </div>

          <!-- PROMEDIO POR GAVETA -->
          <div class="col-12 col-sm-6 col-md-3">
            <div class="kpi-box">
              <div class="text-caption text-slate-500 font-weight-bold">PROMEDIO / GAVETA</div>
              <div class="text-h4 text-weight-bolder text-slate-900 q-my-xs">
                {{ stats.promedioPorCajon }}
              </div>
              <div class="text-caption text-slate-500" style="font-size: 10px;">
                expedientes por cajón
              </div>
            </div>
          </div>

          <!-- GAVETA VIRTUAL -->
          <div class="col-12 col-sm-6 col-md-3">
            <div class="kpi-box">
              <div class="text-caption text-slate-500 font-weight-bold">GAVETAS OCUPADAS</div>
              <div class="text-h4 text-weight-bolder text-slate-900 q-my-xs">
                {{ stats.cajonesOcupados }} / {{ stats.totalCajones }}
              </div>
              <div class="text-caption text-slate-500" style="font-size: 10px;">
                {{ stats.porcentajeCajonesOcupados }}% con expedientes
              </div>
            </div>
          </div>
        </div>

        <!-- DISTRIBUCIÓN POR SEDE -->
        <div class="metricas-section">
          <div class="row items-center justify-between q-mb-sm">
            <span class="text-subtitle2 text-weight-bolder text-slate-800">
              Distribución por Sede
            </span>
            <span class="text-caption text-slate-500">{{ stats.sedesStats.length }} sedes registradas</span>
          </div>

          <div class="q-gutter-y-sm">
            <div
              v-for="sede in stats.sedesStats"
              :key="sede.id"
              class="sede-progress-item q-pa-sm border-rounded bg-slate-50"
            >
              <div class="row items-center justify-between q-mb-xs">
                <span class="text-weight-bold text-slate-800" style="font-size: 12.5px;">
                  {{ sede.nombre }}
                </span>
                <span class="text-caption text-slate-600 font-weight-bold">
                  {{ sede.expedientesCount }} expedientes ({{ sede.porcentaje }}%)
                </span>
              </div>
              <q-linear-progress
                :value="sede.porcentaje / 100"
                rounded
                color="primary"
                track-color="blue-1"
                size="8px"
              />
            </div>
          </div>
        </div>

        <!-- DISTRIBUCIÓN POR TIPO DE CONTRATO -->
        <div class="metricas-section">
          <div class="row items-center justify-between q-mb-sm">
            <span class="text-subtitle2 text-weight-bolder text-slate-800">
              Distribución por Tipo de Contrato
            </span>
          </div>

          <div class="row q-col-gutter-sm">
            <div
              v-for="tc in stats.contratosStats"
              :key="tc.id"
              class="col-12 col-sm-4"
            >
              <div class="contrato-kpi-card q-pa-sm border-rounded">
                <div class="row items-center justify-between">
                  <span class="text-caption text-weight-bold text-slate-700">{{ tc.nombre }}</span>
                  <span class="contrato-count-pill">{{ tc.count }}</span>
                </div>
                <div class="text-caption text-slate-400 q-mt-xs" style="font-size: 10px;">
                  {{ tc.porcentaje }}% del total
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ESTADO POR ARCHIVADOR FÍSICO -->
        <div class="metricas-section">
          <div class="row items-center justify-between q-mb-sm">
            <span class="text-subtitle2 text-weight-bolder text-slate-800">
              Ocupación por Archivador
            </span>
          </div>

          <div class="q-gutter-y-xs">
            <div
              v-for="m in stats.mueblesStats"
              :key="m.id"
              class="row items-center justify-between q-pa-sm bg-white border border-rounded"
            >
              <div class="row items-center q-gutter-sm">
                <q-icon name="inventory_2" size="18px" color="primary" />
                <div>
                  <div class="text-weight-bold text-slate-800" style="font-size: 12.5px;">{{ m.nombre }}</div>
                  <div class="text-caption text-slate-500" style="font-size: 10.5px;">
                    {{ m.columnas }} columna(s) • {{ m.totalCajones }} gavetas
                  </div>
                </div>
              </div>

              <div class="row items-center q-gutter-md">
                <div class="text-right">
                  <span class="text-weight-bolder text-primary" style="font-size: 14px;">{{ m.totalExp }}</span>
                  <span class="text-caption text-slate-400" style="font-size: 11px;"> exp.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>

      <!-- FOOTER -->
      <div class="row items-center justify-end q-pa-md bg-slate-50 border-top">
        <q-btn unelevated no-caps color="primary" label="Entendido" v-close-popup />
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue';
import { useGeosStore } from 'src/stores/geosStore';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue']);

const store = useGeosStore();

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const stats = computed(() => {
  const muebles = store.muebles || [];
  const virtuales = store.expedientesSinAsignar || [];
  const all = store.allEmpleadosWithLocation || [];
  const sedes = store.sedes || [];
  const contratos = store.tiposContrato || [];

  const totalExpedientes = all.length;
  const expedientesVirtuales = virtuales.length;
  const expedientesFisicos = totalExpedientes - expedientesVirtuales;

  let totalCajones = 0;
  let cajonesOcupados = 0;

  const mueblesStats = muebles.map((m) => {
    const cajs = m.cajones || [];
    totalCajones += cajs.length;
    let mTotalExp = 0;

    cajs.forEach((c) => {
      const cExp = (c.empleados || []).length;
      mTotalExp += cExp;
      if (cExp > 0) cajonesOcupados++;
    });

    return {
      id: m.id,
      nombre: m.nombre,
      columnas: m.columnas || 1,
      totalCajones: cajs.length,
      totalExp: mTotalExp
    };
  });

  const promedioPorCajon = totalCajones > 0 ? (expedientesFisicos / totalCajones).toFixed(1) : 0;
  const porcentajeCajonesOcupados = totalCajones > 0 ? Math.round((cajonesOcupados / totalCajones) * 100) : 0;

  // Estadísticas por sede
  const sedesStats = sedes.map((s) => {
    const expCount = all.filter((e) => e.sede_id === s.id).length;
    const porcentaje = totalExpedientes > 0 ? Math.round((expCount / totalExpedientes) * 100) : 0;
    return {
      id: s.id,
      nombre: s.nombre,
      expedientesCount: expCount,
      porcentaje
    };
  }).sort((a, b) => b.expedientesCount - a.expedientesCount);

  // Estadísticas por contrato
  const contratosStats = contratos.map((c) => {
    const count = all.filter((e) => e.tipo_contrato_id === c.id).length;
    const porcentaje = totalExpedientes > 0 ? Math.round((count / totalExpedientes) * 100) : 0;
    return {
      id: c.id,
      nombre: c.nombre,
      count,
      porcentaje
    };
  });

  return {
    totalExpedientes,
    expedientesFisicos,
    expedientesVirtuales,
    totalMuebles: muebles.length,
    totalCajones,
    cajonesOcupados,
    promedioPorCajon,
    porcentajeCajonesOcupados,
    sedesStats,
    contratosStats,
    mueblesStats
  };
});
</script>

<style scoped>
.metricas-card {
  background: #ffffff;
  overflow: hidden;
}

.metricas-header-icon {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.kpi-box {
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
}

.kpi-highlight {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.border-rounded {
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.contrato-kpi-card {
  background: #f8fafc;
}

.contrato-count-pill {
  background: #e2e8f0;
  color: #334155;
  font-weight: 800;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
}
</style>
