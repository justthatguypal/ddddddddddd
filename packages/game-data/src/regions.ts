import type { Region, RegionEndpoint } from '@ogfn/shared-types';

export const REGION_LABELS: Record<Region, string> = {
  'NA-East': 'NA East',
  'NA-West': 'NA West',
  EU: 'Europe',
  OCE: 'Oceania',
  BR: 'Brazil',
  ASIA: 'Asia',
};

/**
 * Default ping targets. For a single-machine self-host every region points at the backend host;
 * multi-region deployments override these via REGION_ENDPOINTS on the backend.
 */
export function defaultRegionEndpoints(host = 'localhost', port = 3000): RegionEndpoint[] {
  return (Object.keys(REGION_LABELS) as Region[]).map((region) => ({
    region,
    label: REGION_LABELS[region],
    pingHost: host,
    pingPort: port,
  }));
}
