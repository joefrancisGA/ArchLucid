using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Requests;
using FluentAssertions;
using Xunit;

namespace ArchLucid.Core.Tests.Requests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RequestConstraintCompoundIdentifierApostropheTests
{
    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_apostrophe_delimited_product_name_embedding_encryption_token()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["field'encryption'module integration only"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_returns_true_when_possessive_precedes_plain_encryption_wording()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Tenant's encryption keys must use CMK"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeTrue();
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
