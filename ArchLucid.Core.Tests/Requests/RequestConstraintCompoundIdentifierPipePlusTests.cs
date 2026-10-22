using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Requests;
using FluentAssertions;
using Xunit;

namespace ArchLucid.Core.Tests.Requests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RequestConstraintCompoundIdentifierPipePlusTests
{
    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_pipe_delimited_product_name_embedding_encryption_token()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["field|encryption|module integration only"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
    }

    [Fact]
    public void RequiresAiCapability_does_not_false_positive_on_pipe_delimited_product_name_embedding_openai_token()
    {
        ArchitectureRequest request = CreateRequest(capabilities: ["email|openai|gateway integration only"]);

        RequestConstraintClassifier.RequiresAiCapability(request).Should().BeFalse();
    }

    [Fact]
    public void RequiresSearchCapability_does_not_false_positive_on_pipe_delimited_product_name_embedding_search_token()
    {
        ArchitectureRequest request = CreateRequest(capabilities: ["com|search|api integration only"]);

        RequestConstraintClassifier.RequiresSearchCapability(request).Should().BeFalse();
    }

    [Fact]
    public void RequiresSqlCapability_does_not_false_positive_on_pipe_delimited_product_name_embedding_sql_token()
    {
        ArchitectureRequest request = CreateRequest(capabilities: ["my|sql|server integration only"]);

        RequestConstraintClassifier.RequiresSqlCapability(request).Should().BeFalse();
    }

    [Fact]
    public void HasEncryptionConstraint_does_not_false_positive_on_plus_delimited_product_name_embedding_encryption_token()
    {
        ArchitectureRequest request = CreateRequest(constraints: ["field+encryption+module integration only"]);

        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeFalse();
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
