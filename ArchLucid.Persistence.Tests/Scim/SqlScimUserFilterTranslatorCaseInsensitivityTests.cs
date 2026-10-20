using ArchLucid.Core.Scim.Filtering;

using ArchLucid.Persistence.Scim;

using Dapper;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Scim;

[Trait("Suite", "Core")]
public sealed class SqlScimUserFilterTranslatorCaseInsensitivityTests
{
    [Theory]
    [InlineData("externalId", "u.ExternalId")]
    [InlineData("userName", "u.UserName")]
    [InlineData("displayName", "u.DisplayName")]
    public void BuildWhere_string_eq_uses_lower_for_case_insensitive_match(string attribute, string columnSql)
    {
        DynamicParameters parameters = new();
        int next = 0;

        string sql = SqlScimUserFilterTranslator.BuildWhere(
            new ScimComparisonNode(attribute, "eq", "Mixed-Case"),
            parameters,
            ref next);

        sql.Should().Contain($"LOWER({columnSql})");
        sql.Should().Contain("LOWER(@");
    }
}
