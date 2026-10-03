<template>
  <q-layout view="hHh Lpr fFf">
    <!-- NAVBAR PRINCIPAL (100% LIMPIO - SIN BOTONES CENTRALES) -->
    <q-header class="main-header">
      <q-toolbar class="q-px-md q-px-md-lg main-toolbar">
        <!-- TOGGLE MENÚ LATERAL -->
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menú Lateral"
          @click="toggleLeftDrawer"
          class="q-mr-sm sidebar-toggle-btn"
        >
          <q-tooltip>Mostrar / Ocultar menú lateral</q-tooltip>
        </q-btn>

        <!-- BRANDING / LOGOTIPO -->
        <div class="row items-center q-gutter-sm cursor-pointer brand-container" @click="$router.push('/kardex')">
          <div class="brand-icon-box flex flex-center">
            <q-icon name="inventory_2" size="20px" color="white" />
          </div>
          <div>
            <div class="row items-center q-gutter-xs">
              <span class="text-weight-bolder brand-title">DOCUS RRHH</span>
              <span class="online-indicator" title="Sistema conectado en tiempo real"></span>
            </div>
            <div class="brand-subtitle gt-xs">GESTIÓN DE EXPEDIENTES & KARDEX</div>
          </div>
        </div>

        <!-- ESPACIO CENTRAL: BUSCADOR SPOTLIGHT RÁPIDO (CTRL + K) -->
        <q-space />

        <div
          class="spotlight-header-trigger gt-xs row items-center q-px-sm q-py-xs cursor-pointer q-mr-sm"
          @click="spotlightOpen = true"
          title="Abrir búsqueda global de expedientes (Ctrl + K)"
        >
          <q-icon name="search" size="15px" color="indigo-7" />
          <span class="spotlight-trigger-text text-slate-500 q-mx-xs">Buscar expediente...</span>
          <span class="spotlight-trigger-kbd">Ctrl K</span>
        </div>

        <!-- ACCIONES RÁPIDAS A LA DERECHA -->
        <div class="row items-center q-gutter-xs q-gutter-sm-sm no-wrap">
          <!-- BOTÓN BÚSQUEDA SPOTLIGHT EN MÓVIL (lt-sm) -->
          <q-btn
            flat
            round
            dense
            size="sm"
            icon="search"
            color="indigo-7"
            class="toolbar-action-btn lt-sm"
            @click="spotlightOpen = true"
          >
            <q-tooltip>Buscar expediente (Ctrl+K)</q-tooltip>
          </q-btn>

          <!-- RELOJ DIGITAL EN VIVO (Desktop) -->
          <div class="clock-display gt-sm row items-center q-gutter-xs q-px-sm q-py-xs">
            <q-icon name="schedule" size="14px" color="indigo-7" />
            <span class="clock-text">{{ liveTime }}</span>
          </div>

          <!-- BOTÓN TEMA OSCURO / CLARO -->
          <q-btn
            flat
            round
            dense
            size="sm"
            :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'"
            :color="$q.dark.isActive ? 'amber-4' : 'slate-600'"
            class="toolbar-action-btn"
            @click="toggleDarkMode"
          >
            <q-tooltip>{{ $q.dark.isActive ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro' }}</q-tooltip>
          </q-btn>

          <!-- BOTÓN SINCRONIZAR DATOS EN VIVO -->
          <q-btn
            flat
            round
            dense
            size="sm"
            icon="sync"
            class="toolbar-action-btn"
            :class="{ 'rotate-animation': syncing }"
            @click="syncAllData"
          >
            <q-tooltip>Sincronizar datos del servidor</q-tooltip>
          </q-btn>

          <!-- BOTÓN PANTALLA COMPLETA (Desktop) -->
          <q-btn
            flat
            round
            dense
            size="sm"
            :icon="isFullscreen ? 'fullscreen_exit' : 'fullscreen'"
            class="toolbar-action-btn gt-xs"
            @click="toggleFullscreen"
          >
            <q-tooltip>{{ isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa' }}</q-tooltip>
          </q-btn>

          <q-separator vertical inset class="q-mx-xs gt-xs" style="background: #e2e8f0;" />

          <!-- PERFIL DE USUARIO / ROL -->
          <div class="user-pill row items-center q-gutter-xs q-px-sm q-py-xs cursor-pointer">
            <div class="user-avatar-mini flex flex-center">
              <span>RH</span>
            </div>
            <div class="gt-sm column items-start" style="line-height: 1.15;">
              <span class="user-name-text">Admin RRHH</span>
              <span class="user-role-text">Sede Central</span>
            </div>
            <q-icon name="expand_more" size="16px" color="grey-7" class="gt-xs" />

            <q-menu auto-close anchor="bottom right" self="top right" class="user-menu-dropdown shadow-10">
              <q-list dense style="min-width: 230px;" class="q-pa-xs">
                <q-item-label header class="text-weight-bold text-slate-500" style="font-size: 11px;">
                  SESIÓN ACTIVA
                </q-item-label>
                <q-item>
                  <q-item-section avatar>
                    <q-avatar size="34px" color="indigo" text-color="white" class="text-weight-bold">
                      RH
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-bold text-slate-900">Administrador RRHH</q-item-label>
                    <q-item-label caption class="text-slate-500">admin@docus.bo</q-item-label>
                  </q-item-section>
                </q-item>
                <q-separator class="q-my-xs" />
                <q-item clickable @click="openImportDialog">
                  <q-item-section avatar>
                    <q-icon name="upload_file" color="indigo" size="18px" />
                  </q-item-section>
                  <q-item-section class="text-slate-800">Importar Planilla Excel</q-item-section>
                </q-item>
                <q-item clickable @click="syncAllData">
                  <q-item-section avatar>
                    <q-icon name="refresh" color="teal" size="18px" />
                  </q-item-section>
                  <q-item-section class="text-slate-800">Recargar Catálogos</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </div>
        </div>
      </q-toolbar>
    </q-header>

    <!-- MENÚ LATERAL PRINCIPAL (AQUÍ RESIDEN EXCLUSIVAMENTE LOS BOTONES DE NAVEGACIÓN) -->
    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      :width="280"
      class="main-drawer"
    >
      <div class="drawer-inner-container column no-wrap full-height">
        <!-- WORKSPACE HEADER -->
        <div class="drawer-header-box q-pa-md border-bottom col-auto">
          <div class="row items-center q-gutter-sm no-wrap">
            <div class="workspace-avatar flex flex-center">
              <q-icon name="apartment" size="18px" color="indigo" />
            </div>
            <div class="col ellipsis">
              <div class="text-weight-bolder drawer-workspace-title ellipsis" style="font-size: 13.5px;">
                DOCUS Archivo RRHH
              </div>
              <div class="text-caption text-slate-500" style="font-size: 11px;">
                Espacio de Trabajo Principal
              </div>
            </div>
          </div>
        </div>

        <!-- SECCIÓN DE NAVEGACIÓN Y HERRAMIENTAS SCROLLABLE -->
        <div class="drawer-scroll-section col scroll q-px-sm q-pt-md q-pb-md">
          <div class="drawer-section-title q-px-sm q-mb-xs">
            NAVEGACIÓN PRINCIPAL
          </div>

          <q-list class="q-gutter-y-xs">
            <!-- BOTÓN ARCHIVADORES & GAVETAS -->
            <q-item
              clickable
              v-ripple
              to="/kardex"
              active-class="drawer-item-active"
              class="drawer-nav-item"
              exact
            >
              <q-item-section avatar class="drawer-avatar-col">
                <div class="drawer-icon-box flex flex-center">
                  <q-icon name="dashboard" size="18px" />
                </div>
              </q-item-section>
              <q-item-section>
                <q-item-label class="drawer-item-title">Archivadores & Gavetas</q-item-label>
                <q-item-label caption class="drawer-item-sub">Gemelo digital interactivo</q-item-label>
              </q-item-section>
              <q-item-section side v-if="store.muebles.length > 0">
                <span class="drawer-count-badge">{{ store.muebles.length }}</span>
              </q-item-section>
            </q-item>

            <!-- BOTÓN DIRECTORIO DE PERSONAL -->
            <q-item
              clickable
              v-ripple
              to="/personal"
              active-class="drawer-item-active"
              class="drawer-nav-item"
            >
              <q-item-section avatar class="drawer-avatar-col">
                <div class="drawer-icon-box flex flex-center">
                  <q-icon name="badge" size="18px" />
                </div>
              </q-item-section>
              <q-item-section>
                <q-item-label class="drawer-item-title">Directorio de Personal</q-item-label>
                <q-item-label caption class="drawer-item-sub">Contratos, sedes e historial</q-item-label>
              </q-item-section>
              <q-item-section side v-if="store.personal.length > 0">
                <span class="drawer-count-badge drawer-count-badge-sky">{{ store.personal.length }}</span>
              </q-item-section>
            </q-item>
          </q-list>

          <q-separator class="q-my-md" style="background: #e2e8f0;" />

          <!-- HERRAMIENTAS RÁPIDAS -->
          <div class="drawer-section-title q-px-sm q-mb-xs">
            HERRAMIENTAS
          </div>

          <q-list class="q-gutter-y-xs">
            <!-- BOTÓN BÚSQUEDA SPOTLIGHT -->
            <q-item
              clickable
              v-ripple
              @click="spotlightOpen = true"
              class="drawer-nav-item"
            >
              <q-item-section avatar class="drawer-avatar-col">
                <div class="drawer-icon-box flex flex-center">
                  <q-icon name="search" size="18px" color="indigo-7" />
                </div>
              </q-item-section>
              <q-item-section>
                <q-item-label class="drawer-item-title">Búsqueda Rápida</q-item-label>
                <q-item-label caption class="drawer-item-sub">Spotlight de expedientes</q-item-label>
              </q-item-section>
              <q-item-section side>
                <span class="spotlight-kbd-side">Ctrl K</span>
              </q-item-section>
            </q-item>

            <!-- BOTÓN EXPORTAR EXCEL -->
            <q-item
              clickable
              v-ripple
              @click="triggerExportExcel"
              class="drawer-nav-item"
            >
              <q-item-section avatar class="drawer-avatar-col">
                <div class="drawer-icon-box flex flex-center" style="background: #ecfdf5; border-color: #a7f3d0;">
                  <q-icon name="table_view" size="18px" color="emerald-7" />
                </div>
              </q-item-section>
              <q-item-section>
                <q-item-label class="drawer-item-title">Inventario en Excel</q-item-label>
                <q-item-label caption class="drawer-item-sub">Descargar reporte (.xlsx)</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="download" size="14px" color="emerald-8" />
              </q-item-section>
            </q-item>

            <!-- BOTÓN MÉTRICAS DE CAPACIDAD -->
            <q-item
              clickable
              v-ripple
              @click="metricasOpen = true"
              class="drawer-nav-item"
            >
              <q-item-section avatar class="drawer-avatar-col">
                <div class="drawer-icon-box flex flex-center" style="background: #faf5ff; border-color: #e9d5ff;">
                  <q-icon name="insights" size="18px" color="purple-7" />
                </div>
              </q-item-section>
              <q-item-section>
                <q-item-label class="drawer-item-title">Métricas de Ocupación</q-item-label>
                <q-item-label caption class="drawer-item-sub">Capacidad y distribución</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="arrow_forward" size="14px" color="grey-6" />
              </q-item-section>
            </q-item>

            <!-- BOTÓN IMPORTAR EXCEL -->
            <q-item
              clickable
              v-ripple
              @click="openImportDialog"
              class="drawer-nav-item drawer-tool-item"
            >
              <q-item-section avatar class="drawer-avatar-col">
                <div class="drawer-icon-box drawer-icon-box-amber flex flex-center">
                  <q-icon name="upload_file" size="18px" color="amber-9" />
                </div>
              </q-item-section>
              <q-item-section>
                <q-item-label class="drawer-item-title">Importar Excel</q-item-label>
                <q-item-label caption class="drawer-item-sub">Carga masiva de planillas</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="arrow_forward" size="14px" color="grey-6" />
              </q-item-section>
            </q-item>

            <!-- BOTÓN SINCRONIZAR -->
            <q-item
              clickable
              v-ripple
              @click="syncAllData"
              class="drawer-nav-item"
            >
              <q-item-section avatar class="drawer-avatar-col">
                <div class="drawer-icon-box flex flex-center">
                  <q-icon name="sync" size="18px" color="indigo-7" :class="{ 'rotate-animation': syncing }" />
                </div>
              </q-item-section>
              <q-item-section>
                <q-item-label class="drawer-item-title">Sincronizar Datos</q-item-label>
                <q-item-label caption class="drawer-item-sub">Refrescar estado en vivo</q-item-label>
              </q-item-section>
            </q-item>

            <!-- TOGGLE MODO OSCURO -->
            <q-item
              clickable
              v-ripple
              @click="toggleDarkMode"
              class="drawer-nav-item"
            >
              <q-item-section avatar class="drawer-avatar-col">
                <div class="drawer-icon-box flex flex-center" :style="$q.dark.isActive ? 'background: #312e81; border-color: #4338ca;' : ''">
                  <q-icon :name="$q.dark.isActive ? 'light_mode' : 'dark_mode'" size="18px" :color="$q.dark.isActive ? 'amber-4' : 'indigo-7'" />
                </div>
              </q-item-section>
              <q-item-section>
                <q-item-label class="drawer-item-title">{{ $q.dark.isActive ? 'Modo Claro' : 'Modo Oscuro' }}</q-item-label>
                <q-item-label caption class="drawer-item-sub">{{ $q.dark.isActive ? 'Tema claro de alto contraste' : 'Descansar la vista' }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon :name="$q.dark.isActive ? 'toggle_on' : 'toggle_off'" :color="$q.dark.isActive ? 'amber-4' : 'grey-5'" size="24px" />
              </q-item-section>
            </q-item>

            <!-- BOTÓN INSTALAR APLICACIÓN (PWA) -->
            <q-item
              clickable
              v-ripple
              @click="installPwaApp"
              class="drawer-nav-item"
            >
              <q-item-section avatar class="drawer-avatar-col">
                <div class="drawer-icon-box flex flex-center" style="background: #eff6ff; border-color: #bfdbfe;">
                  <q-icon :name="isAppInstalled ? 'verified' : 'install_desktop'" size="18px" color="blue-7" />
                </div>
              </q-item-section>
              <q-item-section>
                <q-item-label class="drawer-item-title">{{ isAppInstalled ? 'App Instalada' : 'Instalar Aplicación' }}</q-item-label>
                <q-item-label caption class="drawer-item-sub">{{ isAppInstalled ? 'Funcionando como app nativa' : 'En tu PC o celular' }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <span class="spotlight-kbd-side" style="background: #e0e7ff; color: #4338ca;">PWA</span>
              </q-item-section>
            </q-item>
          </q-list>

          <q-separator class="q-my-md" style="background: #e2e8f0;" />

          <!-- WIDGET DE MÉTRICAS EN VIVO -->
          <div class="drawer-section-title q-px-sm q-mb-xs">
            MÉTRICAS DEL SISTEMA
          </div>

          <div class="metrics-card q-pa-sm q-mt-xs">
            <div class="row items-center justify-between q-mb-xs">
              <span class="text-caption text-weight-bold text-slate-700">Ocupación Física</span>
              <span class="text-caption text-weight-bolder text-indigo-7" style="font-size: 12.5px;">
                {{ porcentajeArchivado }}%
              </span>
            </div>
            <q-linear-progress
              :value="porcentajeArchivadoDecimal"
              rounded
              color="indigo"
              track-color="indigo-1"
              class="q-mb-sm"
              style="height: 6px; border-radius: 999px;"
            />

            <div class="column q-gutter-xs">
              <div class="row items-center justify-between text-caption text-slate-600" style="font-size: 11.5px;">
                <span>En Gavetas:</span>
                <b class="text-slate-900 font-mono">{{ totalExpedientesEnGavetas }}</b>
              </div>

              <div class="row items-center justify-between text-caption text-slate-600" style="font-size: 11.5px;">
                <span>Gaveta Virtual:</span>
                <b :class="totalSinAsignar > 0 ? 'text-pink-7 font-mono' : 'text-slate-900 font-mono'">
                  {{ totalSinAsignar }}
                </b>
              </div>

              <div class="row items-center justify-between text-caption text-slate-600" style="font-size: 11.5px;">
                <span>Total Cajones:</span>
                <b class="text-slate-900 font-mono">{{ totalGavetas }}</b>
              </div>
            </div>
          </div>
        </div>

        <!-- FOOTER DEL DRAWER -->
        <div class="drawer-footer q-pa-md border-top col-auto">
          <div class="row items-center justify-between">
            <div class="row items-center q-gutter-xs">
              <span class="footer-dot"></span>
              <span class="text-caption text-weight-bold text-slate-600" style="font-size: 11px;">
                DOCUS v2.4 • 3FN
              </span>
            </div>
            <q-badge color="indigo-1" text-color="indigo-8" class="text-weight-bold" style="font-size: 10px;">
              Auditoría Activa
            </q-badge>
          </div>
        </div>
      </div>
    </q-drawer>

    <!-- NAVEGACIÓN MOBILE-FIRST INFERIOR (EN PANTALLAS MÓVILES) -->
    <q-footer class="mobile-bottom-nav lt-md border-top">
      <div class="row items-center justify-around q-py-xs">
        <router-link
          to="/kardex"
          class="mobile-nav-btn column items-center justify-center"
          :class="{ 'mobile-nav-btn-active': $route.path === '/kardex' }"
        >
          <div class="mobile-icon-wrapper">
            <q-icon name="dashboard" size="22px" />
            <span v-if="store.muebles.length > 0" class="mobile-mini-badge">
              {{ store.muebles.length }}
            </span>
          </div>
          <span class="mobile-nav-label">Gavetas</span>
        </router-link>

        <router-link
          to="/personal"
          class="mobile-nav-btn column items-center justify-center"
          :class="{ 'mobile-nav-btn-active': $route.path === '/personal' }"
        >
          <div class="mobile-icon-wrapper">
            <q-icon name="badge" size="22px" />
            <span v-if="store.personal.length > 0" class="mobile-mini-badge mobile-mini-badge-sky">
              {{ store.personal.length }}
            </span>
          </div>
          <span class="mobile-nav-label">Personal</span>
        </router-link>

        <div
          class="mobile-nav-btn column items-center justify-center cursor-pointer"
          @click="metricasOpen = true"
        >
          <div class="mobile-icon-wrapper">
            <q-icon name="insights" size="22px" color="purple-7" />
          </div>
          <span class="mobile-nav-label">Métricas</span>
        </div>

        <div
          class="mobile-nav-btn column items-center justify-center cursor-pointer"
          :class="{ 'mobile-nav-btn-active': leftDrawerOpen }"
          @click="toggleLeftDrawer"
        >
          <div class="mobile-icon-wrapper">
            <q-icon name="menu" size="22px" />
          </div>
          <span class="mobile-nav-label">Menú</span>
        </div>
      </div>
    </q-footer>

    <!-- CONTENEDOR DE PÁGINAS CON TRANSICIÓN FLUIDA -->
    <q-page-container class="page-container-bg">
      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>

    <!-- DIÁLOGO GLOBAL DE IMPORTACIÓN DE EXCEL -->
    <ImportPersonalDialog
      v-model="importDialogOpen"
      @import-complete="onGlobalImportComplete"
    />

    <!-- MODAL DE BÚSQUEDA SPOTLIGHT (CTRL + K) -->
    <GlobalSpotlightDialog v-model="spotlightOpen" />

    <!-- MODAL DE MÉTRICAS DE CAPACIDAD & OCUPACIÓN -->
    <MetricasCapacidadDialog v-model="metricasOpen" />
  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useQuasar } from 'quasar';
import { useGeosStore } from 'src/stores/geosStore';
import ImportPersonalDialog from 'src/components/Personal/ImportPersonalDialog.vue';
import GlobalSpotlightDialog from 'src/components/Search/GlobalSpotlightDialog.vue';
import MetricasCapacidadDialog from 'src/components/Kardex/MetricasCapacidadDialog.vue';
import { exportInventoryExcel } from 'src/utils/exportInventoryExcel';

const $q = useQuasar();
const store = useGeosStore();

const leftDrawerOpen = ref(true);
const syncing = ref(false);
const isFullscreen = ref(false);
const importDialogOpen = ref(false);
const spotlightOpen = ref(false);
const metricasOpen = ref(false);
const liveTime = ref('');

const installPromptEvent = ref(null);
const isAppInstalled = ref(false);

let clockInterval = null;

const toggleDarkMode = () => {
  $q.dark.toggle();
  localStorage.setItem('docus_dark_mode', $q.dark.isActive);
  $q.notify({
    type: 'info',
    icon: $q.dark.isActive ? 'dark_mode' : 'light_mode',
    message: $q.dark.isActive ? 'Modo oscuro activado' : 'Modo claro activado',
    position: 'top-right',
    timeout: 1000
  });
};

const installPwaApp = async () => {
  if (installPromptEvent.value) {
    installPromptEvent.value.prompt();
    const choiceResult = await installPromptEvent.value.userChoice;
    if (choiceResult.outcome === 'accepted') {
      isAppInstalled.value = true;
      $q.notify({
        type: 'positive',
        icon: 'verified',
        message: '¡DOCUS RRHH instalado con éxito como aplicación nativa!',
        position: 'top'
      });
    }
    installPromptEvent.value = null;
  } else {
    $q.dialog({
      title: 'Instalar Aplicación DOCUS RRHH',
      message: 'Puedes usar DOCUS RRHH como una app instalada en tu dispositivo:\n\n• En PC (Google Chrome o Edge): Haz clic en el ícono de instalación (⊕) ubicado en la barra de direcciones superior derecha.\n• En celular Android: Abre el menú del navegador y selecciona "Instalar aplicación" o "Agregar a pantalla principal".\n• En iPhone/iPad: Presiona el botón "Compartir" en Safari y selecciona "Agregar al inicio".',
      ok: { label: 'Entendido', color: 'primary', unelevated: true }
    });
  }
};

const handleKeyDown = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    spotlightOpen.value = true;
  }
};

const triggerExportExcel = () => {
  const all = store.allEmpleadosWithLocation || [];
  if (all.length === 0) {
    $q.notify({
      type: 'warning',
      message: 'No hay expedientes registrados para exportar.',
      position: 'top'
    });
    return;
  }

  try {
    exportInventoryExcel(all, store.muebles, store.sedes);
    $q.notify({
      type: 'positive',
      icon: 'download_done',
      message: `¡Inventario descargado con éxito! (${all.length} expedientes exportados)`,
      position: 'top'
    });
  } catch (err) {
    console.error('Error al exportar inventario Excel:', err);
    $q.notify({
      type: 'negative',
      message: 'Ocurrió un error al generar el archivo Excel.',
      position: 'top'
    });
  }
};

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value;
};

const updateClock = () => {
  const now = new Date();
  liveTime.value = now.toLocaleTimeString('es-BO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(() => {
      isFullscreen.value = true;
    }).catch(() => {
      isFullscreen.value = false;
    });
  } else {
    document.exitFullscreen().then(() => {
      isFullscreen.value = false;
    }).catch(() => {});
  }
};

// Sincronización completa con animación
const syncAllData = async () => {
  syncing.value = true;
  try {
    await Promise.all([
      store.fetchMuebles(),
      store.fetchSinAsignar(),
      store.fetchPersonal(),
      store.fetchCatalogos()
    ]);
    $q.notify({
      type: 'positive',
      icon: 'sync',
      message: '¡Datos sincronizados correctamente desde el servidor!',
      position: 'top-right'
    });
  } catch (error) {
    console.error('Error al sincronizar datos:', error);
    $q.notify({
      type: 'negative',
      message: 'Error al sincronizar con el servidor',
      position: 'top-right'
    });
  } finally {
    setTimeout(() => {
      syncing.value = false;
    }, 600);
  }
};

const openImportDialog = () => {
  importDialogOpen.value = true;
};

const onGlobalImportComplete = () => {
  store.fetchMuebles();
  store.fetchSinAsignar();
  store.fetchPersonal();
};

// Métricas en tiempo real para el drawer y toolbar
const totalExpedientesEnGavetas = computed(() => {
  return (store.muebles || []).reduce((acc, m) => {
    return acc + (m.cajones || []).reduce((cAcc, c) => cAcc + (c.empleados?.length || 0), 0);
  }, 0);
});

const totalSinAsignar = computed(() => {
  return (store.expedientesSinAsignar || []).length;
});

const totalGavetas = computed(() => {
  return (store.muebles || []).reduce((acc, m) => acc + (m.cajones?.length || 0), 0);
});

const porcentajeArchivadoDecimal = computed(() => {
  const total = totalExpedientesEnGavetas.value + totalSinAsignar.value;
  if (total === 0) return 1;
  return totalExpedientesEnGavetas.value / total;
});

const porcentajeArchivado = computed(() => {
  return Math.round(porcentajeArchivadoDecimal.value * 100);
});

let onBeforeInstallPrompt = null;
let onAppInstalled = null;

onMounted(() => {
  updateClock();
  clockInterval = setInterval(updateClock, 1000);

  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement;
  });

  window.addEventListener('keydown', handleKeyDown);

  onBeforeInstallPrompt = (e) => {
    e.preventDefault();
    installPromptEvent.value = e;
  };
  onAppInstalled = () => {
    isAppInstalled.value = true;
    installPromptEvent.value = null;
  };
  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  window.addEventListener('appinstalled', onAppInstalled);
});

onUnmounted(() => {
  if (clockInterval) clearInterval(clockInterval);
  window.removeEventListener('keydown', handleKeyDown);
  if (onBeforeInstallPrompt) window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  if (onAppInstalled) window.removeEventListener('appinstalled', onAppInstalled);
});
</script>

<style scoped>
/* NAVBAR LIGHT & CLEAN */
.main-header {
  background: #ffffff !important;
  color: #0f172a !important;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.04);
}

.main-toolbar {
  min-height: 60px;
}

.sidebar-toggle-btn {
  color: #475569;
  transition: all 0.2s ease;
}

.sidebar-toggle-btn:hover {
  color: #0f172a;
  background: #f1f5f9;
}

.brand-container {
  user-select: none;
}

.brand-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.35);
  transition: transform 0.2s ease;
}

.brand-container:hover .brand-icon-box {
  transform: scale(1.05);
}

.brand-title {
  font-size: 15px;
  letter-spacing: 0.02em;
  line-height: 1.1;
  color: #0f172a;
}

.brand-subtitle {
  font-size: 8.5px;
  letter-spacing: 0.1em;
  color: #64748b;
  font-weight: 700;
}

.online-indicator {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #10b981;
  display: inline-block;
  box-shadow: 0 0 6px #10b981;
  animation: pulse-green 2s infinite;
}

@keyframes pulse-green {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

/* ACCIONES DE TOOLBAR */
.clock-display {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-family: monospace;
}

.clock-text {
  font-size: 12px;
  font-weight: 700;
  color: #334155;
}

.toolbar-action-btn {
  color: #475569;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.toolbar-action-btn:hover {
  color: #0f172a;
  background: #f1f5f9;
  transform: translateY(-1px);
}

.rotate-animation {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.user-pill {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 9999px;
  transition: all 0.2s ease;
}

.user-pill:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.user-avatar-mini {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
  font-size: 10px;
  font-weight: 800;
}

.user-name-text {
  font-size: 12px;
  font-weight: 700;
  color: #0f172a !important;
}

.user-role-text {
  font-size: 10px;
  font-weight: 600;
  color: #64748b !important;
}

.user-menu-dropdown {
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

/* MENÚ LATERAL (DRAWER) CON BOTONES */
.main-drawer {
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
  overflow: hidden !important;
}

.main-drawer :deep(.q-drawer__content) {
  overflow: hidden !important;
}

.drawer-inner-container {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap !important;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
}

.drawer-scroll-section {
  flex: 1 1 auto;
  overflow-y: auto;
  overflow-x: hidden;
}

.drawer-workspace-title {
  color: #0f172a;
}

.drawer-header-box {
  background: #f8fafc;
}

.workspace-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #e0e7ff;
  border: 1px solid #c7d2fe;
}

.drawer-section-title {
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #94a3b8;
  text-transform: uppercase;
}

.drawer-avatar-col {
  min-width: 38px;
}

.drawer-icon-box {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #f1f5f9;
  color: #64748b;
  transition: all 0.2s ease;
}

.drawer-icon-box-amber {
  background: #fef3c7;
}

.drawer-nav-item {
  border-radius: 10px;
  padding: 8px 12px;
  color: #475569;
  transition: all 0.18s ease;
}

.drawer-nav-item:hover {
  background: #f8fafc;
  color: #0f172a;
}

.drawer-nav-item:hover .drawer-icon-box {
  background: #e2e8f0;
  color: #0f172a;
}

.drawer-item-active {
  background: #eef2ff !important;
  color: #4f46e5 !important;
  font-weight: 700;
}

.drawer-item-active .drawer-icon-box {
  background: #4f46e5;
  color: white;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.35);
}

.drawer-item-title {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
}

.drawer-item-sub {
  font-size: 10.5px;
  color: #64748b;
}

.drawer-count-badge {
  background: #f1f5f9;
  color: #475569;
  font-size: 11px;
  font-weight: 800;
  padding: 1px 7px;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
}

.drawer-item-active .drawer-count-badge {
  background: #4f46e5;
  color: white;
  border-color: #4f46e5;
}

.drawer-count-badge-sky {
  background: #e0f2fe;
  color: #0369a1;
}

.metrics-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.drawer-footer {
  background: #f8fafc;
}

.border-top {
  border-top: 1px solid #e2e8f0;
}

.border-bottom {
  border-bottom: 1px solid #e2e8f0;
}

.footer-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #10b981;
  display: inline-block;
}

/* MOBILE-FIRST BOTTOM NAVIGATION BAR */
.mobile-bottom-nav {
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  padding-bottom: env(safe-area-inset-bottom, 4px);
  z-index: 2000;
}

.mobile-nav-btn {
  text-decoration: none;
  color: #64748b;
  min-width: 64px;
  padding: 4px 6px;
  border-radius: 8px;
  transition: all 0.15s ease;
}

.mobile-nav-btn:hover {
  color: #0f172a;
}

.mobile-nav-btn-active {
  color: #4f46e5 !important;
}

.mobile-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-mini-badge {
  position: absolute;
  top: -3px;
  right: -8px;
  background: #4f46e5;
  color: white;
  font-size: 9.5px;
  font-weight: 800;
  padding: 0 4px;
  border-radius: 999px;
  line-height: 14px;
}

.mobile-mini-badge-sky {
  background: #0284c7;
}

.mobile-icon-action-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
  box-shadow: 0 2px 6px rgba(217, 119, 6, 0.35);
  margin-bottom: 1px;
}

.mobile-nav-label {
  font-size: 10.5px;
  font-weight: 700;
  margin-top: 2px;
}

.page-container-bg {
  background: #f8fafc;
  min-height: 100vh;
  overflow-x: hidden;
  max-width: 100%;
}

/* TRANSICIÓN FLUIDA ENTRE PÁGINAS */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* SPOTLIGHT TRIGGER STYLES */
.spotlight-header-trigger {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 4px 10px;
  transition: all 0.2s ease;
}

.spotlight-header-trigger:hover {
  background: #e2e8f0;
  border-color: #cbd5e1;
}

.spotlight-trigger-text {
  font-size: 12.5px;
  color: #64748b;
  font-weight: 500;
}

.spotlight-trigger-kbd {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #475569;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 4px;
}

.spotlight-kbd-side {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #64748b;
  font-size: 9.5px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 4px;
}
</style>
