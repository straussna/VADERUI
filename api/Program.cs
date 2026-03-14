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
    if (req.Parameters.A == 0)
        return Results.BadRequest("A (main-channel cross-sectional area) must be non-zero.");
    if (req.Parameters.AS == 0)
        return Results.BadRequest("AS (storage-zone cross-sectional area) must be non-zero.");

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
        Rho: req.Parameters.Rho);

    int totalSteps = (int)(req.TotalDuration / req.Dt);
    int boundarySteps = (int)(req.UpstreamDuration / req.Dt);

    double[] upstreamBoundary = new double[totalSteps];
    for (int i = 0; i < Math.Min(boundarySteps, totalSteps); i++)
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

        result = stream.SimulateAdvectionAndDispersion();
    }
    catch (ArgumentException ex)
    {
        return Results.BadRequest(ex.Message);
    }

    int numberOfSegments = result.C.GetLength(0);
    int numberOfTimeSteps = result.C.GetLength(1);

    // Build distance array (segment midpoints from dx/2 to streamLength - dx/2)
    double[] distance = new double[numberOfSegments];
    for (int i = 0; i < numberOfSegments; i++)
        distance[i] = (i + 0.5) * req.Dx;

    // Select evenly-spaced output time steps across [1 .. numberOfTimeSteps-1],
    // skipping index 0 (the initial all-zero state).
    // For snapshot k (0-based), the formula maps to:
    //   j = round( (k+1) / outputCount * (numberOfTimeSteps - 1) )
    // so that the last snapshot always lands on the final computed time step.
    int outputCount = Math.Min(req.OutputTimeSteps, numberOfTimeSteps);
    var snapshots = new List<SimulationSnapshot>(outputCount);

    for (int k = 0; k < outputCount; k++)
    {
        int j = (int)Math.Round((double)(k + 1) / outputCount * (numberOfTimeSteps - 1));

        double time = j * req.Dt;
        double[] mainChannel = new double[numberOfSegments];
        double[] storageZone = new double[numberOfSegments];
        double[] sediment = new double[numberOfSegments];

        for (int i = 0; i < numberOfSegments; i++)
        {
            mainChannel[i] = result.C[i, j];
            storageZone[i] = result.CS[i, j];
            sediment[i] = result.CSed[i, j];
        }

        snapshots.Add(new SimulationSnapshot(time, distance, mainChannel, storageZone, sediment));
    }

    return Results.Ok(snapshots);
})
.WithName("Calculate");

app.Run();
