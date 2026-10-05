<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" maximized transition-show="slide-up" transition-hide="slide-down">
    <q-card class="bg-grey-1 column full-height">
      <!-- HEADER -->
      <q-card-section class="bg-primary text-white row items-center justify-between q-py-sm">
        <div class="row items-center q-gutter-sm">
          <q-icon name="upload_file" size="28px" />
          <div>
            <div class="text-h6 font-weight-bold">Importar Expedientes de Personal desde Excel</div>
            <div class="text-caption text-grey-3">
              Carga tus planillas en formato .xlsx, .xls o .csv para alimentar la Gaveta Virtual
            </div>
          </div>
        </div>
        <q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>

      <!-- CONTENIDO PRINCIPAL -->
      <q-card-section class="col q-pa-md column q-gutter-y-md" style="overflow-y: auto;">
        <!-- ZONA DE CARGA DE ARCHIVO -->
        <q-card flat bordered class="bg-white q-pa-md">
          <div class="row items-center justify-between q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-file
                v-model="selectedFile"
                outlined
                dense
                clearable
                accept=".xlsx, .xls, .csv"
                label="Seleccionar o arrastrar archivo Excel / CSV"
                @update:model-value="handleFileChange"
              >
                <template v-slot:prepend>
                  <q-icon name="attach_file" color="primary" />
                </template>
              </q-file>
            </div>

            <div class="col-12 col-md-6 row items-center justify-end q-gutter-sm">
              <q-btn
                flat
                color="secondary"
                icon="download"
                label="Descargar Plantilla de Ejemplo"
                no-caps
                @click="descargarPlantilla"
              />
              <q-btn
                v-if="filasParseadas.length > 0"
                outline
                color="negative"
                icon="delete_sweep"
                label="Limpiar datos"
                no-caps
                @click="limpiarDatos"
              />
            </div>
          </div>

          <!-- GUÍA DE COLUMNAS DETECTADAS -->
          <div class="q-mt-sm row items-center q-gutter-x-sm text-caption text-grey-7">
            <q-icon name="info" color="info" size="16px" />
            <span>
              Columnas reconocidas: <b>N°</b>, <b>Apellidos y Nombres</b>, <b>C.I.</b>, <b>Exp.</b>, <b>Sexo</b>, <b>Fecha de Nacimiento</b>, <b>Cargo / Ocupación</b>, <b>Sede</b>, <b>Tipo de Contrato</b>.
            </span>
          </div>
        </q-card>

        <!-- RESUMEN Y ESTADÍSTICAS SI HAY DATOS -->
        <div v-if="filasParseadas.length > 0" class="row q-col-gutter-sm">
          <div class="col-12 col-sm-3">
            <q-card flat bordered class="bg-blue-1 q-pa-sm text-center">
              <div class="text-caption text-primary text-weight-bold">TOTAL EXPEDIENTES</div>
              <div class="text-h5 text-primary text-weight-bolder">{{ filasParseadas.length }}</div>
            </q-card>
          </div>
          <div class="col-12 col-sm-3">
            <q-card flat bordered class="bg-slate-50 q-pa-sm text-center">
              <div class="text-caption text-slate-600 text-weight-bold">SEDES ENCONTRADAS</div>
              <div class="text-h5 text-slate-900 text-weight-bolder">{{ sedesDetectadas.length }}</div>
            </q-card>
          </div>
          <div class="col-12 col-sm-3">
            <q-card flat bordered class="bg-slate-50 q-pa-sm text-center">
              <div class="text-caption text-slate-600 text-weight-bold">CONTRATOS IDENTIFICADOS</div>
              <div class="text-h5 text-slate-900 text-weight-bolder">{{ contratosDetectados.length }}</div>
            </q-card>
          </div>
          <div class="col-12 col-sm-3">
            <q-card flat bordered class="bg-blue-1 q-pa-sm text-center">
              <div class="text-caption text-primary text-weight-bold">DESTINO ASIGNADO</div>
              <div class="text-h6 text-primary text-weight-bolder">Gaveta Virtual</div>
            </q-card>
          </div>
        </div>

        <!-- TABLA DE VISTA PREVIA -->
        <q-card flat bordered class="bg-white col column">
          <div class="q-pa-sm bg-grey-2 row items-center justify-between border-bottom">
            <div class="text-subtitle2 text-weight-bold text-dark row items-center q-gutter-xs">
              <q-icon name="preview" color="primary" size="20px" />
              <span>Vista Previa de Expedientes a Importar ({{ filasFiltradas.length }} registros)</span>
            </div>

            <div class="row items-center q-gutter-sm">
              <q-input
                v-model="filtroTexto"
                outlined
                dense
                placeholder="Buscar en la vista previa..."
                class="bg-white"
                style="width: 250px;"
              >
                <template v-slot:append>
                  <q-icon name="search" size="18px" />
                </template>
              </q-input>
            </div>
          </div>

          <q-table
            flat
            dense
            :rows="filasFiltradas"
            :columns="columnasTabla"
            row-key="numero"
            :pagination="{ rowsPerPage: 15 }"
            class="col"
            no-data-label="No hay registros cargados. Sube un archivo Excel para previsualizar."
          >
            <!-- COLUMNA SEXO -->
            <template v-slot:body-cell-sexo="props">
              <q-td :props="props">
                <q-badge
                  color="grey-8"
                  :label="props.row.sexo === 'F' ? 'F (Femenino)' : 'M (Masculino)'"
                  rounded
                />
              </q-td>
            </template>

            <!-- COLUMNA SEDE -->
            <template v-slot:body-cell-sede="props">
              <q-td :props="props">
                <q-badge color="primary" text-color="white" :label="props.row.sede || 'Sin Sede'" />
              </q-td>
            </template>

            <!-- COLUMNA TIPO CONTRATO -->
            <template v-slot:body-cell-tipo_contrato="props">
              <q-td :props="props">
                <q-badge
                  :color="getContratoBadgeColor(props.row.tipo_contrato)"
                  text-color="white"
                  :label="props.row.tipo_contrato || 'Indefinido'"
                />
              </q-td>
            </template>

            <!-- COLUMNA CI -->
            <template v-slot:body-cell-ci_completo="props">
              <q-td :props="props" class="text-weight-bold">
                {{ props.row.ci }}
                <span v-if="props.row.exp" class="text-caption text-primary">({{ props.row.exp }})</span>
              </q-td>
            </template>
          </q-table>
        </q-card>
      </q-card-section>

      <!-- FOOTER DE ACCIONES -->
      <q-card-section class="bg-white border-top row items-center justify-between q-py-sm">
        <div class="text-caption text-grey-8">
          <span v-if="filasParseadas.length > 0">
            Los expedientes importados se asignarán a la <b>Gaveta Virtual</b> para que puedas organizarlos después.
          </span>
        </div>

        <div class="row q-gutter-sm">
          <q-btn flat label="Cancelar" color="grey-8" v-close-popup />
          <q-btn
            color="positive"
            icon="cloud_upload"
            :label="`Importar ${filasParseadas.length} Registros a Gaveta Virtual`"
            :loading="importando"
            :disable="filasParseadas.length === 0"
            @click="confirmarImportacion"
          />
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import * as XLSX from 'xlsx';
import { useGeosStore } from 'src/stores/geosStore';

defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue', 'import-complete']);

const $q = useQuasar();
const store = useGeosStore();

const selectedFile = ref(null);
const filasParseadas = ref([]);
const filtroTexto = ref('');
const importando = ref(false);

const columnasTabla = [
  { name: 'numero', label: 'N°', field: 'numero', align: 'center', sortable: true },
  { name: 'apellidos_nombres', label: 'Apellidos y Nombres', field: 'apellidos_nombres', align: 'left', sortable: true },
  { name: 'ci_completo', label: 'C.I. / Exp.', field: 'ci', align: 'left' },
  { name: 'sexo', label: 'Sexo', field: 'sexo', align: 'center', sortable: true },
  { name: 'fecha_nacimiento', label: 'Fecha Nacimiento', field: 'fecha_nacimiento', align: 'center' },
  { name: 'cargo', label: 'Cargo / Ocupación', field: 'cargo', align: 'left', sortable: true },
  { name: 'sede', label: 'Sede', field: 'sede', align: 'left', sortable: true },
  { name: 'tipo_contrato', label: 'Tipo de Contrato', field: 'tipo_contrato', align: 'left', sortable: true },
];

const filasFiltradas = computed(() => {
  if (!filtroTexto.value) return filasParseadas.value;
  const q = filtroTexto.value.toLowerCase();
  return filasParseadas.value.filter(f =>
    (f.apellidos_nombres || '').toLowerCase().includes(q) ||
    (f.ci || '').toLowerCase().includes(q) ||
    (f.cargo || '').toLowerCase().includes(q) ||
    (f.sede || '').toLowerCase().includes(q) ||
    (f.tipo_contrato || '').toLowerCase().includes(q)
  );
});

const sedesDetectadas = computed(() => {
  const set = new Set();
  filasParseadas.value.forEach(f => {
    if (f.sede) set.add(f.sede);
  });
  return Array.from(set);
});

const contratosDetectados = computed(() => {
  const set = new Set();
  filasParseadas.value.forEach(f => {
    if (f.tipo_contrato) set.add(f.tipo_contrato);
  });
  return Array.from(set);
});

function getContratoBadgeColor(contrato) {
  if (!contrato) return 'grey-7';
  const c = contrato.toUpperCase();
  if (c.includes('INDEF')) return 'primary';
  if (c.includes('PLAZO') || c.includes('FIJO')) return 'slate-7';
  return 'blue-grey-8';
}

function handleFileChange(file) {
  if (!file) {
    filasParseadas.value = [];
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonRaw = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (!jsonRaw || jsonRaw.length === 0) {
        $q.notify({ type: 'warning', message: 'La hoja de cálculo está vacía o sin formato válido.' });
        return;
      }

      // Normalizar columnas reconociendo variaciones de encabezado
      const normalizadas = jsonRaw.map((row, index) => {
        const keys = Object.keys(row);

        const findVal = (regex) => {
          const key = keys.find(k => regex.test(k.trim().toLowerCase()));
          return key ? String(row[key]).trim() : '';
        };

        const numero = findVal(/^(n°|nro|numero|n_?)$/i) || String(index + 1);
        const apellidosNombres = findVal(/^(apellidos y nombres|nombre completo|nombres y apellidos|personal|nombre)$/i);
        const ci = findVal(/^(c\.?i\.?|ci|documento|cedula|identidad)$/i);
        const exp = findVal(/^(exp\.?|exp|expedido)$/i);
        const sexoRaw = findVal(/^(sexo|genero)$/i);
        let sexo = 'M';
        if (/^f/i.test(sexoRaw) || /fem/i.test(sexoRaw) || /muj/i.test(sexoRaw)) {
          sexo = 'F';
        }

        let fechaNac = findVal(/^(fecha de nacimiento|fecha nacimiento|nacimiento|f\.?\s*nac\.?)$/i);
        // Formatear si viene en formato serial de fecha Excel
        if (fechaNac && !isNaN(Number(fechaNac)) && Number(fechaNac) > 1000) {
          const date = XLSX.SSF.parse_date_code(Number(fechaNac));
          if (date) {
            const pad = (n) => String(n).padStart(2, '0');
            fechaNac = `${pad(date.d)}/${pad(date.m)}/${date.y}`;
          }
        }

        const cargo = findVal(/^(cargo\s*\/?\s*ocupaci[oó]n|cargo|ocupacion|puesto)$/i) || 'PERSONAL';
        const sede = findVal(/^(sede|regional|ciudad)$/i) || 'COBIJA';
        const tipoContrato = findVal(/^(tipo de contrato|tipo contrato|contrato|regimen)$/i) || 'Indefinido';

        return {
          numero,
          apellidos_nombres: apellidosNombres,
          ci,
          exp,
          sexo,
          fecha_nacimiento: fechaNac,
          cargo,
          sede,
          tipo_contrato: tipoContrato,
        };
      }).filter(r => r.apellidos_nombres || r.ci);

      filasParseadas.value = normalizadas;

      $q.notify({
        type: 'positive',
        icon: 'check_circle',
        message: `¡Se leyeron ${normalizadas.length} registros del archivo!`,
      });
    } catch (err) {
      console.error('Error al procesar archivo Excel:', err);
      $q.notify({
        type: 'negative',
        icon: 'error',
        message: 'No se pudo leer el archivo. Verifica que sea un Excel o CSV válido.',
      });
    }
  };

  reader.readAsArrayBuffer(file);
}

function limpiarDatos() {
  selectedFile.value = null;
  filasParseadas.value = [];
  filtroTexto.value = '';
}

function descargarPlantilla() {
  const data = [
    {
      'N°': 1,
      'Apellidos y Nombres': 'ALONZO ROJAS LEIBI',
      'C.I.': '4204219',
      'Exp.': 'PD',
      'Sexo': 'F',
      'Fecha de Nacimiento': '22/01/1986',
      'Cargo / Ocupación': 'ADM CAMPUS',
      'Sede': 'Cobija',
      'Tipo de Contrato': 'Indefinido',
    },
    {
      'N°': 2,
      'Apellidos y Nombres': 'MAMANI QUISPE CARLOS',
      'C.I.': '6891234',
      'Exp.': 'LP',
      'Sexo': 'M',
      'Fecha de Nacimiento': '15/05/1990',
      'Cargo / Ocupación': 'DOCENTE',
      'Sede': 'La Paz',
      'Tipo de Contrato': 'Plazo Fijo',
    },
    {
      'N°': 3,
      'Apellidos y Nombres': 'FLORES TORREZ MARGARITA',
      'C.I.': '5123984',
      'Exp.': 'CB',
      'Sexo': 'F',
      'Fecha de Nacimiento': '10/11/1988',
      'Cargo / Ocupación': 'COORDINADOR ACADÉMICO',
      'Sede': 'Cochabamba',
      'Tipo de Contrato': 'Prestación de Servicios',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla_Personal');
  XLSX.writeFile(workbook, 'Plantilla_Importacion_Personal.xlsx');
}

async function confirmarImportacion() {
  if (filasParseadas.value.length === 0) return;

  importando.value = true;
  try {
    const res = await store.importarPersonalMasivo(filasParseadas.value);
    if (res.success) {
      $q.notify({
        type: 'positive',
        icon: 'task_alt',
        message: res.message || 'Importación completada con éxito hacia la Gaveta Virtual',
      });
      emit('import-complete', res);
      emit('update:modelValue', false);
      limpiarDatos();
    } else {
      $q.notify({
        type: 'negative',
        icon: 'error',
        message: res.message || 'Error durante la importación masiva',
      });
    }
  } catch (error) {
    console.error('Error al importar:', error);
    $q.notify({
      type: 'negative',
      message: 'Ocurrió un error inesperado al procesar la importación.',
    });
  } finally {
    importando.value = false;
  }
}
</script>

<style scoped>
.border-bottom {
  border-bottom: 1px solid #e0e0e0;
}
.border-top {
  border-top: 1px solid #e0e0e0;
}
</style>
