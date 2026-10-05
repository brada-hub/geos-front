<template>
  <div class="login-wrapper fullscreen row items-center justify-center bg-slate-950 q-pa-md">
    <!-- EFECTO DE LUZ DE FONDO -->
    <div class="login-bg-glow"></div>

    <q-card class="login-card column no-wrap shadow-24 text-white">
      <!-- CABECERA CON LOGO Y TÍTULO -->
      <div class="column items-center q-pa-lg text-center border-bottom bg-slate-900">
        <div class="login-logo-container q-mb-sm">
          <img src="icons/docus-app-icon.png" alt="DOCUS Logo" class="login-logo-img" />
        </div>

        <div class="row items-center q-gutter-x-xs q-mb-xs">
          <span class="text-h5 text-weight-bolder tracking-wide text-white">DOCUS</span>
          <q-badge color="amber-5" text-color="dark" class="text-weight-bold" style="font-size: 10px;">
            RRHH & ARCHIVOS
          </q-badge>
        </div>

        <div class="text-caption text-slate-400" style="max-width: 320px;">
          Sistema Seguro de Control de Gavetas, Expedientes y Ficha de Personal
        </div>

        <div class="row items-center q-gutter-x-xs q-mt-sm bg-slate-950 q-px-sm q-py-xs rounded-borders border">
          <q-icon name="shield" size="14px" color="positive" />
          <span class="text-caption text-slate-300" style="font-size: 11px;">
            Acceso Protegido por Token Seguro
          </span>
        </div>
      </div>

      <!-- FORMULARIO DE ACCESO -->
      <q-form @submit.prevent="handleLogin" class="q-pa-lg q-gutter-y-md">
        <!-- MENSAJE DE ERROR -->
        <q-banner v-if="errorMessage" dense rounded class="bg-red-10 text-white q-pa-sm text-caption">
          <template v-slot:avatar>
            <q-icon name="error" color="white" size="20px" />
          </template>
          {{ errorMessage }}
        </q-banner>

        <!-- CAMPO CORREO -->
        <div>
          <label class="text-caption text-slate-300 text-weight-bold q-mb-xs block">
            Correo Electrónico
          </label>
          <q-input
            v-model="email"
            type="email"
            outlined
            dense
            dark
            placeholder="usuario@empresa.com"
            class="login-input"
            :rules="[val => !!val || 'El correo electrónico es obligatorio']"
          >
            <template v-slot:prepend>
              <q-icon name="mail" color="amber-4" size="18px" />
            </template>
          </q-input>
        </div>

        <!-- CAMPO CONTRASEÑA -->
        <div>
          <label class="text-caption text-slate-300 text-weight-bold q-mb-xs block">
            Contraseña
          </label>
          <q-input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            outlined
            dense
            dark
            placeholder="Ingresa tu contraseña"
            class="login-input"
            :rules="[val => !!val || 'La contraseña es obligatoria']"
          >
            <template v-slot:prepend>
              <q-icon name="lock" color="amber-4" size="18px" />
            </template>
            <template v-slot:append>
              <q-icon
                :name="showPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                color="slate-400"
                size="18px"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>
        </div>

        <!-- BOTÓN DE INICIAR SESIÓN -->
        <q-btn
          type="submit"
          unelevated
          no-caps
          color="indigo-7"
          class="full-width text-weight-bolder q-py-sm shadow-3 login-submit-btn"
          label="Ingresar al Sistema"
          icon-right="arrow_forward"
          :loading="authStore.loading"
        />

        <!-- AYUDA / RECORDATORIO DE CREDENCIALES POR DEFECTO -->
        <div class="credentials-hint q-pa-sm rounded-borders text-center">
          <div class="row items-center justify-center q-gutter-x-xs text-caption text-slate-400" style="font-size: 11px;">
            <q-icon name="info" size="14px" color="amber-4" />
            <span>Credenciales iniciales:</span>
          </div>
          <div class="text-caption font-mono text-amber-3 q-mt-xs" style="font-size: 11px;">
            <b>admin@docus.com</b> / <b>Admin123*</b>
          </div>
        </div>
      </q-form>

      <!-- PIE DE TARJETA -->
      <div class="q-px-lg q-py-xs bg-slate-900 border-top text-center text-caption text-slate-500" style="font-size: 11px;">
        DOCUS RRHH • Gestión Física de Archivos • Bolivia
      </div>
    </q-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/authStore';
import { useQuasar } from 'quasar';

const router = useRouter();
const authStore = useAuthStore();
const $q = useQuasar();

const email = ref('admin@docus.com');
const password = ref('Admin123*');
const showPassword = ref(false);
const errorMessage = ref('');

const handleLogin = async () => {
  errorMessage.value = '';

  const res = await authStore.login(email.value, password.value);
  if (res.success) {
    $q.notify({
      type: 'positive',
      message: `¡Bienvenido, ${authStore.userName}! Sesión iniciada con éxito.`,
      icon: 'verified_user',
      timeout: 1500,
    });
    router.push('/');
  } else {
    errorMessage.value = res.message || 'Error al autenticar.';
  }
};
</script>

<style scoped>
.login-wrapper {
  position: relative;
  background-color: #020617;
  overflow: hidden;
}

.login-bg-glow {
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, rgba(245, 158, 11, 0.08) 50%, transparent 70%);
  pointer-events: none;
  filter: blur(40px);
}

.login-card {
  width: 100%;
  max-width: 440px;
  border-radius: 16px;
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 10;
}

.login-logo-container {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 25px -5px rgba(245, 158, 11, 0.35);
  border: 2px solid rgba(245, 158, 11, 0.4);
}

.login-logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.login-submit-btn {
  font-size: 14px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.login-submit-btn:hover {
  background-color: #4338ca !important;
  transform: translateY(-1px);
}

.credentials-hint {
  background: rgba(30, 41, 59, 0.7);
  border: 1px dashed rgba(245, 158, 11, 0.3);
}

.login-input :deep(.q-field__control) {
  border-radius: 8px;
  background: #1e293b;
}
</style>
