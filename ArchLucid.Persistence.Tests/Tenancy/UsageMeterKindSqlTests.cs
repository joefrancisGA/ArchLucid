using ArchLucid.Core.Metering;
using ArchLucid.Persistence.Tenancy;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Category", "Unit")]
public sealed class UsageMeterKindSqlTests
{
    [Theory]
    [InlineData(UsageMeterKind.LlmPromptTokens, "LlmPromptTokens")]
    [InlineData(UsageMeterKind.LlmCompletionTokens, "LlmCompletionTokens")]
    [InlineData(UsageMeterKind.ApiRequest, "ApiRequest")]
    [InlineData(UsageMeterKind.ArchitectureRun, "ArchitectureRun")]
    [InlineData(UsageMeterKind.ArtifactStorageBytes, "ArtifactStorageBytes")]
    [InlineData(UsageMeterKind.AgentExecution, "AgentExecution")]
    public void ToKindString_round_trips_known_values(UsageMeterKind kind, string expected)
    {
        UsageMeterKindSql.ToKindString(kind).Should().Be(expected);
        UsageMeterKindSql.ParseKind(expected).Should().Be(kind);
    }

    [Fact]
    public void ToKindString_throws_for_invalid_enum_value()
    {
        Action act = () => UsageMeterKindSql.ToKindString((UsageMeterKind)999);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void ParseKind_throws_for_unknown_string()
    {
        Action act = () => UsageMeterKindSql.ParseKind("UnknownKind");

        act.Should().Throw<FormatException>();
    }
}
