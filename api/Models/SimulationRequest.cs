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
    /// <summary>
    /// Upstream source: "pulse" holds <see cref="UpstreamConcentration"/> at the
    /// upstream boundary from t = 0 for <see cref="PulseDuration"/>, then zero;
    /// "step" holds <see cref="UpstreamConcentration"/> from t = 0; "slug" injects <see cref="SlugMass"/> at
    /// the upstream boundary during the first time step.
    /// </summary>
    string Source,
    /// <summary>Upstream-boundary concentration of a pulse or step source (kg/m³).</summary>
    double UpstreamConcentration,
    /// <summary>Injection duration of a pulse source (s).</summary>
    double PulseDuration,
    /// <summary>Solute mass of a slug source (kg).</summary>
    double SlugMass,
    /// <summary>Distances from the upstream boundary (m) at which concentrations are returned.</summary>
    double[] Stations,
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
    double Rho,
    double QLout = 0);
