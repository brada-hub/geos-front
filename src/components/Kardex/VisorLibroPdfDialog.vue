<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
    class="visor-libro-dialog"
    @keydown.esc="cerrarVisor"
  >
    <q-card class="column no-wrap full-height bg-slate-950 text-white overflow-hidden">
      <!-- HEADER CONSOLA / BARRA DE HERRAMIENTAS RESPONSIVA -->
      <div class="row no-wrap items-center justify-between q-px-sm q-px-md-md q-py-xs bg-slate-900 border-bottom col-auto z-top shadow-3">
        <!-- IZQUIERDA: VOLVER + METADATOS COMPACTOS -->
        <div class="row no-wrap items-center q-gutter-x-xs q-gutter-x-sm-sm ellipsis" style="min-width: 0; max-width: 38%;">
          <q-btn
            flat
            dense
            no-caps
            icon="arrow_back"
            label="Volver"
            color="amber-4"
            class="text-weight-bold gt-xs"
            @click="cerrarVisor"
          >
            <q-tooltip>Volver al expediente (Esc)</q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            dense
            icon="arrow_back"
            color="amber-4"
            class="lt-sm"
            @click="cerrarVisor"
          />

          <div class="book-icon-badge flex flex-center gt-xs">
            <q-icon :name="viewMode === 'book' ? 'menu_book' : 'picture_as_pdf'" size="18px" color="amber-4" />
          </div>

          <div class="column justify-center ellipsis" style="min-width: 0;">
            <div class="row no-wrap items-center q-gutter-x-xs">
              <span class="text-weight-bolder text-white ellipsis text-caption" style="font-size: 13px;">
                {{ empleado?.nombre_completo || 'Expediente' }}
              </span>
              <q-badge color="indigo-7" class="text-weight-bold font-mono gt-sm" style="font-size: 10px;">
                {{ empleado?.codigo_archivo || `EXP-${empleado?.numero_unico || empleado?.id}` }}
              </q-badge>
            </div>
            <div class="text-caption text-slate-400 ellipsis font-mono" style="font-size: 10.5px;">
              {{ textoEstadoPagina }}
            </div>
          </div>
        </div>

        <!-- CENTRO: NAVEGADOR DE PÁGINAS Y APERTURAS -->
        <div class="row no-wrap items-center q-gutter-x-xs bg-slate-950 q-px-sm q-py-xs rounded-borders border col-auto">
          <q-btn
            flat
            dense
            round
            icon="first_page"
            size="sm"
            color="slate-300"
            :disable="currentPage <= 1"
            @click="goToPage(1)"
          >
            <q-tooltip>Ir a la Carátula (Portada)</q-tooltip>
          </q-btn>

          <q-btn
            flat
            dense
            round
            icon="chevron_left"
            size="md"
            color="amber-4"
            :disable="currentPage <= 1"
            @click="prevPage"
          >
            <q-tooltip>Página anterior (Tecla ←)</q-tooltip>
          </q-btn>

          <!-- INDICADOR VISUAL CLARO -->
          <div class="row items-center q-px-xs text-caption font-mono text-weight-bold text-center" style="min-width: 120px; justify-content: center;">
            <template v-if="currentPage === 1">
              <span class="text-amber-4">Carátula</span>
            </template>
            <template v-else-if="currentPage === 2 && viewMode === 'book'">
              <span class="text-amber-4">Índice • Foja 1</span>
            </template>
            <template v-else-if="currentPage === 2 && viewMode === 'single'">
              <span class="text-amber-4">Índice General</span>
            </template>
            <template v-else-if="viewMode === 'book'">
              <span class="text-amber-4">Fojas {{ getLeftPdfNum(currentPage) }} - {{ Math.min(getRightPdfNum(currentPage), totalPdfPages) }}</span>
            </template>
            <template v-else>
              <span class="text-amber-4">Foja {{ currentPage - 2 }}</span>
            </template>
            <span class="text-slate-500 q-mx-xs">/</span>
            <span class="text-slate-300">{{ totalPdfPages > 0 ? `${totalPdfPages} f.` : 'Sin fojas' }}</span>
          </div>

          <q-btn
            flat
            dense
            round
            icon="chevron_right"
            size="md"
            color="amber-4"
            :disable="currentPage >= totalPages"
            @click="nextPage"
          >
            <q-tooltip>Página siguiente (Tecla →)</q-tooltip>
          </q-btn>

          <q-btn
            flat
            dense
            round
            icon="last_page"
            size="sm"
            color="slate-300"
            :disable="currentPage >= totalPages"
            @click="goToPage(totalPages)"
          >
            <q-tooltip>Última página</q-tooltip>
          </q-btn>
        </div>

        <!-- DERECHA: CONMUTADORES, HERRAMIENTAS Y BOTÓN SALIR FIJO -->
        <div class="row no-wrap items-center q-gutter-x-xs col-auto" style="flex-shrink: 0;">
          <!-- MODO LIBRO VS MODO HOJA SIMPLE -->
          <q-btn-toggle
            v-model="viewMode"
            dense
            no-caps
            rounded
            unelevated
            size="xs"
            toggle-color="indigo-7"
            color="slate-800"
            text-color="slate-300"
            class="gt-xs"
            :options="[
              { label: 'Libro (2 págs)', value: 'book', icon: 'menu_book' },
              { label: 'Hoja simple', value: 'single', icon: 'description' }
            ]"
            @update:model-value="onModeChange"
          />

          <!-- ZOOM -->
          <div class="row items-center q-gutter-x-none bg-slate-950 rounded-borders border gt-md">
            <q-btn flat dense icon="remove" size="xs" color="slate-300" @click="zoomOut">
              <q-tooltip>Reducir zoom</q-tooltip>
            </q-btn>
            <span class="text-caption font-mono q-px-xs" style="font-size: 11px; min-width: 38px; text-align: center;">
              {{ Math.round(zoomScale * 100) }}%
            </span>
            <q-btn flat dense icon="add" size="xs" color="slate-300" @click="zoomIn">
              <q-tooltip>Aumentar zoom</q-tooltip>
            </q-btn>
          </div>

          <!-- BOTÓN ÍNDICE -->
          <q-btn
            flat
            dense
            no-caps
            size="sm"
            color="amber-4"
            icon="format_list_bulleted"
            label="Índice"
            class="gt-xs"
            @click="showSidebar = !showSidebar"
          >
            <q-tooltip>Ver las 13 secciones del legajo</q-tooltip>
          </q-btn>

          <!-- BOTÓN MINIATURAS -->
          <q-btn
            flat
            dense
            no-caps
            size="sm"
            :color="showFilmstrip ? 'amber-4' : 'slate-400'"
            icon="view_carousel"
            label="Miniaturas"
            class="gt-sm"
            @click="toggleFilmstrip"
          >
            <q-tooltip>Mostrar / Ocultar carrusel inferior de páginas</q-tooltip>
          </q-btn>

          <!-- BOTÓN SALIR / CERRAR SIEMPRE VISIBLE Y DESTACADO -->
          <q-btn
            unelevated
            no-caps
            color="negative"
            text-color="white"
            icon="close"
            label="Cerrar"
            class="text-weight-bolder q-px-sm q-ml-xs shadow-2 exit-button-fixed"
            @click="cerrarVisor"
          >
            <q-tooltip>Cerrar visor (Esc)</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- ÁREA PRINCIPAL: VISOR Y SIDEBAR LATERAL -->
      <div class="col row no-wrap overflow-hidden relative-position">
        <!-- SIDEBAR: ÍNDICE DE LAS 13 SECCIONES -->
        <transition name="slide-sidebar">
          <div v-if="showSidebar" class="col-auto column no-wrap bg-slate-900 border-right sidebar-sections shadow-5">
            <div class="row items-center justify-between q-pa-sm bg-slate-950 border-bottom col-auto">
              <div class="row items-center q-gutter-x-xs">
                <q-icon name="bookmarks" size="18px" color="amber-4" />
                <span class="text-caption text-weight-bolder text-white">Índice del Legajo</span>
              </div>
              <q-btn flat round dense icon="chevron_left" size="xs" color="slate-400" @click="showSidebar = false" />
            </div>

            <!-- BOTÓN CARÁTULA E ÍNDICE GENERAL EN EL SIDEBAR -->
            <div class="q-pa-xs q-gutter-y-xs">
              <div
                class="sidebar-section-item q-pa-xs cursor-pointer row items-center justify-between"
                :class="{ 'item-active': currentPage === 1 }"
                @click="goToPage(1)"
              >
                <div class="row items-center q-gutter-xs ellipsis">
                  <q-icon name="folder_shared" size="16px" color="amber-4" />
                  <span class="text-caption text-weight-bold text-slate-200">00. Carátula Oficial</span>
                </div>
                <q-badge color="amber-9" text-color="dark" label="Portada" class="text-weight-bold" />
              </div>

              <div
                class="sidebar-section-item q-pa-xs cursor-pointer row items-center justify-between"
                :class="{ 'item-active': currentPage === 2 }"
                @click="goToPage(2)"
              >
                <div class="row items-center q-gutter-xs ellipsis">
                  <q-icon name="toc" size="16px" color="indigo-4" />
                  <span class="text-caption text-weight-bold text-slate-200">Índice General</span>
                </div>
                <q-badge color="indigo-8" text-color="white" label="Tabla" class="text-weight-bold" />
              </div>
            </div>

            <div class="q-px-sm q-py-xs text-caption text-slate-400 font-mono text-weight-bold" style="font-size: 10px;">
              SECCIONES DOCUMENTALES ({{ totalPdfPages }} fojas)
            </div>

            <q-scroll-area class="col q-px-xs">
              <div class="q-gutter-y-xs q-py-xs">
                <div
                  v-for="sec in secciones"
                  :key="sec.codigo"
                  class="sidebar-section-item q-pa-xs cursor-pointer row items-center justify-between"
                  :class="{
                    'item-active': seccionActivaCodigo === sec.codigo,
                    'item-has-pdf': pdfsDisponibles[sec.codigo]?.hasPdf
                  }"
                  @click="saltarASeccion(sec.codigo)"
                >
                  <div class="row items-center q-gutter-xs ellipsis col">
                    <span class="sidebar-sec-num">{{ String(sec.id).padStart(2, '0') }}</span>
                    <span class="sidebar-sec-name text-caption ellipsis text-slate-200" :title="sec.nombre">
                      {{ sec.nombre }}
                    </span>
                  </div>
                  <div class="row items-center q-gutter-xs">
                    <q-badge
                      v-if="sec.fojas > 0"
                      color="indigo-9"
                      text-color="white"
                      class="text-weight-bold"
                      style="font-size: 9.5px;"
                    >
                      {{ sec.fojas }} f.
                    </q-badge>
                    <q-icon
                      v-if="pdfsDisponibles[sec.codigo]?.hasPdf"
                      name="description"
                      size="14px"
                      color="amber-4"
                      title="Tiene fojas digitalizadas"
                    />
                  </div>
                </div>
              </div>
            </q-scroll-area>
          </div>
        </transition>

        <!-- VIEWPORT PRINCIPAL DEL LIBRO -->
        <div
          ref="viewerContainerRef"
          class="col viewer-viewport book-desk-bg flex flex-center relative-position"
          @click="onBackgroundClick"
        >
          <!-- SPINNER DE CARGA -->
          <div v-if="isLoading" class="absolute-full flex flex-center bg-slate-950 bg-opacity-80 z-top">
            <div class="column items-center q-gutter-y-sm">
              <q-spinner-dots size="56px" color="amber-4" />
              <div class="text-caption text-amber-3 font-mono text-weight-bold">
                Construyendo libro de expediente en alta definición...
              </div>
            </div>
          </div>

          <!-- ========================================== -->
          <!-- PÁGINA 1: PORTADA / CARÁTULA OFICIAL FILE -->
          <!-- ========================================== -->
          <div
            v-if="currentPage === 1"
            class="book-spread-wrapper row items-center justify-center relative-position"
            :style="{ transform: `scale(${zoomScale})`, transformOrigin: 'center center' }"
          >
            <div class="book-cover-folder shadow-24 relative-position column justify-between">
              <!-- CABECERA INSTITUCIONAL CON BORDE DORADO -->
              <div class="cover-header-section q-pa-md text-center">
                <div class="row items-center justify-between q-mb-sm">
                  <div class="row items-center q-gutter-xs">
                    <img :src="docusLogo" alt="DOCUS" style="height: 34px;" />
                    <span class="text-weight-bolder text-amber-5 font-mono text-h6">DOCUS</span>
                  </div>
                  <div class="column items-end" style="line-height: 1.15;">
                    <span class="cover-inst-badge">ESTADO PLURINACIONAL DE BOLIVIA</span>
                    <span class="cover-sub-badge">RECURSOS HUMANOS • ARCHIVO CENTRAL</span>
                  </div>
                </div>

                <div class="cover-title-box q-py-xs">
                  <div class="cover-super-title">LEGAJO INSTITUCIONAL PERSONAL</div>
                  <div class="cover-main-title">CARÁTULA DE EXPEDIENTE</div>
                  <div class="cover-code-pill font-mono">
                    {{ empleado?.codigo_archivo || `EXP-${empleado?.numero_unico || empleado?.id}` }}
                  </div>
                </div>
              </div>

              <!-- CUERPO PRINCIPAL DE LA CARÁTULA -->
              <div class="cover-body-section q-px-lg q-py-sm col column justify-center">
                <!-- TARJETA FILIACIÓN DEL FUNCIONARIO -->
                <div class="cover-person-card q-pa-md row items-center q-gutter-md q-mb-sm">
                  <div class="cover-avatar-box flex flex-center">
                    <q-icon name="folder_shared" size="42px" color="amber-8" />
                  </div>
                  <div class="col" style="min-width: 0;">
                    <div class="cover-name-text ellipsis">{{ empleado?.nombre_completo }}</div>
                    <div class="cover-detail-row row items-center q-gutter-x-sm q-mt-xs">
                      <span><strong>C.I.:</strong> {{ empleado?.documento_identidad || 'Sin CI' }}</span>
                      <span>•</span>
                      <span><strong>Cargo:</strong> {{ empleado?.cargo || 'Funcionario Registrado' }}</span>
                    </div>
                    <div class="cover-detail-row row items-center q-gutter-x-sm q-mt-xs">
                      <q-badge color="indigo-9" text-color="white" class="text-weight-bold">
                        {{ empleado?.tipo_contrato?.nombre || 'Planta' }}
                      </q-badge>
                      <span v-if="empleado?.sede?.nombre">• Sede: {{ empleado?.sede?.nombre }}</span>
                    </div>
                    <div class="cover-location-badge q-mt-xs">
                      <q-icon name="inbox" size="13px" color="amber-9" class="q-mr-xs" />
                      <span><strong>Ubicación Archivística:</strong> {{ ubicacionTextoEmpleado }}</span>
                    </div>
                  </div>
                  <!-- CÓDIGO QR REAL DE VERIFICACIÓN -->
                  <div class="col-auto column items-center">
                    <img v-if="qrDataUrl" :src="qrDataUrl" class="cover-qr-img shadow-2" alt="QR" />
                    <span class="cover-qr-caption font-mono">VERIFICACIÓN QR</span>
                  </div>
                </div>

                <!-- ÍNDICE RESUMIDO DE LAS 13 SECCIONES DEL LEGAJO -->
                <div class="cover-sections-table q-pa-sm rounded-borders">
                  <div class="row items-center justify-between q-mb-xs q-px-xs">
                    <span class="cover-sections-header">REGISTRO DE SECCIONES DEL ARCHIVO</span>
                    <span class="cover-sections-badge">{{ resumenFile.totalFojas }} fojas físicas • {{ totalPdfPages }} fojas digitalizadas</span>
                  </div>
                  <div class="row q-col-gutter-xs">
                    <div
                      v-for="sec in secciones"
                      :key="sec.codigo"
                      class="col-6"
                    >
                      <div class="cover-sec-mini-item row items-center justify-between q-px-xs">
                        <span class="ellipsis" style="font-size: 10px; max-width: 170px;">
                          {{ String(sec.id).padStart(2, '0') }}. {{ sec.nombre }}
                        </span>
                        <span class="cover-sec-fojas-badge">
                          {{ sec.fojas || 0 }} f.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- PIE DE CARÁTULA CON ACCIÓN PARA ENTRAR AL LEGAJO -->
              <div class="cover-footer-section q-pa-md row items-center justify-between">
                <div class="text-caption text-slate-500 font-mono" style="font-size: 10.5px;">
                  DOCUS RRHH • EXPEDIENTE DIGITALIZADO
                </div>
                <q-btn
                  unelevated
                  no-caps
                  color="amber-9"
                  text-color="dark"
                  icon-right="arrow_forward"
                  label="Abrir Expediente & Fojas"
                  class="text-weight-bolder cover-open-btn shadow-3"
                  @click="nextPage"
                />
              </div>
            </div>

            <!-- FLECHA SIGUIENTE FLOTANTE -->
            <button
              v-if="totalPages > 1"
              class="book-nav-arrow book-nav-next"
              title="Abrir expediente (Pág. siguiente →)"
              @click.stop="nextPage"
            >
              <q-icon name="chevron_right" size="32px" />
            </button>
          </div>

          <!-- ================================================== -->
          <!-- PÁGINA 2 EN MODO LIBRO: ÍNDICE GENERAL + FOJA 1   -->
          <!-- ================================================== -->
          <div
            v-else-if="viewMode === 'book' && currentPage === 2"
            class="book-spread-wrapper row items-center justify-center relative-position"
            :style="{ transform: `scale(${zoomScale})`, transformOrigin: 'center center' }"
          >
            <!-- BOTÓN FLOTANTE ANTERIOR (IZQUIERDA) -->
            <button
              class="book-nav-arrow book-nav-prev"
              title="Página anterior (←)"
              @click.stop="prevPage"
            >
              <q-icon name="chevron_left" size="32px" />
            </button>

            <!-- ENCUADERNACIÓN SPREAD: ÍNDICE (IZQ) + FOJA 1 (DER) -->
            <div class="book-binder-spread row no-wrap items-stretch shadow-24">
              <!-- HOJA IZQUIERDA: ÍNDICE GENERAL DEL EXPEDIENTE -->
              <div class="book-page-left column relative-position page-indice-container">
                <!-- CABECERA DEL ÍNDICE -->
                <div class="indice-header q-pa-md border-bottom bg-slate-50">
                  <div class="row items-center justify-between q-mb-xs">
                    <div class="row items-center q-gutter-x-xs">
                      <q-icon name="toc" size="22px" color="indigo-9" />
                      <span class="text-subtitle2 text-weight-bolder text-slate-900 font-mono">ÍNDICE GENERAL DEL EXPEDIENTE</span>
                    </div>
                    <q-badge color="indigo-9" text-color="white" class="font-mono text-weight-bold">
                      13 SECCIONES
                    </q-badge>
                  </div>
                  <div class="text-caption text-slate-600 font-mono" style="font-size: 11px;">
                    Titular: <strong>{{ empleado?.nombre_completo }}</strong> • {{ totalPdfPages }} fojas digitalizadas
                  </div>
                </div>

                <!-- LISTA DE LAS 13 SECCIONES CON ACCESO DIRECTO -->
                <div class="indice-body col q-pa-sm scroll">
                  <div class="q-gutter-y-xs">
                    <div
                      v-for="sec in secciones"
                      :key="sec.codigo"
                      class="indice-item row items-center justify-between q-pa-xs rounded-borders"
                      :class="{ 'indice-item-has-pdf': pdfsDisponibles[sec.codigo]?.hasPdf }"
                    >
                      <div class="row items-center q-gutter-x-xs ellipsis col">
                        <span class="indice-sec-num font-mono">{{ String(sec.id).padStart(2, '0') }}</span>
                        <div class="column ellipsis" style="min-width: 0;">
                          <span class="text-caption text-weight-bold text-slate-900 ellipsis">{{ sec.nombre }}</span>
                          <span class="text-caption text-slate-500 ellipsis" style="font-size: 9.5px;">{{ sec.descripcion }}</span>
                        </div>
                      </div>

                      <div class="row items-center q-gutter-x-xs col-auto">
                        <q-badge
                          :color="pdfsDisponibles[sec.codigo]?.hasPdf ? 'positive' : 'grey-5'"
                          text-color="white"
                          class="text-weight-bold"
                          style="font-size: 9px;"
                        >
                          {{ pdfsDisponibles[sec.codigo]?.hasPdf ? `${sec.fojas || 1} f.` : '0 f.' }}
                        </q-badge>

                        <q-btn
                          v-if="pdfsDisponibles[sec.codigo]?.hasPdf"
                          dense
                          flat
                          round
                          size="xs"
                          icon="arrow_forward"
                          color="indigo-9"
                          @click="saltarASeccion(sec.codigo)"
                        >
                          <q-tooltip>Ir a la primera foja de esta sección</q-tooltip>
                        </q-btn>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- PIE DEL ÍNDICE -->
                <div class="book-page-folio-left font-mono">
                  Índice General y Registro de Fojas
                </div>
              </div>

              <!-- LOMO / ESPINA CENTRAL CON SOMBRA 3D -->
              <div class="book-spine-crease">
                <div class="spine-line"></div>
              </div>

              <!-- HOJA DERECHA: PRIMERA FOJA DEL DOCUMENTO (PDF FOJA 1) -->
              <div class="book-page-right column relative-position">
                <template v-if="totalPdfPages >= 1">
                  <!-- MEMBRETE DE SECCIÓN -->
                  <div class="page-sec-header row items-center justify-between q-px-sm q-py-xs bg-slate-100 border-bottom">
                    <div class="row items-center q-gutter-x-xs ellipsis">
                      <q-icon name="folder" size="14px" color="indigo-8" />
                      <span class="text-caption text-weight-bolder text-slate-800 ellipsis font-mono" style="font-size: 10px;">
                        SECCIÓN {{ getInfoFoja(1).seccionId }}: {{ getInfoFoja(1).seccionNombre }}
                      </span>
                    </div>
                    <q-badge color="indigo-9" text-color="white" class="font-mono text-weight-bold" style="font-size: 9px;">
                      Foja {{ getInfoFoja(1).fojaLocal }} de {{ getInfoFoja(1).totalFojasLocal }}
                    </q-badge>
                  </div>

                  <!-- CANVAS FOJA 1 -->
                  <div class="col flex flex-center relative-position page-canvas-container">
                    <canvas id="page-canvas-spread2-right" class="page-canvas-rendered"></canvas>
                  </div>

                  <!-- FOLIO INFERIOR -->
                  <div class="book-page-folio-right font-mono row items-center justify-between q-px-md">
                    <span style="font-size: 9px; color: #64748b;">{{ empleado?.codigo_archivo }}</span>
                    <span>Foja 1 de {{ totalPdfPages }}</span>
                    <span style="font-size: 9px; color: #10b981; font-weight: bold;">DOCUS DIGITAL</span>
                  </div>
                </template>

                <div v-else class="book-blank-page flex flex-center text-slate-500 col">
                  <div class="column items-center q-gutter-xs q-pa-md text-center">
                    <q-icon name="description" size="48px" color="slate-400" />
                    <div class="text-subtitle2 text-weight-bold text-slate-700">Sin fojas digitalizadas aún</div>
                    <div class="text-caption text-slate-500" style="max-width: 280px;">
                      Sube y desglosa el PDF del expediente desde el botón "Desglosar PDF" en el kardex para visualizar todas sus hojas aquí.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- BOTÓN FLOTANTE SIGUIENTE (DERECHA) -->
            <button
              v-if="currentPage < totalPages"
              class="book-nav-arrow book-nav-next"
              title="Página siguiente (→)"
              @click.stop="nextPage"
            >
              <q-icon name="chevron_right" size="32px" />
            </button>
          </div>

          <!-- ================================================== -->
          <!-- PÁGINAS 3+: FOJAS 2..N EN MODO LIBRO (LADO A LADO) -->
          <!-- ================================================== -->
          <div
            v-else-if="viewMode === 'book' && currentPage >= 3"
            class="book-spread-wrapper row items-center justify-center relative-position"
            :style="{ transform: `scale(${zoomScale})`, transformOrigin: 'center center' }"
          >
            <!-- BOTÓN FLOTANTE ANTERIOR (IZQUIERDA) -->
            <button
              class="book-nav-arrow book-nav-prev"
              title="Página anterior (←)"
              @click.stop="prevPage"
            >
              <q-icon name="chevron_left" size="32px" />
            </button>

            <!-- ENCUADERNACIÓN 2 HOJAS -->
            <div class="book-binder-spread row no-wrap items-stretch shadow-24">
              <!-- HOJA IZQUIERDA -->
              <div class="book-page-left column relative-position">
                <template v-if="getLeftPdfNum(currentPage) <= totalPdfPages">
                  <div class="page-sec-header row items-center justify-between q-px-sm q-py-xs bg-slate-100 border-bottom">
                    <div class="row items-center q-gutter-x-xs ellipsis">
                      <q-icon name="folder" size="14px" color="indigo-8" />
                      <span class="text-caption text-weight-bolder text-slate-800 ellipsis font-mono" style="font-size: 10px;">
                        SECCIÓN {{ getInfoFoja(getLeftPdfNum(currentPage)).seccionId }}: {{ getInfoFoja(getLeftPdfNum(currentPage)).seccionNombre }}
                      </span>
                    </div>
                    <q-badge color="indigo-9" text-color="white" class="font-mono text-weight-bold" style="font-size: 9px;">
                      Foja {{ getInfoFoja(getLeftPdfNum(currentPage)).fojaLocal }} de {{ getInfoFoja(getLeftPdfNum(currentPage)).totalFojasLocal }}
                    </q-badge>
                  </div>

                  <div class="col flex flex-center relative-position page-canvas-container">
                    <canvas id="page-canvas-left" class="page-canvas-rendered"></canvas>
                  </div>

                  <div class="book-page-folio-left font-mono row items-center justify-between q-px-md">
                    <span style="font-size: 9px; color: #64748b;">{{ empleado?.codigo_archivo }}</span>
                    <span>Foja {{ getLeftPdfNum(currentPage) }} de {{ totalPdfPages }}</span>
                    <span style="font-size: 9px; color: #10b981; font-weight: bold;">DOCUS DIGITAL</span>
                  </div>
                </template>

                <div v-else class="book-blank-page flex flex-center text-slate-400 col">
                  <div class="column items-center q-gutter-xs text-center">
                    <q-icon name="done_all" size="36px" color="slate-400" />
                    <div class="text-caption text-italic text-weight-bold">Fin de las fojas digitalizadas</div>
                    <div class="text-caption text-slate-400" style="font-size: 10px;">Expediente archivado conforme a ley</div>
                  </div>
                </div>
              </div>

              <!-- LOMO / ESPINA CENTRAL CON SOMBRA 3D -->
              <div class="book-spine-crease">
                <div class="spine-line"></div>
              </div>

              <!-- HOJA DERECHA -->
              <div class="book-page-right column relative-position">
                <template v-if="getRightPdfNum(currentPage) <= totalPdfPages">
                  <div class="page-sec-header row items-center justify-between q-px-sm q-py-xs bg-slate-100 border-bottom">
                    <div class="row items-center q-gutter-x-xs ellipsis">
                      <q-icon name="folder" size="14px" color="indigo-8" />
                      <span class="text-caption text-weight-bolder text-slate-800 ellipsis font-mono" style="font-size: 10px;">
                        SECCIÓN {{ getInfoFoja(getRightPdfNum(currentPage)).seccionId }}: {{ getInfoFoja(getRightPdfNum(currentPage)).seccionNombre }}
                      </span>
                    </div>
                    <q-badge color="indigo-9" text-color="white" class="font-mono text-weight-bold" style="font-size: 9px;">
                      Foja {{ getInfoFoja(getRightPdfNum(currentPage)).fojaLocal }} de {{ getInfoFoja(getRightPdfNum(currentPage)).totalFojasLocal }}
                    </q-badge>
                  </div>

                  <div class="col flex flex-center relative-position page-canvas-container">
                    <canvas id="page-canvas-right" class="page-canvas-rendered"></canvas>
                  </div>

                  <div class="book-page-folio-right font-mono row items-center justify-between q-px-md">
                    <span style="font-size: 9px; color: #64748b;">{{ empleado?.codigo_archivo }}</span>
                    <span>Foja {{ getRightPdfNum(currentPage) }} de {{ totalPdfPages }}</span>
                    <span style="font-size: 9px; color: #10b981; font-weight: bold;">DOCUS DIGITAL</span>
                  </div>
                </template>

                <div v-else class="book-blank-page flex flex-center text-slate-400 col">
                  <div class="column items-center q-gutter-xs text-center">
                    <q-icon name="done_all" size="36px" color="slate-400" />
                    <div class="text-caption text-italic text-weight-bold">Fin de las fojas digitalizadas</div>
                    <div class="text-caption text-slate-400" style="font-size: 10px;">Expediente archivado conforme a ley</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- BOTÓN FLOTANTE SIGUIENTE (DERECHA) -->
            <button
              v-if="currentPage < totalPages"
              class="book-nav-arrow book-nav-next"
              title="Página siguiente (→)"
              @click.stop="nextPage"
            >
              <q-icon name="chevron_right" size="32px" />
            </button>
          </div>

          <!-- ========================================== -->
          <!-- MODO HOJA SIMPLE (1 PÁGINA TRADICIONAL)    -->
          <!-- ========================================== -->
          <div
            v-else
            class="single-page-wrapper column items-center justify-center relative-position"
            :style="{ transform: `scale(${zoomScale})`, transformOrigin: 'top center' }"
          >
            <button
              class="book-nav-arrow book-nav-prev"
              title="Página anterior (←)"
              @click.stop="prevPage"
            >
              <q-icon name="chevron_left" size="32px" />
            </button>

            <!-- CASO HOJA SIMPLE: ÍNDICE GENERAL EN PÁG 2 -->
            <div v-if="currentPage === 2" class="single-page-card shadow-12 relative-position page-indice-container" style="width: 540px; min-height: 760px;">
              <div class="indice-header q-pa-md border-bottom bg-slate-50">
                <div class="row items-center justify-between q-mb-xs">
                  <div class="row items-center q-gutter-x-xs">
                    <q-icon name="toc" size="22px" color="indigo-9" />
                    <span class="text-subtitle2 text-weight-bolder text-slate-900 font-mono">ÍNDICE GENERAL DEL EXPEDIENTE</span>
                  </div>
                  <q-badge color="indigo-9" text-color="white" class="font-mono text-weight-bold">
                    13 SECCIONES
                  </q-badge>
                </div>
                <div class="text-caption text-slate-600 font-mono" style="font-size: 11px;">
                  Titular: <strong>{{ empleado?.nombre_completo }}</strong> • {{ totalPdfPages }} fojas digitalizadas
                </div>
              </div>

              <div class="indice-body col q-pa-sm scroll" style="max-height: 640px;">
                <div class="q-gutter-y-xs">
                  <div
                    v-for="sec in secciones"
                    :key="sec.codigo"
                    class="indice-item row items-center justify-between q-pa-xs rounded-borders"
                    :class="{ 'indice-item-has-pdf': pdfsDisponibles[sec.codigo]?.hasPdf }"
                  >
                    <div class="row items-center q-gutter-x-xs ellipsis col">
                      <span class="indice-sec-num font-mono">{{ String(sec.id).padStart(2, '0') }}</span>
                      <div class="column ellipsis" style="min-width: 0;">
                        <span class="text-caption text-weight-bold text-slate-900 ellipsis">{{ sec.nombre }}</span>
                        <span class="text-caption text-slate-500 ellipsis" style="font-size: 9.5px;">{{ sec.descripcion }}</span>
                      </div>
                    </div>

                    <div class="row items-center q-gutter-x-xs col-auto">
                      <q-badge
                        :color="pdfsDisponibles[sec.codigo]?.hasPdf ? 'positive' : 'grey-5'"
                        text-color="white"
                        class="text-weight-bold"
                        style="font-size: 9px;"
                      >
                        {{ pdfsDisponibles[sec.codigo]?.hasPdf ? `${sec.fojas || 1} f.` : '0 f.' }}
                      </q-badge>

                      <q-btn
                        v-if="pdfsDisponibles[sec.codigo]?.hasPdf"
                        dense
                        flat
                        round
                        size="xs"
                        icon="arrow_forward"
                        color="indigo-9"
                        @click="saltarASeccion(sec.codigo)"
                      >
                        <q-tooltip>Ir a la primera foja de esta sección</q-tooltip>
                      </q-btn>
                    </div>
                  </div>
                </div>
              </div>

              <div class="book-page-folio font-mono">
                Índice General del Expediente
              </div>
            </div>

            <!-- CASO HOJA SIMPLE: FOJAS DEL PDF EN PÁG 3+ -->
            <div v-else class="single-page-card shadow-12 relative-position" style="min-width: 520px;">
              <div class="page-sec-header row items-center justify-between q-px-sm q-py-xs bg-slate-100 border-bottom">
                <div class="row items-center q-gutter-x-xs ellipsis">
                  <q-icon name="folder" size="14px" color="indigo-8" />
                  <span class="text-caption text-weight-bolder text-slate-800 ellipsis font-mono" style="font-size: 10px;">
                    SECCIÓN {{ getInfoFoja(currentPage - 2).seccionId }}: {{ getInfoFoja(currentPage - 2).seccionNombre }}
                  </span>
                </div>
                <q-badge color="indigo-9" text-color="white" class="font-mono text-weight-bold" style="font-size: 9px;">
                  Foja {{ getInfoFoja(currentPage - 2).fojaLocal }} de {{ getInfoFoja(currentPage - 2).totalFojasLocal }}
                </q-badge>
              </div>

              <div class="flex flex-center page-canvas-container">
                <canvas id="page-canvas-single" class="page-canvas-rendered"></canvas>
              </div>

              <div class="book-page-folio font-mono row items-center justify-between q-px-md">
                <span style="font-size: 9px; color: #64748b;">{{ empleado?.codigo_archivo }}</span>
                <span>Foja {{ currentPage - 2 }} de {{ totalPdfPages }}</span>
                <span style="font-size: 9px; color: #10b981; font-weight: bold;">DOCUS DIGITAL</span>
              </div>
            </div>

            <button
              v-if="currentPage < totalPages"
              class="book-nav-arrow book-nav-next"
              title="Página siguiente (→)"
              @click.stop="nextPage"
            >
              <q-icon name="chevron_right" size="32px" />
            </button>
          </div>
        </div>
      </div>

      <!-- CINTA INFERIOR DE MINIATURAS (FILMSTRIP) -->
      <transition name="slide-up">
        <div v-if="showFilmstrip" class="filmstrip-drawer row no-wrap items-center q-px-sm q-py-xs bg-slate-900 border-top col-auto z-top shadow-8">
          <div class="row items-center no-wrap q-gutter-x-sm scroll full-width filmstrip-scroll-area">
            <!-- MINIATURA 1: CARÁTULA -->
            <div
              class="filmstrip-item column items-center cursor-pointer"
              :class="{ 'filmstrip-active': currentPage === 1 }"
              @click="goToPage(1)"
            >
              <div class="filmstrip-thumb-box flex flex-center bg-amber-9 text-dark text-weight-bolder">
                <q-icon name="folder_shared" size="24px" color="amber-1" />
              </div>
              <span class="filmstrip-num font-mono">Carátula</span>
            </div>

            <!-- MINIATURA 2: ÍNDICE GENERAL -->
            <div
              class="filmstrip-item column items-center cursor-pointer"
              :class="{ 'filmstrip-active': currentPage === 2 }"
              @click="goToPage(2)"
            >
              <div class="filmstrip-thumb-box flex flex-center bg-indigo-9 text-white text-weight-bolder">
                <q-icon name="toc" size="24px" color="indigo-2" />
              </div>
              <span class="filmstrip-num font-mono">Índice</span>
            </div>

            <!-- MINIATURAS 3..N: FOJAS DEL PDF -->
            <div
              v-for="p in totalPdfPages"
              :key="p"
              class="filmstrip-item column items-center cursor-pointer"
              :class="{ 'filmstrip-active': isFilmstripActive(p) }"
              @click="irAFoja(p)"
            >
              <div class="filmstrip-thumb-box flex flex-center relative-position">
                <canvas :id="`filmstrip-canvas-${p}`" class="filmstrip-canvas"></canvas>
                <div class="filmstrip-badge font-mono">
                  S{{ getInfoFoja(p).seccionId }}
                </div>
              </div>
              <span class="filmstrip-num font-mono">Foja {{ p }}</span>
            </div>
          </div>
        </div>
      </transition>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useQuasar } from 'quasar';
import { PDFDocument } from 'pdf-lib/dist/pdf-lib.min.js';
import * as pdfjsLib from 'pdfjs-dist';
import QRCode from 'qrcode';
import docusLogo from 'src/assets/docus-app-icon.png';
import {
  getEmpleadoSecciones,
  calcularResumenFile,
  SECCIONES_FILE_DEFAULT
} from 'src/utils/fileSectionsHelper';
import {
  getMasterPdf,
  getSectionPdf,
  getEmpleadoPdfsMap,
  saveMasterPdf
} from 'src/utils/pdfStorageHelper';

// Polyfill preventivo para navegadores sin Uint8Array.prototype.toHex
if (typeof Uint8Array !== 'undefined' && !Uint8Array.prototype.toHex) {
  Uint8Array.prototype.toHex = function () {
    return Array.from(this)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  };
}

// Configurar worker de PDF.js estable 4.10.38
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';

const props = defineProps({
  modelValue: Boolean,
  empleado: Object,
  seccionCodigoInicial: {
    type: String,
    default: null
  },
  pdfDataBuffer: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['update:modelValue']);
const $q = useQuasar();

// Estado del visor
const isLoading = ref(false);
const viewMode = ref('book'); // 'book' (2 páginas) | 'single' (1 página)
const zoomScale = ref(1.0);
const showSidebar = ref(false);
const showFilmstrip = ref(true);
const viewerContainerRef = ref(null);

// Datos del documento
const totalPages = ref(2); // Mínimo 2: Carátula + Índice
const currentPage = ref(1); // 1 = Carátula, 2 = Índice (o Índice + Foja 1 en libro), 3..N
const totalPdfPages = ref(0);
let pdfDocProxy = ref(null);
const qrDataUrl = ref('');

// Mapeos de secciones por página
const pageSectionMap = ref({});
const seccionStartPageMap = ref({});
const activeRenderTasks = new Map();

// Metadatos de secciones
const secciones = ref(JSON.parse(JSON.stringify(SECCIONES_FILE_DEFAULT)));
const pdfsDisponibles = ref({});
const seccionActivaCodigo = ref(null);

const resumenFile = computed(() => {
  return calcularResumenFile(secciones.value);
});

const ubicacionTextoEmpleado = computed(() => {
  if (!props.empleado) return 'Sin asignar';
  if (props.empleado.cajon) {
    const c = props.empleado.cajon;
    const colText = c.columna === 1 ? '' : `Col ${String.fromCharCode(64 + c.columna)} • `;
    return `${c.mueble?.nombre || 'Archivador'} • ${colText}Gaveta ${c.fila}`;
  }
  return 'Gaveta Virtual (Sin asignar a mueble físico)';
});

const textoEstadoPagina = computed(() => {
  if (currentPage.value === 1) return 'Portada / Carátula';
  if (currentPage.value === 2) {
    return viewMode.value === 'book'
      ? `Índice General • Foja 1 de ${totalPdfPages.value}`
      : 'Índice General de Secciones';
  }
  if (viewMode.value === 'book') {
    const l = getLeftPdfNum(currentPage.value);
    const r = Math.min(getRightPdfNum(currentPage.value), totalPdfPages.value);
    return `Fojas ${l} - ${r} de ${totalPdfPages.value} fojas`;
  }
  return `Foja ${currentPage.value - 2} de ${totalPdfPages.value}`;
});

// Ayudantes de número de foja PDF según página en modo libro
const getLeftPdfNum = (page) => {
  if (page <= 2) return 1;
  return (page - 2) * 2;
};

const getRightPdfNum = (page) => {
  if (page === 2) return 1;
  return (page - 2) * 2 + 1;
};

const getInfoFoja = (pdfPageNum) => {
  if (pageSectionMap.value[pdfPageNum]) {
    return pageSectionMap.value[pdfPageNum];
  }
  return {
    seccionId: 1,
    seccionCodigo: 'DOC_PER',
    seccionNombre: 'Documentos Digitales',
    fojaLocal: pdfPageNum,
    totalFojasLocal: totalPdfPages.value
  };
};

const isFilmstripActive = (pdfNum) => {
  if (viewMode.value === 'single') {
    return currentPage.value === pdfNum + 2;
  }
  if (currentPage.value === 2) {
    return pdfNum === 1;
  }
  const l = getLeftPdfNum(currentPage.value);
  const r = getRightPdfNum(currentPage.value);
  return pdfNum === l || pdfNum === r;
};

const cerrarVisor = () => {
  emit('update:modelValue', false);
};

// Generar QR de la Carátula
const generarQrCaratula = async () => {
  if (!props.empleado) return;
  try {
    const payload = JSON.stringify({
      id: props.empleado.id,
      codigo: props.empleado.codigo_archivo,
      ci: props.empleado.documento_identidad,
      empleado: props.empleado.nombre_completo,
      sede: props.empleado.sede?.nombre
    });
    qrDataUrl.value = await QRCode.toDataURL(payload, {
      width: 140,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' }
    });
  } catch (err) {
    console.warn('Error generando QR de carátula:', err);
  }
};

// Watch para cuando se abre el diálogo o cambia el empleado
watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeydown);
      await inicializarVisor();
    } else {
      document.removeEventListener('keydown', handleKeydown);
      limpiarInstancia();
    }
  }
);

const limpiarInstancia = () => {
  // Cancelar renders activos
  activeRenderTasks.forEach((task) => {
    try {
      task.cancel();
    } catch {
      // Ignorar error al cancelar
    }
  });
  activeRenderTasks.clear();

  pdfDocProxy.value = null;
  totalPages.value = 2;
  currentPage.value = 1;
  totalPdfPages.value = 0;
  pageSectionMap.value = {};
  seccionStartPageMap.value = {};
};

// =========================================================================
// ENSAMBLADOR DE LIBRO UNIFICADO (MULTI-SECCIÓN SECUENCIAL)
// =========================================================================
const inicializarVisor = async () => {
  if (!props.empleado?.id) return;
  isLoading.value = true;
  currentPage.value = 1;

  try {
    secciones.value = getEmpleadoSecciones(props.empleado.id);
    pdfsDisponibles.value = await getEmpleadoPdfsMap(props.empleado.id);
    await generarQrCaratula();

    // Caso 1: Se pasó un buffer directo por prop
    if (props.pdfDataBuffer) {
      await cargarPdfDesdeBuffer(props.pdfDataBuffer);
      return;
    }

    // Caso 2: Construir el libro unificado secuencial a partir de todas las secciones
    await armarYProcesarLibroCompleto();

    // Si se solicitó abrir en una sección específica al inicio
    if (props.seccionCodigoInicial) {
      saltarASeccion(props.seccionCodigoInicial);
    }
  } catch (error) {
    console.error('Error inicializando visor:', error);
    $q.notify({ type: 'negative', message: 'No se pudo cargar el expediente para el visor.' });
  } finally {
    isLoading.value = false;
  }
};

const armarYProcesarLibroCompleto = async () => {
  try {
    pageSectionMap.value = {};
    seccionStartPageMap.value = {};

    const unifiedDoc = await PDFDocument.create();
    let globalPageCounter = 1;
    let anyPageLoaded = false;

    // Recorremos las 13 secciones en riguroso orden archivístico (01 al 13)
    for (const sec of secciones.value) {
      const hasPdf = pdfsDisponibles.value[sec.codigo]?.hasPdf;
      if (hasPdf) {
        const secRecord = await getSectionPdf(props.empleado.id, sec.codigo);
        if (secRecord && secRecord.blob) {
          try {
            const buf = await secRecord.blob.arrayBuffer();
            if (buf && buf.byteLength > 0) {
              const subDoc = await PDFDocument.load(buf);
              const count = subDoc.getPageCount();

              if (count > 0) {
                anyPageLoaded = true;
                seccionStartPageMap.value[sec.codigo] = globalPageCounter;

                const indices = Array.from({ length: count }, (_, i) => i);
                const copiedPages = await unifiedDoc.copyPages(subDoc, indices);

                copiedPages.forEach((page, idx) => {
                  unifiedDoc.addPage(page);
                  pageSectionMap.value[globalPageCounter] = {
                    seccionId: sec.id,
                    seccionCodigo: sec.codigo,
                    seccionNombre: sec.nombre,
                    fojaLocal: idx + 1,
                    totalFojasLocal: count,
                    globalPage: globalPageCounter
                  };
                  globalPageCounter++;
                });
              }
            }
          } catch (e) {
            console.warn(`Aviso leyendo PDF de sección ${sec.codigo}:`, e);
          }
        }
      }
    }

    // Si encontramos secciones con PDF, guardamos el unificado y lo cargamos
    if (anyPageLoaded) {
      const unifiedBytes = await unifiedDoc.save();
      // Guardar en la caché master en segundo plano
      saveMasterPdf(props.empleado.id, unifiedBytes, {
        filename: `EXP_${props.empleado.id}_UNIFICADO.pdf`,
        pagesCount: globalPageCounter - 1
      }).catch(() => {});

      await cargarPdfDesdeBuffer(unifiedBytes.buffer);
    } else {
      // Si no encontramos secciones separadas, verificamos si existe un Master directo previo
      const master = await getMasterPdf(props.empleado.id);
      if (master && master.blob) {
        const buf = await master.blob.arrayBuffer();
        await cargarPdfDesdeBuffer(buf);
      } else {
        // Expediente solo con Carátula e Índice
        totalPdfPages.value = 0;
        calcularTotalPaginasVisor();
      }
    }
  } catch (err) {
    console.error('Error armando libro unificado:', err);
    totalPdfPages.value = 0;
    calcularTotalPaginasVisor();
  }
};

const cargarPdfDesdeBuffer = async (buffer) => {
  try {
    isLoading.value = true;
    const proxy = await pdfjsLib.getDocument({ data: buffer }).promise;
    pdfDocProxy.value = proxy;
    totalPdfPages.value = proxy.numPages;

    // Si no teníamos un mapa detallado (por ejemplo PDF master directo), mapeamos 1 a 1
    if (Object.keys(pageSectionMap.value).length === 0) {
      for (let i = 1; i <= proxy.numPages; i++) {
        pageSectionMap.value[i] = {
          seccionId: 1,
          seccionCodigo: 'DOC_PER',
          seccionNombre: 'Documentos Personales',
          fojaLocal: i,
          totalFojasLocal: proxy.numPages,
          globalPage: i
        };
      }
      seccionStartPageMap.value['DOC_PER'] = 1;
    }

    calcularTotalPaginasVisor();
    ajustarZoomOptimo();

    await nextTick();
    if (currentPage.value > 1) {
      await renderizarPaginasActuales();
    }
    if (showFilmstrip.value) {
      renderFilmstrip();
    }
  } catch (error) {
    console.error('Error cargando PDF en PDF.js:', error);
    $q.notify({ type: 'negative', message: 'Error procesando páginas del PDF.' });
  } finally {
    isLoading.value = false;
  }
};

const calcularTotalPaginasVisor = () => {
  if (viewMode.value === 'book') {
    // Portada (1) + Spread Índice/Foja1 (2) + spreads de fojas restantes
    if (totalPdfPages.value <= 1) {
      totalPages.value = 2;
    } else {
      // Foja 1 está en página 2. Fojas 2..N van de 2 en 2 en páginas 3..M
      totalPages.value = 2 + Math.ceil((totalPdfPages.value - 1) / 2);
    }
  } else {
    // Hoja simple: 1 = Carátula, 2 = Índice, 3.. = Fojas
    totalPages.value = 2 + totalPdfPages.value;
  }
};

const saltarASeccion = async (codigo) => {
  seccionActivaCodigo.value = codigo;
  const startFoja = seccionStartPageMap.value[codigo];
  const sec = secciones.value.find((s) => s.codigo === codigo);

  if (!startFoja) {
    $q.notify({
      type: 'info',
      message: `La sección "${sec?.nombre || codigo}" no tiene fojas digitalizadas aún.`,
      icon: 'info'
    });
    return;
  }

  await irAFoja(startFoja);
  $q.notify({
    type: 'positive',
    message: `Abriendo Sección ${sec?.id || ''}: ${sec?.nombre || ''} (Foja ${startFoja})`,
    icon: 'menu_book',
    timeout: 1500
  });
};

const irAFoja = async (fojaNum) => {
  if (viewMode.value === 'single') {
    await goToPage(fojaNum + 2);
    return;
  }
  // En modo libro:
  if (fojaNum === 1) {
    await goToPage(2);
    return;
  }
  const spread = 2 + Math.ceil((fojaNum - 1) / 2);
  await goToPage(spread);
};

// =========================================================================
// RENDERIZADO ULTRA-ROBUSTO DE CANVASES
// =========================================================================
const getCanvasAsync = async (id, maxTries = 25, delayMs = 25) => {
  for (let i = 0; i < maxTries; i++) {
    const el = document.getElementById(id);
    if (el && el.isConnected) return el;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return document.getElementById(id);
};

const renderizarPaginasActuales = async () => {
  if (!pdfDocProxy.value) return;

  if (currentPage.value === 1) {
    // Carátula HTML pura, sin canvas
    return;
  }

  await nextTick();

  if (viewMode.value === 'book') {
    if (currentPage.value === 2) {
      // Spread 2: Izquierda = Índice General (HTML), Derecha = Foja 1 (Canvas)
      if (totalPdfPages.value >= 1) {
        await renderizarCanvas('page-canvas-spread2-right', 1);
      }
    } else {
      // Spread 3+: Izquierda y Derecha son fojas PDF
      const leftFoja = getLeftPdfNum(currentPage.value);
      const rightFoja = getRightPdfNum(currentPage.value);

      if (leftFoja <= totalPdfPages.value) {
        await renderizarCanvas('page-canvas-left', leftFoja);
      }
      if (rightFoja <= totalPdfPages.value) {
        await renderizarCanvas('page-canvas-right', rightFoja);
      }
    }
  } else {
    // Modo página simple
    if (currentPage.value >= 3) {
      const fojaNum = currentPage.value - 2;
      if (fojaNum <= totalPdfPages.value) {
        await renderizarCanvas('page-canvas-single', fojaNum);
      }
    }
  }
};

const renderizarCanvas = async (canvasId, pdfPageNum) => {
  if (!pdfDocProxy.value || pdfPageNum < 1 || pdfPageNum > totalPdfPages.value) return;

  try {
    const canvas = await getCanvasAsync(canvasId);
    if (!canvas) {
      console.warn(`[VisorLibro] No se encontró el canvas #${canvasId} en el DOM`);
      return;
    }

    // Cancelar render anterior en este canvas si estaba en progreso
    if (activeRenderTasks.has(canvasId)) {
      try {
        await activeRenderTasks.get(canvasId).cancel();
      } catch {
        // Ignorar cancelacion previa
      }
      activeRenderTasks.delete(canvasId);
    }

    const page = await pdfDocProxy.value.getPage(pdfPageNum);
    const dpr = window.devicePixelRatio || 1;

    // Escala nítida basada en ancho de página estándar (540px)
    const baseTargetWidth = 530;
    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const scale = (baseTargetWidth / unscaledViewport.width) * dpr;
    const viewport = page.getViewport({ scale });

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.objectFit = 'contain';

    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);

    const renderTask = page.render({
      canvasContext: context,
      viewport: viewport
    });

    activeRenderTasks.set(canvasId, renderTask);
    await renderTask.promise;
    activeRenderTasks.delete(canvasId);
  } catch (err) {
    if (err?.name !== 'RenderingCancelledException') {
      console.error(`Error renderizando canvas ${canvasId} en pág ${pdfPageNum}:`, err);
    }
  }
};

const toggleFilmstrip = async () => {
  showFilmstrip.value = !showFilmstrip.value;
  if (showFilmstrip.value) {
    await nextTick();
    renderFilmstrip();
  }
};

const renderFilmstrip = async () => {
  if (!pdfDocProxy.value || !showFilmstrip.value || totalPdfPages.value === 0) return;
  await nextTick();
  await new Promise((r) => setTimeout(r, 120));

  for (let i = 1; i <= totalPdfPages.value; i++) {
    try {
      const page = await pdfDocProxy.value.getPage(i);
      const canvas = await getCanvasAsync(`filmstrip-canvas-${i}`, 15, 20);
      if (canvas) {
        const viewport = page.getViewport({ scale: 0.18 });
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: context, viewport }).promise;
      }
    } catch {
      // Ignorar errores individuales en miniaturas
    }
  }
};

// =========================================================================
// NAVEGACIÓN
// =========================================================================
const nextPage = async () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    await nextTick();
    await renderizarPaginasActuales();
  }
};

const prevPage = async () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    await nextTick();
    await renderizarPaginasActuales();
  }
};

const goToPage = async (page) => {
  const target = Math.max(1, Math.min(page, totalPages.value));
  currentPage.value = target;
  await nextTick();
  await renderizarPaginasActuales();
};

const onModeChange = async () => {
  calcularTotalPaginasVisor();
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value;
  }
  await nextTick();
  ajustarZoomOptimo();
  await renderizarPaginasActuales();
};

// ZOOM
const zoomIn = () => {
  zoomScale.value = Math.min(2.0, +(zoomScale.value + 0.1).toFixed(2));
};

const zoomOut = () => {
  zoomScale.value = Math.max(0.5, +(zoomScale.value - 0.1).toFixed(2));
};

const ajustarZoomOptimo = () => {
  const w = window.innerWidth;
  if (w < 768) {
    zoomScale.value = 0.65;
  } else if (w < 1200) {
    zoomScale.value = 0.82;
  } else {
    zoomScale.value = 0.95;
  }
};

// TECLADO
const handleKeydown = (e) => {
  if (e.key === 'ArrowRight' || e.key === 'PageDown') {
    nextPage();
  } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
    prevPage();
  } else if (e.key === 'Escape') {
    cerrarVisor();
  }
};

const onBackgroundClick = () => {
  if (window.innerWidth < 768 && showSidebar.value) {
    showSidebar.value = false;
  }
};

onMounted(() => {
  if (props.modelValue) {
    document.addEventListener('keydown', handleKeydown);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown);
  limpiarInstancia();
});
</script>

<style scoped>
.visor-libro-dialog {
  user-select: none;
}

.book-icon-badge {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.exit-button-fixed {
  flex-shrink: 0;
  white-space: nowrap;
}

.viewer-viewport {
  position: relative;
  background-color: #0b1120;
  width: 100%;
  height: 100%;
  overflow: auto;
  perspective: 1200px;
}

.book-desk-bg {
  background: radial-gradient(circle at center, #1e293b 0%, #0f172a 70%, #020617 100%);
}

.book-spread-wrapper {
  transition: transform 0.2s ease-out;
  padding: 20px 40px;
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ========================================= */
/* CARÁTULA OFICIAL DEL EXPEDIENTE (PÁG 1)   */
/* ========================================= */
.book-cover-folder {
  width: 540px;
  min-height: 760px;
  background: #fdfbf7;
  color: #0f172a;
  border-radius: 8px;
  border: 3px double #d97706;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.75),
    0 0 0 1px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
}

.cover-header-section {
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  color: #ffffff;
  border-bottom: 2px solid #f59e0b;
}

.cover-inst-badge {
  font-size: 11px;
  font-weight: 900;
  color: #fbbf24;
  letter-spacing: 0.05em;
}

.cover-sub-badge {
  font-size: 9.5px;
  color: #94a3b8;
  letter-spacing: 0.03em;
}

.cover-super-title {
  font-size: 11px;
  font-weight: 700;
  color: #cbd5e1;
  letter-spacing: 0.08em;
}

.cover-main-title {
  font-size: 20px;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: 0.03em;
  margin: 2px 0;
}

.cover-code-pill {
  display: inline-block;
  background: #f59e0b;
  color: #0f172a;
  font-size: 12px;
  font-weight: 900;
  padding: 2px 12px;
  border-radius: 999px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
}

.cover-person-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.cover-avatar-box {
  width: 58px;
  height: 58px;
  border-radius: 8px;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.cover-name-text {
  font-size: 16px;
  font-weight: 900;
  color: #0f172a;
  line-height: 1.2;
}

.cover-detail-row {
  font-size: 11.5px;
  color: #334155;
}

.cover-location-badge {
  font-size: 11px;
  background: #f8fafc;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 2px 6px;
  display: inline-flex;
  align-items: center;
}

.cover-qr-img {
  width: 72px;
  height: 72px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

.cover-qr-caption {
  font-size: 8px;
  font-weight: 800;
  color: #64748b;
  margin-top: 2px;
}

.cover-sections-table {
  background: #ffffff;
  border: 1px solid #e2e8f0;
}

.cover-sections-header {
  font-size: 10px;
  font-weight: 800;
  color: #475569;
  letter-spacing: 0.05em;
}

.cover-sections-badge {
  font-size: 10px;
  font-weight: 800;
  color: #d97706;
}

.cover-sec-mini-item {
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 4px;
  padding: 2px 4px;
}

.cover-sec-fojas-badge {
  font-size: 9px;
  font-weight: 800;
  color: #1e40af;
  background: #eff6ff;
  border-radius: 3px;
  padding: 1px 4px;
}

.cover-footer-section {
  background: #f1f5f9;
  border-top: 1px solid #e2e8f0;
}

.cover-open-btn {
  font-size: 12px;
}

/* ========================================= */
/* ENCUADERNACIÓN 2 PÁGINAS (FOJAS DEL LEGAJO)*/
/* ========================================= */
.book-binder-spread {
  display: flex;
  background: #ffffff;
  border-radius: 6px;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.75),
    0 0 0 1px rgba(0, 0, 0, 0.3),
    inset 0 0 40px rgba(0, 0, 0, 0.05);
  position: relative;
}

.book-page-left,
.book-page-right {
  min-width: 520px;
  min-height: 730px;
  background: #ffffff;
  position: relative;
  display: flex;
  flex-direction: column;
  box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.02);
}

.book-page-left {
  border-top-left-radius: 6px;
  border-bottom-left-radius: 6px;
  box-shadow:
    -4px 0 8px rgba(0, 0, 0, 0.15),
    inset -15px 0 20px rgba(0, 0, 0, 0.04);
}

.book-page-right {
  border-top-right-radius: 6px;
  border-bottom-right-radius: 6px;
  box-shadow:
    4px 0 8px rgba(0, 0, 0, 0.15),
    inset 15px 0 20px rgba(0, 0, 0, 0.04);
}

.book-spine-crease {
  width: 22px;
  background: linear-gradient(
    to right,
    rgba(0, 0, 0, 0.28) 0%,
    rgba(0, 0, 0, 0.15) 20%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(0, 0, 0, 0.15) 80%,
    rgba(0, 0, 0, 0.28) 100%
  );
  box-shadow:
    inset -2px 0 5px rgba(0, 0, 0, 0.4),
    inset 2px 0 5px rgba(0, 0, 0, 0.4);
  position: relative;
  z-index: 5;
}

.spine-line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
  background: rgba(0, 0, 0, 0.35);
}

/* PÁGINA ÍNDICE GENERAL */
.page-indice-container {
  background: #ffffff;
}

.indice-header {
  border-bottom: 2px solid #e2e8f0;
}

.indice-item {
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  transition: all 0.15s ease;
}

.indice-item:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.indice-item-has-pdf {
  border-left: 3px solid #10b981;
}

.indice-sec-num {
  font-size: 11px;
  font-weight: 900;
  color: #1e293b;
  background: #e2e8f0;
  padding: 1px 5px;
  border-radius: 4px;
}

/* MEMBRETE SUPERIOR DE SECCIÓN EN FOJA */
.page-sec-header {
  height: 28px;
  flex-shrink: 0;
}

.page-canvas-container {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  overflow: hidden;
  padding: 4px;
}

.page-canvas-rendered {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
}

.book-page-folio-left,
.book-page-folio-right,
.book-page-folio {
  font-size: 11px;
  color: #94a3b8;
  padding: 4px 12px;
  text-align: center;
  border-top: 1px solid #f1f5f9;
  background: #ffffff;
  height: 28px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.book-blank-page {
  min-height: 680px;
  background: #fafafa;
}

.book-nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.75);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 30;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
  transition: all 0.2s ease;
}

.book-nav-arrow:hover {
  background: #f59e0b;
  color: #0f172a;
  transform: translateY(-50%) scale(1.1);
}

.book-nav-prev {
  left: 8px;
}

.book-nav-next {
  right: 8px;
}

/* HOJA SIMPLE */
.single-page-wrapper {
  padding: 30px;
  transition: transform 0.2s ease-out;
  min-height: 100%;
}

.single-page-card {
  background: #ffffff;
  border-radius: 6px;
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(0, 0, 0, 0.2);
}

/* SIDEBAR DE LAS 13 SECCIONES */
.sidebar-sections {
  width: 260px;
  background: #0f172a;
  z-index: 40;
}

.sidebar-section-item {
  border-radius: 6px;
  background: #1e293b;
  border: 1px solid #334155;
  transition: all 0.15s ease;
}

.sidebar-section-item:hover {
  background: #334155;
  border-color: #64748b;
}

.sidebar-section-item.item-active {
  background: #312e81;
  border-color: #818cf8;
}

.sidebar-section-item.item-has-pdf {
  border-left: 3px solid #10b981;
}

.sidebar-sec-num {
  font-family: monospace;
  font-weight: 800;
  font-size: 11px;
  background: #0f172a;
  color: #93c5fd;
  padding: 1px 4px;
  border-radius: 4px;
}

/* FILMSTRIP (CARRUSEL INFERIOR) */
.filmstrip-drawer {
  height: 118px;
  background: #090d16;
  border-top: 1px solid #1e293b;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.filmstrip-scroll-area {
  padding-bottom: 4px;
}

.filmstrip-item {
  flex-shrink: 0;
  padding: 4px;
  border-radius: 6px;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  user-select: none;
}

.filmstrip-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: #475569;
}

.filmstrip-item.filmstrip-active {
  background: rgba(251, 191, 36, 0.1);
  border-color: #fbbf24;
}

.filmstrip-thumb-box {
  width: 58px;
  height: 74px;
  background: #1e293b;
  border-radius: 3px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0,0,0,0.4);
}

.filmstrip-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  background: rgba(15, 23, 42, 0.85);
  color: #fbbf24;
  font-size: 8px;
  font-weight: 900;
  padding: 1px 3px;
  border-radius: 2px;
  line-height: 1;
}

.filmstrip-canvas {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.filmstrip-num {
  font-size: 10px;
  font-weight: 700;
  color: #94a3b8;
  margin-top: 3px;
}

.filmstrip-active .filmstrip-num {
  color: #fbbf24;
}

/* ANIMACIONES */
.slide-sidebar-enter-active,
.slide-sidebar-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.slide-sidebar-enter-from,
.slide-sidebar-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
