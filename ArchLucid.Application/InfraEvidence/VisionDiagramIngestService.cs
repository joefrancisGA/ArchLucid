using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.ContextIngestion.Diagram;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.InfraEvidence;

public sealed class VisionDiagramIngestService : IVisionDiagramIngestService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false,
    };

    private readonly SimulatorVisionDiagramInterpreter simulatorInterpreter;
    private readonly IArchitectureDiagramModelRepository repository;
    private readonly IAuthorityQueryService authorityQueryService;
    private readonly IManifestHashService manifestHashService;

    public VisionDiagramIngestService(
        SimulatorVisionDiagramInterpreter simulatorInterpreter,
        IArchitectureDiagramModelRepository repository,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService)
    {
        this.simulatorInterpreter = simulatorInterpreter;
        this.repository = repository;
        this.authorityQueryService = authorityQueryService;
        this.manifestHashService = manifestHashService;
    }

    public async Task<VisionDiagramIngestResult> IngestAsync(
        ScopeContext scope,
        Guid runId,
        VisionDiagramIngestRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);

        ValidateRequest(request);

        await VisionDiagramIngestSealedManifestHashGuard.EnsureRunSealedManifestHashOrThrowAsync(
            runId,
            scope,
            this.authorityQueryService,
            this.manifestHashService,
            cancellationToken);

        if (!request.UseSimulator)
        {
            throw new InvalidOperationException(
                "Live diagram vision is not configured on this deployment. Set useSimulator=true for the canned interpreter.");
        }

        VisionDiagramInterpretationResult interpreted = this.simulatorInterpreter.Interpret(request);

        if (!VisionDiagramModelValidator.TryValidate(interpreted.Model, out string? validationFailure))
        {
            throw new InvalidOperationException(validationFailure ?? "Vision diagram schema validation failed.");
        }

        string modelJson = JsonSerializer.Serialize(interpreted.Model, JsonOptions);
        string warningsJson = JsonSerializer.Serialize(interpreted.Warnings, JsonOptions);
        DateTime utcNow = TimeProvider.System.UtcNowDateTime();

        await this.repository.UpsertAsync(
            new ArchitectureDiagramModelPersistRecord
            {
                DiagramModelId = Guid.NewGuid(),
                TenantId = scope.TenantId,
                RunId = runId,
                ModelJson = modelJson,
                ExtractionMethod = DiagramExtractionMethods.VisionAi,
                WarningsJson = warningsJson,
                CreatedUtc = utcNow,
                UpdatedUtc = utcNow,
            },
            cancellationToken);

        return new VisionDiagramIngestResult
        {
            Model = interpreted.Model,
            Warnings = interpreted.Warnings,
            ExtractionMethod = DiagramExtractionMethods.VisionAi,
            InterpretationConfidence = interpreted.InterpretationConfidence,
            SourceFingerprint = ComputeFingerprint(request),
        };
    }

    private static void ValidateRequest(VisionDiagramIngestRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Format))
        {
            throw new ArgumentException("Format is required.", nameof(request));
        }

        bool supportedFormat = string.Equals(request.Format, DiagramSourceFormats.Png, StringComparison.OrdinalIgnoreCase)
            || string.Equals(request.Format, DiagramSourceFormats.Pdf, StringComparison.OrdinalIgnoreCase);

        if (!supportedFormat)
        {
            throw new ArgumentException(
                $"Vision ingest supports '{DiagramSourceFormats.Png}' and '{DiagramSourceFormats.Pdf}' only.",
                nameof(request));
        }
    }

    private static string ComputeFingerprint(VisionDiagramIngestRequest request)
    {
        byte[] hash = SHA256.HashData(
            Encoding.UTF8.GetBytes($"{request.Format}:{request.Name}:{request.ContentBase64}"));

        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
