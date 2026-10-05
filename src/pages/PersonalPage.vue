<template>
  <q-page class="personal-page-canvas q-pa-lg">
    <!-- ENCABEZADO -->
    <div class="row items-center justify-between q-mb-lg">
      <div class="row items-center q-gutter-md">
        <div class="header-icon-badge flex flex-center">
          <q-icon name="groups" size="26px" color="white" />
        </div>
        <div>
          <div class="row items-center q-gutter-xs">
            <span class="text-h5 text-weight-bolder text-slate-900" style="letter-spacing: -0.02em;">
              Directorio Integral de Personal
            </span>
            <q-badge color="slate-800" text-color="white" class="text-weight-bold q-ml-xs header-tag">
              RRHH Activo
            </q-badge>
          </div>
          <div class="text-caption text-slate-500 q-mt-xs">
            Expedientes físicos, asignación en archivadores e historial laboral normalizado
          </div>
        </div>
      </div>

      <div class="row q-gutter-sm items-center">
        <q-btn
          unelevated
          icon="upload_file"
          label="Importar Excel"
          class="action-btn-import"
          @click="openImportDialog"
        />
        <q-btn
          unelevated
          icon="person_add"
          label="Nuevo Personal"
          class="action-btn-primary"
          @click="openNewDialog"
        />
      </div>
    </div>

    <!-- BARRA DE FILTROS -->
    <q-card flat bordered class="q-mb-md q-pa-sm bg-white" style="border-radius: 10px;">
      <div class="row q-col-gutter-sm items-center">
        <!-- BUSCADOR TEXTO -->
        <div class="col-12 col-md-4">
          <q-input
            v-model="filterSearch"
            outlined
            dense
            clearable
            placeholder="Buscar por CI, Nombres, Apellidos, Cargo..."
          >
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>

        <!-- FILTRO SEDE -->
        <div class="col-12 col-sm-4 col-md-3">
          <q-select
            v-model="filterSedeId"
            :options="sedeFilterOptions"
            option-value="id"
            option-label="label"
            emit-value
            map-options
            outlined
            dense
            label="Filtrar por Sede"
          />
        </div>

        <!-- FILTRO CONTRATO -->
        <div class="col-12 col-sm-4 col-md-3">
          <q-select
            v-model="filterContratoId"
            :options="contratoFilterOptions"
            option-value="id"
            option-label="label"
            emit-value
            map-options
            outlined
            dense
            label="Tipo de Contrato"
          />
        </div>

        <!-- TOTAL REGISTROS -->
        <div class="col-12 col-sm-4 col-md-2 text-right">
          <q-badge color="blue-grey-8" class="q-pa-xs text-caption">
            {{ filteredPersonal.length }} registros
          </q-badge>
        </div>
      </div>
    </q-card>

    <!-- TABLA DE PERSONAL -->
    <q-card flat bordered style="border-radius: 10px;">
      <q-table
        :rows="filteredPersonal"
        :columns="columns"
        row-key="id"
        :loading="store.personalLoading"
        flat
        separator="horizontal"
        :pagination="{ rowsPerPage: 15 }"
        no-data-label="No se encontraron registros de personal"
      >
        <!-- COLUMNA NOMBRE Y DATOS -->
        <template v-slot:body-cell-nombre_completo="props">
          <q-td :props="props">
            <div class="row items-center no-wrap">
              <q-avatar
                size="34px"
                color="slate-800"
                text-color="white"
                class="q-mr-sm"
              >
                <q-icon :name="props.row.sexo_id === 2 || props.row.sexo === 'F' ? 'female' : 'male'" />
              </q-avatar>
              <div>
                <div class="text-weight-bold text-grey-9">
                  {{ props.row.nombre_completo || `${props.row.nombres} ${props.row.primer_apellido}` }}
                </div>
                <div class="text-caption text-grey-6">
                  {{ props.row.codigo_archivo }}
                  <span v-if="props.row.numero_unico"> • Folio: {{ props.row.numero_unico }}</span>
                </div>
              </div>
            </div>
          </q-td>
        </template>

        <!-- COLUMNA DOCUMENTO DE IDENTIDAD -->
        <template v-slot:body-cell-documento_identidad="props">
          <q-td :props="props">
            <span class="text-weight-medium text-dark font-monospace">
              {{ props.row.documento_identidad || 'Sin CI' }}
            </span>
          </q-td>
        </template>

        <!-- COLUMNA TIPO DE CONTRATO (3FN) -->
        <template v-slot:body-cell-tipo_contrato="props">
          <q-td :props="props">
            <q-badge
              v-if="props.row.tipo_contrato"
              color="slate-800"
              text-color="white"
              class="q-px-sm text-weight-bold"
            >
              {{ props.row.tipo_contrato.nombre }}
            </q-badge>
            <span v-else class="text-grey-6 text-caption">Sin contrato</span>
          </q-td>
        </template>

        <!-- COLUMNA CARGO -->
        <template v-slot:body-cell-cargo="props">
          <q-td :props="props">
            <div class="text-weight-medium text-grey-9">
              {{ props.row.cargo || 'Sin cargo asignado' }}
            </div>
          </q-td>
        </template>

        <!-- COLUMNA UBICACIÓN (SEDE -> ARCHIVADOR -> GAVETA) -->
        <template v-slot:body-cell-ubicacion="props">
          <q-td :props="props">
            <div v-if="props.row.cajon" class="row items-center no-wrap text-caption text-grey-8">
              <q-icon name="meeting_room" size="14px" color="primary" class="q-mr-xs" />
              <div>
                <span class="text-weight-bold">{{ props.row.sede?.nombre || props.row.cajon.mueble?.sede?.nombre || 'Sede' }}</span>
                ➔ {{ props.row.cajon.mueble?.nombre }}
                ➔ <span class="text-primary text-weight-bold">
                  {{ props.row.cajon.columna === 1 ? `Gaveta ${props.row.cajon.fila}` : `Col ${String.fromCharCode(64 + props.row.cajon.columna)} - Gaveta ${props.row.cajon.fila}` }}
                </span>
              </div>
            </div>
            <div v-else class="row items-center no-wrap text-caption">
              <q-badge color="slate-800" text-color="white" class="text-weight-bold">
                <q-icon name="all_inbox" size="12px" class="q-mr-xs" />
                Gaveta Virtual
              </q-badge>
              <span class="q-ml-xs text-grey-7" v-if="props.row.sede">({{ props.row.sede.nombre }})</span>
            </div>
          </q-td>
        </template>

        <!-- COLUMNA ESTADO -->
        <template v-slot:body-cell-estado="props">
          <q-td :props="props">
            <q-chip
              :color="props.row.estado === 0 ? 'primary' : 'slate-700'"
              text-color="white"
              dense
              size="sm"
              class="text-weight-bold"
            >
              {{ props.row.estado === 0 ? 'PRESENTE' : (props.row.estado === 1 ? 'AUSENTE' : 'PRESTADO') }}
            </q-chip>
          </q-td>
        </template>

        <!-- COLUMNA ACCIONES -->
        <template v-slot:body-cell-acciones="props">
          <q-td :props="props" class="text-right">
            <div class="row q-gutter-xs justify-end no-wrap">
              <!-- VER HISTORIAL -->
              <q-btn
                flat
                round
                dense
                color="primary"
                icon="history"
                size="sm"
                @click="openHistory(props.row)"
              >
                <q-tooltip>Ver historial de movimientos y cambios</q-tooltip>
              </q-btn>

              <!-- EDITAR / TRASLADAR -->
              <q-btn
                flat
                round
                dense
                color="primary"
                icon="edit"
                size="sm"
                @click="openEdit(props.row)"
              >
                <q-tooltip>Modificar datos o trasladar</q-tooltip>
              </q-btn>

              <!-- ELIMINAR -->
              <q-btn
                flat
                round
                dense
                color="negative"
                icon="delete"
                size="sm"
                @click="confirmDelete(props.row)"
              >
                <q-tooltip>Eliminar ficha</q-tooltip>
              </q-btn>
            </div>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- DIÁLOGOS -->
    <ImportPersonalDialog
      v-model="importDialogOpen"
      @import-complete="onImportComplete"
    />
    <NewEmpleadoDialog v-model="newDialogOpen" />
    <EditPersonalDialog
      v-model="editDialogOpen"
      :persona="selectedPersona"
      @updated="onPersonalUpdated"
    />
    <KardexHistoryDialog
      v-model="historyDialogOpen"
      :kardex="selectedPersona"
    />

    <!-- DIÁLOGO CONFIRMAR ELIMINACIÓN -->
    <q-dialog v-model="deleteDialogOpen" persistent>
      <q-card style="min-width: 350px; border-radius: 10px;">
        <q-card-section class="bg-negative text-white row items-center q-gutter-sm">
          <q-icon name="warning" size="24px" />
          <div class="text-h6 font-weight-bold">¿Eliminar personal?</div>
        </q-card-section>
        <q-card-section class="q-pt-md">
          <p class="text-body2 text-grey-8">
            Se eliminará definitivamente el expediente de <strong>{{ personaToDelete?.nombre_completo }}</strong>.
          </p>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md q-pt-none">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn unelevated color="negative" label="Sí, Eliminar" :loading="deleting" @click="executeDelete" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useGeosStore } from 'src/stores/geosStore';
import ImportPersonalDialog from 'src/components/Personal/ImportPersonalDialog.vue';
import NewEmpleadoDialog from 'src/components/Kardex/NewEmpleadoDialog.vue';
import EditPersonalDialog from 'src/components/Personal/EditPersonalDialog.vue';
import KardexHistoryDialog from 'src/components/Kardex/KardexHistoryDialog.vue';

const $q = useQuasar();
const store = useGeosStore();

const filterSearch = ref('');
const filterSedeId = ref(null);
const filterContratoId = ref(null);

const importDialogOpen = ref(false);
const newDialogOpen = ref(false);
const editDialogOpen = ref(false);
const historyDialogOpen = ref(false);
const deleteDialogOpen = ref(false);
const deleting = ref(false);

const selectedPersona = ref(null);
const personaToDelete = ref(null);

const formatNombreOrdenado = (p) => {
  if (!p) return '';
  const pAp = p.primer_apellido ? p.primer_apellido.trim() : '';
  const sAp = p.segundo_apellido ? p.segundo_apellido.trim() : '';
  const nom = p.nombres ? p.nombres.trim() : '';
  const apellidos = [pAp, sAp].filter(Boolean).join(' ');
  if (apellidos && nom) {
    return `${apellidos} ${nom}`;
  }
  return p.nombre_completo || [apellidos, nom].filter(Boolean).join(' ');
};

const columns = [
  { name: 'documento_identidad', label: 'CI / DOC', field: 'documento_identidad', align: 'left', sortable: true },
  { name: 'nombre_completo', label: 'APELLIDOS Y NOMBRES', field: row => formatNombreOrdenado(row), align: 'left', sortable: true },
  { name: 'tipo_contrato', label: 'RÉGIMEN CONTRACTUAL', field: row => row.tipo_contrato?.nombre, align: 'left', sortable: true },
  { name: 'cargo', label: 'CARGO', field: 'cargo', align: 'left', sortable: true },
  { name: 'ubicacion', label: 'UBICACIÓN FÍSICA', field: row => row.cajon?.mueble?.nombre, align: 'left', sortable: true },
  { name: 'estado', label: 'ESTADO', field: 'estado', align: 'center', sortable: true },
  { name: 'acciones', label: 'ACCIONES', align: 'right' },
];

const sedeFilterOptions = computed(() => {
  const all = [{ id: null, label: 'Todas las Sedes' }];
  const list = (store.sedes || []).map(s => ({ id: s.id, label: s.nombre }));
  return [...all, ...list];
});

const contratoFilterOptions = computed(() => {
  const all = [{ id: null, label: 'Todos los Contratos' }];
  const list = (store.tiposContrato || []).map(t => ({ id: t.id, label: t.nombre }));
  return [...all, ...list];
});

const filteredPersonal = computed(() => {
  let list = [...(store.personal || [])];

  list.sort((a, b) => {
    const apA = (a.primer_apellido || '').trim().toLowerCase();
    const apB = (b.primer_apellido || '').trim().toLowerCase();
    if (apA !== apB) return apA.localeCompare(apB, 'es', { sensitivity: 'base' });
    const sApA = (a.segundo_apellido || '').trim().toLowerCase();
    const sApB = (b.segundo_apellido || '').trim().toLowerCase();
    if (sApA !== sApB) return sApA.localeCompare(sApB, 'es', { sensitivity: 'base' });
    const nomA = (a.nombres || a.nombre_completo || '').trim().toLowerCase();
    const nomB = (b.nombres || b.nombre_completo || '').trim().toLowerCase();
    return nomA.localeCompare(nomB, 'es', { sensitivity: 'base' });
  });

  if (filterSedeId.value) {
    list = list.filter(p => p.sede_id === filterSedeId.value || p.cajon?.mueble?.sede_id === filterSedeId.value);
  }

  if (filterContratoId.value) {
    list = list.filter(p => p.tipo_contrato_id === filterContratoId.value);
  }

  if (filterSearch.value && filterSearch.value.trim()) {
    const q = filterSearch.value.toLowerCase().trim();
    list = list.filter(p => {
      const nombre = (p.nombre_completo || '').toLowerCase();
      const pAp = (p.primer_apellido || '').toLowerCase();
      const sAp = (p.segundo_apellido || '').toLowerCase();
      const nom = (p.nombres || '').toLowerCase();
      const doc = (p.documento_identidad || '').toLowerCase();
      const cod = (p.codigo_archivo || '').toLowerCase();
      const cargo = (p.cargo || '').toLowerCase();
      return nombre.includes(q) || pAp.includes(q) || sAp.includes(q) || nom.includes(q) || doc.includes(q) || cod.includes(q) || cargo.includes(q);
    });
  }

  return list;
});

const openImportDialog = () => {
  importDialogOpen.value = true;
};

const onImportComplete = () => {
  store.fetchPersonal();
  store.fetchSinAsignar();
  store.fetchMuebles();
};

const openNewDialog = () => {
  newDialogOpen.value = true;
};

const openEdit = (row) => {
  selectedPersona.value = row;
  editDialogOpen.value = true;
};

const openHistory = (row) => {
  selectedPersona.value = row;
  historyDialogOpen.value = true;
};

const confirmDelete = (row) => {
  personaToDelete.value = row;
  deleteDialogOpen.value = true;
};

const executeDelete = async () => {
  if (!personaToDelete.value) return;
  deleting.value = true;
  const ok = await store.deletePersonal(personaToDelete.value.id);
  deleting.value = false;
  if (ok) {
    deleteDialogOpen.value = false;
    $q.notify({
      type: 'positive',
      icon: 'delete',
      message: 'Ficha de personal eliminada correctamente'
    });
  } else {
    $q.notify({ type: 'negative', message: 'Error al eliminar el personal' });
  }
};

const onPersonalUpdated = () => {
  store.fetchPersonal();
};

onMounted(() => {
  store.fetchCatalogos();
  store.fetchPersonal();
  store.fetchMuebles();
});
</script>

<style scoped>
.personal-page-canvas {
  background: radial-gradient(circle at top right, #ffffff 0%, #f8fafc 45%, #f1f5f9 100%);
  min-height: 100vh;
}

.header-icon-badge {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: #1e293b;
  border: 1px solid #334155;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.2);
}

.text-slate-900 { color: #0f172a; }
.text-slate-700 { color: #334155; }
.text-slate-500 { color: #64748b; }

.header-tag {
  border-radius: 6px;
  font-size: 11px;
  padding: 3px 8px;
}

.action-btn-import {
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #cbd5e1;
  padding: 8px 16px;
  border-radius: 10px;
  font-weight: 700;
  transition: all 0.2s ease;
}

.action-btn-import:hover {
  background: #e2e8f0;
  color: #0f172a;
  transform: translateY(-1px);
}

.action-btn-primary {
  background: #2563eb;
  color: white;
  padding: 8px 16px;
  border-radius: 10px;
  font-weight: 700;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
  transition: all 0.2s ease;
}

.action-btn-primary:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
}

.font-monospace {
  font-family: 'Courier New', Courier, monospace;
}
</style>
