using ArchLucid.Core.Scim.Filtering;

using ArchLucid.Persistence.Scim;

using Dapper;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Scim;

[Trait("Suite", "Core")]
public sealed class SqlScimUserFilterTranslatorCaseInsensitivityTests
{
    [Fact]
    public void BuildWhere_externalId_eq_uses_case_sensitive_collation_without_lower()
    {
        DynamicParameters parameters = new();
        int next = 0;

        string sql = SqlScimUserFilterTranslator.BuildWhere(
            new ScimComparisonNode("externalId", "eq", "Mixed-Case"),
            parameters,
            ref next);

        sql.Should().Contain("u.ExternalId COLLATE Latin1_General_CS_AS");
        sql.Should().NotContain("LOWER(u.ExternalId)");
    }

    [Theory]
    [InlineData("userName", "u.UserName")]
    [InlineData("displayName", "u.DisplayName")]
    public void BuildWhere_case_insensitive_attribute_eq_uses_sargable_compare_without_lower(string attribute, string columnSql)
    {
        DynamicParameters parameters = new();
        int next = 0;

        string sql = SqlScimUserFilterTranslator.BuildWhere(
            new ScimComparisonNode(attribute, "eq", "Mixed-Case"),
            parameters,
            ref next);

        sql.Should().Contain($"{columnSql} = @");
        sql.Should().NotContain($"LOWER({columnSql})");
    }
}
