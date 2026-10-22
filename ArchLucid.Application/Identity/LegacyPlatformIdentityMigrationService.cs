using ArchLucid.Core.Authorization;
using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity;

public interface ILegacyPlatformIdentityMigrationService
{
    Task<IdentityMigrationReport> MigrateAsync(CancellationToken cancellationToken);
}

public sealed partial class LegacyPlatformIdentityMigrationService(
    ILegacyPlatformIdentityMigrationSource legacySource,
    IPlatformIdentityService platformIdentity,
    IWorkspaceMembershipRepository memberships,
    IIdentityMigrationReviewRepository reviewItems,
    TimeProvider timeProvider) : ILegacyPlatformIdentityMigrationService
{
    private const string ScimLegacySourceType = "ScimUser";

    private const string TrialLegacySourceType = "IdentityUser";

    private readonly ILegacyPlatformIdentityMigrationSource _legacySource =
        legacySource ?? throw new ArgumentNullException(nameof(legacySource));

    private readonly IPlatformIdentityService _platformIdentity =
        platformIdentity ?? throw new ArgumentNullException(nameof(platformIdentity));

    private readonly IWorkspaceMembershipRepository _memberships =
        memberships ?? throw new ArgumentNullException(nameof(memberships));

    private readonly IIdentityMigrationReviewRepository _reviewItems =
        reviewItems ?? throw new ArgumentNullException(nameof(reviewItems));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));
}
