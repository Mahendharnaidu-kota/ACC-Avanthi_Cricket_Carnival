import axios from 'axios'
import type { Player, PlayerCreate, PlayerFilters, Team, TeamCreate } from './types'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api'

export const apiClient = axios.create({
  baseURL: apiBaseUrl.replace(/\/$/, ''),
  headers: { 'Content-Type': 'application/json' },
})

export const playersApi = {
  list: async (filters: PlayerFilters = {}): Promise<Player[]> => {
    const response = await apiClient.get<Player[]>('/players', { params: filters })
    return response.data
  },
  register: async (payload: PlayerCreate): Promise<Player> => {
    const response = await apiClient.post<Player>('/players', payload)
    return response.data
  },
}

export const teamsApi = {
  list: async (): Promise<Team[]> => {
    const response = await apiClient.get<Team[]>('/teams')
    return response.data
  },
  create: async (payload: TeamCreate): Promise<Team> => {
    const response = await apiClient.post<Team>('/teams', payload)
    return response.data
  },
}
