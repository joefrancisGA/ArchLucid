using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Requests;
using FluentAssertions;
using Xunit;

namespace ArchLucid.Core.Tests.Requests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RequestConstraintPhraseUnicodeWhitespaceTests
{
    [Fact]
    public void HasManagedIdentityConstraint_returns_true_when_nonbreaking_space_separates_words()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Use managed\u00A0identity for Key Vault"]);

        RequestConstraintClassifier.HasManagedIdentityConstraint(request).Should().BeTrue();
    }

    [Fact]
    public void HasPrivateNetworkingConstraint_returns_true_when_figure_space_separates_private_endpoint_phrase()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Traffic via private\u2007endpoint only"]);

        RequestConstraintClassifier.HasPrivateNetworkingConstraint(request).Should().BeTrue();
    }

    [Fact]
    public void RequiresAiCapability_returns_true_when_nonbreaking_space_follows_openai_phrase()
    {
        ArchitectureRequest request = CreateRequest(capabilities: ["Require openai\u00A0cognitive services"]);

        RequestConstraintClassifier.RequiresAiCapability(request).Should().BeTrue();
    }

    private static ArchitectureRequest CreateRequest(
        List<string>? constraints = null,
        List<string>? capabilities = null)
    {
        return new ArchitectureRequest
        {
            Description = "architecture request for tests",
            SystemName = "TestSystem",
            Environment = "dev",
            Constraints = constraints ?? [],
            RequiredCapabilities = capabilities ?? [],
        };
    }
}
