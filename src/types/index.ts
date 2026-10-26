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
  /** Volumetric flow rate (m³/s). */
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
}

export interface SoluteTransportInput {
  /** Total length of the stream reach (m). */
  streamLength: number;
  /** Total simulation duration (s). */
  totalDuration: number;
  /** Time-step size (s). */
  dt: number;
  /** Spatial segment length (m). */
  dx: number;
  /** Upstream-boundary concentration (kg/m³). */
  upstreamConcentration: number;
  /** Duration (s) for which the upstream concentration is held; zero thereafter. */
  upstreamDuration: number;
  /** Number of evenly-spaced time snapshots in the response. */
  outputTimeSteps: number;
  /** Stream physical and chemical parameters. */
  parameters: StreamParametersDto;
}

export interface SoluteTransportResult {
  /** Simulation time for this snapshot (s). */
  time: number;
  /** Distance from the upstream end at each spatial segment (m). */
  distance: number[];
  /** Main-channel solute concentration at each segment (kg/m³). */
  mainChannel: number[];
  /** Transient-storage zone solute concentration at each segment (kg/m³). */
  storageZone: number[];
  /** Sediment-sorbed solute concentration at each segment (kg/kg). */
  sediment: number[];
}
