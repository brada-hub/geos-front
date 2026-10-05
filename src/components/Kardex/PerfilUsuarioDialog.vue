<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    transition-show="scale"
    transition-hide="scale"
  >
    <q-card
      class="profile-card"
      :style="{
        width: activeTab === 'usuarios' ? '890px' : '580px',
        maxWidth: '96vw',
        borderRadius: '16px',
        overflow: 'hidden',
        transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }"
    >
      <!-- CABECERA EJECUTIVA -->
      <div class="profile-header q-pa-md bg-slate-900 text-white row items-center justify-between">
        <div class="row items-center q-gutter-sm">
          <div class="header-icon-circle flex flex-center">
            <q-icon
              :name="activeTab === 'usuarios' ? 'manage_accounts' : 'person'"
              size="22px"
              color="primary"
            />
          </div>
          <div>
            <div class="text-subtitle1 text-weight-bolder">
              {{ activeTab === 'usuarios' ? 'Gestión de Usuarios & Roles' : 'Mi Perfil y Seguridad' }}
            </div>
            <div class="text-caption text-slate-400" style="font-size: 11px;">
              {{ activeTab === 'usuarios'
                ? 'Administración de cuentas institucionales, asignación de roles y matriz de permisos'
                : 'Configuración de cuenta personal, seguridad y estado de conectividad en la nube' }}
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
        <q-tab name="usuarios" icon="group" label="Usuarios & Roles" no-caps />
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

          <!-- BOTÓN DIRECTO A GESTIÓN DE USUARIOS -->
          <div class="q-pt-sm">
            <q-btn
              unelevated
              no-caps
              color="slate-800"
              text-color="white"
              icon="group_add"
              label="Ir a Gestión de Usuarios y Roles"
              class="full-width border border-slate-700"
              @click="activeTab = 'usuarios'"
            />
          </div>
        </q-tab-panel>

        <!-- TAB 2: GESTIÓN DE USUARIOS, ROLES Y PERMISOS -->
        <q-tab-panel name="usuarios" class="q-pa-md q-gutter-y-sm">
          <!-- BARRA DE ACCIONES SUPERIOR -->
          <div class="row items-center justify-between q-col-gutter-sm q-mb-sm">
            <div class="col-12 col-sm-6 row items-center q-gutter-x-sm">
              <q-input
                v-model="searchUsuario"
                outlined
                dense
                dark
                color="primary"
                placeholder="Buscar por nombre, correo o cargo..."
                class="col"
              >
                <template #prepend>
                  <q-icon name="search" size="18px" color="slate-400" />
                </template>
                <template #append v-if="searchUsuario">
                  <q-icon name="close" size="16px" class="cursor-pointer text-slate-400" @click="searchUsuario = ''" />
                </template>
              </q-input>

              <q-select
                v-model="filterRole"
                :options="roleFilterOptions"
                outlined
                dense
                dark
                emit-value
                map-options
                color="primary"
                style="min-width: 140px;"
              />
            </div>

            <div class="col-12 col-sm-auto row items-center q-gutter-x-xs justify-end">
              <q-btn
                flat
                round
                dense
                icon="refresh"
                color="slate-300"
                :loading="loadingUsers"
                @click="fetchUsuarios"
              >
                <q-tooltip>Recargar lista</q-tooltip>
              </q-btn>

              <q-btn
                unelevated
                no-caps
                color="primary"
                text-color="white"
                icon="person_add"
                label="Nuevo Usuario"
                class="text-weight-bolder q-px-sm"
                @click="openCreateUserModal"
              />
            </div>
          </div>

          <!-- LISTA DE USUARIOS -->
          <div v-if="loadingUsers" class="column items-center q-py-xl q-gutter-sm">
            <q-spinner-dots size="42px" color="primary" />
            <div class="text-caption text-slate-400 font-mono">Cargando usuarios registrados...</div>
          </div>

          <div v-else-if="usuariosFiltrados.length === 0" class="column items-center q-py-xl text-center text-slate-400 q-gutter-sm">
            <q-icon name="group_off" size="48px" color="slate-600" />
            <div class="text-body2 text-weight-bold text-slate-300">No se encontraron usuarios</div>
            <div class="text-caption" style="max-width: 320px;">
              {{ searchUsuario ? 'No hay resultados que coincidan con la búsqueda.' : 'Aún no se han registrado usuarios adicionales.' }}
            </div>
            <q-btn
              unelevated
              no-caps
              color="primary"
              text-color="white"
              icon="add"
              label="Crear el primer usuario"
              size="sm"
              class="q-mt-xs"
              @click="openCreateUserModal"
            />
          </div>

          <q-scroll-area v-else style="height: 380px;" class="q-pr-xs">
            <div class="q-gutter-y-xs">
              <div
                v-for="u in usuariosFiltrados"
                :key="u.id"
                class="user-row-card q-pa-sm bg-slate-800 rounded-borders border border-slate-700 row items-center justify-between"
              >
                <!-- IDENTIFICACIÓN -->
                <div class="row items-center q-gutter-sm col ellipsis" style="min-width: 0;">
                  <q-avatar size="36px" color="primary" text-color="white" class="text-weight-bold" style="font-size: 13px;">
                    {{ getInitials(u.name) }}
                  </q-avatar>

                  <div class="column ellipsis" style="min-width: 0;">
                    <div class="row items-center q-gutter-x-xs">
                      <span class="text-weight-bold text-slate-100 text-body2 ellipsis">{{ u.name }}</span>
                      <q-badge
                        v-if="u.id === authStore.currentUser?.id"
                        color="slate-700"
                        text-color="slate-300"
                        label="Tú"
                        class="text-weight-bold"
                        style="font-size: 9.5px;"
                      />
                    </div>
                    <div class="row items-center q-gutter-x-xs text-caption text-slate-400 ellipsis" style="font-size: 11px;">
                      <span>{{ u.email }}</span>
                      <span v-if="u.cargo">• {{ u.cargo }}</span>
                    </div>
                  </div>
                </div>

                <!-- ROL Y PERMISOS -->
                <div class="row items-center q-gutter-x-sm col-auto">
                  <q-badge
                    :color="u.role === 'admin' ? 'primary' : 'slate-900'"
                    text-color="white"
                    class="text-weight-bold border border-slate-700 font-mono"
                    style="font-size: 10.5px; padding: 4px 8px;"
                  >
                    {{ getRoleLabel(u.role) }}
                  </q-badge>

                  <q-badge
                    color="slate-900"
                    text-color="slate-300"
                    class="cursor-pointer border border-slate-700 gt-xs"
                    style="font-size: 10px;"
                  >
                    {{ (u.permissions || []).length }} permisos
                    <q-tooltip class="bg-slate-950 text-white shadow-4">
                      <div class="text-weight-bold q-mb-xs">Permisos activos:</div>
                      <div v-for="p in (u.permissions || [])" :key="p" class="text-caption">
                        • {{ getPermissionLabel(p) }}
                      </div>
                      <div v-if="!(u.permissions || []).length" class="text-caption text-italic">
                        Sin permisos específicos (Solo lectura)
                      </div>
                    </q-tooltip>
                  </q-badge>

                  <q-badge
                    :color="u.activo ? 'slate-800' : 'slate-950'"
                    :text-color="u.activo ? 'slate-200' : 'slate-500'"
                    class="border border-slate-700 font-mono"
                    style="font-size: 9.5px;"
                  >
                    {{ u.activo ? 'Activo' : 'Inactivo' }}
                  </q-badge>

                  <!-- ACCIONES -->
                  <div class="row items-center q-gutter-x-none">
                    <q-btn
                      flat
                      round
                      dense
                      size="sm"
                      icon="edit"
                      color="slate-300"
                      @click="openEditUserModal(u)"
                    >
                      <q-tooltip>Editar usuario y permisos</q-tooltip>
                    </q-btn>

                    <q-btn
                      flat
                      round
                      dense
                      size="sm"
                      icon="delete"
                      color="slate-400"
                      :disable="u.id === authStore.currentUser?.id"
                      @click="confirmDeleteUser(u)"
                    >
                      <q-tooltip v-if="u.id === authStore.currentUser?.id">No puedes eliminar tu propia cuenta</q-tooltip>
                      <q-tooltip v-else>Eliminar usuario</q-tooltip>
                    </q-btn>
                  </div>
                </div>
              </div>
            </div>
          </q-scroll-area>
        </q-tab-panel>

        <!-- TAB 3: SEGURIDAD Y CAMBIO DE CONTRASEÑA -->
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
                  val => !!val || 'Confirma la contraseña',
                  val => val === passForm.new_password || 'Las contraseñas no coinciden'
                ]"
              />
            </div>

            <div class="row justify-end q-mt-md">
              <q-btn
                type="submit"
                unelevated
                no-caps
                color="primary"
                text-color="white"
                icon="save"
                label="Actualizar Contraseña"
                class="text-weight-bolder"
                :loading="savingPass"
              />
            </div>
          </q-form>
        </q-tab-panel>

        <!-- TAB 4: ESTADO DE INFRAESTRUCTURA -->
        <q-tab-panel name="sistema" class="q-pa-md q-gutter-y-sm">
          <div class="text-caption text-slate-400 text-weight-bold uppercase" style="letter-spacing: 0.05em;">
            Arquitectura Híbrida Cloud & Local
          </div>

          <!-- RENDER API BACKEND -->
          <div class="infra-box row items-center justify-between q-pa-sm bg-slate-800 rounded-borders border border-slate-700">
            <div class="row items-center q-gutter-sm">
              <q-icon name="dns" size="20px" color="primary" />
              <div>
                <div class="text-weight-bold text-slate-200">API Backend en Render</div>
                <div class="text-caption text-slate-400" style="font-size: 11px;">Laravel 11 • PostgreSQL • Sanctum Auth</div>
              </div>
            </div>
            <q-badge color="slate-800" text-color="white" label="Conectado" class="text-weight-bold font-mono" />
          </div>

          <!-- SUPABASE STORAGE CDN -->
          <div class="infra-box row items-center justify-between q-pa-sm bg-slate-800 rounded-borders border border-slate-700">
            <div class="row items-center q-gutter-sm">
              <q-icon name="cloud_queue" size="20px" color="primary" />
              <div>
                <div class="text-weight-bold text-slate-200">Supabase Cloud Storage</div>
                <div class="text-caption text-slate-400" style="font-size: 11px;">Bucket 'expedientes' • CDN Global</div>
              </div>
            </div>
            <q-badge color="slate-800" text-color="white" label="CDN Activo" class="text-weight-bold font-mono" />
          </div>

          <!-- INDEXEDDB LOCAL CACHE -->
          <div class="infra-box row items-center justify-between q-pa-sm bg-slate-800 rounded-borders border border-slate-700">
            <div class="row items-center q-gutter-sm">
              <q-icon name="storage" size="20px" color="primary" />
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

    <!-- ======================================================= -->
    <!-- DIÁLOGO CREAR / EDITAR USUARIO CON ROLES Y PERMISOS     -->
    <!-- ======================================================= -->
    <q-dialog v-model="userModalOpen" persistent transition-show="scale" transition-hide="scale">
      <q-card class="bg-slate-900 text-white border border-slate-700" style="width: 580px; max-width: 95vw; border-radius: 14px;">
        <div class="q-pa-md bg-slate-950 border-bottom border-slate-800 row items-center justify-between">
          <div class="row items-center q-gutter-xs">
            <q-icon :name="isEditingUser ? 'manage_accounts' : 'person_add'" size="20px" color="primary" />
            <span class="text-subtitle1 text-weight-bolder">
              {{ isEditingUser ? 'Editar Usuario & Permisos' : 'Crear Nuevo Usuario' }}
            </span>
          </div>
          <q-btn flat round dense icon="close" size="sm" color="slate-400" v-close-popup />
        </div>

        <q-form @submit.prevent="saveUser">
          <div class="q-pa-md q-gutter-y-sm">
            <!-- NOMBRE COMPLETO -->
            <div>
              <div class="text-caption text-slate-300 text-weight-bold q-mb-xs">Nombre Completo *</div>
              <q-input
                v-model="userForm.name"
                outlined
                dense
                dark
                color="primary"
                placeholder="Ej. Lic. Roberto Pérez Rojas"
                :rules="[val => !!val || 'El nombre es obligatorio']"
              />
            </div>

            <!-- EMAIL Y CARGO EN 2 COLUMNAS -->
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-6">
                <div class="text-caption text-slate-300 text-weight-bold q-mb-xs">Correo Electrónico *</div>
                <q-input
                  v-model="userForm.email"
                  type="email"
                  outlined
                  dense
                  dark
                  color="primary"
                  placeholder="usuario@docus.com"
                  :rules="[
                    val => !!val || 'El correo es requerido',
                    val => /.+@.+\..+/.test(val) || 'Ingresa un correo válido'
                  ]"
                />
              </div>

              <div class="col-12 col-sm-6">
                <div class="text-caption text-slate-300 text-weight-bold q-mb-xs">Cargo Institucional</div>
                <q-input
                  v-model="userForm.cargo"
                  outlined
                  dense
                  dark
                  color="primary"
                  placeholder="Ej. Archivista Principal"
                />
              </div>
            </div>

            <!-- CONTRASEÑA -->
            <div>
              <div class="row items-center justify-between q-mb-xs">
                <span class="text-caption text-slate-300 text-weight-bold">
                  {{ isEditingUser ? 'Nueva Contraseña (dejar en blanco para mantener la actual)' : 'Contraseña de Acceso *' }}
                </span>
                <span v-if="!isEditingUser" class="text-caption text-slate-400" style="font-size: 10.5px;">Mínimo 6 caracteres</span>
              </div>
              <q-input
                v-model="userForm.password"
                :type="showModalPass ? 'text' : 'password'"
                outlined
                dense
                dark
                color="primary"
                :placeholder="isEditingUser ? '•••••••• (sin cambios)' : 'Contraseña segura'"
                :rules="[
                  val => isEditingUser || !!val || 'La contraseña es obligatoria',
                  val => !val || val.length >= 6 || 'Debe tener al menos 6 caracteres'
                ]"
              >
                <template #append>
                  <q-icon
                    :name="showModalPass ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer text-slate-400"
                    @click="showModalPass = !showModalPass"
                  />
                </template>
              </q-input>
            </div>

            <!-- SELECCIÓN DE ROL CON AYUDA VISUAL -->
            <div>
              <div class="text-caption text-slate-300 text-weight-bold q-mb-xs">Rol Institucional *</div>
              <q-select
                v-model="userForm.role"
                :options="roleOptions"
                outlined
                dense
                dark
                emit-value
                map-options
                color="primary"
                @update:model-value="onRoleChange"
              />
              <div class="text-caption text-slate-400 q-mt-xs" style="font-size: 11px;">
                {{ getRoleDescription(userForm.role) }}
              </div>
            </div>

            <!-- MATRIZ DE PERMISOS -->
            <div class="q-pt-xs">
              <div class="row items-center justify-between q-mb-xs">
                <span class="text-caption text-slate-300 text-weight-bold uppercase" style="letter-spacing: 0.05em;">
                  Matriz de Permisos Específicos
                </span>
                <q-btn
                  flat
                  dense
                  no-caps
                  size="xs"
                  color="primary"
                  label="Asignar recomendados"
                  @click="resetPermissionsToRole"
                />
              </div>

              <div class="q-pa-sm bg-slate-950 rounded-borders border border-slate-800">
                <div class="row q-col-gutter-xs">
                  <div
                    v-for="perm in availablePermissions"
                    :key="perm.id"
                    class="col-12 col-sm-6"
                  >
                    <q-checkbox
                      v-model="userForm.permissions"
                      :val="perm.id"
                      dark
                      color="primary"
                      size="sm"
                      class="text-caption"
                    >
                      <span class="text-slate-200 text-weight-medium" style="font-size: 11.5px;">{{ perm.label }}</span>
                    </q-checkbox>
                  </div>
                </div>
              </div>
            </div>

            <!-- USUARIO ACTIVO -->
            <div class="row items-center justify-between q-pa-sm bg-slate-800 rounded-borders border border-slate-700 q-mt-sm">
              <div>
                <div class="text-caption text-weight-bold text-slate-200">Estado de la Cuenta</div>
                <div class="text-caption text-slate-400" style="font-size: 10.5px;">Permite al usuario iniciar sesión en DOCUS</div>
              </div>
              <q-toggle v-model="userForm.activo" dark color="primary" />
            </div>
          </div>

          <!-- BOTONES MODAL -->
          <div class="q-pa-md bg-slate-950 border-top border-slate-800 row items-center justify-end q-gutter-x-sm">
            <q-btn flat no-caps color="slate-300" label="Cancelar" v-close-popup />
            <q-btn
              type="submit"
              unelevated
              no-caps
              color="primary"
              text-color="white"
              icon="save"
              :label="isEditingUser ? 'Guardar Cambios' : 'Crear Usuario'"
              class="text-weight-bolder"
              :loading="savingUser"
            />
          </div>
        </q-form>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script setup>
import { ref, computed, reactive, watch, onMounted } from 'vue';
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

const emit = defineEmits(['update:modelValue']);

const $q = useQuasar();
const authStore = useAuthStore();

const activeTab = ref(props.initialTab || 'general');
const showCurrentPass = ref(false);
const showNewPass = ref(false);
const savingPass = ref(false);

watch(() => props.initialTab, (newTab) => {
  if (newTab) activeTab.value = newTab;
});

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    if (props.initialTab) activeTab.value = props.initialTab;
    if (activeTab.value === 'usuarios') {
      fetchUsuarios();
    }
  }
});

watch(activeTab, (tab) => {
  if (tab === 'usuarios' && usuarios.value.length === 0) {
    fetchUsuarios();
  }
});

// FORMULARIO DE CONTRASEÑA PROPIA
const passForm = reactive({
  current_password: '',
  new_password: '',
  new_password_confirmation: ''
});

const userName = computed(() => authStore.currentUser?.name || 'Administrador');
const userEmail = computed(() => authStore.currentUser?.email || 'admin@docus.com');

const userRoleLabel = computed(() => {
  const r = authStore.currentUser?.role || 'admin';
  return getRoleLabel(r);
});

const initials = computed(() => getInitials(userName.value));

function getInitials(name) {
  if (!name) return 'US';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

// ========================================================
// GESTIÓN DE USUARIOS, ROLES Y PERMISOS
// ========================================================
const usuarios = ref([]);
const loadingUsers = ref(false);
const searchUsuario = ref('');
const filterRole = ref('todos');

const roleOptions = [
  { label: 'Administrador (Acceso Total)', value: 'admin' },
  { label: 'Archivista / Kardex (Gestión de Expedientes)', value: 'archivista' },
  { label: 'Operador (Carga y Desglose de Fojas)', value: 'operador' },
  { label: 'Solo Consulta (Lectura y Auditoría)', value: 'consulta' }
];

const roleFilterOptions = [
  { label: 'Todos los roles', value: 'todos' },
  { label: 'Administrador', value: 'admin' },
  { label: 'Archivista', value: 'archivista' },
  { label: 'Operador', value: 'operador' },
  { label: 'Solo Consulta', value: 'consulta' }
];

const availablePermissions = [
  { id: 'crear_expediente', label: 'Crear Expedientes / Personal' },
  { id: 'editar_expediente', label: 'Editar Datos de Expediente' },
  { id: 'eliminar_expediente', label: 'Eliminar Expedientes' },
  { id: 'subir_fojas', label: 'Subir y Adjuntar Documentos' },
  { id: 'desglosar_pdf', label: 'Desglosar Fojas de PDF' },
  { id: 'gestionar_archivadores', label: 'Gestionar Muebles y Archivadores' },
  { id: 'gestionar_usuarios', label: 'Gestionar Usuarios, Roles y Permisos' }
];

function getRoleLabel(role) {
  switch (role) {
    case 'admin': return 'Administrador';
    case 'archivista': return 'Archivista / Kardex';
    case 'operador': return 'Operador Digital';
    case 'consulta': return 'Solo Consulta';
    default: return role || 'Archivista';
  }
}

function getRoleDescription(role) {
  switch (role) {
    case 'admin':
      return 'Control total del sistema: gestión de expedientes, archivadores, subida masiva y administración de usuarios.';
    case 'archivista':
      return 'Gestión completa de archivadores físicos, movimiento de carpetas, edición de fojas y desglosado.';
    case 'operador':
      return 'Carga y desglose digital de PDFs, subida de documentos y actualización de legajos.';
    case 'consulta':
      return 'Solo visualización de libros, expedientes y reportes. Sin permisos de modificación.';
    default:
      return '';
  }
}

function getPermissionLabel(permId) {
  const found = availablePermissions.find(p => p.id === permId);
  return found ? found.label : permId;
}

function defaultPermissionsForRole(role) {
  switch (role) {
    case 'admin':
      return [
        'crear_expediente',
        'editar_expediente',
        'eliminar_expediente',
        'subir_fojas',
        'desglosar_pdf',
        'gestionar_archivadores',
        'gestionar_usuarios'
      ];
    case 'archivista':
      return [
        'crear_expediente',
        'editar_expediente',
        'subir_fojas',
        'desglosar_pdf',
        'gestionar_archivadores'
      ];
    case 'operador':
      return [
        'subir_fojas',
        'desglosar_pdf',
        'editar_expediente'
      ];
    case 'consulta':
    default:
      return [];
  }
}

const usuariosFiltrados = computed(() => {
  return usuarios.value.filter(u => {
    const matchSearch = !searchUsuario.value ||
      u.name.toLowerCase().includes(searchUsuario.value.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUsuario.value.toLowerCase()) ||
      (u.cargo && u.cargo.toLowerCase().includes(searchUsuario.value.toLowerCase()));

    const matchRole = filterRole.value === 'todos' || u.role === filterRole.value;

    return matchSearch && matchRole;
  });
});

const fetchUsuarios = async () => {
  try {
    loadingUsers.value = true;
    const res = await api.get('/usuarios');
    if (res.data?.status === 'success') {
      usuarios.value = res.data.data || [];
    }
  } catch (error) {
    console.error('Error fetching usuarios:', error);
    $q.notify({
      type: 'negative',
      message: 'No se pudo cargar la lista de usuarios.',
      icon: 'error'
    });
  } finally {
    loadingUsers.value = false;
  }
};

// MODAL CREAR / EDITAR USUARIO
const userModalOpen = ref(false);
const isEditingUser = ref(false);
const savingUser = ref(false);
const showModalPass = ref(false);

const userForm = reactive({
  id: null,
  name: '',
  email: '',
  password: '',
  cargo: '',
  role: 'archivista',
  permissions: [],
  activo: true
});

function openCreateUserModal() {
  isEditingUser.value = false;
  userForm.id = null;
  userForm.name = '';
  userForm.email = '';
  userForm.password = '';
  userForm.cargo = '';
  userForm.role = 'archivista';
  userForm.permissions = defaultPermissionsForRole('archivista');
  userForm.activo = true;
  showModalPass.value = false;
  userModalOpen.value = true;
}

function openEditUserModal(u) {
  isEditingUser.value = true;
  userForm.id = u.id;
  userForm.name = u.name;
  userForm.email = u.email;
  userForm.password = '';
  userForm.cargo = u.cargo || '';
  userForm.role = u.role || 'archivista';
  userForm.permissions = Array.isArray(u.permissions) ? [...u.permissions] : defaultPermissionsForRole(u.role);
  userForm.activo = u.activo ?? true;
  showModalPass.value = false;
  userModalOpen.value = true;
}

function onRoleChange(newRole) {
  userForm.permissions = defaultPermissionsForRole(newRole);
}

function resetPermissionsToRole() {
  userForm.permissions = defaultPermissionsForRole(userForm.role);
  $q.notify({
    type: 'info',
    message: `Permisos restablecidos para el rol: ${getRoleLabel(userForm.role)}`,
    icon: 'done'
  });
}

const saveUser = async () => {
  try {
    savingUser.value = true;

    const payload = {
      name: userForm.name,
      email: userForm.email,
      role: userForm.role,
      cargo: userForm.cargo,
      permissions: userForm.permissions,
      activo: userForm.activo
    };

    if (userForm.password) {
      payload.password = userForm.password;
    }

    if (isEditingUser.value) {
      const res = await api.patch(`/usuarios/${userForm.id}`, payload);
      if (res.data?.status === 'success') {
        $q.notify({
          type: 'positive',
          message: 'Usuario actualizado correctamente',
          icon: 'check_circle'
        });
        userModalOpen.value = false;
        fetchUsuarios();
      }
    } else {
      const res = await api.post('/usuarios', payload);
      if (res.data?.status === 'success') {
        $q.notify({
          type: 'positive',
          message: '¡Usuario creado exitosamente!',
          icon: 'check_circle'
        });
        userModalOpen.value = false;
        fetchUsuarios();
      }
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || 'Error al guardar el usuario.';
    $q.notify({
      type: 'negative',
      message: errorMsg,
      icon: 'warning'
    });
  } finally {
    savingUser.value = false;
  }
};

function confirmDeleteUser(u) {
  $q.dialog({
    title: 'Eliminar Usuario',
    message: `¿Estás seguro de eliminar al usuario "${u.name}" (${u.email})? Esta acción revocará todos sus accesos al sistema.`,
    cancel: {
      flat: true,
      color: 'slate-300',
      label: 'Cancelar'
    },
    ok: {
      unelevated: true,
      color: 'negative',
      label: 'Eliminar Usuario'
    },
    dark: true,
    class: 'bg-slate-900 text-white'
  }).onOk(async () => {
    try {
      const res = await api.delete(`/usuarios/${u.id}`);
      if (res.data?.status === 'success') {
        $q.notify({
          type: 'positive',
          message: 'Usuario eliminado exitosamente',
          icon: 'delete'
        });
        fetchUsuarios();
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Error al eliminar el usuario.';
      $q.notify({
        type: 'negative',
        message: errorMsg,
        icon: 'error'
      });
    }
  });
}

// CAMBIO DE CONTRASEÑA PERSONAL
const submitChangePassword = async () => {
  try {
    savingPass.value = true;
    const response = await api.post('/change-password', {
      current_password: passForm.current_password,
      new_password: passForm.new_password,
      new_password_confirmation: passForm.new_password_confirmation
    });

    if (response.data?.status === 'success') {
      $q.notify({
        type: 'positive',
        message: '¡Contraseña actualizada con éxito!',
        icon: 'check_circle'
      });
      passForm.current_password = '';
      passForm.new_password = '';
      passForm.new_password_confirmation = '';
      emit('update:modelValue', false);
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || 'Error al actualizar la contraseña.';
    $q.notify({
      type: 'negative',
      message: errorMsg,
      icon: 'warning'
    });
  } finally {
    savingPass.value = false;
  }
};

const limpiarCacheLocal = async () => {
  try {
    await clearAllPdfs();
    $q.notify({
      type: 'info',
      message: 'Caché local de documentos limpiada exitosamente.',
      icon: 'done_all'
    });
  } catch (error) {
    console.error('Error limpiando cache:', error);
  }
};

onMounted(() => {
  if (activeTab.value === 'usuarios') {
    fetchUsuarios();
  }
});
</script>

<style scoped>
.profile-card {
  background: #0f172a;
  border: 1px solid #334155;
}

.profile-header {
  border-bottom: 1px solid #1e293b;
}

.header-icon-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(37, 99, 235, 0.15);
  border: 1px solid rgba(37, 99, 235, 0.3);
}

.profile-tabs {
  border-bottom: 1px solid #1e293b;
}

.user-row-card {
  transition: all 0.2s ease;
}

.user-row-card:hover {
  background: #1e293b;
  border-color: #475569;
}

.infra-box {
  transition: all 0.2s ease;
}

.infra-box:hover {
  background: #1e293b;
  border-color: #475569;
}
</style>
