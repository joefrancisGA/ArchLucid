using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Requests;
using FluentAssertions;
using Xunit;

namespace ArchLucid.Core.Tests.Requests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RequestConstraintCompoundIdentifierEqualsAmpersandTests
{
    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_equals_delimited_product_name_embedding_encryption_token()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["field=encryption=module integration only"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void RequiresSqlCapability_does_not_false_positive_on_ampersand_delimited_product_name_embedding_sql_token()
    {
        ArchitectureRequest request = CreateRequest(capabilities: ["my&sql&server integration only"]);

        RequestConstraintClassifier.RequiresSqlCapability(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_returns_true_when_constraint_mentions_encryption_in_plain_language()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["Require encryption at rest and TLS 1.2"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeTrue();
    }

    [Fact]
    public void RequiresSearchCapability_returns_true_when_capabilities_list_uses_spaced_ampersand()
    {
        ArchitectureRequest request = CreateRequest(capabilities: ["Needs search & sql integrations"]);

        RequestConstraintClassifier.RequiresSearchCapability(request).Should().BeTrue();
        RequestConstraintClassifier.RequiresSqlCapability(request).Should().BeTrue();
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
