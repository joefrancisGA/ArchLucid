using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.Architecture;

public sealed class ArchitectureInventoryBindingService(
    IArchitectureIdentityRepository architectureIdentityRepository,
    IAzureInventorySnapshotRepository snapshotRepository,
    IArchitectureInventoryBindingRepository bindingRepository) : IArchitectureInventoryBindingService
{
    private readonly IArchitectureIdentityRepository _architectureIdentityRepository =
        architectureIdentityRepository ?? throw new ArgumentNullException(nameof(architectureIdentityRepository));

    private readonly IAzureInventorySnapshotRepository _snapshotRepository =
        snapshotRepository ?? throw new ArgumentNullException(nameof(snapshotRepository));

    private readonly IArchitectureInventoryBindingRepository _bindingRepository =
        bindingRepository ?? throw new ArgumentNullException(nameof(bindingRepository));

    public async Task<ArchitectureInventoryBindingResponse?> TryGetBindingAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (!await ArchitectureExistsAsync(scope, architectureId, cancellationToken))
            return null;

        ArchitectureInventoryBindingRecord? binding = await _bindingRepository.TryGetByArchitectureIdAsync(
            scope,
            architectureId,
            cancellationToken);

        if (binding is null)
        {
            return new ArchitectureInventoryBindingResponse
            {
                ArchitectureId = architectureId,
                IsBound = false,
            };
        }

        return await MapBindingAsync(scope, binding, cancellationToken);
    }

    public async Task<ArchitectureInventoryBindingAttachResult> AttachAsync(
        ScopeContext scope,
        Guid architectureId,
        Guid snapshotId,
        string boundBy,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (string.IsNullOrWhiteSpace(boundBy))
            throw new ArgumentException("BoundBy is required.", nameof(boundBy));

        if (!await ArchitectureExistsAsync(scope, architectureId, cancellationToken))
            return ArchitectureInventoryBindingAttachResult.ArchitectureNotFound();

        AzureInventorySnapshotRecord? snapshot = await _snapshotRepository.TryGetBySnapshotIdAsync(
            scope,
            snapshotId,
            cancellationToken);

        if (snapshot is null)
            return ArchitectureInventoryBindingAttachResult.SnapshotNotFound();

        DateTime boundUtc = TimeProvider.System.GetUtcNow().UtcDateTime;

        ArchitectureInventoryBindingRecord record = new()
        {
            ArchitectureId = architectureId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            SnapshotId = snapshotId,
            BoundBy = boundBy.Trim(),
            BoundUtc = boundUtc,
        };

        await _bindingRepository.UpsertAsync(record, cancellationToken);

        ArchitectureInventoryBindingResponse response = await MapBindingAsync(
            scope,
            record,
            cancellationToken,
            snapshot);

        return ArchitectureInventoryBindingAttachResult.Success(response);
    }

    public async Task<bool> TryDetachAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (!await ArchitectureExistsAsync(scope, architectureId, cancellationToken))
            return false;

        return await _bindingRepository.TryDeleteByArchitectureIdAsync(scope, architectureId, cancellationToken);
    }

    private async Task<bool> ArchitectureExistsAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken)
    {
        ArchitectureIdentityRecord? architecture = await _architectureIdentityRepository.GetByIdAsync(
            scope,
            architectureId,
            cancellationToken);

        return architecture is not null;
    }

    private async Task<ArchitectureInventoryBindingResponse> MapBindingAsync(
        ScopeContext scope,
        ArchitectureInventoryBindingRecord binding,
        CancellationToken cancellationToken,
        AzureInventorySnapshotRecord? snapshot = null)
    {
        snapshot ??= await _snapshotRepository.TryGetBySnapshotIdAsync(
            scope,
            binding.SnapshotId,
            cancellationToken);

        return new ArchitectureInventoryBindingResponse
        {
            ArchitectureId = binding.ArchitectureId,
            IsBound = true,
            SnapshotId = binding.SnapshotId,
            BoundBy = binding.BoundBy,
            BoundUtc = binding.BoundUtc,
            SnapshotCapturedUtc = snapshot?.CapturedUtc,
            SnapshotSubscriptionName = snapshot?.SubscriptionName,
        };
    }
}
