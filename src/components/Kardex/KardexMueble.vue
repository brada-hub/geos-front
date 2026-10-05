<template>
  <q-card
    flat
    bordered
    class="mueble-card column no-wrap full-height"
    :class="{ 'mueble-drag-target': isDragOver }"
    @dragenter="onCardDragEnter"
    @dragover="onCardDragOver"
    @dragleave="onCardDragLeave"
    @drop="onCardDrop"
  >
    <!-- OVERLAY DE ACOPLE POR DRAG & DROP -->
    <div v-if="isDragOver" class="drop-overlay flex flex-center column">
      <q-icon name="merge_type" size="44px" color="white" />
      <div class="text-subtitle2 text-weight-bolder text-white q-mt-xs text-center q-px-sm">
        {{ store.dragContext?.type === 'columna' ? `Acoplar columna a ${mueble.nombre}` : `Unir con ${mueble.nombre}` }}
      </div>
      <div class="text-caption text-white" style="font-size: 11px;">Suelta para fusionar</div>
    </div>

    <!-- CABECERA DEL ARCHIVADOR -->
    <q-card-section class="mueble-header text-white q-py-sm q-px-md">
      <div class="row items-center justify-between no-wrap">
        <div class="row items-center q-gutter-xs ellipsis">
          <q-icon
            name="drag_indicator"
            size="18px"
            class="drag-handle cursor-move text-slate-400"
            title="Arrastra para cambiar de lugar en la pantalla"
          />
          <q-icon name="inventory_2" size="18px" color="white" />
          <div class="text-subtitle1 text-weight-bolder ellipsis text-slate-100" :title="mueble.nombre">
            {{ mueble.nombre }}
          </div>
        </div>

        <div class="row items-center q-gutter-xs">
          <!-- BOTÓN UNIR / FUSIONAR -->
          <q-btn
            v-if="otherMuebles.length > 0"
            dense
            no-caps
            size="xs"
            color="primary"
            text-color="white"
            icon="merge_type"
            label="Unir"
            class="cursor-grab no-sort q-px-xs text-weight-bold btn-unir"
            draggable="true"
            @dragstart="onMuebleDragStart($event)"
            @dragend="onMuebleDragEnd"
            @click="openFusionarDialog"
          >
            <q-tooltip anchor="top middle" self="bottom middle">
              Arrastra sobre otro archivador para fusionarlos, o haz clic para elegir
            </q-tooltip>
          </q-btn>
          <!-- BADGE EXPEDIENTES -->
          <q-badge
            class="mueble-exp-badge"
          >
            {{ totalExpedientes }} exp.
          </q-badge>

          <!-- MENU ACCIONES -->
          <q-btn flat round dense icon="more_vert" color="grey-4" size="sm">
            <q-menu auto-close anchor="bottom right" self="top right">
              <q-list dense style="min-width: 200px">
                <!-- FUSIONAR / UNIR A OTRO MUEBLE -->
                <q-item v-if="otherMuebles.length > 0" clickable @click="openFusionarDialog">
                  <q-item-section avatar>
                    <q-icon name="merge_type" size="18px" color="primary" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Unir a otro archivador</q-item-label>
                    <q-item-label caption>Consolidar en un solo mueble</q-item-label>
                  </q-item-section>
                </q-item>

                <!-- SEPARAR EN TORRES SI ES MULTI-COLUMNA -->
                <q-item v-if="mueble.columnas > 1" clickable @click="openDesacoplarDialog">
                  <q-item-section avatar>
                    <q-icon name="call_split" size="18px" color="slate-7" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Separar en torres</q-item-label>
                    <q-item-label caption>Divide en {{ mueble.columnas }} muebles</q-item-label>
                  </q-item-section>
                </q-item>

                <q-separator v-if="otherMuebles.length > 0 || mueble.columnas > 1" />

                <q-item clickable @click="addDrawer">
                  <q-item-section avatar>
                    <q-icon name="add_circle" size="18px" color="primary" />
                  </q-item-section>
                  <q-item-section>Añadir gaveta (+1)</q-item-section>
                </q-item>

                <q-item clickable @click="openRenameDialog">
                  <q-item-section avatar>
                    <q-icon name="edit" size="18px" color="primary" />
                  </q-item-section>
                  <q-item-section>Renombrar</q-item-section>
                </q-item>

                <q-separator />

                <q-item clickable @click="openDeleteDialog" class="text-negative">
                  <q-item-section avatar>
                    <q-icon name="delete" size="18px" color="negative" />
                  </q-item-section>
                  <q-item-section>Eliminar mueble</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </div>
    </q-card-section>

    <!-- CUERPO DEL ARCHIVADOR -->
    <q-card-section class="col q-pa-sm mueble-body">
      <!-- CABECERAS DE COLUMNA (CON DRAG & DROP PARA SEPARAR O ACOPLAR) -->
      <div
        class="row no-wrap q-col-gutter-xs q-mb-xs"
      >
        <div
          v-for="c in uniqueColumns"
          :key="c"
          class="col"
        >
          <div
            class="col-header-box row items-center justify-between q-px-xs q-py-xs cursor-grab"
            draggable="true"
            @dragstart="onColumnDragStart($event, c)"
            @dragend="onColumnDragEnd"
            :title="mueble.columnas > 1 ? '¡Arrastra esta columna abajo para separarla, o a otro mueble para unirla!' : '¡Arrastra esta columna sobre otro mueble para consolidarlos!'"
          >
            <div class="row items-center q-gutter-none">
              <q-icon name="drag_indicator" size="14px" color="slate-400" />
              <span class="text-caption text-weight-bolder text-slate-700" style="font-size: 11px;">
                Col. {{ columnLetter(c) }}
              </span>
            </div>
            <q-btn
              flat
              round
              dense
              size="xs"
              icon="open_in_new"
              color="primary"
              :title="mueble.columnas > 1 ? 'Mover o extraer esta columna' : 'Mover esta columna a otro archivador'"
              @click.stop="openExtractDialog(c)"
            >
              <q-tooltip anchor="top middle" self="bottom middle">
                {{ mueble.columnas > 1 ? `Extraer o trasladar Columna ${columnLetter(c)}` : `Mover Columna ${columnLetter(c)} a otro archivador` }}
              </q-tooltip>
            </q-btn>
          </div>
        </div>
      </div>

      <div
        class="mueble-grid"
        :style="`grid-template-columns: repeat(${mueble.columnas || 1}, 1fr);`"
      >
        <KardexDrawer
          v-for="cajon in sortedCajones"
          :key="cajon.id"
          :cajon="cajon"
          :is-highlighted="highlightedCajones.has(cajon.id)"
          :is-targeted="targetedCajonId === cajon.id"
          @open="$emit('open-drawer', cajon)"
          @configure="(c) => $emit('configure-drawer', c)"
          @drag-change="(evt, id) => $emit('drag-change', evt, id)"
        />
      </div>
    </q-card-section>

    <!-- BASE / ZÓCALO DEL MUEBLE -->
    <div class="mueble-base row justify-between items-center q-px-sm">
      <div class="row items-center q-gutter-xs">
        <span class="text-caption text-slate-500" style="font-size: 11px; font-weight: 600;">
          {{ mueble.cajones?.length || 0 }} gavetas
        </span>
        <q-btn
          flat
          dense
          size="xs"
          icon="add"
          label="Gaveta"
          color="primary"
          class="q-px-xs text-weight-bold"
          style="font-size: 10px;"
          title="Añadir una gaveta más a este archivador"
          :loading="addingDrawer"
          @click="addDrawer"
        />
      </div>
      <div class="row q-gutter-xs">
        <div class="mueble-leg"></div>
        <div class="mueble-leg"></div>
      </div>
    </div>


    <!-- DIÁLOGO GESTIÓN DE COLUMNA (EXTRAER O TRASLADAR) -->
    <q-dialog v-model="extractDialogOpen" persistent>
      <q-card style="min-width: 380px; max-width: 460px; border-radius: 12px;">
        <q-card-section class="bg-primary text-white row items-center q-gutter-sm">
          <q-icon name="view_column" size="24px" />
          <div class="text-h6 font-weight-bold">Mover Columna {{ columnLetter(selectedCol) }}</div>
        </q-card-section>

        <q-card-section class="q-pt-md">
          <div class="text-caption text-grey-8 q-mb-sm">
            ¿Qué deseas hacer con todas las gavetas de la <strong>Columna {{ columnLetter(selectedCol) }}</strong>?
          </div>

          <q-btn-toggle
            v-if="mueble.columnas > 1"
            v-model="extractMode"
            spread
            no-caps
            unelevated
            class="q-mb-md"
            toggle-color="primary"
            color="grey-3"
            text-color="dark"
            :options="[
              { label: 'Separar como nuevo', value: 'nuevo', icon: 'add_box' },
              { label: 'Mover a otro mueble', value: 'mover', icon: 'drive_file_move', disable: otherMuebles.length === 0 }
            ]"
          />

          <div v-if="extractMode === 'nuevo'">
            <p class="text-caption text-grey-7">
              Se creará un archivador independiente de 1 columna con estas gavetas y sus carpetas.
            </p>
            <q-input
              v-model="extractNewName"
              outlined
              dense
              label="Nombre del nuevo archivador"
            />
          </div>

          <div v-else>
            <p class="text-caption text-grey-7">
              Se anexará esta columna completa como una nueva columna en el archivador seleccionado:
            </p>
            <q-select
              v-model="selectedTargetMueble"
              :options="otherMuebles"
              option-label="nombre"
              option-value="id"
              emit-value
              map-options
              outlined
              dense
              label="Selecciona archivador destino"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md q-pt-none">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn
            unelevated
            :label="extractMode === 'nuevo' ? 'Crear Archivador' : 'Trasladar Columna'"
            color="primary"
            :loading="extracting"
            @click="executeColumnAction"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- DIÁLOGO FUSIONAR / UNIR A OTRO MUEBLE -->
    <q-dialog v-model="fusionarDialogOpen" persistent>
      <q-card style="min-width: 360px; max-width: 440px; border-radius: 12px;">
        <q-card-section class="bg-indigo text-white row items-center q-gutter-sm">
          <q-icon name="merge_type" size="24px" />
          <div class="text-h6 font-weight-bold">Unir archivador</div>
        </q-card-section>

        <q-card-section class="q-pt-md">
          <p class="text-body2 text-grey-8">
            Consolida <strong>"{{ mueble.nombre }}"</strong> dentro de otro archivador existente. Todas sus columnas y gavetas se anexarán al mueble elegido formando un solo grupo.
          </p>

          <q-select
            v-model="fusionarTargetId"
            :options="otherMuebles"
            option-label="nombre"
            option-value="id"
            emit-value
            map-options
            outlined
            dense
            label="Archivador donde se consolidará"
            class="q-mt-sm"
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md q-pt-none">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn
            unelevated
            label="Unir y Consolidar"
            color="primary"
            :loading="fusionando"
            :disable="!fusionarTargetId"
            @click="executeFusionar"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- DIÁLOGO DESACOPLAR TODAS LAS COLUMNAS -->
    <q-dialog v-model="desacoplarDialogOpen" persistent>
      <q-card style="min-width: 360px; max-width: 440px; border-radius: 12px;">
        <q-card-section class="bg-slate-900 text-white row items-center q-gutter-sm">
          <q-icon name="call_split" size="22px" />
          <div class="text-h6 font-weight-bold">Separar en torres individuales</div>
        </q-card-section>

        <q-card-section class="q-pt-md">
          <p class="text-body2 text-grey-8">
            Este mueble tiene <strong>{{ mueble.columnas }} columnas</strong>. Se dividirá en <strong>{{ mueble.columnas }} archivadores independientes de 1 columna</strong> (Torre A, Torre B, Torre C...).
          </p>
          <p class="text-caption text-grey-7">
            Cada torre se podrá mover, arrastrar y reordenar por separado en la pantalla. Todas las carpetas y gavetas se mantendrán intactas.
          </p>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md q-pt-none">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn
            unelevated
            label="Dividir en torres"
            color="primary"
            :loading="desacoplando"
            @click="executeDesacoplar"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- DIÁLOGO CONFIRMAR ELIMINACIÓN -->
    <q-dialog v-model="deleteDialogOpen" persistent>
      <q-card style="min-width: 360px; max-width: 420px; border-radius: 10px;">
        <q-card-section class="bg-negative text-white row items-center q-gutter-sm">
          <q-icon name="warning" size="24px" />
          <div class="text-h6">¿Eliminar archivador?</div>
        </q-card-section>

        <q-card-section class="q-pt-md">
          <div class="text-body1 text-weight-medium q-mb-xs">
            "{{ mueble.nombre }}"
          </div>
          <p class="text-body2 text-grey-8" v-if="totalExpedientes > 0">
            Contiene <strong>{{ totalExpedientes }} expedientes</strong> guardados. Si lo eliminas, sus {{ mueble.cajones?.length || 0 }} gavetas se borrarán pero <strong>los expedientes no se eliminarán</strong> (quedarán sin gaveta asignada).
          </p>
          <p class="text-body2 text-grey-8" v-else>
            Se eliminarán este archivador y sus {{ mueble.cajones?.length || 0 }} gavetas. Esta acción no se puede deshacer.
          </p>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md q-pt-none">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn
            unelevated
            label="Sí, eliminar"
            color="negative"
            :loading="deleting"
            @click="executeDelete"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- DIÁLOGO RENOMBRAR -->
    <q-dialog v-model="renameDialogOpen" persistent>
      <q-card style="min-width: 340px; border-radius: 10px;">
        <q-card-section class="bg-primary text-white row items-center q-gutter-sm">
          <q-icon name="edit" size="22px" />
          <div class="text-h6">Renombrar Archivador</div>
        </q-card-section>

        <q-card-section class="q-pt-md">
          <q-input
            v-model="newNameInput"
            outlined
            dense
            label="Nombre del archivador"
            autofocus
            @keyup.enter="executeRename"
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md q-pt-none">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn
            unelevated
            label="Guardar"
            color="primary"
            :loading="renaming"
            @click="executeRename"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-card>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useGeosStore } from 'src/stores/geosStore';
import KardexDrawer from './KardexDrawer.vue';

const $q = useQuasar();
const store = useGeosStore();

const props = defineProps({
  mueble: {
    type: Object,
    required: true
  },
  highlightedCajones: {
    type: Set,
    default: () => new Set()
  },
  targetedCajonId: {
    type: [Number, String],
    default: null
  }
});

defineEmits(['open-drawer', 'configure-drawer', 'drag-change']);

// Drag & Drop interactivo entre muebles y columnas
const isDragOver = ref(false);
let dragCounter = 0;

const onMuebleDragStart = (evt) => {
  evt.stopPropagation();
  evt.dataTransfer.effectAllowed = 'move';
  evt.dataTransfer.setData('text/plain', JSON.stringify({ type: 'mueble', id: props.mueble.id }));
  store.setDragContext({ type: 'mueble', muebleId: props.mueble.id, nombre: props.mueble.nombre });
};

const onMuebleDragEnd = () => {
  store.clearDragContext();
};

const onColumnDragStart = (evt, colNum) => {
  evt.stopPropagation();
  evt.dataTransfer.effectAllowed = 'move';
  evt.dataTransfer.setData('text/plain', JSON.stringify({ type: 'columna', muebleId: props.mueble.id, columna: colNum }));
  store.setDragContext({ type: 'columna', muebleId: props.mueble.id, columna: colNum, muebleNombre: props.mueble.nombre });
};

const onColumnDragEnd = () => {
  store.clearDragContext();
};

const onCardDragEnter = (evt) => {
  const ctx = store.dragContext;
  if (!ctx || ctx.muebleId === props.mueble.id) return;
  evt.preventDefault();
  dragCounter++;
  if (dragCounter === 1) {
    isDragOver.value = true;
  }
};

const onCardDragOver = (evt) => {
  const ctx = store.dragContext;
  if (!ctx || ctx.muebleId === props.mueble.id) return;
  evt.preventDefault();
  evt.dataTransfer.dropEffect = 'move';
  if (!isDragOver.value) {
    isDragOver.value = true;
  }
};

const onCardDragLeave = () => {
  const ctx = store.dragContext;
  if (!ctx || ctx.muebleId === props.mueble.id) return;
  dragCounter--;
  if (dragCounter <= 0) {
    dragCounter = 0;
    isDragOver.value = false;
  }
};

const onCardDrop = async (evt) => {
  dragCounter = 0;
  isDragOver.value = false;
  const ctx = store.dragContext;
  if (!ctx || ctx.muebleId === props.mueble.id) return;

  evt.preventDefault();
  evt.stopPropagation();

  if (ctx.type === 'mueble') {
    const ok = await store.fusionarMuebles(ctx.muebleId, props.mueble.id);
    if (ok) {
      $q.notify({
        type: 'positive',
        icon: 'auto_awesome',
        message: `¡Archivadores unidos y consolidados en "${props.mueble.nombre}"!`
      });
    }
    store.clearDragContext();
  } else if (ctx.type === 'columna') {
    const ok = await store.moverColumnaMueble(ctx.muebleId, {
      columna: ctx.columna,
      mueble_destino_id: props.mueble.id
    });
    if (ok) {
      $q.notify({
        type: 'positive',
        icon: 'auto_awesome',
        message: `¡Columna acoplada dentro de "${props.mueble.nombre}"!`
      });
    }
    store.clearDragContext();
  }
};

// Otros muebles disponibles para fusionar o trasladar
const otherMuebles = computed(() => {
  return (store.muebles || []).filter(m => m.id !== props.mueble.id);
});

// Estados de los diálogos locales
const deleteDialogOpen = ref(false);
const deleting = ref(false);

const renameDialogOpen = ref(false);
const newNameInput = ref('');
const renaming = ref(false);

const addingDrawer = ref(false);

// Estado para extraer o mover columna
const extractDialogOpen = ref(false);
const selectedCol = ref(1);
const extractMode = ref('nuevo'); // 'nuevo' o 'mover'
const extractNewName = ref('');
const selectedTargetMueble = ref(null);
const extracting = ref(false);

// Estado para fusionar mueble
const fusionarDialogOpen = ref(false);
const fusionarTargetId = ref(null);
const fusionando = ref(false);

// Estado para desacoplar
const desacoplarDialogOpen = ref(false);
const desacoplando = ref(false);

// Columnas únicas presentes en el mueble
const uniqueColumns = computed(() => {
  if (!props.mueble.cajones) return [];
  const cols = [...new Set(props.mueble.cajones.map(c => c.columna))].sort((a, b) => a - b);
  return cols.length > 0 ? cols : [1];
});

// Letra de la columna (1->A, 2->B, etc.)
const columnLetter = (col) => String.fromCharCode(64 + col);

// Ordenar cajones por fila y columna
const sortedCajones = computed(() => {
  if (!props.mueble.cajones) return [];
  return [...props.mueble.cajones].sort((a, b) => {
    if (a.fila !== b.fila) return a.fila - b.fila;
    return a.columna - b.columna;
  });
});

// Total de expedientes en este mueble
const totalExpedientes = computed(() => {
  if (!props.mueble.cajones) return 0;
  return props.mueble.cajones.reduce((acc, c) => acc + (c.empleados?.length || 0), 0);
});

// Añadir gaveta al archivador
const addDrawer = async () => {
  addingDrawer.value = true;
  const ok = await store.addCajon(props.mueble.id);
  addingDrawer.value = false;
  if (ok) {
    $q.notify({
      type: 'positive',
      icon: 'add_circle',
      message: `Nueva gaveta añadida a "${props.mueble.nombre}".`
    });
  } else {
    $q.notify({ type: 'negative', message: 'Error al añadir la gaveta' });
  }
};

// Abrir diálogo de columna (extraer o mover)
const openExtractDialog = (colNum) => {
  selectedCol.value = colNum;
  extractMode.value = props.mueble.columnas > 1 ? 'nuevo' : 'mover';
  const letter = columnLetter(colNum);
  extractNewName.value = `${props.mueble.nombre} (Torre ${letter})`;
  selectedTargetMueble.value = otherMuebles.value.length > 0 ? otherMuebles.value[0].id : null;
  extractDialogOpen.value = true;
};

// Ejecutar acción de columna (extraer como nuevo o mover a destino)
const executeColumnAction = async () => {
  extracting.value = true;
  let ok = false;
  if (extractMode.value === 'nuevo') {
    ok = await store.extraerColumna(props.mueble.id, {
      columna: selectedCol.value,
      nombre: extractNewName.value.trim()
    });
    if (ok) {
      $q.notify({
        type: 'positive',
        icon: 'add_box',
        message: `Columna ${columnLetter(selectedCol.value)} extraída como nuevo archivador.`
      });
    }
  } else {
    if (!selectedTargetMueble.value) {
      extracting.value = false;
      return;
    }
    ok = await store.moverColumnaMueble(props.mueble.id, {
      columna: selectedCol.value,
      mueble_destino_id: selectedTargetMueble.value
    });
    if (ok) {
      $q.notify({
        type: 'positive',
        icon: 'drive_file_move',
        message: `Columna ${columnLetter(selectedCol.value)} trasladada exitosamente.`
      });
    }
  }
  extracting.value = false;
  if (ok) {
    extractDialogOpen.value = false;
  } else {
    $q.notify({ type: 'negative', message: 'Error al procesar la columna' });
  }
};

// Abrir diálogo fusionar
const openFusionarDialog = () => {
  fusionarTargetId.value = otherMuebles.value.length > 0 ? otherMuebles.value[0].id : null;
  fusionarDialogOpen.value = true;
};

// Ejecutar fusión de muebles
const executeFusionar = async () => {
  if (!fusionarTargetId.value) return;
  fusionando.value = true;
  const ok = await store.fusionarMuebles(props.mueble.id, fusionarTargetId.value);
  fusionando.value = false;
  if (ok) {
    fusionarDialogOpen.value = false;
    $q.notify({
      type: 'positive',
      icon: 'merge_type',
      message: 'Archivadores consolidados correctamente en un solo mueble.'
    });
  } else {
    $q.notify({ type: 'negative', message: 'Error al consolidar los archivadores' });
  }
};

// Abrir diálogo de desacoplar
const openDesacoplarDialog = () => {
  desacoplarDialogOpen.value = true;
};

// Ejecutar desacoplamiento completo en torres
const executeDesacoplar = async () => {
  desacoplando.value = true;
  const ok = await store.desacoplarMueble(props.mueble.id);
  desacoplando.value = false;
  if (ok) {
    desacoplarDialogOpen.value = false;
    $q.notify({
      type: 'positive',
      icon: 'call_split',
      message: `Mueble dividido en ${props.mueble.columnas} torres individuales.`
    });
  } else {
    $q.notify({ type: 'negative', message: 'Error al desacoplar el mueble' });
  }
};

// Abrir diálogo renombrar
const openRenameDialog = () => {
  newNameInput.value = props.mueble.nombre;
  renameDialogOpen.value = true;
};

// Guardar nuevo nombre
const executeRename = async () => {
  if (!newNameInput.value || !newNameInput.value.trim()) return;
  renaming.value = true;
  const ok = await store.updateMueble(props.mueble.id, { nombre: newNameInput.value.trim() });
  renaming.value = false;
  if (ok) {
    renameDialogOpen.value = false;
    $q.notify({ type: 'positive', message: 'Nombre actualizado' });
  } else {
    $q.notify({ type: 'negative', message: 'Error al actualizar el nombre' });
  }
};

// Abrir diálogo eliminar
const openDeleteDialog = () => {
  deleteDialogOpen.value = true;
};

// Ejecutar eliminación
const executeDelete = async () => {
  deleting.value = true;
  const ok = await store.deleteMueble(props.mueble.id);
  deleting.value = false;
  if (ok) {
    deleteDialogOpen.value = false;
    $q.notify({
      type: 'positive',
      icon: 'delete',
      message: `Archivador "${props.mueble.nombre}" eliminado.`
    });
  } else {
    $q.notify({ type: 'negative', message: 'Error al eliminar el archivador' });
  }
};
</script>

<style scoped>
.mueble-card {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04);
  border: 1px solid #e2e8f0;
  transition: transform 0.22s ease, box-shadow 0.22s ease;
  background: #ffffff;
}

.mueble-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px -4px rgba(15, 23, 42, 0.12), 0 4px 8px -2px rgba(15, 23, 42, 0.05);
}

.mueble-header {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.mueble-exp-badge {
  background: rgba(37, 99, 235, 0.2);
  color: #93c5fd;
  border: 1px solid rgba(147, 197, 253, 0.35);
  font-weight: 700;
  border-radius: 6px;
  font-size: 11px;
}

.btn-unir {
  border-radius: 6px;
  font-size: 10px;
}

.mueble-body {
  background: #f8fafc;
}

.mueble-drag-target {
  border: 2px dashed #2563eb !important;
  box-shadow: 0 0 24px rgba(37, 99, 235, 0.35) !important;
}

.drop-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(37, 99, 235, 0.92);
  border-radius: 16px;
  z-index: 25;
  backdrop-filter: blur(4px);
  pointer-events: none;
  border: 3px dashed white;
  animation: pulse 1s infinite alternate;
}

.col-header-box {
  border: 1px solid #e2e8f0;
  background: #f1f5f9;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.col-header-box:hover {
  background: #e2e8f0;
  border-color: #cbd5e1;
}

.cursor-grab {
  cursor: grab;
}

.cursor-grab:active {
  cursor: grabbing;
}

.mueble-grid {
  display: grid;
  gap: 8px;
  background: #f1f5f9;
  padding: 8px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  min-height: 200px;
}

.mueble-base {
  background: #f8fafc;
  height: 26px;
  border-top: 1px solid #e2e8f0;
}

.mueble-leg {
  width: 14px;
  height: 4px;
  background: #cbd5e1;
  border-radius: 2px 2px 0 0;
}
</style>
