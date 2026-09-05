using System.Text.Json;

using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence.RemediationPatterns;

public sealed class RemediationPatternService(
    IRemediationPatternRepository repository,
    ILogger<RemediationPatternService> logger) : IRemediationPatternService
{
    public async Task<RemediationPatternOperationResult> CreateDraftAsync(
        ScopeContext scope,
        RemediationPatternDraftRequest request,
        string actorKey,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);

        if (!RemediationPatternGuard.TryValidateDraftRequest(request, out string? validationError))
        {
            return Fail(validationError);
        }

        if (string.IsNullOrWhiteSpace(actorKey))
            return Fail("Actor key is required.");

        try
        {
            RemediationPatternRecord? existing = await repository.TryGetPatternByKeyAsync(
                scope.TenantId,
                request.PatternKey.Trim(),
                cancellationToken);

            DateTime utcNow = TimeProvider.System.UtcNowDateTime();

            if (existing is not null)
            {
                RemediationPatternVersionRecord? duplicateVersion = await repository.TryGetVersionAsync(
                    scope.TenantId,
                    existing.PatternId,
                    request.Version.Trim(),
                    cancellationToken);

                if (duplicateVersion is not null)
                    return Fail($"Pattern '{request.PatternKey}' already has version '{request.Version}'.");

                RemediationPatternVersionRecord versionRecord = BuildVersionRecord(
                    existing.PatternId,
                    scope.TenantId,
                    request,
                    actorKey,
                    utcNow);

                await repository.InsertVersionAsync(versionRecord, cancellationToken);

                return Success(existing.PatternId, versionRecord.Version, versionRecord.Status);
            }

            Guid patternId = Guid.NewGuid();
            RemediationPatternRecord pattern = new()
            {
                PatternId = patternId,
                TenantId = scope.TenantId,
                PatternKey = request.PatternKey.Trim(),
                DisplayName = request.DisplayName.Trim(),
                Description = request.Description?.Trim(),
                CreatedByActorKey = actorKey,
                CreatedUtc = utcNow,
                UpdatedUtc = utcNow,
            };

            RemediationPatternVersionRecord firstVersion = BuildVersionRecord(
                patternId,
                scope.TenantId,
                request,
                actorKey,
                utcNow);

            await repository.InsertPatternAsync(pattern, cancellationToken);
            await repository.InsertVersionAsync(firstVersion, cancellationToken);

            return Success(patternId, firstVersion.Version, firstVersion.Status);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Remediation pattern draft creation failed for PatternKey={PatternKey}.", request.PatternKey);
            return Fail("Remediation pattern draft creation failed.");
        }
    }

    public Task<RemediationPatternOperationResult> SubmitForReviewAsync(
        ScopeContext scope,
        Guid patternId,
        string version,
        string actorKey,
        CancellationToken cancellationToken = default) =>
        TransitionAsync(scope, patternId, version, RemediationPatternStatus.UnderReview, actorKey, cancellationToken);

    public async Task<RemediationPatternOperationResult> ApproveAsync(
        ScopeContext scope,
        Guid patternId,
        string version,
        string approverActorKey,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        RemediationPatternVersionRecord? versionRecord = await repository.TryGetVersionAsync(
            scope.TenantId,
            patternId,
            version,
            cancellationToken);

        if (versionRecord is null)
            return Fail("Remediation pattern version was not found.");

        if (!RemediationPatternGuard.TryValidateApprovalSegregation(versionRecord, approverActorKey, out string? sodError))
            return Fail(sodError);

        if (!RemediationPatternGuard.CanTransition(versionRecord.Status, RemediationPatternStatus.Approved, out string? transitionError))
            return Fail(transitionError);

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();

        RemediationPatternVersionRecord approved = CloneVersion(
            versionRecord,
            status: RemediationPatternStatus.Approved,
            approvedByActorKey: approverActorKey,
            approvedUtc: utcNow,
            updatedUtc: utcNow);

        await repository.UpdateVersionAsync(approved, cancellationToken);

        RemediationPatternRecord? pattern = await repository.TryGetPatternByIdAsync(scope.TenantId, patternId, cancellationToken);

        if (pattern is not null)
        {
            RemediationPatternRecord updatedPattern = ClonePattern(
                pattern,
                currentApprovedVersion: approved.Version,
                updatedUtc: utcNow);

            await repository.UpdatePatternAsync(updatedPattern, cancellationToken);
        }

        return Success(patternId, approved.Version, approved.Status);
    }

    public Task<RemediationPatternOperationResult> DeprecateAsync(
        ScopeContext scope,
        Guid patternId,
        string version,
        string actorKey,
        CancellationToken cancellationToken = default) =>
        TransitionAsync(scope, patternId, version, RemediationPatternStatus.Deprecated, actorKey, cancellationToken);

    public Task<RemediationPatternOperationResult> RetireAsync(
        ScopeContext scope,
        Guid patternId,
        string version,
        string actorKey,
        CancellationToken cancellationToken = default) =>
        TransitionAsync(scope, patternId, version, RemediationPatternStatus.Retired, actorKey, cancellationToken);

    public async Task<RemediationPatternDetailResult> TryGetDetailAsync(
        ScopeContext scope,
        Guid patternId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        RemediationPatternRecord? pattern = await repository.TryGetPatternByIdAsync(scope.TenantId, patternId, cancellationToken);

        if (pattern is null)
        {
            return new RemediationPatternDetailResult
            {
                Succeeded = false,
                ErrorMessage = "Remediation pattern was not found in current tenant scope.",
            };
        }

        IReadOnlyList<RemediationPatternVersionRecord> versions =
            await repository.ListVersionsByPatternAsync(scope.TenantId, patternId, cancellationToken);

        return new RemediationPatternDetailResult
        {
            Succeeded = true,
            Pattern = pattern,
            Versions = versions,
        };
    }

    public async Task<IReadOnlyList<RemediationPatternRecord>> ListPatternsAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        return await repository.ListPatternsAsync(scope.TenantId, cancellationToken);
    }

    public async Task<RemediationPatternImportResult> ImportFromJsonAsync(
        ScopeContext scope,
        string json,
        string actorKey,
        CancellationToken cancellationToken = default)
    {
        try
        {
            RemediationPatternDraftRequest request = RemediationPatternYamlCodec.DeserializeDraftRequestFromJson(json);
            RemediationPatternOperationResult result = await CreateDraftAsync(scope, request, actorKey, cancellationToken);

            return new RemediationPatternImportResult
            {
                Succeeded = result.Succeeded,
                PatternId = result.PatternId,
                Version = result.Version,
                ErrorMessage = result.ErrorMessage,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            return new RemediationPatternImportResult
            {
                Succeeded = false,
                ErrorMessage = ex.Message,
            };
        }
    }

    public async Task<RemediationPatternImportResult> ImportFromYamlAsync(
        ScopeContext scope,
        string yaml,
        string actorKey,
        CancellationToken cancellationToken = default)
    {
        try
        {
            RemediationPatternDraftRequest request = RemediationPatternYamlCodec.DeserializeDraftRequest(yaml);
            RemediationPatternOperationResult result = await CreateDraftAsync(scope, request, actorKey, cancellationToken);

            return new RemediationPatternImportResult
            {
                Succeeded = result.Succeeded,
                PatternId = result.PatternId,
                Version = result.Version,
                ErrorMessage = result.ErrorMessage,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            return new RemediationPatternImportResult
            {
                Succeeded = false,
                ErrorMessage = ex.Message,
            };
        }
    }

    public async Task<RemediationPatternBulkImportResult> ImportBulkAsync(
        ScopeContext scope,
        IReadOnlyList<RemediationPatternDraftRequest> items,
        string actorKey,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(items);

        List<RemediationPatternBulkImportItemResult> results = [];
        int succeeded = 0;
        int failed = 0;

        for (int index = 0; index < items.Count; index++)
        {
            RemediationPatternDraftRequest? item = items[index];

            if (item is null)
            {
                results.Add(new RemediationPatternBulkImportItemResult
                {
                    Index = index,
                    Succeeded = false,
                    ErrorMessage = "Null item in bulk import.",
                });
                failed++;
                continue;
            }

            RemediationPatternOperationResult createResult = await CreateDraftAsync(scope, item, actorKey, cancellationToken);

            results.Add(new RemediationPatternBulkImportItemResult
            {
                Index = index,
                Succeeded = createResult.Succeeded,
                PatternId = createResult.PatternId,
                PatternKey = item.PatternKey,
                ErrorMessage = createResult.ErrorMessage,
            });

            if (createResult.Succeeded)
                succeeded++;
            else
                failed++;
        }

        return new RemediationPatternBulkImportResult
        {
            Items = results,
            SucceededCount = succeeded,
            FailedCount = failed,
        };
    }

    private async Task<RemediationPatternOperationResult> TransitionAsync(
        ScopeContext scope,
        Guid patternId,
        string version,
        RemediationPatternStatus nextStatus,
        string actorKey,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        RemediationPatternVersionRecord? versionRecord = await repository.TryGetVersionAsync(
            scope.TenantId,
            patternId,
            version,
            cancellationToken);

        if (versionRecord is null)
            return Fail("Remediation pattern version was not found.");

        if (!RemediationPatternGuard.CanTransition(versionRecord.Status, nextStatus, out string? transitionError))
            return Fail(transitionError);

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();

        RemediationPatternVersionRecord updated = CloneVersion(
            versionRecord,
            status: nextStatus,
            updatedUtc: utcNow);

        await repository.UpdateVersionAsync(updated, cancellationToken);

        return Success(patternId, updated.Version, updated.Status);
    }

    private static RemediationPatternVersionRecord BuildVersionRecord(
        Guid patternId,
        Guid tenantId,
        RemediationPatternDraftRequest request,
        string actorKey,
        DateTime utcNow)
    {
        string contentJson = JsonSerializer.Serialize(request.Content, AuditJsonSerializationOptions.Instance);
        string? matchPropertyEqualsJson = request.MatchCriteria.PropertyEquals.Count == 0
            ? null
            : JsonSerializer.Serialize(request.MatchCriteria.PropertyEquals, AuditJsonSerializationOptions.Instance);

        return new RemediationPatternVersionRecord
        {
            VersionId = Guid.NewGuid(),
            PatternId = patternId,
            TenantId = tenantId,
            Version = request.Version.Trim(),
            Status = RemediationPatternStatus.Draft,
            ControlObjective = request.Content.ControlObjective.Trim(),
            ContentJson = contentJson,
            MatchProvider = request.MatchCriteria.Provider,
            MatchResourceType = request.MatchCriteria.ResourceType?.Trim(),
            MatchControlId = request.MatchCriteria.ControlId?.Trim(),
            MatchSeverityMin = request.MatchCriteria.SeverityMin?.Trim(),
            MatchPropertyEqualsJson = matchPropertyEqualsJson,
            AutomationLevel = request.AutomationLevel,
            AuthorActorKey = actorKey,
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
        };
    }

    private static RemediationPatternVersionRecord CloneVersion(
        RemediationPatternVersionRecord source,
        RemediationPatternStatus? status = null,
        string? approvedByActorKey = null,
        DateTime? approvedUtc = null,
        DateTime? updatedUtc = null) =>
        new()
        {
            VersionId = source.VersionId,
            PatternId = source.PatternId,
            TenantId = source.TenantId,
            Version = source.Version,
            Status = status ?? source.Status,
            ControlObjective = source.ControlObjective,
            ContentJson = source.ContentJson,
            MatchProvider = source.MatchProvider,
            MatchResourceType = source.MatchResourceType,
            MatchControlId = source.MatchControlId,
            MatchSeverityMin = source.MatchSeverityMin,
            MatchPropertyEqualsJson = source.MatchPropertyEqualsJson,
            AutomationLevel = source.AutomationLevel,
            AuthorActorKey = source.AuthorActorKey,
            ApprovedByActorKey = approvedByActorKey ?? source.ApprovedByActorKey,
            ApprovedUtc = approvedUtc ?? source.ApprovedUtc,
            CreatedUtc = source.CreatedUtc,
            UpdatedUtc = updatedUtc ?? source.UpdatedUtc,
        };

    private static RemediationPatternRecord ClonePattern(
        RemediationPatternRecord source,
        string? currentApprovedVersion = null,
        DateTime? updatedUtc = null) =>
        new()
        {
            PatternId = source.PatternId,
            TenantId = source.TenantId,
            PatternKey = source.PatternKey,
            DisplayName = source.DisplayName,
            Description = source.Description,
            CurrentApprovedVersion = currentApprovedVersion ?? source.CurrentApprovedVersion,
            CreatedByActorKey = source.CreatedByActorKey,
            CreatedUtc = source.CreatedUtc,
            UpdatedUtc = updatedUtc ?? source.UpdatedUtc,
        };

    private static RemediationPatternOperationResult Success(
        Guid patternId,
        string version,
        RemediationPatternStatus status) =>
        new()
        {
            Succeeded = true,
            PatternId = patternId,
            Version = version,
            Status = status,
        };

    private static RemediationPatternOperationResult Fail(string? message) =>
        new()
        {
            Succeeded = false,
            ErrorMessage = message,
        };
}
