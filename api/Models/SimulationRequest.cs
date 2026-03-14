namespace VADERUI.Api.Models;

/// <summary>
/// Request body for the POST /api/calculate endpoint.
/// </summary>
public record SimulationRequest(
    /// <summary>Total length of the stream reach (m).</summary>
    double StreamLength,
    /// <summary>Total simulation duration (s).</summary>
    double TotalDuration,
    /// <summary>Time-step size (s).</summary>
    double Dt,
    /// <summary>Spatial segment length (m).</summary>
    double Dx,
    /// <summary>Upstream-boundary solute concentration (kg/m³) applied at the start of the simulation.</summary>
    double UpstreamConcentration,
    /// <summary>Duration (s) for which the upstream-boundary concentration is held constant; zero thereafter.</summary>
    double UpstreamDuration,
    /// <summary>Number of evenly-spaced time snapshots to include in the response.</summary>
    int OutputTimeSteps,
    /// <summary>Stream physical and chemical parameters.</summary>
    StreamParametersDto Parameters);

/// <summary>
/// DTO mirroring <see cref="SoluteTransport.StreamParameters"/>.
/// </summary>
public record StreamParametersDto(
    double A,
    double AS,
    double CL,
    double D,
    double Q,
    double QLin,
    double Alpha,
    double ChatS,
    double Kd,
    double Lambda,
    double LambdaS,
    double LambdaHat,
    double LambdaHatS,
    double Rho);
