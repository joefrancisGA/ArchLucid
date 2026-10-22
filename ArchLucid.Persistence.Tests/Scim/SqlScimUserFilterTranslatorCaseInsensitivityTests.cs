using ArchLucid.Core.Scim.Filtering;

using ArchLucid.Persistence.Scim;

using Dapper;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Scim;

[Trait("Suite", "Core")]
public sealed class SqlScimUserFilterTranslatorCaseInsensitivityTests
{
    [Fact]
    public void BuildWhere_externalId_eq_uses_seek_then_filter_for_case_exact()
    {
        DynamicParameters parameters = new();
        int next = 0;

        string sql = SqlScimUserFilterTranslator.BuildWhere(
            new ScimComparisonNode("externalId", "eq", "Mixed-Case"),
            parameters,
            ref next);

        sql.Should().Contain("u.ExternalId = @f1");
        sql.Should().Contain("u.ExternalId COLLATE Latin1_General_CS_AS = @f1 COLLATE Latin1_General_CS_AS");
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
        sql.Should().NotContain("COLLATE Latin1_General_CS_AS");
    }

    [Fact]
    public void BuildWhere_active_eq_numeric_one_targets_active_bit_one()
    {
        DynamicParameters parameters = new();
        int next = 0;

        string sql = SqlScimUserFilterTranslator.BuildWhere(
            new ScimComparisonNode("active", "eq", "1"),
            parameters,
            ref next);

        sql.Should().Contain("u.Active = @f1");
        parameters.Get<int>("f1").Should().Be(1);
    }
}
