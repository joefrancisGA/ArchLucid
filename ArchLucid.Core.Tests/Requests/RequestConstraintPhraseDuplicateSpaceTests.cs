using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Requests;
using FluentAssertions;
using Xunit;

namespace ArchLucid.Core.Tests.Requests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RequestConstraintPhraseDuplicateSpaceTests
{
    [Fact]
    public void HasManagedIdentityConstraint_returns_true_when_duplicate_ascii_spaces_separate_words()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Use managed  identity for Key Vault"]);

        RequestConstraintClassifier.HasManagedIdentityConstraint(request).Should().BeTrue();
    }

    [Fact]
    public void HasPrivateNetworkingConstraint_returns_true_when_duplicate_ascii_spaces_separate_private_endpoint_phrase()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Traffic via private  endpoint only"]);

        RequestConstraintClassifier.HasPrivateNetworkingConstraint(request).Should().BeTrue();
    }

    private static ArchitectureRequest CreateRequest(List<string>? constraints = null)
    {
        return new ArchitectureRequest
        {
            Description = "architecture request for tests",
            SystemName = "TestSystem",
            Environment = "dev",
            Constraints = constraints ?? [],
            RequiredCapabilities = [],
        };
    }
}
