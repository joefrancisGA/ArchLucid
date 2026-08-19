using System.Reflection;

using ArchLucid.Api.Controllers.Authority;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     TB-288: buyer-facing controller actions must not declare <c>ArchLucid.Persistence.*</c> response types.
/// </summary>
[Trait("Suite", "Architecture")]
[Trait("Category", "Unit")]
public sealed class BuyerFacingDtoBoundaryArchitectureTests
{
    [Fact]
    public void Buyer_facing_controller_actions_do_not_declare_ArchLucid_Persistence_return_types()
    {
        Assembly api = typeof(AuthorityQueryController).Assembly;

        List<string> violations =
        [
            .. BuyerFacingControllerRouteScanner.Enumerate(api)
                .SelectMany(BuyerFacingPersistenceReturnTypeInspector.FindViolations),
        ];

        violations.Should().BeEmpty(
            "TB-288: buyer routes must map to buyer/proof DTOs — not persistence read models: "
            + string.Join("; ", violations));
    }
}
