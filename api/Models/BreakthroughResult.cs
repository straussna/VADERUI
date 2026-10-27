namespace VADERUI.Api.Models;

/// <summary>
/// Concentration time series at each requested station.
/// </summary>
public record BreakthroughResult(
    /// <summary>Simulation time of each sample (s).</summary>
    double[] Time,
    /// <summary>One series per requested station, in request order.</summary>
    StationSeries[] Stations);

/// <summary>
/// Concentrations over time at the segment that contains one station.
/// </summary>
public record StationSeries(
    /// <summary>Requested distance from the upstream boundary (m).</summary>
    double Distance,
    /// <summary>Centre of the segment containing the station (m).</summary>
    double SegmentCentre,
    /// <summary>Main-channel solute concentration at each sample (kg/m³).</summary>
    double[] MainChannel,
    /// <summary>Transient-storage zone solute concentration at each sample (kg/m³).</summary>
    double[] StorageZone,
    /// <summary>Sediment-sorbed solute concentration at each sample (kg/kg).</summary>
    double[] Sediment);
