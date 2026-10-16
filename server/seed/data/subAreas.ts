// Localities in and around Kakkanad. Coordinates are approximate centroids.
// Lower-confidence entries are marked; see docs/ASSUMPTIONS.md.
export interface SubAreaSeed {
  id: string
  area_id: string
  slug: string
  name: string
  lat: number
  lng: number
}

const k = (slug: string, name: string, lat: number, lng: number): SubAreaSeed => ({
  id: `sa_${slug.replace(/-/g, '_')}`,
  area_id: 'area_kakkanad',
  slug,
  name,
  lat,
  lng,
})

export const subAreas: SubAreaSeed[] = [
  k('infopark-road', 'Infopark Road', 10.0128, 76.356),
  k('chittethukara', 'Chittethukara', 10.0215, 76.3555),
  k('edachira', 'Edachira', 10.0182, 76.365),
  k('kusumagiri', 'Kusumagiri', 10.024, 76.3385),
  k('thrikkakara', 'Thrikkakara', 10.033, 76.3295),
  k('padamugal', 'Padamugal', 10.0105, 76.333),
  k('palachuvadu', 'Palachuvadu', 10.002, 76.3245), // lower confidence: closer to the Vennala side
  k('vazhakkala', 'Vazhakkala', 10.008, 76.3215), // lower confidence: on the Thrikkakara municipality edge
  k('civil-station', 'Civil Station', 10.0155, 76.3425),
  k('ngo-quarters', 'NGO Quarters', 10.0205, 76.3345),
]
