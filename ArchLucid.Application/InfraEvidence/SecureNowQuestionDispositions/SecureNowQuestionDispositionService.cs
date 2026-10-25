using System.Text.Json;
using System.Text.RegularExpressions;

using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Serialization;
using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowQuestionDispositions;

public sealed class SecureNowQuestionDispositionService(
    ISecureNowQuestionDispositionRepository dispositionRepository,
    IAzureInventorySnapshotRepository snapshotRepository,
    IAuditService auditService,
    IOperatorInferredConnectionRepository? inferredConnectionRepository = null,
    IEffectiveGovernanceLoader? effectiveGovernanceLoader = null,
    IAzureInventorySnapshotGraphResolver? graphResolver = null) : ISecureNowQuestionDispositionService
{
    private readonly SecureNowQuestionCompiler questionCompiler = new();
    private readonly SecureNowPackQuestionCandidateBuilder packQuestionCandidateBuilder = new();
    private static readonly TimeSpan MaximumDispositionLifetime = TimeSpan.FromDays(90);
    private const int MaximumQuestionKeyLength = 256;
    private static readonly Regex VersionedQuestionKey = new(
        @"@v[1-9][0-9]*$",
        RegexOptions.CultureInvariant | RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public async Task<IReadOnlyList<SecureNowQuestionRecord>> ListQuestionsAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        return await CompileQuestionsAsync(
            scope,
            snapshotId,
            includeInferredConnections: true,
            cancellationToken);
    }

    private async Task<IReadOnlyList<SecureNowQuestionRecord>> CompileQuestionsAsync(
        ScopeContext scope,
        Guid snapshotId,
        bool includeInferredConnections,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        AzureInventorySnapshotDetailReadModel? snapshot =
            await snapshotRepository.TryGetSnapshotDetailAsync(scope, snapshotId, cancellationToken);

        if (snapshot is null || string.IsNullOrWhiteSpace(snapshot.Header.SubscriptionId))
            return [];

        IReadOnlyList<SecureNowQuestionDispositionRecord> dispositions =
            await dispositionRepository.ListByTenantAndSubscriptionAsync(
                scope.TenantId,
                Normalize(snapshot.Header.SubscriptionId),
                cancellationToken);
        IReadOnlyList<OperatorInferredConnectionRecord> inferred =
            !includeInferredConnections || inferredConnectionRepository is null
                ? []
                : await inferredConnectionRepository.ListBySnapshotAsync(
                    scope.TenantId,
                    snapshotId,
                    cancellationToken);

        IReadOnlyList<SecureNowDiagramQuestionCandidate> candidates =
            BuildDiagramCandidates(snapshot);
        IReadOnlyList<SecureNowPackQuestionCandidate> packCandidates =
            await BuildPackCandidatesAsync(scope, snapshotId, snapshot, cancellationToken);

        return questionCompiler.Compile(
            scope,
            snapshot,
            packCandidates,
            candidates,
            inferred,
            dispositions);
    }

    private async Task<IReadOnlyList<SecureNowPackQuestionCandidate>> BuildPackCandidatesAsync(
        ScopeContext scope,
        Guid snapshotId,
        AzureInventorySnapshotDetailReadModel snapshot,
        CancellationToken cancellationToken)
    {
        if (effectiveGovernanceLoader is null || graphResolver is null)
            return [];

        PolicyPackContentDocument effectiveContent = await effectiveGovernanceLoader.LoadEffectiveContentAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            cancellationToken);

        AzureInventorySnapshotGraphResolveResult graphResult =
            graphResolver.ResolveGraphFromSnapshot(snapshot);
        GraphSnapshot? graph = graphResult.Succeeded ? graphResult.Graph : null;

        return packQuestionCandidateBuilder.Build(
            effectiveContent,
            graph,
            snapshot.Header.SubscriptionId!);
    }

    public async Task<IReadOnlyList<SecureNowQuestionDispositionRecord>> ListAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        AzureInventorySnapshotRecord? snapshot =
            await snapshotRepository.TryGetBySnapshotIdAsync(scope, snapshotId, cancellationToken);

        if (snapshot is null || string.IsNullOrWhiteSpace(snapshot.SubscriptionId))
            return [];

        DateTime now = TimeProvider.System.UtcNowDateTime();
        IReadOnlyList<SecureNowQuestionDispositionRecord> records =
            await dispositionRepository.ListByTenantAndSubscriptionAsync(
                scope.TenantId,
                Normalize(snapshot.SubscriptionId),
                cancellationToken);

        return records
            .Select(record => record with { IsExpired = record.ExpirationUtc <= now })
            .ToList();
    }

    public Task<SecureNowQuestionDispositionMutationResult> AnswerAsync(
        ScopeContext scope,
        Guid snapshotId,
        SecureNowQuestionDispositionWriteRequest request,
        string actorKey,
        CancellationToken cancellationToken = default) =>
        WriteAsync(
            scope,
            snapshotId,
            request,
            actorKey,
            SecureNowQuestionDispositionStatus.Answered,
            cancellationToken);

    public Task<SecureNowQuestionDispositionMutationResult> IgnoreAsync(
        ScopeContext scope,
        Guid snapshotId,
        SecureNowQuestionDispositionWriteRequest request,
        string actorKey,
        CancellationToken cancellationToken = default) =>
        WriteAsync(
            scope,
            snapshotId,
            request,
            actorKey,
            SecureNowQuestionDispositionStatus.Ignored,
            cancellationToken);

    public async Task<SecureNowQuestionDispositionMutationResult> ReopenAsync(
        ScopeContext scope,
        Guid snapshotId,
        SecureNowQuestionDispositionReopenRequest request,
        string actorKey,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);

        string dispositionResourceId =
            SecureNowQuestionDispositionResourceIdResolver.ResolveForReopen(
                request.SubscriptionId,
                request.ResourceId);

        string? validationError = ValidateIdentity(
            request.SubscriptionId,
            dispositionResourceId,
            request.QuestionKey,
            request.Reason,
            actorKey);

        if (validationError is not null)
            return Failed(validationError);

        if (!await OwnsSnapshotAsync(scope, snapshotId, request.SubscriptionId, cancellationToken))
            return Failed("Snapshot was not found.");

        SecureNowQuestionDispositionRecord? existing =
            await dispositionRepository.TryGetByIdentityAsync(
                scope.TenantId,
                Normalize(request.SubscriptionId),
                dispositionResourceId,
                NormalizeQuestionKey(request.QuestionKey),
                cancellationToken);

        if (existing is null)
            return Failed("Question disposition was not found.");

        DateTime now = TimeProvider.System.UtcNowDateTime();
        SecureNowQuestionDispositionRecord reopened = new()
        {
            DispositionId = existing.DispositionId,
            TenantId = existing.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            SnapshotId = snapshotId,
            SubscriptionId = existing.SubscriptionId,
            ResourceId = existing.ResourceId,
            QuestionKey = existing.QuestionKey,
            Source = existing.Source,
            ScopeKind = existing.ScopeKind,
            Status = SecureNowQuestionDispositionStatus.Open,
            AnswerCode = null,
            AnswerText = null,
            Reason = string.Empty,
            ExpirationUtc = existing.ExpirationUtc > now
                ? existing.ExpirationUtc
                : now.Add(MaximumDispositionLifetime),
            EvidenceFingerprint = existing.EvidenceFingerprint,
            ActorKey = actorKey.Trim(),
            UpdatedUtc = now,
            AuditEntries = existing.AuditEntries
                .Append(new SecureNowQuestionDispositionAuditEntry
                {
                    Action = "Reopened",
                    ActorKey = actorKey.Trim(),
                    OccurredUtc = now,
                    Reason = request.Reason.Trim(),
                })
                .ToList(),
        };

        await dispositionRepository.UpsertAsync(reopened, cancellationToken);
        await WriteAuditAsync(scope, snapshotId, actorKey, "Reopened", reopened, request.Reason, cancellationToken);
        return new SecureNowQuestionDispositionMutationResult { Succeeded = true, Record = reopened };
    }

    private async Task<SecureNowQuestionDispositionMutationResult> WriteAsync(
        ScopeContext scope,
        Guid snapshotId,
        SecureNowQuestionDispositionWriteRequest request,
        string actorKey,
        SecureNowQuestionDispositionStatus status,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);

        string dispositionResourceId = ResolveDispositionResourceId(
            request.SubscriptionId,
            request.ResourceId,
            request.ScopeKind);

        string? validationError = ValidateWriteRequest(
            request,
            actorKey,
            status,
            dispositionResourceId);

        if (validationError is not null)
            return Failed(validationError);

        if (!await OwnsSnapshotAsync(scope, snapshotId, request.SubscriptionId, cancellationToken))
            return Failed("Snapshot was not found.");

        if (status is SecureNowQuestionDispositionStatus.Answered
            or SecureNowQuestionDispositionStatus.Ignored)
        {
            string? mutationValidationError = await ValidateMutationAgainstCompiledQuestionAsync(
                scope,
                snapshotId,
                request,
                request.Source == SecureNowQuestionSource.InferredConnection,
                cancellationToken);

            if (mutationValidationError is not null)
                return Failed(mutationValidationError);
        }

        DateTime now = TimeProvider.System.UtcNowDateTime();
        DateTime expirationUtc = request.ExpirationUtc ?? now.Add(MaximumDispositionLifetime);
        SecureNowQuestionDispositionRecord? existing =
            await dispositionRepository.TryGetByIdentityAsync(
                scope.TenantId,
                Normalize(request.SubscriptionId),
                dispositionResourceId,
                NormalizeQuestionKey(request.QuestionKey),
                cancellationToken);

        SecureNowQuestionDispositionRecord record = new()
        {
            DispositionId = existing?.DispositionId ?? Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            SnapshotId = snapshotId,
            SubscriptionId = Normalize(request.SubscriptionId),
            ResourceId = dispositionResourceId,
            QuestionKey = NormalizeQuestionKey(request.QuestionKey),
            Source = request.Source,
            ScopeKind = request.ScopeKind,
            Status = status,
            AnswerCode = status == SecureNowQuestionDispositionStatus.Answered
                ? request.AnswerCode?.Trim()
                : null,
            AnswerText = status == SecureNowQuestionDispositionStatus.Answered
                ? request.AnswerText?.Trim()
                : null,
            Reason = request.Reason.Trim(),
            ExpirationUtc = expirationUtc,
            EvidenceFingerprint = request.EvidenceFingerprint.Trim(),
            ActorKey = actorKey.Trim(),
            UpdatedUtc = now,
            AuditEntries = (existing?.AuditEntries ?? [])
                .Append(new SecureNowQuestionDispositionAuditEntry
                {
                    Action = status.ToString(),
                    ActorKey = actorKey.Trim(),
                    OccurredUtc = now,
                    Reason = request.Reason.Trim(),
                })
                .ToList(),
        };

        await dispositionRepository.UpsertAsync(record, cancellationToken);
        await WriteAuditAsync(scope, snapshotId, actorKey, status.ToString(), record, request.Reason, cancellationToken);
        return new SecureNowQuestionDispositionMutationResult { Succeeded = true, Record = record };
    }

    private async Task<bool> OwnsSnapshotAsync(
        ScopeContext scope,
        Guid snapshotId,
        string subscriptionId,
        CancellationToken cancellationToken)
    {
        if (snapshotId == Guid.Empty)
            return false;

        AzureInventorySnapshotRecord? snapshot =
            await snapshotRepository.TryGetBySnapshotIdAsync(scope, snapshotId, cancellationToken);
        return snapshot is not null
               && string.Equals(
                   Normalize(snapshot.SubscriptionId),
                   Normalize(subscriptionId),
                   StringComparison.Ordinal);
    }

    private async Task<string?> ValidateMutationAgainstCompiledQuestionAsync(
        ScopeContext scope,
        Guid snapshotId,
        SecureNowQuestionDispositionWriteRequest request,
        bool includeInferredConnections,
        CancellationToken cancellationToken)
    {
        SecureNowQuestionRecord? question = await TryFindCompiledQuestionAsync(
            scope,
            snapshotId,
            request,
            includeInferredConnections,
            cancellationToken);

        if (question is null)
            return "Question was not found.";

        if (!string.Equals(
                question.EvidenceFingerprint,
                request.EvidenceFingerprint.Trim(),
                StringComparison.Ordinal))
            return "Question evidence has changed.";

        if (request.AnswerCode is null)
            return null;

        return question.AnswerCodes.Contains(
                   request.AnswerCode.Trim(),
                   StringComparer.OrdinalIgnoreCase)
            ? null
            : "AnswerCode is invalid.";
    }

    private async Task<SecureNowQuestionRecord?> TryFindCompiledQuestionAsync(
        ScopeContext scope,
        Guid snapshotId,
        SecureNowQuestionDispositionWriteRequest request,
        bool includeInferredConnections,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<SecureNowQuestionRecord> questions =
            await CompileQuestionsAsync(
                scope,
                snapshotId,
                includeInferredConnections,
                cancellationToken);

        string dispositionResourceId = ResolveDispositionResourceId(
            request.SubscriptionId,
            request.ResourceId,
            request.ScopeKind);

        return questions.FirstOrDefault(item =>
            string.Equals(item.SubscriptionId, Normalize(request.SubscriptionId), StringComparison.OrdinalIgnoreCase)
            && string.Equals(
                ResolveDispositionResourceId(item.SubscriptionId, item.ResourceId, item.ScopeKind),
                dispositionResourceId,
                StringComparison.OrdinalIgnoreCase)
            && string.Equals(
                item.QuestionKey,
                NormalizeQuestionKey(request.QuestionKey),
                StringComparison.OrdinalIgnoreCase));
    }

    private static string? ValidateWriteRequest(
        SecureNowQuestionDispositionWriteRequest request,
        string actorKey,
        SecureNowQuestionDispositionStatus status,
        string dispositionResourceId)
    {
        string? identityError = ValidateIdentity(
            request.SubscriptionId,
            dispositionResourceId,
            request.QuestionKey,
            request.Reason,
            actorKey);

        if (identityError is not null)
            return identityError;

        if (string.IsNullOrWhiteSpace(request.EvidenceFingerprint))
            return "EvidenceFingerprint is required.";

        if (!Enum.IsDefined(request.Source))
            return "Source is invalid.";

        if (!Enum.IsDefined(request.ScopeKind))
            return "ScopeKind is invalid.";

        if (status == SecureNowQuestionDispositionStatus.Answered
            && string.IsNullOrWhiteSpace(request.AnswerCode))
            return "AnswerCode is required.";

        return ValidateExpiration(request.ExpirationUtc);
    }

    private static string? ValidateIdentity(
        string subscriptionId,
        string resourceId,
        string questionKey,
        string reason,
        string actorKey)
    {
        if (string.IsNullOrWhiteSpace(subscriptionId))
            return "SubscriptionId is required.";

        if (string.IsNullOrWhiteSpace(questionKey) || !VersionedQuestionKey.IsMatch(questionKey.Trim()))
            return "QuestionKey must end with a positive version such as @v1.";

        if (questionKey.Trim().Length > MaximumQuestionKeyLength)
            return "QuestionKey is too long.";

        if (string.IsNullOrWhiteSpace(resourceId))
            return "ResourceId is required.";

        if (string.IsNullOrWhiteSpace(reason))
            return "Reason is required.";

        if (string.IsNullOrWhiteSpace(actorKey))
            return "ActorKey is required.";

        if (resourceId.Length > 2048)
            return "ResourceId is too long.";
        return null;
    }

    private static string? ValidateExpiration(DateTime? expirationUtc)
    {
        DateTime now = TimeProvider.System.UtcNowDateTime();
        DateTime expiration = expirationUtc ?? now.Add(MaximumDispositionLifetime);

        if (expiration <= now)
            return "ExpirationUtc must be in the future.";

        if (expiration > now.Add(MaximumDispositionLifetime).AddMinutes(1))
            return "ExpirationUtc cannot be more than 90 days ahead.";
        return null;
    }

    private async Task WriteAuditAsync(
        ScopeContext scope,
        Guid snapshotId,
        string actorKey,
        string action,
        SecureNowQuestionDispositionRecord record,
        string reason,
        CancellationToken cancellationToken)
    {
        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = $"SecureNowQuestionDisposition.{action}",
                ActorUserId = actorKey.Trim(),
                ActorUserName = actorKey.Trim(),
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        snapshotId,
                        record.DispositionId,
                        record.SubscriptionId,
                        record.ResourceId,
                        record.QuestionKey,
                        reason,
                    },
                    AuditJsonSerializationOptions.Instance),
            },
            cancellationToken);
    }

    private static SecureNowQuestionDispositionMutationResult Failed(string errorMessage) =>
        new() { Succeeded = false, ErrorMessage = errorMessage };

    private static string Normalize(string? value) => value?.Trim().ToLowerInvariant() ?? string.Empty;

    private static string NormalizeResourceId(string? value) => Normalize(value);

    private static string ResolveDispositionResourceId(
        string subscriptionId,
        string? resourceId,
        SecureNowQuestionScopeKind scopeKind) =>
        SecureNowQuestionDispositionResourceIdResolver.Resolve(subscriptionId, resourceId, scopeKind);

    private static string NormalizeQuestionKey(string? questionKey) =>
        questionKey?.Trim().ToLowerInvariant() ?? string.Empty;

    private static IReadOnlyList<SecureNowDiagramQuestionCandidate> BuildDiagramCandidates(
        AzureInventorySnapshotDetailReadModel snapshot)
    {
        HashSet<string> resourceIds = snapshot.Resources
            .Select(resource => Normalize(resource.AzureResourceId))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        HashSet<string> relationshipResourceIds = snapshot.Relationships
            .Where(relationship =>
            {
                string fromResourceId = Normalize(relationship.FromAzureResourceId);
                string toResourceId = Normalize(relationship.ToAzureResourceId);

                return fromResourceId.Length > 0
                       && toResourceId.Length > 0
                       && resourceIds.Contains(fromResourceId)
                       && resourceIds.Contains(toResourceId);
            })
            .SelectMany(relationship => new[]
            {
                relationship.FromAzureResourceId,
                relationship.ToAzureResourceId,
            })
            .Select(Normalize)
            .Where(value => value.Length > 0)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        List<SecureNowDiagramQuestionCandidate> candidates = [];

        foreach (AzureInventoryResourceRecord resource in snapshot.Resources)
        {
            string resourceId = Normalize(resource.AzureResourceId);

            if (relationshipResourceIds.Contains(resourceId)
                || IsSharedServiceType(resource.ResourceType))
                continue;

            bool hasParentResourceId = !string.IsNullOrWhiteSpace(resource.ParentResourceId);
            bool parentMissingFromSnapshot = hasParentResourceId
                && !resourceIds.Contains(Normalize(resource.ParentResourceId));

            candidates.Add(new SecureNowDiagramQuestionCandidate
            {
                SubscriptionId = Normalize(resource.SubscriptionId ?? snapshot.Header.SubscriptionId),
                ResourceId = resourceId,
                ResourceType = resource.ResourceType,
                IsOrphanIntent = hasParentResourceId,
                IsUnknownEvidence = !hasParentResourceId,
                ProblemText = parentMissingFromSnapshot
                    ? "Required parent is not in this inventory snapshot."
                    : string.IsNullOrWhiteSpace(resource.ParentResourceId)
                        ? "No cited connection, and this type is not on the shared-service list."
                        : "Required parent relationship is not cited.",
            });
        }

        return candidates;
    }

    private static bool IsSharedServiceType(string resourceType)
    {
        string normalized = resourceType.Trim().ToLowerInvariant();
        return normalized is "microsoft.operationalinsights/workspaces"
            or "microsoft.keyvault/vaults"
            or "microsoft.managedidentity/userassignedidentities"
            or "microsoft.insights/actiongroups"
            or "microsoft.network/privatednszones";
    }
}
