using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.Queries;
using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Application.Analysis;

/// <inheritdoc cref="IRunExportLineageVerifier" />
public sealed class RunExportLineageVerifier(
    IAuthorityQueryService authorityQueryService,
    IAuditRepository auditRepository,
    IManifestHashService manifestHashService,
    IAuditService auditService) : IRunExportLineageVerifier
{
    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IAuditRepository _auditRepository =
        auditRepository ?? throw new ArgumentNullException(nameof(auditRepository));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    /// <inheritdoc />
    public async Task<RunExportLineageVerificationResult?> VerifyAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);

        RunDetailDto? runDetail = await _authorityQueryService.GetRunDetailForManifestCompareAsync(scope, runId, ct);

        if (runDetail is null)
            return null;

        ManifestDocument? golden = runDetail.GoldenManifest;

        if (golden is null)
        {
            RunExportLineageVerificationResult notAttested = BuildResult(
                runId,
                Guid.Empty,
                RunExportLineageVerificationStatus.NotAttested,
                committedHash: null,
                recomputedHash: null,
                "Run has no committed golden manifest.");

            await LogVerificationAuditAsync(runId, notAttested, ct);

            return notAttested;
        }

        string recomputedHash = _manifestHashService.ComputeHash(golden);
        string? anchorHash = await TryGetManifestGeneratedAnchorHashAsync(scope, runId, ct);

        if (string.IsNullOrWhiteSpace(anchorHash))
        {
            RunExportLineageVerificationResult notAttested = BuildResult(
                runId,
                golden.ManifestId,
                RunExportLineageVerificationStatus.NotAttested,
                committedHash: null,
                recomputedHash: recomputedHash,
                "No ManifestGenerated audit anchor found for this run.");

            await LogVerificationAuditAsync(runId, notAttested, ct);

            return notAttested;
        }

        RunExportLineageVerificationStatus status = string.Equals(
            recomputedHash,
            anchorHash,
            StringComparison.OrdinalIgnoreCase)
            ? RunExportLineageVerificationStatus.Match
            : RunExportLineageVerificationStatus.Mismatch;

        RunExportLineageVerificationResult result = BuildResult(
            runId,
            golden.ManifestId,
            status,
            committedHash: anchorHash,
            recomputedHash: recomputedHash,
            detail: null);

        await LogVerificationAuditAsync(runId, result, ct);

        return result;
    }

    private async Task<string?> TryGetManifestGeneratedAnchorHashAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken ct)
    {
        AuditEventFilter filter = new()
        {
            RunId = runId,
            EventType = AuditEventTypes.ManifestGenerated,
            Take = 50
        };

        IReadOnlyList<AuditEvent> rows = await _auditRepository.GetFilteredAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            filter,
            ct);

        AuditEvent? anchor = rows
            .OrderByDescending(e => e.OccurredUtc)
            .ThenByDescending(e => e.EventId)
            .FirstOrDefault();

        if (anchor is null || string.IsNullOrWhiteSpace(anchor.DataJson))
            return null;

        ManifestGeneratedAuditPayload? payload = JsonSerializer.Deserialize<ManifestGeneratedAuditPayload>(
            anchor.DataJson,
            AuditJsonSerializationOptions.Instance);

        return string.IsNullOrWhiteSpace(payload?.ManifestHash) ? null : payload.ManifestHash;
    }

    [InformationalAudit]
    private async Task LogVerificationAuditAsync(
        Guid runId,
        RunExportLineageVerificationResult result,
        CancellationToken ct)
    {
        AuditEvent auditEvent = new()
        {
            EventType = AuditEventTypes.RunExportLineageVerified,
            RunId = runId,
            ManifestId = result.ManifestId == Guid.Empty ? null : result.ManifestId,
            DataJson = JsonSerializer.Serialize(
                new
                {
                    runId,
                    status = result.Status.ToString(),
                    committedHash = result.CommittedHash,
                    recomputedHash = result.RecomputedHash
                },
                AuditJsonSerializationOptions.Instance)
        };

        await _auditService.LogAsync(auditEvent, ct);
    }

    private static RunExportLineageVerificationResult BuildResult(
        Guid runId,
        Guid manifestId,
        RunExportLineageVerificationStatus status,
        string? committedHash,
        string? recomputedHash,
        string? detail)
    {
        return new RunExportLineageVerificationResult
        {
            Status = status,
            RunId = runId,
            ManifestId = manifestId,
            CommittedHash = committedHash,
            RecomputedHash = recomputedHash,
            Detail = detail
        };
    }

    private sealed record ManifestGeneratedAuditPayload(string ManifestHash, string RuleSetId);
}
