import { defineStore } from 'pinia'
import { api } from 'boot/axios'

export const useGeosStore = defineStore('geos', {
  state: () => ({
    muebles: [],
    loading: false,
    searchQuery: '',
  }),
  actions: {
    async fetchMuebles() {
      this.loading = true
      try {
        const response = await api.get('/muebles')
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
        await this.fetchMuebles()
        return true
      } catch (error) {
        console.error('Error updating location:', error)
        return false
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

    async createEmpleado(payload) {
      try {
        await api.post('/empleados', payload)
        await this.fetchMuebles()
        return true
      } catch (error) {
        console.error('Error creating empleado:', error)
        return false
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
    }
  },
});
