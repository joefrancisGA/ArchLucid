using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Architecture;

public interface IArchitectureIdentityCustomerService
{
    Task<ArchitectureIdentityListResult> ListAsync(
        ScopeContext scope,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<ArchitectureIdentityWithChildren?> GetAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default);

    Task<ArchitectureIdentityRecord?> RenameAsync(
        ScopeContext scope,
        Guid architectureId,
        ArchitectureIdentityPatchRequest patch,
        CancellationToken cancellationToken = default);
}

public sealed class ArchitectureIdentityCustomerService(
    IArchitectureIdentityRepository architectureIdentityRepository) : IArchitectureIdentityCustomerService
{
    private readonly IArchitectureIdentityRepository _architectureIdentityRepository =
        architectureIdentityRepository ?? throw new ArgumentNullException(nameof(architectureIdentityRepository));

    public Task<ArchitectureIdentityListResult> ListAsync(
        ScopeContext scope,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        (int effectivePage, int effectivePageSize) = PaginationDefaults.Normalize(page, pageSize);
        int skip = PaginationDefaults.ToSkip(effectivePage, effectivePageSize);

        return _architectureIdentityRepository.ListAsync(scope, skip, effectivePageSize, cancellationToken);
    }

    public Task<ArchitectureIdentityWithChildren?> GetAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return _architectureIdentityRepository.GetWithChildrenAsync(scope, architectureId, cancellationToken);
    }

    public async Task<ArchitectureIdentityRecord?> RenameAsync(
        ScopeContext scope,
        Guid architectureId,
        ArchitectureIdentityPatchRequest patch,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(patch);

        if (patch.DisplayName is null && patch.Description is null)
            throw new ArgumentException("At least one of DisplayName or Description is required.", nameof(patch));

        ArchitectureIdentityRecord? existing = await _architectureIdentityRepository
            .GetByIdAsync(scope, architectureId, cancellationToken)
            .ConfigureAwait(false);

        if (existing is null)
            return null;

        string displayName = patch.DisplayName is null
            ? existing.DisplayName
            : ArchitectureIdentityDisplayNameRules.NormalizeRequired(patch.DisplayName);

        string? description = patch.Description is null
            ? existing.Description
            : ArchitectureIdentityDisplayNameRules.NormalizeOptionalDescription(patch.Description);

        return await _architectureIdentityRepository.UpdateDisplayNameAsync(
            scope,
            architectureId,
            displayName,
            description,
            cancellationToken).ConfigureAwait(false);
    }
}
