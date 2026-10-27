using SoluteTransport;
using VADERUI.Api.Models;
using SoluteStream = SoluteTransport.Stream;

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
    if (req.OutputTimeSteps < 1)
        return Results.BadRequest("outputTimeSteps must be at least 1.");

    var parameters = new StreamParameters(
        A: req.Parameters.A,
        AS: req.Parameters.AS,
        CL: req.Parameters.CL,
        D: req.Parameters.D,
        Q: req.Parameters.Q,
        QLin: req.Parameters.QLin,
        Alpha: req.Parameters.Alpha,
        ChatS: req.Parameters.ChatS,
        Kd: req.Parameters.Kd,
        Lambda: req.Parameters.Lambda,
        LambdaS: req.Parameters.LambdaS,
        LambdaHat: req.Parameters.LambdaHat,
        LambdaHatS: req.Parameters.LambdaHatS,
        Rho: req.Parameters.Rho,
        QLout: req.Parameters.QLout);

    // One upstream-boundary value per time level j (time j * dt), 0 … totalSteps.
    int totalSteps = (int)Math.Round(req.TotalDuration / req.Dt);
    int boundarySteps = (int)(req.UpstreamDuration / req.Dt);

    double[] upstreamBoundary = new double[totalSteps + 1];
    for (int i = 0; i < Math.Min(boundarySteps, totalSteps + 1); i++)
        upstreamBoundary[i] = req.UpstreamConcentration;

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

        // Evenly-spaced time levels across [1 .. TimeStepCount], skipping
        // level 0 (the initial all-zero state). Snapshot k (0-based) is
        //   j = round( (k+1) / outputCount * TimeStepCount )
        // so the last snapshot lands on t = totalDuration.
        int outputCount = Math.Min(req.OutputTimeSteps, stream.TimeStepCount);
        int[] levels = Enumerable.Range(0, outputCount)
            .Select(k => (int)Math.Round((double)(k + 1) / outputCount * stream.TimeStepCount))
            .ToArray();

        result = stream.SimulateAdvectionAndDispersion(levels);
    }
    catch (ArgumentException ex)
    {
        return Results.BadRequest(ex.Message);
    }

    int numberOfSegments = result.C.GetLength(0);

    // Segment i is centred at (i + 0.5) * dx; the upstream boundary is at x = 0.
    double[] distance = new double[numberOfSegments];
    for (int i = 0; i < numberOfSegments; i++)
        distance[i] = (i + 0.5) * req.Dx;

    var snapshots = new List<SimulationSnapshot>(result.TimeLevels.Length);

    for (int k = 0; k < result.TimeLevels.Length; k++)
    {
        double time = result.TimeLevels[k] * req.Dt;
        double[] mainChannel = new double[numberOfSegments];
        double[] storageZone = new double[numberOfSegments];
        double[] sediment = new double[numberOfSegments];

        for (int i = 0; i < numberOfSegments; i++)
        {
            mainChannel[i] = result.C[i, k];
            storageZone[i] = result.CS[i, k];
            sediment[i] = result.CSed[i, k];
        }

        snapshots.Add(new SimulationSnapshot(time, distance, mainChannel, storageZone, sediment));
    }

    return Results.Ok(snapshots);
})
.WithName("Calculate");

app.Run();
