namespace ArchLucid.Persistence.Integrations;

public sealed partial class InMemoryItsmFindingCorrelationRepository
{
    /// <inheritdoc />
    public Task RegisterAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string findingId,
        string provider,
        string externalKey,
        string? externalSysId,
        Guid? findingRecordId,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        if (string.IsNullOrWhiteSpace(findingId))
            throw new ArgumentException("findingId is required.", nameof(findingId));

        if (string.IsNullOrWhiteSpace(provider))
            throw new ArgumentException("provider is required.", nameof(provider));

        if (string.IsNullOrWhiteSpace(externalKey))
            throw new ArgumentException("externalKey is required.", nameof(externalKey));

        string k = Key(tenantId, provider, externalKey);

        if (_byKey.TryGetValue(k, out ItsmFindingCorrelationRecord? existing) &&
            existing.FindingRecordId is null &&
            findingRecordId is not null)
        {
            ItsmFindingCorrelationRecord updated = new()
            {
                TenantId = existing.TenantId,
                WorkspaceId = existing.WorkspaceId,
                ProjectId = existing.ProjectId,
                FindingId = existing.FindingId,
                Provider = existing.Provider,
                ExternalKey = existing.ExternalKey,
                ExternalSysId = existing.ExternalSysId,
                CreatedUtc = existing.CreatedUtc,
                FindingRecordId = findingRecordId
            };

            _byKey[k] = updated;

            return Task.CompletedTask;
        }

        _ = _byKey.TryAdd(
            k,
            new ItsmFindingCorrelationRecord
            {
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                FindingId = findingId.Trim(),
                Provider = provider.Trim(),
                ExternalKey = externalKey.Trim(),
                ExternalSysId = string.IsNullOrWhiteSpace(externalSysId) ? null : externalSysId.Trim(),
                CreatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime,
                FindingRecordId = findingRecordId
            });

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<Guid?> TryResolveFindingRecordIdForRunFindingAsync(
        Guid tenantId,
        Guid runId,
        string findingId,
        CancellationToken ct) =>
        Task.FromResult<Guid?>(null);

    /// <inheritdoc />
    public Task<Guid?> TryResolveLatestCommittedFindingRecordIdAsync(
        Guid tenantId,
        string findingId,
        CancellationToken ct) =>
        Task.FromResult<Guid?>(null);

    /// <inheritdoc />
    public Task<ItsmFindingCorrelationUpdateResult> UpdateExternalTrackingAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string findingId,
        string provider,
        string externalKey,
        string? externalSysId,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        if (string.IsNullOrWhiteSpace(findingId))
            throw new ArgumentException("findingId is required.", nameof(findingId));

        if (string.IsNullOrWhiteSpace(provider))
            throw new ArgumentException("provider is required.", nameof(provider));

        if (string.IsNullOrWhiteSpace(externalKey))
            throw new ArgumentException("externalKey is required.", nameof(externalKey));

        string trimmedFinding = findingId.Trim();
        string trimmedProvider = provider.Trim();
        string trimmedExternalKey = externalKey.Trim();
        string? trimmedExternalSysId = string.IsNullOrWhiteSpace(externalSysId) ? null : externalSysId.Trim();

        ItsmFindingCorrelationRecord? prior = _byKey.Values
            .Where(r =>
                r.TenantId == tenantId &&
                string.Equals(r.FindingId, trimmedFinding, StringComparison.Ordinal) &&
                string.Equals(r.Provider, trimmedProvider, StringComparison.Ordinal))
            .OrderByDescending(r => r.CreatedUtc)
            .FirstOrDefault();

        if (prior is null)
            return Task.FromResult(ItsmFindingCorrelationUpdateResult.NotFound);

        bool externalKeyChanged = !string.Equals(prior.ExternalKey, trimmedExternalKey, StringComparison.Ordinal);
        bool externalSysIdChanged = !string.Equals(prior.ExternalSysId, trimmedExternalSysId, StringComparison.Ordinal);

        if (!externalKeyChanged && !externalSysIdChanged)
        {
            return Task.FromResult(new ItsmFindingCorrelationUpdateResult
            {
                Status = ItsmFindingCorrelationUpdateStatus.Unchanged,
                Prior = prior,
                Current = prior
            });
        }

        if (externalKeyChanged)
        {
            bool conflict = _byKey.Values.Any(r =>
                r.TenantId == tenantId &&
                string.Equals(r.Provider, trimmedProvider, StringComparison.Ordinal) &&
                string.Equals(r.ExternalKey, trimmedExternalKey, StringComparison.Ordinal) &&
                !string.Equals(r.FindingId, trimmedFinding, StringComparison.Ordinal));

            if (conflict)
                return Task.FromResult(ItsmFindingCorrelationUpdateResult.ExternalKeyConflict);
        }

        string priorKey = Key(tenantId, prior.Provider, prior.ExternalKey);
        _ = _byKey.TryRemove(priorKey, out _);

        ItsmFindingCorrelationRecord current = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            FindingId = trimmedFinding,
            Provider = trimmedProvider,
            ExternalKey = trimmedExternalKey,
            ExternalSysId = trimmedExternalSysId,
            FindingRecordId = prior.FindingRecordId,
            CreatedUtc = prior.CreatedUtc
        };

        string nextKey = Key(tenantId, trimmedProvider, trimmedExternalKey);
        _ = _byKey.TryAdd(nextKey, current);

        return Task.FromResult(new ItsmFindingCorrelationUpdateResult
        {
            Status = ItsmFindingCorrelationUpdateStatus.Updated,
            Prior = prior,
            Current = current
        });
    }
}
