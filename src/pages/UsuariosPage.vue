<template>
  <q-page class="usuarios-page-canvas q-pa-lg">
    <!-- ENCABEZADO EJECUTIVO -->
    <div class="row items-center justify-between q-mb-lg">
      <div class="row items-center q-gutter-md">
        <div class="header-icon-badge flex flex-center">
          <q-icon name="manage_accounts" size="26px" color="white" />
        </div>
        <div>
          <div class="row items-center q-gutter-xs">
            <span class="text-h5 text-weight-bolder text-slate-900" style="letter-spacing: -0.02em;">
              Gestión de Usuarios & Roles
            </span>
            <q-badge color="slate-800" text-color="white" class="text-weight-bold q-ml-xs header-tag">
              Control Institucional
            </q-badge>
          </div>
          <div class="text-caption text-slate-500 q-mt-xs">
            Administración de cuentas, asignación de roles jerárquicos y matriz granular de permisos
          </div>
        </div>
      </div>

      <div class="row q-gutter-sm items-center">
        <q-btn
          flat
          dense
          round
          icon="refresh"
          color="slate-600"
          :loading="loadingUsers"
          class="q-mr-xs"
          @click="fetchUsuarios"
        >
          <q-tooltip>Recargar usuarios</q-tooltip>
        </q-btn>
        <q-btn
          unelevated
          icon="person_add"
          label="Nuevo Usuario"
          class="action-btn-primary"
          @click="openCreateUserModal"
        />
      </div>
    </div>

    <!-- TARJETAS DE MÉTRICAS / KPIS -->
    <div class="row q-col-gutter-md q-mb-md">
      <!-- KPI 1: TOTAL USUARIOS -->
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="kpi-card bg-white q-pa-md">
          <div class="row items-center justify-between no-wrap">
            <div>
              <div class="text-caption text-slate-500 text-weight-bold uppercase" style="letter-spacing: 0.04em;">
                Total Usuarios
              </div>
              <div class="text-h4 text-weight-bolder text-slate-900 q-mt-xs">
                {{ usuarios.length }}
              </div>
              <div class="text-caption text-slate-400 q-mt-xs" style="font-size: 11px;">
                Cuentas en el sistema
              </div>
            </div>
            <div class="kpi-icon-circle bg-blue-50 text-primary flex flex-center">
              <q-icon name="groups" size="22px" />
            </div>
          </div>
        </q-card>
      </div>

      <!-- KPI 2: ADMINISTRADORES -->
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="kpi-card bg-white q-pa-md">
          <div class="row items-center justify-between no-wrap">
            <div>
              <div class="text-caption text-slate-500 text-weight-bold uppercase" style="letter-spacing: 0.04em;">
                Administradores
              </div>
              <div class="text-h4 text-weight-bolder text-primary q-mt-xs">
                {{ totalAdmins }}
              </div>
              <div class="text-caption text-slate-400 q-mt-xs" style="font-size: 11px;">
                Acceso y control total
              </div>
            </div>
            <div class="kpi-icon-circle bg-blue-50 text-primary flex flex-center">
              <q-icon name="admin_panel_settings" size="22px" />
            </div>
          </div>
        </q-card>
      </div>

      <!-- KPI 3: OPERATIVOS / ARCHIVISTAS -->
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="kpi-card bg-white q-pa-md">
          <div class="row items-center justify-between no-wrap">
            <div>
              <div class="text-caption text-slate-500 text-weight-bold uppercase" style="letter-spacing: 0.04em;">
                Kardex & Operadores
              </div>
              <div class="text-h4 text-weight-bolder text-slate-800 q-mt-xs">
                {{ totalOperativos }}
              </div>
              <div class="text-caption text-slate-400 q-mt-xs" style="font-size: 11px;">
                Gestión de fojas y gavetas
              </div>
            </div>
            <div class="kpi-icon-circle bg-slate-100 text-slate-700 flex flex-center">
              <q-icon name="badge" size="22px" />
            </div>
          </div>
        </q-card>
      </div>

      <!-- KPI 4: CUENTAS ACTIVAS -->
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="kpi-card bg-white q-pa-md">
          <div class="row items-center justify-between no-wrap">
            <div>
              <div class="text-caption text-slate-500 text-weight-bold uppercase" style="letter-spacing: 0.04em;">
                Cuentas Habilitadas
              </div>
              <div class="text-h4 text-weight-bolder text-positive q-mt-xs">
                {{ totalActivos }}
              </div>
              <div class="text-caption text-slate-400 q-mt-xs" style="font-size: 11px;">
                Con inicio de sesión activo
              </div>
            </div>
            <div class="kpi-icon-circle bg-green-50 text-positive flex flex-center">
              <q-icon name="verified_user" size="22px" />
            </div>
          </div>
        </q-card>
      </div>
    </div>

    <!-- BARRA DE BÚSQUEDA Y FILTROS -->
    <q-card flat bordered class="q-mb-md q-pa-sm bg-white" style="border-radius: 10px;">
      <div class="row q-col-gutter-sm items-center">
        <!-- BUSCADOR -->
        <div class="col-12 col-md-4">
          <q-input
            v-model="filterSearch"
            outlined
            dense
            clearable
            placeholder="Buscar por nombre, correo o cargo..."
          >
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>

        <!-- FILTRO DE ROL -->
        <div class="col-12 col-sm-6 col-md-3">
          <q-select
            v-model="filterRole"
            :options="roleFilterOptions"
            emit-value
            map-options
            outlined
            dense
            label="Filtrar por Rol"
          />
        </div>

        <!-- FILTRO DE ESTADO -->
        <div class="col-12 col-sm-6 col-md-3">
          <q-select
            v-model="filterEstado"
            :options="estadoFilterOptions"
            emit-value
            map-options
            outlined
            dense
            label="Estado de Cuenta"
          />
        </div>

        <!-- CONTADOR DE REGISTROS -->
        <div class="col-12 col-md-2 text-right">
          <q-badge color="blue-grey-8" class="q-pa-xs text-caption">
            {{ usuariosFiltrados.length }} usuarios
          </q-badge>
        </div>
      </div>
    </q-card>

    <!-- TABLA PRINCIPAL DE USUARIOS -->
    <q-card flat bordered class="q-mb-xl" style="border-radius: 10px;">
      <q-table
        :rows="usuariosFiltrados"
        :columns="columns"
        row-key="id"
        :loading="loadingUsers"
        flat
        separator="horizontal"
        :pagination="{ rowsPerPage: 10 }"
        no-data-label="No se encontraron usuarios registrados"
      >
        <!-- COLUMNA USUARIO (AVATAR + NOMBRE + EMAIL + CARGO) -->
        <template v-slot:body-cell-usuario="props">
          <q-td :props="props">
            <div class="row items-center no-wrap">
              <q-avatar
                size="38px"
                :color="props.row.role === 'admin' ? 'primary' : 'slate-800'"
                text-color="white"
                class="q-mr-sm text-weight-bold"
                style="font-size: 13px;"
              >
                {{ getInitials(props.row.name) }}
              </q-avatar>
              <div class="column">
                <div class="row items-center q-gutter-x-xs">
                  <span class="text-weight-bold text-slate-900 text-body2">{{ props.row.name }}</span>
                  <q-badge
                    v-if="props.row.id === authStore.currentUser?.id"
                    color="primary"
                    text-color="white"
                    label="Tú"
                    class="text-weight-bold"
                    style="font-size: 9px; padding: 2px 6px;"
                  />
                </div>
                <div class="text-caption text-slate-500">{{ props.row.email }}</div>
                <div v-if="props.row.cargo" class="text-caption text-slate-400" style="font-size: 10.5px;">
                  {{ props.row.cargo }}
                </div>
              </div>
            </div>
          </q-td>
        </template>

        <!-- COLUMNA ROL -->
        <template v-slot:body-cell-role="props">
          <q-td :props="props">
            <q-badge
              :color="getRoleBadgeColor(props.row.role)"
              text-color="white"
              class="text-weight-bold q-px-sm q-py-xs"
              style="font-size: 11px; border-radius: 6px;"
            >
              <q-icon :name="getRoleIcon(props.row.role)" size="13px" class="q-mr-xs" />
              {{ getRoleLabel(props.row.role) }}
            </q-badge>
          </q-td>
        </template>

        <!-- COLUMNA PERMISOS -->
        <template v-slot:body-cell-permissions="props">
          <q-td :props="props">
            <div class="row items-center q-gutter-xs cursor-pointer">
              <q-badge
                color="blue-50"
                text-color="primary"
                class="text-weight-bold q-px-sm q-py-xs border border-blue-200"
                style="font-size: 11px;"
              >
                {{ (props.row.permissions || []).length }} permisos asignados
              </q-badge>
              <q-icon name="info" size="14px" color="slate-400" />

              <q-tooltip class="bg-slate-950 text-white shadow-4" style="max-width: 320px;">
                <div class="text-weight-bold q-mb-xs">Permisos activos:</div>
                <div v-if="(props.row.permissions || []).length === 0" class="text-caption text-slate-400">
                  Sin permisos especiales asignados (solo lectura).
                </div>
                <div v-for="p in (props.row.permissions || [])" :key="p" class="text-caption q-my-xs">
                  • {{ getPermissionLabel(p) }}
                </div>
              </q-tooltip>
            </div>
          </q-td>
        </template>

        <!-- COLUMNA ESTADO -->
        <template v-slot:body-cell-activo="props">
          <q-td :props="props">
            <q-chip
              clickable
              :color="props.row.activo ? 'green-1' : 'red-1'"
              :text-color="props.row.activo ? 'positive' : 'negative'"
              dense
              class="text-weight-bold"
              style="font-size: 11px;"
              @click="toggleUserActivo(props.row)"
            >
              <q-icon :name="props.row.activo ? 'check_circle' : 'cancel'" size="14px" class="q-mr-xs" />
              {{ props.row.activo ? 'Habilitado' : 'Inactivo' }}
              <q-tooltip>Clic para alternar estado de acceso</q-tooltip>
            </q-chip>
          </q-td>
        </template>

        <!-- COLUMNA FECHA -->
        <template v-slot:body-cell-created_at="props">
          <q-td :props="props" class="text-slate-500 font-mono" style="font-size: 11.5px;">
            {{ props.row.created_at || '—' }}
          </q-td>
        </template>

        <!-- COLUMNA ACCIONES -->
        <template v-slot:body-cell-acciones="props">
          <q-td :props="props">
            <div class="row items-center q-gutter-xs no-wrap justify-end">
              <!-- EDITAR -->
              <q-btn
                flat
                round
                dense
                size="sm"
                icon="edit"
                color="primary"
                @click="openEditUserModal(props.row)"
              >
                <q-tooltip>Editar usuario y permisos</q-tooltip>
              </q-btn>

              <!-- CAMBIAR CONTRASEÑA -->
              <q-btn
                flat
                round
                dense
                size="sm"
                icon="lock_reset"
                color="slate-600"
                @click="openChangePassModal(props.row)"
              >
                <q-tooltip>Restablecer contraseña</q-tooltip>
              </q-btn>

              <!-- ELIMINAR (SI NO ES EL MISMO USUARIO) -->
              <q-btn
                flat
                round
                dense
                size="sm"
                icon="delete"
                color="negative"
                :disable="props.row.id === authStore.currentUser?.id"
                @click="confirmDeleteUser(props.row)"
              >
                <q-tooltip>
                  {{ props.row.id === authStore.currentUser?.id ? 'No puedes eliminar tu propia cuenta' : 'Eliminar usuario' }}
                </q-tooltip>
              </q-btn>
            </div>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- SECCIÓN INFORMATIVA: ROLES Y CAPACIDADES INSTITUCIONALES -->
    <div class="q-mt-md">
      <div class="row items-center q-gutter-xs q-mb-md">
        <q-icon name="security" size="20px" color="primary" />
        <span class="text-subtitle1 text-weight-bolder text-slate-900">
          Matriz de Roles y Niveles de Acceso Institucional
        </span>
      </div>

      <div class="row q-col-gutter-md">
        <div
          v-for="role in roleDefinitions"
          :key="role.value"
          class="col-12 col-sm-6 col-md-3"
        >
          <q-card flat bordered class="role-desc-card bg-white q-pa-md full-height column justify-between">
            <div>
              <div class="row items-center justify-between q-mb-sm">
                <q-badge
                  :color="role.badgeColor"
                  text-color="white"
                  class="text-weight-bold q-px-sm q-py-xs"
                  style="border-radius: 6px; font-size: 11px;"
                >
                  <q-icon :name="role.icon" size="13px" class="q-mr-xs" />
                  {{ role.title }}
                </q-badge>
                <span class="text-caption text-slate-400 font-mono" style="font-size: 10px;">{{ role.code }}</span>
              </div>
              <div class="text-caption text-slate-600 q-mb-sm" style="line-height: 1.4;">
                {{ role.description }}
              </div>
            </div>
            <div class="q-pt-sm border-top border-slate-100">
              <div class="text-caption text-slate-400 text-weight-bold" style="font-size: 10px;">
                Permisos clave:
              </div>
              <div class="text-caption text-slate-700 q-mt-xs" style="font-size: 11px;">
                {{ role.keyPermissions }}
              </div>
            </div>
          </q-card>
        </div>
      </div>
    </div>

    <!-- ======================================================= -->
    <!-- MODAL CREAR / EDITAR USUARIO CON ROLES Y PERMISOS       -->
    <!-- ======================================================= -->
    <q-dialog v-model="userModalOpen" persistent transition-show="scale" transition-hide="scale">
      <q-card class="bg-white text-slate-900 shadow-24" style="width: 620px; max-width: 95vw; border-radius: 14px; overflow: hidden;">
        <!-- CABECERA -->
        <div class="q-pa-md bg-slate-900 text-white row items-center justify-between">
          <div class="row items-center q-gutter-sm">
            <div class="modal-header-icon-circle flex flex-center">
              <q-icon :name="isEditingUser ? 'manage_accounts' : 'person_add'" size="20px" color="primary" />
            </div>
            <div>
              <div class="text-subtitle1 text-weight-bolder">
                {{ isEditingUser ? 'Editar Usuario & Permisos' : 'Crear Nuevo Usuario' }}
              </div>
              <div class="text-caption text-slate-400" style="font-size: 11px;">
                {{ isEditingUser ? 'Actualiza los datos institucionales y niveles de acceso' : 'Registra una nueva cuenta institucional en DOCUS' }}
              </div>
            </div>
          </div>
          <q-btn flat round dense icon="close" size="sm" color="slate-400" v-close-popup />
        </div>

        <q-form @submit.prevent="saveUser">
          <div class="q-pa-lg q-gutter-y-md">
            <!-- NOMBRE COMPLETO -->
            <div>
              <div class="text-caption text-slate-700 text-weight-bold q-mb-xs">Nombre Completo *</div>
              <q-input
                v-model="userForm.name"
                outlined
                dense
                placeholder="Ej. Lic. Roberto Pérez Rojas"
                :rules="[val => !!val || 'El nombre es obligatorio']"
              />
            </div>

            <!-- EMAIL Y CARGO EN 2 COLUMNAS -->
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <div class="text-caption text-slate-700 text-weight-bold q-mb-xs">Correo Electrónico *</div>
                <q-input
                  v-model="userForm.email"
                  type="email"
                  outlined
                  dense
                  placeholder="usuario@docus.com"
                  :rules="[
                    val => !!val || 'El correo es requerido',
                    val => /.+@.+\..+/.test(val) || 'Ingresa un correo válido'
                  ]"
                />
              </div>

              <div class="col-12 col-sm-6">
                <div class="text-caption text-slate-700 text-weight-bold q-mb-xs">Cargo Institucional</div>
                <q-input
                  v-model="userForm.cargo"
                  outlined
                  dense
                  placeholder="Ej. Archivista Principal"
                />
              </div>
            </div>

            <!-- CONTRASEÑA -->
            <div>
              <div class="row items-center justify-between q-mb-xs">
                <span class="text-caption text-slate-700 text-weight-bold">
                  {{ isEditingUser ? 'Nueva Contraseña (dejar en blanco para mantener la actual)' : 'Contraseña de Acceso *' }}
                </span>
                <span v-if="!isEditingUser" class="text-caption text-slate-500" style="font-size: 11px;">Mínimo 6 caracteres</span>
              </div>
              <q-input
                v-model="userForm.password"
                :type="showModalPass ? 'text' : 'password'"
                outlined
                dense
                :placeholder="isEditingUser ? '•••••••• (sin cambios)' : 'Contraseña segura'"
                :rules="[
                  val => isEditingUser || !!val || 'La contraseña es obligatoria',
                  val => !val || val.length >= 6 || 'Debe tener al menos 6 caracteres'
                ]"
              >
                <template #append>
                  <q-icon
                    :name="showModalPass ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer text-slate-500"
                    @click="showModalPass = !showModalPass"
                  />
                </template>
              </q-input>
            </div>

            <!-- SELECCIÓN DE ROL CON DESCRIPCIÓN -->
            <div>
              <div class="text-caption text-slate-700 text-weight-bold q-mb-xs">Rol Institucional *</div>
              <q-select
                v-model="userForm.role"
                :options="roleOptions"
                outlined
                dense
                emit-value
                map-options
                @update:model-value="onRoleChange"
              />
              <div class="text-caption text-slate-500 q-mt-xs" style="font-size: 11.5px;">
                {{ getRoleDescription(userForm.role) }}
              </div>
            </div>

            <!-- MATRIZ DE PERMISOS ESPECÍFICOS -->
            <div class="q-pt-xs">
              <div class="row items-center justify-between q-mb-xs">
                <span class="text-caption text-slate-700 text-weight-bold uppercase" style="letter-spacing: 0.05em;">
                  Matriz de Permisos Específicos
                </span>
                <q-btn
                  flat
                  dense
                  no-caps
                  size="xs"
                  color="primary"
                  label="Restablecer a recomendados"
                  @click="resetPermissionsToRole"
                />
              </div>

              <div class="q-pa-sm bg-slate-50 rounded-borders border border-slate-200">
                <div class="row q-col-gutter-xs">
                  <div
                    v-for="perm in availablePermissions"
                    :key="perm.id"
                    class="col-12 col-sm-6"
                  >
                    <q-checkbox
                      v-model="userForm.permissions"
                      :val="perm.id"
                      color="primary"
                      size="sm"
                      class="text-caption"
                    >
                      <span class="text-slate-800 text-weight-medium" style="font-size: 11.5px;">{{ perm.label }}</span>
                    </q-checkbox>
                  </div>
                </div>
              </div>
            </div>

            <!-- USUARIO ACTIVO / TOGGLE -->
            <div class="row items-center justify-between q-pa-sm bg-slate-50 rounded-borders border border-slate-200">
              <div>
                <div class="text-caption text-weight-bold text-slate-800">Estado de la Cuenta</div>
                <div class="text-caption text-slate-500" style="font-size: 11px;">Permite al usuario iniciar sesión en DOCUS</div>
              </div>
              <q-toggle v-model="userForm.activo" color="primary" />
            </div>
          </div>

          <!-- BOTONES MODAL -->
          <div class="q-pa-md bg-slate-50 border-top border-slate-200 row items-center justify-end q-gutter-x-sm">
            <q-btn flat no-caps color="slate-600" label="Cancelar" v-close-popup />
            <q-btn
              type="submit"
              unelevated
              no-caps
              color="primary"
              text-color="white"
              icon="save"
              :label="isEditingUser ? 'Guardar Cambios' : 'Crear Usuario'"
              class="text-weight-bolder q-px-md"
              :loading="savingUser"
            />
          </div>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- ======================================================= -->
    <!-- MODAL RESTABLECER CONTRASEÑA RÁPIDA                     -->
    <!-- ======================================================= -->
    <q-dialog v-model="passModalOpen" transition-show="scale" transition-hide="scale">
      <q-card class="bg-white text-slate-900 shadow-24" style="width: 440px; max-width: 95vw; border-radius: 14px;">
        <div class="q-pa-md bg-slate-900 text-white row items-center justify-between">
          <div class="row items-center q-gutter-xs">
            <q-icon name="lock_reset" size="20px" color="primary" />
            <span class="text-subtitle1 text-weight-bolder">Restablecer Contraseña</span>
          </div>
          <q-btn flat round dense icon="close" size="sm" color="slate-400" v-close-popup />
        </div>

        <q-form @submit.prevent="submitChangePass">
          <div class="q-pa-md q-gutter-y-sm">
            <div class="text-caption text-slate-600">
              Asigna una nueva clave de acceso para el usuario:
              <b class="text-slate-900">{{ targetUser?.name }}</b> ({{ targetUser?.email }}).
            </div>

            <div>
              <div class="text-caption text-slate-700 text-weight-bold q-mb-xs">Nueva Contraseña *</div>
              <q-input
                v-model="newPassword"
                type="password"
                outlined
                dense
                placeholder="Mínimo 6 caracteres"
                :rules="[
                  val => !!val || 'La contraseña es requerida',
                  val => val.length >= 6 || 'Mínimo 6 caracteres'
                ]"
              />
            </div>
          </div>

          <div class="q-pa-md bg-slate-50 border-top border-slate-200 row items-center justify-end q-gutter-x-sm">
            <q-btn flat no-caps color="slate-600" label="Cancelar" v-close-popup />
            <q-btn
              type="submit"
              unelevated
              no-caps
              color="primary"
              label="Actualizar Clave"
              class="text-weight-bolder"
              :loading="savingPass"
            />
          </div>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'src/stores/authStore';
import { api } from 'src/boot/axios';

const $q = useQuasar();
const authStore = useAuthStore();

// ========================================================
// ESTADO Y FILTROS
// ========================================================
const usuarios = ref([]);
const loadingUsers = ref(false);
const filterSearch = ref('');
const filterRole = ref('todos');
const filterEstado = ref('todos');

const roleFilterOptions = [
  { label: 'Todos los roles', value: 'todos' },
  { label: 'Administrador', value: 'admin' },
  { label: 'Archivista / Kardex', value: 'archivista' },
  { label: 'Operador Digital', value: 'operador' },
  { label: 'Solo Consulta', value: 'consulta' }
];

const estadoFilterOptions = [
  { label: 'Todos los estados', value: 'todos' },
  { label: 'Habilitados (Activos)', value: 'activos' },
  { label: 'Inactivos', value: 'inactivos' }
];

const roleOptions = [
  { label: 'Administrador (Acceso Total)', value: 'admin' },
  { label: 'Archivista / Kardex (Gestión de Gavetas y Expedientes)', value: 'archivista' },
  { label: 'Operador (Carga y Desglose Digital)', value: 'operador' },
  { label: 'Solo Consulta (Lectura y Auditoría)', value: 'consulta' }
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

const roleDefinitions = [
  {
    code: 'ADMIN',
    title: 'Administrador',
    icon: 'admin_panel_settings',
    badgeColor: 'primary',
    description: 'Control y configuración global de DOCUS. Administra usuarios, archivadores, reglas y procesos masivos.',
    keyPermissions: 'Acceso total sin restricciones'
  },
  {
    code: 'ARCHIVISTA',
    title: 'Archivista / Kardex',
    icon: 'dashboard',
    badgeColor: 'slate-800',
    description: 'Responsable de la organización física en gavetas, traslados, préstamos de carpetas y desgloses.',
    keyPermissions: 'Mover carpetas, configurar gavetas, subir fojas'
  },
  {
    code: 'OPERADOR',
    title: 'Operador Digital',
    icon: 'badge',
    badgeColor: 'slate-700',
    description: 'Enfocado en la digitalización, desglose de PDFs y subida de contratos y legajos al sistema.',
    keyPermissions: 'Subir fojas, desglosar PDFs, actualizar datos'
  },
  {
    code: 'CONSULTA',
    title: 'Solo Consulta',
    icon: 'visibility',
    badgeColor: 'slate-600',
    description: 'Perfil auditor o directivo con permisos de visualización de libros, expedientes y reportes.',
    keyPermissions: 'Lectura protegida (sin edición ni borrado)'
  }
];

// ========================================================
// COLUMNAS TABLA
// ========================================================
const columns = [
  { name: 'usuario', label: 'USUARIO INSTITUCIONAL', align: 'left', field: 'name', sortable: true },
  { name: 'role', label: 'ROL ASIGNADO', align: 'left', field: 'role', sortable: true },
  { name: 'permissions', label: 'PERMISOS ACTIVOS', align: 'left', field: 'permissions' },
  { name: 'activo', label: 'ESTADO', align: 'center', field: 'activo', sortable: true },
  { name: 'created_at', label: 'REGISTRO', align: 'left', field: 'created_at', sortable: true },
  { name: 'acciones', label: 'ACCIONES', align: 'right' }
];

// ========================================================
// COMPUTEDS & KPIS
// ========================================================
const totalAdmins = computed(() => usuarios.value.filter(u => u.role === 'admin').length);
const totalOperativos = computed(() => usuarios.value.filter(u => u.role === 'archivista' || u.role === 'operador').length);
const totalActivos = computed(() => usuarios.value.filter(u => u.activo).length);

const usuariosFiltrados = computed(() => {
  return usuarios.value.filter(u => {
    const s = filterSearch.value ? filterSearch.value.toLowerCase().trim() : '';
    const matchSearch = !s ||
      u.name.toLowerCase().includes(s) ||
      u.email.toLowerCase().includes(s) ||
      (u.cargo && u.cargo.toLowerCase().includes(s));

    const matchRole = filterRole.value === 'todos' || u.role === filterRole.value;

    let matchEstado = true;
    if (filterEstado.value === 'activos') matchEstado = !!u.activo;
    if (filterEstado.value === 'inactivos') matchEstado = !u.activo;

    return matchSearch && matchRole && matchEstado;
  });
});

// ========================================================
// HELPERS VISUALES
// ========================================================
function getInitials(name) {
  if (!name) return 'US';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getRoleLabel(role) {
  switch (role) {
    case 'admin': return 'Administrador';
    case 'archivista': return 'Archivista / Kardex';
    case 'operador': return 'Operador Digital';
    case 'consulta': return 'Solo Consulta';
    default: return role || 'Archivista';
  }
}

function getRoleBadgeColor(role) {
  switch (role) {
    case 'admin': return 'primary';
    case 'archivista': return 'slate-900';
    case 'operador': return 'slate-800';
    case 'consulta': return 'slate-600';
    default: return 'slate-800';
  }
}

function getRoleIcon(role) {
  switch (role) {
    case 'admin': return 'admin_panel_settings';
    case 'archivista': return 'dashboard';
    case 'operador': return 'badge';
    case 'consulta': return 'visibility';
    default: return 'person';
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

// ========================================================
// API CALLS
// ========================================================
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

const toggleUserActivo = async (user) => {
  try {
    const nuevoEstado = !user.activo;
    const res = await api.patch(`/usuarios/${user.id}`, { activo: nuevoEstado });
    if (res.data?.status === 'success') {
      user.activo = nuevoEstado;
      $q.notify({
        type: 'info',
        message: `Usuario ${user.name} marcado como ${nuevoEstado ? 'Habilitado' : 'Inactivo'}.`,
        icon: nuevoEstado ? 'check_circle' : 'block'
      });
    }
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    $q.notify({
      type: 'negative',
      message: 'Error al actualizar el estado del usuario.',
      icon: 'error'
    });
  }
};

// ========================================================
// MODAL CREAR / EDITAR USUARIO
// ========================================================
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
    message: `¿Estás seguro de eliminar al usuario "${u.name}" (${u.email})? Esta acción revocará todos sus accesos institucionales al sistema DOCUS.`,
    cancel: {
      flat: true,
      color: 'slate-600',
      label: 'Cancelar'
    },
    ok: {
      unelevated: true,
      color: 'negative',
      label: 'Eliminar Usuario'
    }
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
      const msg = error.response?.data?.message || 'Error al eliminar usuario';
      $q.notify({
        type: 'negative',
        message: msg,
        icon: 'error'
      });
    }
  });
}

// ========================================================
// MODAL CAMBIO RÁPIDO DE CONTRASEÑA
// ========================================================
const passModalOpen = ref(false);
const targetUser = ref(null);
const newPassword = ref('');
const savingPass = ref(false);

function openChangePassModal(u) {
  targetUser.value = u;
  newPassword.value = '';
  passModalOpen.value = true;
}

const submitChangePass = async () => {
  if (!targetUser.value || !newPassword.value) return;
  try {
    savingPass.value = true;
    const res = await api.patch(`/usuarios/${targetUser.value.id}`, { password: newPassword.value });
    if (res.data?.status === 'success') {
      $q.notify({
        type: 'positive',
        message: `Contraseña restablecida exitosamente para ${targetUser.value.name}`,
        icon: 'check_circle'
      });
      passModalOpen.value = false;
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Error al restablecer la contraseña',
      icon: 'error'
    });
  } finally {
    savingPass.value = false;
  }
};

onMounted(() => {
  fetchUsuarios();
});
</script>

<style scoped>
.usuarios-page-canvas {
  background: #f8fafc;
  min-height: 100vh;
}

.header-icon-badge {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #2563eb;
}

.header-tag {
  font-size: 10.5px;
  letter-spacing: 0.05em;
  padding: 4px 8px;
  border-radius: 6px;
}

.action-btn-primary {
  background: #2563eb;
  color: white;
  font-weight: 700;
  border-radius: 8px;
  padding: 8px 16px;
}

.kpi-card {
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
}

.kpi-icon-circle {
  width: 42px;
  height: 42px;
  border-radius: 10px;
}

.role-desc-card {
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.modal-header-icon-circle {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(37, 99, 235, 0.15);
}

/* Modo oscuro */
body.body--dark .usuarios-page-canvas {
  background: #0f172a;
}
body.body--dark .kpi-card,
body.body--dark .role-desc-card {
  background: #1e293b !important;
  border-color: #334155 !important;
}
body.body--dark .text-slate-900 {
  color: #f1f5f9 !important;
}
body.body--dark .text-slate-800 {
  color: #e2e8f0 !important;
}
body.body--dark .text-slate-700 {
  color: #cbd5e1 !important;
}
body.body--dark .text-slate-600 {
  color: #94a3b8 !important;
}
body.body--dark .text-slate-500 {
  color: #64748b !important;
}
body.body--dark .bg-white {
  background: #1e293b !important;
}
body.body--dark .bg-slate-50 {
  background: #0f172a !important;
}
body.body--dark .border-slate-200 {
  border-color: #334155 !important;
}
</style>
