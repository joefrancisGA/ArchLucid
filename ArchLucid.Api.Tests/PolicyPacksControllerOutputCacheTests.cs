using System.Reflection;

using ArchLucid.Api.Controllers.Governance;

using FluentAssertions;

using Microsoft.AspNetCore.OutputCaching;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
public sealed class PolicyPacksControllerOutputCacheTests
{
    [Fact]
    public void Effective_policy_pack_endpoints_must_not_use_the_anonymous_immutable_cache_policy()
    {
        GetOutputCachePolicyName(nameof(PolicyPacksController.GetEffective))
            .Should()
            .NotBe("ImmutableShort");

        GetOutputCachePolicyName(nameof(PolicyPacksController.GetEffectiveContent))
            .Should()
            .NotBe("ImmutableShort");
    }

    private static string? GetOutputCachePolicyName(string methodName) =>
        typeof(PolicyPacksController)
            .GetMethod(methodName, BindingFlags.Public | BindingFlags.Instance)!
            .GetCustomAttribute<OutputCacheAttribute>()?
            .PolicyName;
}
