import axios from 'axios'
import type { AuctionCategory, AuctionPublicState, BasePrice, BasePriceUpdate, BidRequest, LoginCredentials, LoginResponse, PaymentStatus, Player, PlayerCreate, PlayerFilters, Team, TeamCreate, TeamUpdate, UserRole } from './types'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api'

export const apiClient = axios.create({
  baseURL: apiBaseUrl.replace(/\/$/, ''),
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('acc_access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401 && typeof window !== 'undefined') {
      window.localStorage.removeItem('acc_access_token')
      window.localStorage.removeItem('acc_user_role')
      window.dispatchEvent(new Event('acc:auth-expired'))
    }
    return Promise.reject(error)
  },
)

export const authApi = {
  loginAdmin: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/admin/login', credentials)
    return response.data
  },
  loginVerifier: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/verifier/login', credentials)
    return response.data
  },
  login: async (role: UserRole, credentials: LoginCredentials): Promise<LoginResponse> => {
    return role === 'admin' ? authApi.loginAdmin(credentials) : authApi.loginVerifier(credentials)
  },
}

export function getAuctionWebSocketUrl(): string {
  const apiUrl = new URL(apiBaseUrl, window.location.origin)
  const apiRootPath = apiUrl.pathname.replace(/\/api\/?$/, '').replace(/\/$/, '')
  const websocketUrl = new URL(`${apiRootPath}/ws/auction`, apiUrl.origin)
  websocketUrl.protocol = websocketUrl.protocol === 'https:' ? 'wss:' : 'ws:'
  return websocketUrl.toString()
}

export const auctionApi = {
  state: async (): Promise<AuctionPublicState> => {
    const response = await apiClient.get<AuctionPublicState>('/auction/state')
    return response.data
  },
  selectCategory: async (category: AuctionCategory): Promise<AuctionPublicState> => {
    const response = await apiClient.post<AuctionPublicState>('/auction/select-category', { category })
    return response.data
  },
  start: async (): Promise<AuctionPublicState> => {
    const response = await apiClient.post<AuctionPublicState>('/auction/start')
    return response.data
  },
  bid: async (teamId: number): Promise<AuctionPublicState> => {
    const payload: BidRequest = { team_id: teamId }
    const response = await apiClient.post<AuctionPublicState>('/auction/bid', payload)
    return response.data
  },
  next: async (): Promise<AuctionPublicState> => {
    const response = await apiClient.post<AuctionPublicState>('/auction/next')
    return response.data
  },
  pass: async (): Promise<AuctionPublicState> => {
    const response = await apiClient.post<AuctionPublicState>('/auction/pass')
    return response.data
  },
}

export const playersApi = {
  list: async (filters: PlayerFilters = {}): Promise<Player[]> => {
    const response = await apiClient.get<Player[]>('/players', { params: filters })
    return response.data
  },
  register: async (payload: PlayerCreate): Promise<Player> => {
    const response = await apiClient.post<Player>('/players', payload)
    return response.data
  },
  updatePayment: async (playerId: number, paymentStatus: PaymentStatus): Promise<Player> => {
    const response = await apiClient.patch<Player>(`/players/${playerId}/payment`, {
      payment_status: paymentStatus,
    })
    return response.data
  },
  updateBasePrice: async (playerId: number, basePrice: BasePrice): Promise<Player> => {
    const payload: BasePriceUpdate = { base_price: basePrice }
    const response = await apiClient.patch<Player>(`/players/${playerId}/base-price`, payload)
    return response.data
  },
  remove: async (playerId: number): Promise<void> => {
    await apiClient.delete(`/players/${playerId}`)
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
  update: async (teamId: number, payload: TeamUpdate): Promise<Team> => {
    const response = await apiClient.put<Team>(`/teams/${teamId}`, payload)
    return response.data
  },
  remove: async (teamId: number): Promise<void> => {
    await apiClient.delete(`/teams/${teamId}`)
  },
}
