using ArchLucid.Core.AwsExtractor;

namespace ArchLucid.Application.AwsExtractor;

public interface IAwsTier2ConnectionService
{
    Task<AwsTier2ConnectionSummary> ConfigureAsync(
        Guid tenantId,
        string actorId,
        AwsTier2ConnectionConfigureRequest request,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<AwsTier2ConnectionSummary>> ListConnectionsAsync(
        Guid tenantId,
        CancellationToken cancellationToken);

    Task DisconnectAsync(
        Guid tenantId,
        Guid connectionId,
        string actorId,
        CancellationToken cancellationToken);
}

public sealed class AwsTier2ConnectionConfigureRequest
{
    public required string AccountId { get; init; }

    public required string Region { get; init; }

    public required string RoleArn { get; init; }
}

public sealed class AwsTier2ConnectionSummary
{
    public Guid ConnectionId { get; init; }

    public required string AccountId { get; init; }

    public required string Region { get; init; }

    public required string RoleArn { get; init; }

    public AwsConnectionStatus Status { get; init; }

    public DateTimeOffset? LastPolledUtc { get; init; }

    public DateTimeOffset UpdatedUtc { get; init; }
}

public sealed class AwsTier2ConnectionService(
    ITenantAwsConnectionRepository repository) : IAwsTier2ConnectionService
{
    private readonly ITenantAwsConnectionRepository _repository =
        repository ?? throw new ArgumentNullException(nameof(repository));

    public async Task<AwsTier2ConnectionSummary> ConfigureAsync(
        Guid tenantId,
        string actorId,
        AwsTier2ConnectionConfigureRequest request,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        ArgumentException.ThrowIfNullOrWhiteSpace(actorId);
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.AccountId);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.Region);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.RoleArn);

        TenantAwsConnectionRecord? existing = await _repository
            .TryGetByAccountAsync(tenantId, request.AccountId, cancellationToken)
            .ConfigureAwait(false);

        DateTimeOffset now = TimeProvider.System.GetUtcNow();

        TenantAwsConnectionRecord record = new()
        {
            ConnectionId = existing?.ConnectionId ?? Guid.Empty,
            TenantId = tenantId,
            AccountId = request.AccountId.Trim(),
            Region = request.Region.Trim(),
            RoleArn = request.RoleArn.Trim(),
            Status = AwsConnectionStatus.Connected,
            LastPolledUtc = existing?.LastPolledUtc,
            CreatedUtc = existing?.CreatedUtc ?? now,
            UpdatedUtc = now,
            UpdatedByActorId = actorId
        };

        await _repository.UpsertAsync(record, cancellationToken).ConfigureAwait(false);

        TenantAwsConnectionRecord? stored = await _repository
            .TryGetByAccountAsync(tenantId, request.AccountId, cancellationToken)
            .ConfigureAwait(false);

        if (stored is null)
            throw new InvalidOperationException("AWS connection upsert did not persist.");

        return ToSummary(stored);
    }

    public async Task<IReadOnlyList<AwsTier2ConnectionSummary>> ListConnectionsAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        IReadOnlyList<TenantAwsConnectionRecord> records = await _repository
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

        TenantAwsConnectionRecord? existing = await _repository
            .TryGetAsync(tenantId, connectionId, cancellationToken)
            .ConfigureAwait(false);

        if (existing is null)
            return;

        await _repository.DeleteAsync(tenantId, connectionId, cancellationToken).ConfigureAwait(false);
    }

    private static AwsTier2ConnectionSummary ToSummary(TenantAwsConnectionRecord record) =>
        new()
        {
            ConnectionId = record.ConnectionId,
            AccountId = record.AccountId,
            Region = record.Region,
            RoleArn = record.RoleArn,
            Status = record.Status,
            LastPolledUtc = record.LastPolledUtc,
            UpdatedUtc = record.UpdatedUtc
        };
}
