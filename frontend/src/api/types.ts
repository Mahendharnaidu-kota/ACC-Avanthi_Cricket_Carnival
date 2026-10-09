export type Course = 'BTech' | 'Diploma' | 'MBA' | 'MCA' | 'MTech'
export type SkillType = 'batting' | 'bowling' | 'allrounder'
export type PaymentStatus = 'paid' | 'not_paid'
export type PlayerAuctionStatus = 'available' | 'sold' | 'passed' | 'unsold'
export type AuctionStatus = 'idle' | 'running' | 'sold' | 'unsold'
export type UserRole = 'admin' | 'verifier'

export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: 'bearer'
  role: UserRole
  expires_at: string
}

export interface PlayerCreate {
  roll_number: string
  mobile: string
  name: string
  photo_url: string
  course: Course
  branch: string
  year: number
  cricheroes_url?: string | null
  base_price: number
  skill_type: SkillType
  batting_style?: Player['batting_style']
  bowling_style?: Player['bowling_style']
  is_wicket_keeper?: boolean
}

export interface Player {
  id: number
  roll_number: string
  mobile: string
  name: string
  photo_url: string
  course: Course
  branch: string
  year: number
  cricheroes_url: string | null
  base_price: number
  skill_type: SkillType
  batting_style: 'strike rotator' | 'aggressive batter' | 'big hitter' | null
  bowling_style: 'fast' | 'spin' | null
  is_wicket_keeper: boolean
  payment_status: PaymentStatus
  auction_status: PlayerAuctionStatus
  sold_to_team_id: number | null
  sold_price: number | null
  created_at: string
}

export type PublicPlayer = Omit<Player, 'mobile'>

export interface TeamCreate {
  name: string
  captain_name: string
  captain_photo_url: string
  coordinator_name: string
  coordinator_photo_url: string
}

export type TeamUpdate = TeamCreate

export interface Team {
  id: number
  name: string
  captain_name: string
  captain_photo_url: string
  coordinator_name: string
  coordinator_photo_url: string
  purse: number
  players: PublicPlayer[]
}

export interface AuctionState {
  id: number
  current_player_id: number | null
  selected_category: string | null
  current_price: number
  leading_team_id: number | null
  timer_ends_at: string | null
  status: AuctionStatus
  message: string | null
  updated_at: string
}

export interface PlayerFilters {
  payment_status?: PaymentStatus
  course?: Course
  year?: number
  branch?: string
  search?: string
}
