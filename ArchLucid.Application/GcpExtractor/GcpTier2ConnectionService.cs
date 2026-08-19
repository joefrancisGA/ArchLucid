using ArchLucid.Core.GcpExtractor;

namespace ArchLucid.Application.GcpExtractor;

public interface IGcpTier2ConnectionService
{
    Task<GcpTier2ConnectionSummary> ConfigureAsync(
        Guid tenantId,
        string actorId,
        GcpTier2ConnectionConfigureRequest request,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<GcpTier2ConnectionSummary>> ListConnectionsAsync(
        Guid tenantId,
        CancellationToken cancellationToken);

    Task DisconnectAsync(
        Guid tenantId,
        Guid connectionId,
        string actorId,
        CancellationToken cancellationToken);
}

public sealed class GcpTier2ConnectionConfigureRequest
{
    public required string ProjectId { get; init; }

    public required string WorkloadIdentityPoolProvider { get; init; }

    public required string ServiceAccountEmail { get; init; }
}

public sealed class GcpTier2ConnectionSummary
{
    public Guid ConnectionId { get; init; }

    public required string ProjectId { get; init; }

    public required string WorkloadIdentityPoolProvider { get; init; }

    public required string ServiceAccountEmail { get; init; }

    public GcpConnectionStatus Status { get; init; }

    public DateTimeOffset? LastPolledUtc { get; init; }

    public DateTimeOffset UpdatedUtc { get; init; }
}

public sealed class GcpTier2ConnectionService(
    ITenantGcpConnectionRepository repository) : IGcpTier2ConnectionService
{
    private readonly ITenantGcpConnectionRepository _repository =
        repository ?? throw new ArgumentNullException(nameof(repository));

    public async Task<GcpTier2ConnectionSummary> ConfigureAsync(
        Guid tenantId,
        string actorId,
        GcpTier2ConnectionConfigureRequest request,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        ArgumentException.ThrowIfNullOrWhiteSpace(actorId);
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.ProjectId);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.WorkloadIdentityPoolProvider);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.ServiceAccountEmail);

        TenantGcpConnectionRecord? existing = await _repository
            .TryGetByProjectAsync(tenantId, request.ProjectId, cancellationToken)
            .ConfigureAwait(false);

        DateTimeOffset now = TimeProvider.System.GetUtcNow();

        TenantGcpConnectionRecord record = new()
        {
            ConnectionId = existing?.ConnectionId ?? Guid.Empty,
            TenantId = tenantId,
            ProjectId = request.ProjectId.Trim(),
            WorkloadIdentityPoolProvider = request.WorkloadIdentityPoolProvider.Trim(),
            ServiceAccountEmail = request.ServiceAccountEmail.Trim(),
            Status = GcpConnectionStatus.Connected,
            LastPolledUtc = existing?.LastPolledUtc,
            CreatedUtc = existing?.CreatedUtc ?? now,
            UpdatedUtc = now,
            UpdatedByActorId = actorId
        };

        await _repository.UpsertAsync(record, cancellationToken).ConfigureAwait(false);

        TenantGcpConnectionRecord? stored = await _repository
            .TryGetByProjectAsync(tenantId, request.ProjectId, cancellationToken)
            .ConfigureAwait(false);

        if (stored is null)
            throw new InvalidOperationException("GCP connection upsert did not persist.");

        return ToSummary(stored);
    }

    public async Task<IReadOnlyList<GcpTier2ConnectionSummary>> ListConnectionsAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        IReadOnlyList<TenantGcpConnectionRecord> records = await _repository
            .ListByTenantAsync(tenantId, cancellationToken)
            .ConfigureAwait(false);

        return records.Select(ToSummary).ToList();
    }

    public async Task DisconnectAsync(
        Guid tenantId,
        Guid connectionId,
        string actorId,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        if (connectionId == Guid.Empty)
            throw new ArgumentException("connectionId is required.", nameof(connectionId));

        ArgumentException.ThrowIfNullOrWhiteSpace(actorId);

        TenantGcpConnectionRecord? existing = await _repository
            .TryGetAsync(tenantId, connectionId, cancellationToken)
            .ConfigureAwait(false);

        if (existing is null)
            return;

        await _repository.DeleteAsync(tenantId, connectionId, cancellationToken).ConfigureAwait(false);
    }

    private static GcpTier2ConnectionSummary ToSummary(TenantGcpConnectionRecord record) =>
        new()
        {
            ConnectionId = record.ConnectionId,
            ProjectId = record.ProjectId,
            WorkloadIdentityPoolProvider = record.WorkloadIdentityPoolProvider,
            ServiceAccountEmail = record.ServiceAccountEmail,
            Status = record.Status,
            LastPolledUtc = record.LastPolledUtc,
            UpdatedUtc = record.UpdatedUtc
        };
}
