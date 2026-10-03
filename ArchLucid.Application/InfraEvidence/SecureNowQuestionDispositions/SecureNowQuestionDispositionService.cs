using System.Text.Json;
using System.Text.RegularExpressions;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Application.InfraEvidence.SecureNowQuestionDispositions;

public sealed class SecureNowQuestionDispositionService(
    ISecureNowQuestionDispositionRepository dispositionRepository,
    IAzureInventorySnapshotRepository snapshotRepository,
    IAuditService auditService) : ISecureNowQuestionDispositionService
{
    private static readonly TimeSpan MaximumDispositionLifetime = TimeSpan.FromDays(90);
    private static readonly Regex VersionedQuestionKey = new(
        @"@v[1-9][0-9]*$",
        RegexOptions.CultureInvariant | RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public async Task<IReadOnlyList<SecureNowQuestionDispositionRecord>> ListAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        AzureInventorySnapshotDetailReadModel? snapshot =
            await snapshotRepository.TryGetSnapshotDetailAsync(scope, snapshotId, cancellationToken);
        if (snapshot is null || string.IsNullOrWhiteSpace(snapshot.Header.SubscriptionId))
            return [];

        DateTime now = TimeProvider.System.UtcNowDateTime();
        IReadOnlyList<SecureNowQuestionDispositionRecord> records =
            await dispositionRepository.ListByTenantAndSubscriptionAsync(
                scope.TenantId,
                Normalize(snapshot.Header.SubscriptionId),
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

        string? validationError = ValidateIdentity(
            request.SubscriptionId,
            request.ResourceId,
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
                NormalizeResourceId(request.ResourceId),
                request.QuestionKey.Trim(),
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
            AnswerCode = existing.AnswerCode,
            AnswerText = existing.AnswerText,
            Reason = existing.Reason,
            ExpirationUtc = existing.ExpirationUtc,
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

        string? validationError = ValidateWriteRequest(request, actorKey, status);
        if (validationError is not null)
            return Failed(validationError);

        if (!await OwnsSnapshotAsync(scope, snapshotId, request.SubscriptionId, cancellationToken))
            return Failed("Snapshot was not found.");

        DateTime now = TimeProvider.System.UtcNowDateTime();
        DateTime expirationUtc = request.ExpirationUtc ?? now.Add(MaximumDispositionLifetime);
        SecureNowQuestionDispositionRecord? existing =
            await dispositionRepository.TryGetByIdentityAsync(
                scope.TenantId,
                Normalize(request.SubscriptionId),
                NormalizeResourceId(request.ResourceId),
                request.QuestionKey.Trim(),
                cancellationToken);

        SecureNowQuestionDispositionRecord record = new()
        {
            DispositionId = existing?.DispositionId ?? Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            SnapshotId = snapshotId,
            SubscriptionId = Normalize(request.SubscriptionId),
            ResourceId = NormalizeResourceId(request.ResourceId),
            QuestionKey = request.QuestionKey.Trim(),
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

        AzureInventorySnapshotDetailReadModel? snapshot =
            await snapshotRepository.TryGetSnapshotDetailAsync(scope, snapshotId, cancellationToken);
        return snapshot is not null
               && string.Equals(
                   Normalize(snapshot.Header.SubscriptionId),
                   Normalize(subscriptionId),
                   StringComparison.Ordinal);
    }

    private static string? ValidateWriteRequest(
        SecureNowQuestionDispositionWriteRequest request,
        string actorKey,
        SecureNowQuestionDispositionStatus status)
    {
        string? identityError = ValidateIdentity(
            request.SubscriptionId,
            request.ResourceId,
            request.QuestionKey,
            request.Reason,
            actorKey);
        if (identityError is not null)
            return identityError;

        if (string.IsNullOrWhiteSpace(request.EvidenceFingerprint))
            return "EvidenceFingerprint is required.";

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
}
