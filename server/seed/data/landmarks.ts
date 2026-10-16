// Real public landmarks (approximate coordinates). Properties near them are fictional.
// `aliases` are the other ways people type a landmark; search interpretation reads them from the database.
export interface LandmarkSeed {
  id: string
  area_id: string
  slug: string
  name: string
  kind: 'it_park' | 'campus' | 'government' | 'transit' | 'hospital' | 'market'
  lat: number
  lng: number
  aliases: string[]
}

const l = (slug: string, name: string, kind: LandmarkSeed['kind'], lat: number, lng: number, aliases: string[] = []): LandmarkSeed => ({
  id: `lm_${slug.replace(/-/g, '_')}`,
  area_id: 'area_kakkanad',
  slug,
  name,
  kind,
  lat,
  lng,
  aliases,
})

export const landmarks: LandmarkSeed[] = [
  l('infopark-phase-1', 'Infopark Phase 1', 'it_park', 10.0103, 76.3636, ['infopark', 'info park', 'infopark phase i']),
  l('infopark-phase-2', 'Infopark Phase 2', 'it_park', 10.003, 76.3742, ['infopark phase ii', 'infopark phase two', 'info park phase 2']),
  l('smartcity-kochi', 'SmartCity Kochi', 'it_park', 10.0072, 76.3795, ['smartcity', 'smart city']),
  l('cochin-sez', 'Cochin Special Economic Zone', 'it_park', 10.0128, 76.347, ['cochin sez', 'csez', 'sez', 'special economic zone']),
  l('rajagiri-valley', 'Rajagiri Valley campus', 'campus', 10.027, 76.3535, ['rajagiri', 'rajagiri valley']),
  l('model-engineering-college', 'Model Engineering College', 'campus', 10.0281, 76.3285, ['mec', 'model engineering']),
  l('bharata-mata-college', 'Bharata Mata College', 'campus', 10.0362, 76.327, ['bharata mata', 'bmc']),
  l('civil-station', 'Civil Station (Collectorate)', 'government', 10.015, 76.3418, ['civil station', 'collectorate']),
  l('kakkanad-junction', 'Kakkanad Junction bus stop', 'transit', 10.0148, 76.3395, ['kakkanad junction']),
]
