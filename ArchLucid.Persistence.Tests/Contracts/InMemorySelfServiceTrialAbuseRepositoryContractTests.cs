using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Identity;

namespace ArchLucid.Persistence.Tests.Contracts;

/// <summary>
///     Runs <see cref="SelfServiceTrialAbuseRepositoryContractTests" /> against
///     <see cref="InMemorySelfServiceTrialAbuseRepository" />.
/// </summary>
[Trait("Category", "Unit")]
public sealed class InMemorySelfServiceTrialAbuseRepositoryContractTests : SelfServiceTrialAbuseRepositoryContractTests
{
    protected override ISelfServiceTrialAbuseRepository CreateRepository() =>
        new InMemorySelfServiceTrialAbuseRepository();
}
