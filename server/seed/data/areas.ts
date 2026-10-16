// Areas. Only the active area has properties; coming_soon areas exist so search can say "not yet".
export interface AreaSeed {
  id: string
  slug: string
  name: string
  district: string
  state: string
  lat: number
  lng: number
  status: 'active' | 'coming_soon'
}

export const areas: AreaSeed[] = [
  { id: 'area_kakkanad', slug: 'kakkanad', name: 'Kakkanad', district: 'Ernakulam', state: 'Kerala', lat: 10.0159, lng: 76.3419, status: 'active' },
  { id: 'area_edappally', slug: 'edappally', name: 'Edappally', district: 'Ernakulam', state: 'Kerala', lat: 10.0261, lng: 76.3086, status: 'coming_soon' },
  { id: 'area_vyttila', slug: 'vyttila', name: 'Vyttila', district: 'Ernakulam', state: 'Kerala', lat: 9.9672, lng: 76.3197, status: 'coming_soon' },
  { id: 'area_kaloor', slug: 'kaloor', name: 'Kaloor', district: 'Ernakulam', state: 'Kerala', lat: 9.9972, lng: 76.2918, status: 'coming_soon' },
]
