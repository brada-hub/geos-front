import { defineStore } from 'pinia'
import { api } from 'boot/axios'

export const useGeosStore = defineStore('geos', {
  state: () => ({
    muebles: [],
    loading: false,
    searchQuery: '',
    dragContext: null, // { type: 'mueble' | 'columna', muebleId, columna }
    tiposContrato: [],
    cargos: [],
    sedes: [],
    sexos: [],
    selectedSedeId: null, // null = todas las sedes
    selectedContratoIds: [], // array de IDs de contrato activos para filtrar
    personal: [],
    personalLoading: false,
    expedientesSinAsignar: [],
    sinAsignarLoading: false,
    locatorTarget: null, // { muebleId, cajonId, empleadoId, isVirtual, timestamp }
  }),

  getters: {
    // Lista completa de todos los empleados con su ubicación física o virtual resuelta
    allEmpleadosWithLocation(state) {
      const list = [];
      // 1. Empleados en archivadores físicos
      (state.muebles || []).forEach(mueble => {
        (mueble.cajones || []).forEach(cajon => {
          (cajon.empleados || []).forEach(emp => {
            list.push({
              ...emp,
              isVirtual: false,
              mueble_id: mueble.id,
              mueble_nombre: mueble.nombre,
              cajon_id: cajon.id,
              fila: cajon.fila,
              columna: cajon.columna,
              cajon_etiqueta: cajon.etiqueta,
              ubicacion_texto: `${mueble.nombre} • Gaveta ${cajon.fila} (Col ${String.fromCharCode(64 + cajon.columna)})${cajon.etiqueta ? ` - "${cajon.etiqueta}"` : ''}`
            });
          });
        });
      });
      // 2. Empleados en gaveta virtual
      (state.expedientesSinAsignar || []).forEach(emp => {
        list.push({
          ...emp,
          isVirtual: true,
          mueble_id: null,
          mueble_nombre: 'Gaveta Virtual',
          cajon_id: null,
          fila: null,
          columna: null,
          cajon_etiqueta: 'Sin archivar físicamente',
          ubicacion_texto: 'Gaveta Virtual (Bandeja de Entrada)'
        });
      });
      return list;
    },

    // Muebles filtrados dinámicamente por Sede y/o Tipo de Contrato
    filteredMuebles(state) {
      let list = state.muebles || [];

      // Filtro por Sede
      if (state.selectedSedeId !== null && state.selectedSedeId !== undefined) {
        list = list.filter(m => m.sede_id === state.selectedSedeId);
      }

      // Filtro por Tipos de Contrato
      if (state.selectedContratoIds && state.selectedContratoIds.length > 0) {
        list = list.filter(m => {
          if (!m.cajones) return false;
          // Un mueble se muestra si al menos una de sus gavetas tiene un empleado con alguno de los contratos seleccionados
          return m.cajones.some(cajon =>
            (cajon.empleados || []).some(emp => state.selectedContratoIds.includes(emp.tipo_contrato_id))
          );
        });
      }

      return list;
    },
  },

  actions: {
    locateEmpleado(target) {
      this.locatorTarget = {
        ...target,
        timestamp: Date.now()
      };
    },
    clearLocatorTarget() {
      this.locatorTarget = null;
    },

    setDragContext(ctx) {
      this.dragContext = ctx;
    },
    clearDragContext() {
      this.dragContext = null;
    },

    async fetchCatalogos() {
      try {
        const [contratosRes, cargosRes, sedesRes, sexosRes] = await Promise.all([
          api.get('/catalogos/tipos-contrato'),
          api.get('/catalogos/cargos'),
          api.get('/catalogos/sedes'),
          api.get('/catalogos/sexos'),
        ]);
        this.tiposContrato = contratosRes.data || [];
        this.cargos = cargosRes.data || [];
        this.sedes = sedesRes.data || [];
        this.sexos = sexosRes.data || [];
      } catch (error) {
        console.error('Error fetching catalogos:', error);
      }
    },

    async createCargo(nombre, descripcion = null) {
      try {
        const res = await api.post('/catalogos/cargos', { nombre, descripcion });
        await this.fetchCatalogos();
        return res.data;
      } catch (error) {
        console.error('Error creating cargo:', error);
        return null;
      }
    },

    async createSede(nombre) {
      try {
        const res = await api.post('/catalogos/sedes', { nombre });
        await this.fetchCatalogos();
        return res.data;
      } catch (error) {
        console.error('Error creating sede:', error);
        return null;
      }
    },

    async fetchSinAsignar() {
      this.sinAsignarLoading = true;
      try {
        const res = await api.get('/empleados/sin-asignar');
        this.expedientesSinAsignar = res.data || [];
      } catch (error) {
        console.error('Error fetching sin asignar:', error);
      } finally {
        this.sinAsignarLoading = false;
      }
    },

    async fetchMuebles() {
      this.loading = true
      try {
        const [response] = await Promise.all([
          api.get('/muebles'),
          this.fetchSinAsignar(),
        ]);
        this.muebles = response.data.data || response.data
      } catch (error) {
        console.error('Error fetching muebles:', error)
      } finally {
        this.loading = false
      }
    },

    async updateEmpleadoUbicacion(empleadoId, newCajonId) {
      try {
        await api.patch(`/empleados/${empleadoId}/ubicacion`, {
          cajon_id: newCajonId,
        })
        await Promise.all([this.fetchMuebles(), this.fetchSinAsignar()])
        return { success: true }
      } catch (error) {
        console.error('Error updating location:', error)
        await Promise.all([this.fetchMuebles(), this.fetchSinAsignar()])
        const message = error.response?.data?.message || 'Error al mover el expediente'
        return { success: false, message }
      }
    },

    async createMueble(payload) {
      try {
        await api.post('/muebles', payload)
        await this.fetchMuebles()
        return true
      } catch (error) {
        console.error('Error creating mueble:', error)
        return false
      }
    },

    async updateMueble(muebleId, payload) {
      try {
        await api.patch(`/muebles/${muebleId}`, payload)
        await this.fetchMuebles()
        return true
      } catch (error) {
        console.error('Error updating mueble:', error)
        return false
      }
    },

    async deleteMueble(muebleId) {
      try {
        await api.delete(`/muebles/${muebleId}`)
        await this.fetchMuebles()
        return true
      } catch (error) {
        console.error('Error deleting mueble:', error)
        if (error.response && error.response.status === 404) {
          await this.fetchMuebles()
          return true
        }
        return false
      }
    },

    async createEmpleado(payload) {
      try {
        const res = await api.post('/empleados', payload)
        await Promise.all([this.fetchMuebles(), this.fetchSinAsignar(), this.fetchPersonal()])
        return { success: true, data: res.data }
      } catch (error) {
        console.error('Error creating empleado:', error)
        const msg = error.response?.data?.message || 'Error al registrar personal'
        return { success: false, message: msg }
      }
    },

    async updateCajon(cajonId, payload) {
      try {
        await api.patch(`/cajones/${cajonId}`, payload)
        await this.fetchMuebles()
        return true
      } catch (error) {
        console.error('Error updating cajon:', error)
        return false
      }
    },

    async addCajon(muebleId, payload = {}) {
      try {
        await api.post(`/muebles/${muebleId}/cajones`, payload)
        await this.fetchMuebles()
        return true
      } catch (error) {
        console.error('Error adding cajon:', error)
        return false
      }
    },

    async deleteCajon(cajonId) {
      try {
        await api.delete(`/cajones/${cajonId}`)
        await this.fetchMuebles()
        return true
      } catch (error) {
        console.error('Error deleting cajon:', error)
        return false
      }
    },

    async extraerColumna(muebleId, payload) {
      try {
        await api.post(`/muebles/${muebleId}/extraer-columna`, payload)
        await this.fetchMuebles()
        return true
      } catch (error) {
        console.error('Error extracting column:', error)
        return false
      }
    },

    async desacoplarMueble(muebleId) {
      try {
        await api.post(`/muebles/${muebleId}/desacoplar`)
        await this.fetchMuebles()
        return true
      } catch (error) {
        console.error('Error splitting furniture into towers:', error)
        return false
      }
    },

    async fusionarMuebles(muebleOrigenId, muebleDestinoId) {
      try {
        await api.post(`/muebles/${muebleOrigenId}/fusionar`, {
          mueble_destino_id: muebleDestinoId
        })
        await this.fetchMuebles()
        return true
      } catch (error) {
        console.error('Error merging muebles:', error)
        return false
      }
    },

    async moverColumnaMueble(muebleOrigenId, payload) {
      try {
        await api.post(`/muebles/${muebleOrigenId}/mover-columna`, payload)
        await this.fetchMuebles()
        return true
      } catch (error) {
        console.error('Error moving column:', error)
        return false
      }
    },

    async moverCajon(cajonId, payload) {
      try {
        await api.post(`/cajones/${cajonId}/mover`, payload)
        await this.fetchMuebles()
        return true
      } catch (error) {
        console.error('Error moving drawer:', error)
        return false
      }
    },

    async fetchPersonal() {
      this.personalLoading = true;
      try {
        const res = await api.get('/empleados');
        this.personal = res.data || [];
      } catch (error) {
        console.error('Error fetching personal:', error);
      } finally {
        this.personalLoading = false;
      }
    },

    async updatePersonal(personalId, payload) {
      try {
        const res = await api.patch(`/empleados/${personalId}`, payload);
        await this.fetchMuebles();
        await this.fetchPersonal();
        return { success: true, data: res.data };
      } catch (error) {
        console.error('Error updating personal:', error);
        const msg = error.response?.data?.message || 'Error al actualizar información';
        return { success: false, message: msg };
      }
    },

    async deletePersonal(personalId) {
      try {
        await api.delete(`/empleados/${personalId}`);
        await this.fetchMuebles();
        await this.fetchPersonal();
        return true;
      } catch (error) {
        console.error('Error deleting personal:', error);
        return false;
      }
    },

    async updateCajonReglas(cajonId, { tiposContratoIds = [], sedesIds = [], apellidoDesde = null, apellidoHasta = null, autoSincronizar = false }) {
      try {
        const res = await api.patch(`/cajones/${cajonId}/reglas`, {
          tipos_contrato_ids: tiposContratoIds,
          sedes_ids: sedesIds,
          apellido_desde: apellidoDesde,
          apellido_hasta: apellidoHasta,
          auto_sincronizar: autoSincronizar,
        });
        await Promise.all([this.fetchMuebles(), this.fetchSinAsignar(), this.fetchPersonal()]);
        return { success: true, data: res.data };
      } catch (error) {
        console.error('Error updating drawer rules:', error);
        return { success: false, message: error.response?.data?.message || 'Error al actualizar reglas' };
      }
    },

    async sincronizarCajon(cajonId) {
      try {
        const res = await api.post(`/cajones/${cajonId}/sincronizar-automatico`);
        await Promise.all([this.fetchMuebles(), this.fetchSinAsignar(), this.fetchPersonal()]);
        return { success: true, ...res.data };
      } catch (error) {
        console.error('Error sincronizando gaveta:', error);
        return { success: false, message: error.response?.data?.message || 'Error al sincronizar gaveta' };
      }
    },

    async asignarPorSede(cajonId, sedeId) {
      try {
        const res = await api.post(`/cajones/${cajonId}/asignar-por-sede`, {
          sede_id: sedeId
        });
        await Promise.all([this.fetchMuebles(), this.fetchSinAsignar(), this.fetchPersonal()]);
        return { success: true, message: res.data.message, data: res.data };
      } catch (error) {
        console.error('Error asignando por sede:', error);
        const msg = error.response?.data?.message || 'Error al asignar expedientes';
        return { success: false, message: msg };
      }
    },

    async importarPersonalMasivo(filas) {
      try {
        const res = await api.post('/empleados/importar-masivo', { filas });
        await Promise.all([this.fetchMuebles(), this.fetchSinAsignar(), this.fetchPersonal()]);
        return { success: true, ...res.data };
      } catch (error) {
        console.error('Error importando personal:', error);
        const msg = error.response?.data?.message || 'Error al importar datos masivos';
        return { success: false, message: msg, errores: error.response?.data?.errores || [] };
      }
    },

    async cambiarEstadoExpediente(empleadoId, nuevoEstado, comentario = '') {
      try {
        await api.post(`/empleados/${empleadoId}/movimientos`, {
          estado_nuevo: nuevoEstado,
          comentario: comentario || (nuevoEstado === 0 ? 'Marcado como Presente en gaveta' : nuevoEstado === 1 ? 'Marcado como Ausente' : 'Marcado como Prestado')
        });

        // Actualizar reactivamente el estado en muebles y cajones
        for (const m of this.muebles || []) {
          for (const c of m.cajones || []) {
            const emp = (c.empleados || []).find(e => e.id === empleadoId);
            if (emp) {
              emp.estado = nuevoEstado;
            }
          }
        }

        // Actualizar en expedientes sin asignar si corresponde
        const sinAsig = (this.expedientesSinAsignar || []).find(e => e.id === empleadoId);
        if (sinAsig) {
          sinAsig.estado = nuevoEstado;
        }

        // Actualizar en lista de personal
        const p = (this.personal || []).find(e => e.id === empleadoId);
        if (p) {
          p.estado = nuevoEstado;
        }

        return true;
      } catch (error) {
        console.error('Error al cambiar estado de expediente:', error);
        return false;
      }
    },
  },
});
