<template>
  <div class="login-page-canvas fullscreen flex flex-center q-pa-md">
    <!-- LUCES AMBIENTALES DE FONDO (2 COLORES: AZUL Y SLATE) -->
    <div class="ambient-glow glow-top"></div>
    <div class="ambient-glow glow-bottom"></div>

    <!-- TARJETA PRINCIPAL DE ACCESO -->
    <q-card class="login-card shadow-24 text-white">
      <!-- CABECERA EJECUTIVA -->
      <div class="login-header q-pa-lg text-center">
        <!-- LOGO INSTITUCIONAL CON AURA -->
        <div class="logo-wrapper q-mx-auto q-mb-md flex flex-center">
          <img :src="docusLogo" alt="DOCUS RRHH" class="logo-image" />
        </div>

        <div class="row items-center justify-center q-gutter-x-xs q-mb-xs">
          <span class="text-h5 text-weight-bolder tracking-wide text-white">DOCUS</span>
          <q-badge color="primary" text-color="white" class="text-weight-bold header-badge">
            RRHH & ARCHIVOS
          </q-badge>
        </div>

        <div class="text-caption text-slate-400 q-mb-sm" style="max-width: 340px; margin: 0 auto; line-height: 1.4;">
          Control Físico y Normalizado de Expedientes, Gavetas y Directorio de Personal
        </div>

        <div class="row items-center justify-center q-gutter-x-xs text-caption text-slate-400" style="font-size: 11px;">
          <q-icon name="verified_user" size="13px" color="primary" />
          <span>Autenticación Segura Institucional • Modelo 3FN</span>
        </div>
      </div>

      <q-separator class="bg-slate-800" />

      <!-- TARJETA DE AYUDA DE CREDENCIALES (AUTOCOMPLETAR CON 1 CLIC) -->
      <div class="q-px-lg q-pt-md">
        <div class="demo-credentials-box q-pa-sm rounded-borders row items-center justify-between no-wrap">
          <div class="row items-center q-gutter-xs col ellipsis">
            <q-icon name="key" size="16px" color="primary" />
            <div class="column ellipsis" style="font-size: 11px;">
              <div class="text-slate-300">
                Usuario: <b class="text-white">admin@docus.com</b>
              </div>
              <div class="text-slate-400">
                Clave: <b class="text-primary font-mono">Admin123*</b>
              </div>
            </div>
          </div>

          <q-btn
            unelevated
            dense
            no-caps
            size="xs"
            color="primary"
            text-color="white"
            icon="auto_fix_high"
            label="Autocompletar"
            class="text-weight-bold q-px-sm"
            @click="fillAdminCredentials"
          >
            <q-tooltip>Rellenar credenciales de Administrador automáticamente</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- FORMULARIO DE INICIO DE SESIÓN -->
      <q-form @submit.prevent="handleLogin" class="q-pa-lg q-gutter-y-md">
        <!-- BANNER DE ERROR -->
        <q-banner
          v-if="errorMessage"
          dense
          rounded
          class="bg-negative text-white q-pa-sm text-caption error-banner"
        >
          <template v-slot:avatar>
            <q-icon name="error_outline" color="white" size="20px" />
          </template>
          {{ errorMessage }}
        </q-banner>

        <!-- CORREO ELECTRÓNICO -->
        <div>
          <div class="row items-center justify-between q-mb-xs">
            <label class="text-caption text-slate-300 text-weight-bold">
              Correo Electrónico Institucional
            </label>
            <span class="text-caption text-slate-500" style="font-size: 10px;">Obligatorio</span>
          </div>
          <q-input
            v-model="email"
            type="email"
            outlined
            dense
            dark
            placeholder="admin@docus.com"
            class="login-input-field"
            :rules="[val => !!val || 'El correo electrónico es requerido']"
          >
            <template v-slot:prepend>
              <q-icon name="mail" color="primary" size="18px" />
            </template>
          </q-input>
        </div>

        <!-- CONTRASEÑA -->
        <div>
          <div class="row items-center justify-between q-mb-xs">
            <label class="text-caption text-slate-300 text-weight-bold">
              Contraseña de Acceso
            </label>
            <span class="text-caption text-slate-500 font-mono" style="font-size: 10.5px;">Admin123*</span>
          </div>
          <q-input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            outlined
            dense
            dark
            placeholder="Ingresa tu contraseña"
            class="login-input-field"
            :rules="[val => !!val || 'La contraseña es requerida']"
          >
            <template v-slot:prepend>
              <q-icon name="lock" color="primary" size="18px" />
            </template>
            <template v-slot:append>
              <q-icon
                :name="showPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer text-slate-400"
                size="18px"
                @click="showPassword = !showPassword"
              >
                <q-tooltip>{{ showPassword ? 'Ocultar contraseña' : 'Ver contraseña' }}</q-tooltip>
              </q-icon>
            </template>
          </q-input>
        </div>

        <!-- RECORDAR SESIÓN -->
        <div class="row items-center justify-between">
          <q-checkbox
            v-model="rememberMe"
            dark
            dense
            color="primary"
            size="sm"
            class="text-caption text-slate-400"
          >
            <span style="font-size: 11.5px;">Recordar en este equipo</span>
          </q-checkbox>

          <span
            class="text-caption text-primary cursor-pointer hover-underline"
            style="font-size: 11.5px;"
            @click="fillAdminCredentials"
          >
            ¿Olvidaste tu clave?
          </span>
        </div>

        <!-- BOTÓN INGRESAR AL SISTEMA -->
        <q-btn
          type="submit"
          unelevated
          no-caps
          color="primary"
          class="full-width text-weight-bolder q-py-sm login-btn shadow-3"
          label="Ingresar al Sistema"
          icon-right="login"
          :loading="authStore.loading"
        >
          <template v-slot:loading>
            <div class="row items-center q-gutter-x-xs">
              <q-spinner-dots size="18px" />
              <span>Verificando credenciales...</span>
            </div>
          </template>
        </q-btn>
      </q-form>

      <!-- PIE DE TARJETA -->
      <div class="q-px-lg q-py-sm bg-slate-950 border-top text-center row items-center justify-between text-caption text-slate-500" style="font-size: 11px;">
        <div class="row items-center q-gutter-xs">
          <span class="status-dot"></span>
          <span>Servidor Activo</span>
        </div>
        <span>DOCUS v2.4 • Sede Central</span>
      </div>
    </q-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/authStore';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import docusLogo from 'src/assets/docus-app-icon.png';

const router = useRouter();
const authStore = useAuthStore();
const $q = useQuasar();

// Credenciales por defecto precargadas para facilitar acceso
const email = ref(localStorage.getItem('docus_saved_email') || 'admin@docus.com');
const password = ref(localStorage.getItem('docus_saved_pass') || 'Admin123*');
const rememberMe = ref(true);
const showPassword = ref(false);
const errorMessage = ref('');

// Precalentar el servidor en segundo plano
onMounted(() => {
  api.get('/up').catch(() => {
    api.get('/catalogos/tipos-contrato').catch(() => {});
  });
});

const fillAdminCredentials = () => {
  email.value = 'admin@docus.com';
  password.value = 'Admin123*';
  errorMessage.value = '';
  $q.notify({
    type: 'info',
    message: 'Credenciales de Administrador cargadas (admin@docus.com / Admin123*)',
    icon: 'vpn_key',
    timeout: 1500
  });
};

const handleLogin = async () => {
  errorMessage.value = '';

  if (rememberMe.value) {
    localStorage.setItem('docus_saved_email', email.value);
    localStorage.setItem('docus_saved_pass', password.value);
  } else {
    localStorage.removeItem('docus_saved_email');
    localStorage.removeItem('docus_saved_pass');
  }

  const res = await authStore.login(email.value, password.value);

  if (res.success) {
    $q.notify({
      type: 'positive',
      message: `¡Bienvenido al sistema, ${authStore.userName || 'Administrador'}!`,
      icon: 'verified_user',
      timeout: 1500,
    });
    router.push('/');
  } else {
    errorMessage.value = res.message || 'Credenciales incorrectas. Verifica tu correo y contraseña.';
  }
};
</script>

<style scoped>
.login-page-canvas {
  position: relative;
  background-color: #020617;
  overflow: hidden;
  min-height: 100vh;
}

/* EFECTOS AMBIENTALES DE LUZ SUAVE */
.ambient-glow {
  position: absolute;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(80px);
}
.glow-top {
  top: -150px;
  left: 20%;
  background: radial-gradient(circle, rgba(37, 99, 235, 0.25) 0%, transparent 70%);
}
.glow-bottom {
  bottom: -150px;
  right: 20%;
  background: radial-gradient(circle, rgba(30, 41, 59, 0.4) 0%, transparent 70%);
}

.login-card {
  width: 100%;
  max-width: 440px;
  border-radius: 18px;
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.08);
  position: relative;
  z-index: 10;
  backdrop-filter: blur(12px);
  overflow: hidden;
}

.login-header {
  background: #0f172a;
}

.logo-wrapper {
  width: 68px;
  height: 68px;
  border-radius: 18px;
  overflow: hidden;
  border: 2px solid rgba(37, 99, 235, 0.35);
  box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.4);
  background: #020617;
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.header-badge {
  font-size: 10px;
  padding: 3px 7px;
  border-radius: 4px;
  letter-spacing: 0.04em;
}

.demo-credentials-box {
  background: #1e293b;
  border: 1px solid rgba(37, 99, 235, 0.3);
}

.login-input-field :deep(.q-field__control) {
  border-radius: 9px;
  background: #1e293b;
  border-color: #334155;
  transition: border-color 0.2s ease;
}

.login-input-field :deep(.q-field__control:hover) {
  border-color: #2563eb;
}

.login-btn {
  font-size: 14px;
  border-radius: 9px;
  background: #2563eb !important;
  transition: all 0.2s ease;
}

.login-btn:hover {
  background: #1d4ed8 !important;
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(37, 99, 235, 0.35);
}

.error-banner {
  border-radius: 8px;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #22c55e;
  box-shadow: 0 0 8px #22c55e;
}

.hover-underline:hover {
  text-decoration: underline;
}

.font-mono {
  font-family: 'Courier New', Courier, monospace;
}
</style>
