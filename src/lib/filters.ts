// URL <-> filter values. URL params are exactly the API's query params, plus `say`
// (the person's original sentence, used for the "I heard" row and never sent as a filter).
import type { FilterDef, FilterValues, FiltersResponse } from '../../shared/types'
import { inr } from './api'

export const NON_FILTER_PARAMS = new Set(['say', 'page', 'limit', 'sort'])

export function valuesFromParams(params: URLSearchParams): FilterValues {
  const v: FilterValues = {}
  params.forEach((value, key) => {
    if (!NON_FILTER_PARAMS.has(key) && value !== '') v[key] = value
  })
  return v
}

export interface ChipModel {
  key: string
  label: string
  def: FilterDef
}

/** One chip per applied filter, labelled with the registry's own labels. */
export function chipsFor(values: FilterValues, filters: FiltersResponse | null): ChipModel[] {
  if (!filters) return []
  const chips: ChipModel[] = []
  for (const def of filters.filters) {
    if (!def.supported) continue
    if (def.kind === 'range' && def.range) {
      const lo = values[def.range.min_key]
      const hi = values[def.range.max_key]
      if (lo || hi) {
        const label = lo && hi ? `${inr(+lo)}–${inr(+hi)} a month` : hi ? `Up to ${inr(+hi)} a month` : `From ${inr(+lo)} a month`
        chips.push({ key: def.key, label, def })
      }
      continue
    }
    const v = values[def.key]
    if (!v) continue
    const optLabel = (x: string) => def.options?.find((o) => o.value === x)?.label ?? x
    let label: string
    if (def.kind === 'boolean') label = def.label
    else if (def.kind === 'commute') {
      const mode = values.commute_mode ?? 'auto'
      label = `Within ${values.max_minutes ?? 15} min of ${optLabel(v)} by ${mode === 'walk' ? 'walking' : mode}`
    } else if (def.kind === 'single') label = `${def.label}: ${optLabel(v)}`
    else {
      const joined = v.split(',').map(optLabel).join(' or ')
      label = def.key === 'type' || def.key === 'gender_policy' ? joined : `${def.label}: ${joined}`
    }
    chips.push({ key: def.key, label, def })
  }
  return chips
}

/** Remove one filter (and its companion keys) from a values object. */
export function withoutFilter(values: FilterValues, def: FilterDef): FilterValues {
  const next = { ...values }
  if (def.kind === 'range' && def.range) {
    delete next[def.range.min_key]
    delete next[def.range.max_key]
  } else if (def.kind === 'commute' && def.commute) {
    delete next[def.key]
    delete next[def.commute.minutes_key]
    delete next[def.commute.mode_key]
  } else delete next[def.key]
  return next
}

export function toSearch(values: FilterValues, extra: Record<string, string | undefined> = {}) {
  const p = new URLSearchParams()
  Object.entries({ ...values, ...extra }).forEach(([k, v]) => v != null && v !== '' && p.set(k, v))
  return p.toString()
}
