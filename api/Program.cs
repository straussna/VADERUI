using SoluteTransport;
using VADERUI.Api.Models;
using SoluteStream = SoluteTransport.Stream;

const int MaxTimeSamples = 1000;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader());
});

var app = builder.Build();

app.UseCors();

app.MapPost("/api/calculate", (SimulationRequest req) =>
{
    if (req.StreamLength <= 0)
        return Results.BadRequest("streamLength must be positive.");
    if (req.TotalDuration <= 0)
        return Results.BadRequest("totalDuration must be positive.");
    if (req.Dt <= 0)
        return Results.BadRequest("dt must be positive.");
    if (req.Dx <= 0)
        return Results.BadRequest("dx must be positive.");
    if (req.Source is not ("pulse" or "step" or "slug"))
        return Results.BadRequest("source must be \"pulse\", \"step\" or \"slug\".");
    if (req.Source == "pulse" && !(req.PulseDuration >= 0))
        return Results.BadRequest("pulseDuration must not be negative.");
    if (req.Source == "slug" && req.Parameters.Q <= 0)
        return Results.BadRequest("Q must be positive for a slug source.");
    if (req.Stations is null || req.Stations.Length == 0)
        return Results.BadRequest("stations must hold at least one distance.");
    if (req.Stations.Any(x => !double.IsFinite(x)))
        return Results.BadRequest("stations must be finite distances.");

    var p = req.Parameters;
    var parameters = new StreamParameters(
        A: p.A,
        AS: p.AS,
        CL: p.CL,
        D: p.D,
        Q: p.Q,
        QLin: p.QLin,
        Alpha: p.Alpha,
        ChatS: p.ChatS,
        Kd: p.Kd,
        Lambda: p.Lambda,
        LambdaS: p.LambdaS,
        LambdaHat: p.LambdaHat,
        LambdaHatS: p.LambdaHatS,
        Rho: p.Rho,
        QLout: p.QLout);

    // One upstream-boundary value per time level j (time j * dt), 0 … totalSteps.
    // A step holds C0 throughout. A pulse holds C0 for levels 0 … n - 1,
    // n = round(tau / dt), and C0 / 2 at level n, so its advective inflow is
    // Q C0 n dt; levels after n are zero. A slug sets level 0 only, to 2 M / (Q dt):
    // the first time step's advective inflow, Q dt (Cbc[0] + Cbc[1]) / 2,
    // carries mass M, and the dispersive exchange across the upstream face
    // returns to zero net mass once Cbc is zero.
    int totalSteps = (int)Math.Round(req.TotalDuration / req.Dt);
    double[] upstreamBoundary = new double[Math.Max(totalSteps, 0) + 1];
    if (req.Source == "step")
        Array.Fill(upstreamBoundary, req.UpstreamConcentration);
    else if (req.Source == "pulse")
    {
        int n = (int)Math.Round(req.PulseDuration / req.Dt);
        Array.Fill(upstreamBoundary, req.UpstreamConcentration, 0, Math.Min(n, upstreamBoundary.Length));
        if (n < upstreamBoundary.Length)
            upstreamBoundary[n] = req.UpstreamConcentration / 2;
    }
    else
        upstreamBoundary[0] = 2 * req.SlugMass / (p.Q * req.Dt);

    SimulationResult result;
    try
    {
        var stream = new SoluteStream(
            req.StreamLength,
            req.TotalDuration,
            req.Dt,
            req.Dx,
            upstreamBoundary,
            parameters);

        // At most MaxTimeSamples + 1 evenly strided levels from 0, ending at TimeStepCount.
        int stride = (stream.TimeStepCount + MaxTimeSamples - 1) / MaxTimeSamples;
        var levels = new List<int>();
        for (int j = 0; j < stream.TimeStepCount; j += stride)
            levels.Add(j);
        levels.Add(stream.TimeStepCount);

        int[] segments = req.Stations
            .Select(x => Math.Clamp((int)Math.Floor(x / req.Dx), 0, stream.SegmentCount - 1))
            .ToArray();

        result = stream.SimulateAdvectionAndDispersion(levels, segments);
    }
    catch (ArgumentException ex)
    {
        return Results.BadRequest(ex.Message);
    }

    int samples = result.TimeLevels.Length;
    double[] time = result.TimeLevels.Select(j => j * req.Dt).ToArray();
    var stations = new StationSeries[result.Segments.Length];
    for (int s = 0; s < stations.Length; s++)
    {
        double[] mainChannel = new double[samples];
        double[] storageZone = new double[samples];
        double[] sediment = new double[samples];
        for (int k = 0; k < samples; k++)
        {
            mainChannel[k] = result.C[s, k];
            storageZone[k] = result.CS[s, k];
            sediment[k] = result.CSed[s, k];
        }
        stations[s] = new StationSeries(
            req.Stations[s], (result.Segments[s] + 0.5) * req.Dx, mainChannel, storageZone, sediment);
    }

    return Results.Ok(new BreakthroughResult(time, stations));
})
.WithName("Calculate");

app.Run();
