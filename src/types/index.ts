/// <summary>
/// DTO mirroring <see cref="SoluteTransport.StreamParameters"/>.
/// All physical and chemical parameters describing a stream reach.
/// </summary>
export interface StreamParametersDto {
  /** Main-channel cross-sectional area (m²). */
  a: number;
  /** Transient-storage zone cross-sectional area (m²). */
  aS: number;
  /** Lateral inflow solute concentration (kg/m³). */
  cL: number;
  /** Longitudinal dispersion coefficient (m²/s). */
  d: number;
  /** Volumetric flow rate (m³/s). */
  q: number;
  /** Lateral inflow rate per unit length (m²/s). */
  qLin: number;
  /** Exchange rate between main channel and storage zone (1/s). */
  alpha: number;
  /** Equilibrium solute concentration in the storage zone (kg/m³). */
  chatS: number;
  /** Sediment-water partition coefficient (m³/kg). */
  kd: number;
  /** First-order decay rate in main channel (1/s). */
  lambda: number;
  /** First-order decay rate in storage zone (1/s). */
  lambdaS: number;
  /** First-order desorption rate from sediment (1/s). */
  lambdaHat: number;
  /** First-order desorption rate in storage zone (1/s). */
  lambdaHatS: number;
  /** Sediment bulk density (kg/m³). */
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
