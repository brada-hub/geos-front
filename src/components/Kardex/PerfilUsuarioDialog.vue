<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    transition-show="scale"
    transition-hide="scale"
  >
    <q-card
      class="profile-card"
      style="width: 580px; max-width: 96vw; border-radius: 16px; overflow: hidden;"
    >
      <!-- CABECERA EJECUTIVA -->
      <div class="profile-header q-pa-md bg-slate-900 text-white row items-center justify-between">
        <div class="row items-center q-gutter-sm">
          <div class="header-icon-circle flex flex-center">
            <q-icon name="person" size="22px" color="primary" />
          </div>
          <div>
            <div class="text-subtitle1 text-weight-bolder">
              Mi Perfil y Seguridad
            </div>
            <div class="text-caption text-slate-400" style="font-size: 11px;">
              Configuración de cuenta personal, seguridad y estado de conectividad en la nube
            </div>
          </div>
        </div>
        <q-btn flat round dense icon="close" color="slate-400" v-close-popup />
      </div>

      <!-- TABS -->
      <q-tabs
        v-model="activeTab"
        dense
        class="bg-slate-950 text-slate-400 profile-tabs"
        active-color="primary"
        indicator-color="primary"
        align="left"
      >
        <q-tab name="general" icon="badge" label="General" no-caps />
        <q-tab name="seguridad" icon="lock_reset" label="Cambiar Contraseña" no-caps />
        <q-tab name="sistema" icon="cloud_sync" label="Infraestructura" no-caps />
      </q-tabs>

      <q-separator class="bg-slate-800" />

      <!-- CONTENIDO DE TABS -->
      <q-tab-panels v-model="activeTab" animated class="bg-slate-900 text-white q-pa-none">
        <!-- TAB 1: INFORMACIÓN GENERAL -->
        <q-tab-panel name="general" class="q-pa-md q-gutter-y-md">
          <div class="row items-center q-gutter-md q-pa-md bg-slate-800 rounded-borders border border-slate-700">
            <q-avatar size="64px" color="primary" text-color="white" class="text-weight-bolder text-h5 shadow-4">
              {{ initials }}
            </q-avatar>
            <div class="col">
              <div class="text-h6 text-weight-bolder text-white">{{ userName }}</div>
              <div class="text-caption text-slate-400">{{ userEmail }}</div>
              <div class="row items-center q-gutter-x-xs q-mt-xs">
                <q-badge color="primary" text-color="white" :label="userRoleLabel" class="text-weight-bold" />
                <q-badge color="slate-800" text-color="slate-300" label="● Sesión Activa" class="text-weight-bold font-mono" />
              </div>
            </div>
          </div>

          <div class="q-gutter-y-sm">
            <div class="text-caption text-slate-400 text-weight-bold uppercase" style="letter-spacing: 0.05em;">
              Detalles de la Cuenta
            </div>
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-6">
                <div class="q-pa-sm bg-slate-800 rounded-borders border border-slate-700">
                  <div class="text-caption text-slate-400" style="font-size: 11px;">Entorno de Acceso</div>
                  <div class="text-body2 text-weight-bold text-slate-200">DOCUS Kardex v2.0</div>
                </div>
              </div>
              <div class="col-12 col-sm-6">
                <div class="q-pa-sm bg-slate-800 rounded-borders border border-slate-700">
                  <div class="text-caption text-slate-400" style="font-size: 11px;">Cargo Asignado</div>
                  <div class="text-body2 text-weight-bold text-slate-200">{{ authStore.currentUser?.cargo || 'Responsable de Archivo Central' }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- BOTÓN DIRECTO A PÁGINA COMPLETA DE USUARIOS Y ROLES -->
          <div class="q-pt-sm">
            <q-btn
              unelevated
              no-caps
              color="primary"
              text-color="white"
              icon="manage_accounts"
              label="Abrir Pantalla de Usuarios & Roles"
              class="full-width text-weight-bold shadow-2"
              @click="$emit('update:modelValue', false); $router.push('/usuarios')"
            />
          </div>
        </q-tab-panel>

        <!-- TAB 2: SEGURIDAD Y CAMBIO DE CONTRASEÑA PROPIA -->
        <q-tab-panel name="seguridad" class="q-pa-md q-gutter-y-md">
          <q-form @submit.prevent="submitChangePassword" class="q-gutter-y-sm">
            <div>
              <div class="text-caption text-slate-300 text-weight-bold q-mb-xs">Contraseña Actual *</div>
              <q-input
                v-model="passForm.current_password"
                :type="showCurrentPass ? 'text' : 'password'"
                outlined
                dense
                dark
                color="primary"
                placeholder="Ingresa tu contraseña actual"
                :rules="[val => !!val || 'La contraseña actual es requerida']"
              >
                <template #append>
                  <q-icon
                    :name="showCurrentPass ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer text-slate-400"
                    @click="showCurrentPass = !showCurrentPass"
                  />
                </template>
              </q-input>
            </div>

            <div>
              <div class="text-caption text-slate-300 text-weight-bold q-mb-xs">Nueva Contraseña *</div>
              <q-input
                v-model="passForm.new_password"
                :type="showNewPass ? 'text' : 'password'"
                outlined
                dense
                dark
                color="primary"
                placeholder="Mínimo 6 caracteres"
                :rules="[
                  val => !!val || 'Ingresa la nueva contraseña',
                  val => val.length >= 6 || 'Debe tener al menos 6 caracteres'
                ]"
              >
                <template #append>
                  <q-icon
                    :name="showNewPass ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer text-slate-400"
                    @click="showNewPass = !showNewPass"
                  />
                </template>
              </q-input>
            </div>

            <div>
              <div class="text-caption text-slate-300 text-weight-bold q-mb-xs">Confirmar Nueva Contraseña *</div>
              <q-input
                v-model="passForm.new_password_confirmation"
                :type="showNewPass ? 'text' : 'password'"
                outlined
                dense
                dark
                color="primary"
                placeholder="Repite la nueva contraseña"
                :rules="[
                  val => !!val || 'Confirma la nueva contraseña',
                  val => val === passForm.new_password || 'Las contraseñas no coinciden'
                ]"
              />
            </div>

            <div class="row justify-end q-mt-md">
              <q-btn
                type="submit"
                unelevated
                color="primary"
                text-color="white"
                icon="lock_reset"
                label="Actualizar Mi Contraseña"
                class="text-weight-bolder"
                :loading="savingPass"
              />
            </div>
          </q-form>
        </q-tab-panel>

        <!-- TAB 3: INFRAESTRUCTURA Y CONECTIVIDAD -->
        <q-tab-panel name="sistema" class="q-pa-md q-gutter-y-md">
          <div class="row items-center justify-between q-pa-sm bg-slate-800 rounded-borders border border-slate-700">
            <div class="row items-center q-gutter-sm">
              <q-icon name="cloud_done" color="positive" size="24px" />
              <div>
                <div class="text-weight-bold text-slate-200">Supabase Cloud PostgreSQL</div>
                <div class="text-caption text-slate-400" style="font-size: 11px;">Sincronización en vivo activa</div>
              </div>
            </div>
            <q-badge color="positive" text-color="white" label="Online" class="font-mono" />
          </div>

          <div class="row items-center justify-between q-pa-sm bg-slate-800 rounded-borders border border-slate-700">
            <div class="row items-center q-gutter-sm">
              <q-icon name="storage" color="primary" size="24px" />
              <div>
                <div class="text-weight-bold text-slate-200">IndexedDB Caché Local</div>
                <div class="text-caption text-slate-400" style="font-size: 11px;">Visualización ultrarrápida sin consumo de red</div>
              </div>
            </div>
            <q-btn
              flat
              dense
              no-caps
              size="xs"
              color="slate-300"
              icon="delete_sweep"
              label="Limpiar Caché"
              @click="limpiarCacheLocal"
            >
              <q-tooltip>Eliminar copias temporales en este navegador</q-tooltip>
            </q-btn>
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'src/stores/authStore';
import { api } from 'src/boot/axios';
import { clearAllPdfs } from 'src/utils/pdfStorageHelper';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  initialTab: {
    type: String,
    default: 'general'
  }
});

defineEmits(['update:modelValue']);

const $q = useQuasar();
const authStore = useAuthStore();

const activeTab = ref(props.initialTab || 'general');
const showCurrentPass = ref(false);
const showNewPass = ref(false);
const savingPass = ref(false);

watch(() => props.initialTab, (newTab) => {
  if (newTab && newTab !== 'usuarios') activeTab.value = newTab;
});

const passForm = reactive({
  current_password: '',
  new_password: '',
  new_password_confirmation: ''
});

const userName = computed(() => authStore.currentUser?.name || 'Administrador');
const userEmail = computed(() => authStore.currentUser?.email || 'admin@docus.com');

const userRoleLabel = computed(() => {
  const r = authStore.currentUser?.role || 'admin';
  switch (r) {
    case 'admin': return 'Administrador';
    case 'archivista': return 'Archivista / Kardex';
    case 'operador': return 'Operador Digital';
    case 'consulta': return 'Solo Consulta';
    default: return r;
  }
});

const initials = computed(() => {
  const name = userName.value;
  if (!name) return 'US';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
});

const submitChangePassword = async () => {
  try {
    savingPass.value = true;
    const res = await api.post('/change-password', passForm);
    if (res.data?.status === 'success') {
      $q.notify({
        type: 'positive',
        message: '¡Contraseña actualizada con éxito!',
        icon: 'check_circle'
      });
      passForm.current_password = '';
      passForm.new_password = '';
      passForm.new_password_confirmation = '';
    }
  } catch (error) {
    const msg = error.response?.data?.message || 'Error al cambiar la contraseña';
    $q.notify({
      type: 'negative',
      message: msg,
      icon: 'error'
    });
  } finally {
    savingPass.value = false;
  }
};

const limpiarCacheLocal = async () => {
  try {
    await clearAllPdfs();
    $q.notify({
      type: 'positive',
      message: 'Caché de documentos eliminada localmente',
      icon: 'cleaning_services'
    });
  } catch (e) {
    console.error(e);
  }
};
</script>

<style scoped>
.header-icon-circle {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(37, 99, 235, 0.2);
}
.border {
  border: 1px solid rgba(255, 255, 255, 0.08);
}
</style>
