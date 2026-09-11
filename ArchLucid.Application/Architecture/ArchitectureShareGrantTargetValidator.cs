using ArchLucid.Core.Identity;
using ArchLucid.Core.Scim;
using ArchLucid.Core.Scim.Models;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Architecture;

public interface IArchitectureShareGrantTargetValidator
{
    Task<ArchitectureShareGrantTargetValidationResult> ValidateUserTargetAsync(
        ScopeContext scope,
        Guid userId,
        CancellationToken cancellationToken = default);
}

/// <summary>AS-096: architecture shares target platform users only — not SCIM groups.</summary>
public sealed class ArchitectureShareGrantTargetValidator(
    IPlatformUserRepository platformUserRepository,
    IScimGroupRepository scimGroupRepository) : IArchitectureShareGrantTargetValidator
{
    private readonly IPlatformUserRepository _platformUserRepository =
        platformUserRepository ?? throw new ArgumentNullException(nameof(platformUserRepository));

    private readonly IScimGroupRepository _scimGroupRepository =
        scimGroupRepository ?? throw new ArgumentNullException(nameof(scimGroupRepository));

    public async Task<ArchitectureShareGrantTargetValidationResult> ValidateUserTargetAsync(
        ScopeContext scope,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (userId == Guid.Empty)
            return ArchitectureShareGrantTargetValidationResult.UserNotFound();

        ScimGroupRecord? scimGroup = await _scimGroupRepository.GetByIdAsync(
            scope.TenantId,
            userId,
            cancellationToken);

        if (scimGroup is not null)
            return ArchitectureShareGrantTargetValidationResult.ScimGroupNotSupported();

        PlatformUserRecord? platformUser = await _platformUserRepository.GetByIdAsync(userId, cancellationToken);

        if (platformUser is null)
            return ArchitectureShareGrantTargetValidationResult.UserNotFound();

        return ArchitectureShareGrantTargetValidationResult.Valid();
    }
}

public enum ArchitectureShareGrantTargetValidationStatus
{
    Valid,
    ScimGroupNotSupported,
    UserNotFound,
}

public sealed class ArchitectureShareGrantTargetValidationResult
{
    public ArchitectureShareGrantTargetValidationStatus Status
    {
        get;
        init;
    }

    public static ArchitectureShareGrantTargetValidationResult Valid() =>
        new() { Status = ArchitectureShareGrantTargetValidationStatus.Valid };

    public static ArchitectureShareGrantTargetValidationResult ScimGroupNotSupported() =>
        new() { Status = ArchitectureShareGrantTargetValidationStatus.ScimGroupNotSupported };

    public static ArchitectureShareGrantTargetValidationResult UserNotFound() =>
        new() { Status = ArchitectureShareGrantTargetValidationStatus.UserNotFound };
}
