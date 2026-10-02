<template>
  <div class="gaveta-virtual-wrapper q-mb-md">
    <q-card class="gaveta-virtual-card" flat>
      <!-- BARRA SUPERIOR DEL DOCK -->
      <div class="row items-center justify-between q-pa-sm bg-virtual text-white q-gutter-y-xs flex-wrap">
        <div class="row items-center q-gutter-sm cursor-pointer" @click="expanded = !expanded">
          <div class="virtual-icon-badge flex flex-center">
            <q-icon name="cloud_queue" size="20px" color="white" />
          </div>
          <div>
            <div class="row items-center q-gutter-xs">
              <span class="text-subtitle1 text-weight-bolder" style="letter-spacing: -0.01em;">GAVETA VIRTUAL</span>
              <q-badge class="virtual-tag-permanent">
                Bandeja de Entrada
              </q-badge>
              <q-badge :class="totalCount > 0 ? 'virtual-tag-count-active' : 'virtual-tag-count-empty'">
                {{ totalCount }} sin archivar
              </q-badge>
            </div>
            <div class="text-caption text-indigo-1" style="font-size: 11px;">
              Arrastra expedientes hacia las gavetas físicas, o suelta aquí para desasignarlos
            </div>
          </div>
        </div>

        <div class="row items-center q-gutter-xs">
          <!-- BOTÓN IMPORTAR EXCEL -->
          <q-btn
            dense
            unelevated
            color="amber-4"
            text-color="dark"
            icon="upload_file"
            label="Importar Excel"
            class="text-weight-bold q-px-sm"
            style="border-radius: 8px;"
            @click="importDialogOpen = true"
          />

          <!-- FILTRO POR SEDE DENTRO DE LA GAVETA VIRTUAL -->
          <q-select
            v-model="filtroSedeVirtual"
            :options="sedeOptions"
            option-value="id"
            option-label="label"
            emit-value
            map-options
            dense
            outlined
            dark
            color="white"
            bg-color="indigo-9"
            class="filter-select"
            label="Filtrar sede"
          />

          <q-btn
            flat
            round
            dense
            color="white"
            :icon="expanded ? 'expand_less' : 'expand_more'"
            @click="expanded = !expanded"
            :title="expanded ? 'Contraer' : 'Expandir'"
          />
        </div>
      </div>

      <!-- ÁREA INTERACTIVA DRAGGABLE -->
      <q-slide-transition>
        <div v-show="expanded" class="dock-content-body q-pa-sm border-top">
          <!-- DROPZONE DRAGGABLE -->
          <draggable
            v-model="localSinAsignar"
            group="expedientes"
            item-key="id"
            class="virtual-dropzone row q-gutter-xs items-center"
            :class="{ 'dropzone-empty': filteredList.length === 0 }"
            @change="handleDropChange"
            @start="$emit('drag-start')"
            @end="$emit('drag-end')"
          >
            <template #item="{ element }">
              <div class="virtual-folder-chip" :title="element.nombre_completo">
                <div class="row items-center q-gutter-xs no-wrap">
                  <q-icon name="folder_open" size="18px" color="deep-purple-8" />
                  <span class="text-weight-bold text-caption ellipsis" style="max-width: 170px;">
                    #{{ element.numero_unico || element.codigo_archivo }} {{ formatChipName(element) }}
                  </span>
                  <q-badge
                    v-if="element.tipo_contrato"
                    :color="element.tipo_contrato.color || 'primary'"
                    text-color="white"
                    style="font-size: 8px; padding: 1px 3px;"
                  >
                    {{ element.tipo_contrato.codigo || element.tipo_contrato.nombre }}
                  </q-badge>
                  <q-badge
                    v-if="element.sede"
                    color="blue-grey-7"
                    text-color="white"
                    style="font-size: 8px; padding: 1px 3px;"
                  >
                    {{ element.sede.nombre }}
                  </q-badge>
                  <q-btn
                    flat
                    round
                    dense
                    size="xs"
                    icon="visibility"
                    color="grey-7"
                    @click.stop="$emit('open-kardex', element)"
                  />
                </div>
              </div>
            </template>

            <template #footer>
              <div v-if="filteredList.length === 0" class="col-12 text-center q-pa-sm text-grey-6 text-caption row items-center justify-center q-gutter-xs">
                <q-icon name="inbox" size="20px" />
                <span>Bandeja vacía. Suelta aquí expedientes de las gavetas para enviarlos a la gaveta virtual.</span>
              </div>
            </template>
          </draggable>
        </div>
      </q-slide-transition>
    </q-card>

    <ImportPersonalDialog
      v-model="importDialogOpen"
      @import-complete="onImportComplete"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useGeosStore } from 'src/stores/geosStore';
import draggable from 'vuedraggable';
import ImportPersonalDialog from 'src/components/Personal/ImportPersonalDialog.vue';

defineEmits(['drag-start', 'drag-end', 'open-kardex']);

const $q = useQuasar();
const store = useGeosStore();
const importDialogOpen = ref(false);
const expanded = ref(true);
const filtroSedeVirtual = ref(null);

const onImportComplete = () => {
  store.fetchSinAsignar();
  store.fetchMuebles();
  store.fetchPersonal();
};

const totalCount = computed(() => (store.expedientesSinAsignar || []).length);

const sedeOptions = computed(() => {
  const opts = [{ label: 'Todas las sedes', id: null }];
  (store.sedes || []).forEach(s => opts.push({ label: s.nombre, id: s.id }));
  return opts;
});

const formatChipName = (e) => {
  if (!e) return '';
  const pAp = e.primer_apellido ? e.primer_apellido.trim() : '';
  const sAp = e.segundo_apellido ? e.segundo_apellido.trim() : '';
  const nom = e.nombres ? e.nombres.trim() : '';
  const apellidos = [pAp, sAp].filter(Boolean).join(' ');
  if (apellidos && nom) {
    return `${apellidos} ${nom}`;
  }
  return e.nombre_completo || [apellidos, nom].filter(Boolean).join(' ');
};

const filteredList = computed(() => {
  let list = [...(store.expedientesSinAsignar || [])];

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

  if (filtroSedeVirtual.value !== null && filtroSedeVirtual.value !== undefined) {
    list = list.filter(e => e.sede_id === filtroSedeVirtual.value);
  }
  return list;
});

// Getter and setter for vuedraggable group="expedientes"
const localSinAsignar = computed({
  get: () => filteredList.value,
  set: () => {
    // Mutations handled by events
  }
});

const handleDropChange = async (evt) => {
  // Si se soltó un expediente adentro de la gaveta virtual (added)
  if (evt.added) {
    const emp = evt.added.element;
    const res = await store.updateEmpleadoUbicacion(emp.id, null);
    if (res && res.success) {
      $q.notify({
        type: 'positive',
        icon: 'all_inbox',
        message: `#${emp.numero_unico || emp.codigo_archivo} movido a la Gaveta Virtual (Sin Asignar)`,
        position: 'top-right'
      });
    } else {
      $q.notify({
        type: 'negative',
        message: res?.message || 'Error al mover a la gaveta virtual',
        position: 'top-right'
      });
    }
  }
};
</script>

<style scoped>
.gaveta-virtual-card {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #c7d2fe;
  box-shadow: 0 4px 20px -2px rgba(79, 70, 229, 0.15);
}

.virtual-icon-badge {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.bg-virtual {
  background: linear-gradient(135deg, #4338ca 0%, #4f46e5 50%, #3730a3 100%);
}

.virtual-tag-permanent {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.35);
  font-weight: 700;
  border-radius: 6px;
}

.virtual-tag-count-active {
  background: #f43f5e;
  color: #ffffff;
  font-weight: 800;
  border-radius: 6px;
}

.virtual-tag-count-empty {
  background: rgba(255, 255, 255, 0.15);
  color: #cbd5e1;
  font-weight: 600;
  border-radius: 6px;
}

.border-top {
  border-top: 1px solid #e0e7ff;
}

.filter-select {
  min-width: 170px;
  max-width: 220px;
}

.virtual-dropzone {
  min-height: 52px;
  max-height: 180px;
  overflow-y: auto;
  padding: 8px;
  border: 2px dashed #c7d2fe;
  border-radius: 12px;
  background: #f5f7ff;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  transition: all 0.2s ease;
}

.dropzone-empty {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.virtual-folder-chip {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 5px 10px;
  cursor: grab;
  user-select: none;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}

.virtual-folder-chip:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(79, 70, 229, 0.18);
  border-color: #818cf8;
}
</style>
