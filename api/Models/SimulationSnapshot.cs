namespace VADERUI.Api.Models;

/// <summary>
/// Concentration profiles at a single time snapshot.
/// </summary>
public record SimulationSnapshot(
    /// <summary>Simulation time of this snapshot (s).</summary>
    double Time,
    /// <summary>Distance from the upstream boundary at each spatial segment (m).</summary>
    double[] Distance,
    /// <summary>Main-channel solute concentration at each segment (kg/m³).</summary>
    double[] MainChannel,
    /// <summary>Transient-storage zone solute concentration at each segment (kg/m³).</summary>
    double[] StorageZone,
    /// <summary>Sediment-sorbed solute concentration at each segment (kg/kg).</summary>
    double[] Sediment);
