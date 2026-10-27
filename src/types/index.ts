/// <summary>
/// DTO mirroring <see cref="SoluteTransport.StreamParameters"/>.
/// All physical and chemical parameters describing a stream reach.
/// </summary>
export interface StreamParametersDto {
  /** Main-channel cross-sectional area (m²). */
  a: number;
  /** Storage-zone cross-sectional area (m²); may be zero when alpha is zero. */
  aS: number;
  /** Lateral inflow solute concentration (kg/m³). */
  cL: number;
  /** Longitudinal dispersion coefficient (m²/s). */
  d: number;
  /** Volumetric flow rate at the upstream boundary (m³/s); downstream, dQ/dx = qLin - qLout. */
  q: number;
  /** Lateral inflow rate per unit length (m²/s). */
  qLin: number;
  /** Storage-zone exchange coefficient α (1/s). */
  alpha: number;
  /** Background storage-zone solute concentration Ĉ_S (kg/m³). */
  chatS: number;
  /** Distribution coefficient K_d (m³/kg). */
  kd: number;
  /** Main-channel first-order decay coefficient λ (1/s). */
  lambda: number;
  /** Storage-zone first-order decay coefficient λ_S (1/s). */
  lambdaS: number;
  /** Main-channel sorption rate coefficient λ̂ (1/s). */
  lambdaHat: number;
  /** Storage-zone sorption rate coefficient λ̂_S (1/s). */
  lambdaHatS: number;
  /** Mass of accessible sediment per volume of water ρ (kg/m³). */
  rho: number;
  /** Lateral outflow rate per unit length (m²/s). */
  qLout: number;
}

/** "step": a constant concentration switched on upstream at t = 0; "slug": a mass dumped upstream at t = 0. */
export type SourceMode = 'step' | 'slug';

/** Values the page's controls edit. */
export interface ModelInput {
  /** Total length of the stream reach (m). */
  streamLength: number;
  /** Total simulation duration (s). */
  totalDuration: number;
  /** Time-step size (s). */
  dt: number;
  /** Spatial segment length (m). */
  dx: number;
  source: SourceMode;
  /** Upstream-boundary concentration of a step source (kg/m³). */
  upstreamConcentration: number;
  /** Solute mass of a slug source (kg). */
  slugMass: number;
  /** Number of evenly spaced stations, at streamLength * k / stationCount for k = 1 … stationCount. */
  stationCount: number;
  /** Stream physical and chemical parameters. */
  parameters: StreamParametersDto;
}

/** Request body of POST /api/calculate. */
export interface SimulationRequest {
  streamLength: number;
  totalDuration: number;
  dt: number;
  dx: number;
  source: SourceMode;
  upstreamConcentration: number;
  slugMass: number;
  /** Distances from the upstream boundary (m) at which concentrations are returned. */
  stations: number[];
  parameters: StreamParametersDto;
}

export interface StationSeries {
  /** Requested distance from the upstream boundary (m). */
  distance: number;
  /** Centre of the segment containing the station (m). */
  segmentCentre: number;
  /** Main-channel solute concentration at each sample (kg/m³). */
  mainChannel: number[];
  /** Transient-storage zone solute concentration at each sample (kg/m³). */
  storageZone: number[];
  /** Sediment-sorbed solute concentration at each sample (kg/kg). */
  sediment: number[];
}

/** Response of POST /api/calculate. */
export interface BreakthroughResult {
  /** Simulation time of each sample (s). */
  time: number[];
  /** One series per requested station, in request order. */
  stations: StationSeries[];
}
