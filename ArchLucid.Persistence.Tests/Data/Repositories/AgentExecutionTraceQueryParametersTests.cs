using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Data.Repositories;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentExecutionTraceQueryParametersTests
{
    private static readonly Guid SqlRunId = Guid.Parse("11111111-2222-3333-4444-555555555555");
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000001");
    private static readonly Guid WorkspaceId = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000002");
    private static readonly Guid ProjectId = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000003");

    private static string ContractRunId => SqlRunId.ToString("N");

    [Fact]
    public void ForRun_carries_the_scope_triple_alongside_the_run_key()
    {
        object parameters = AgentExecutionTraceQueryParameters.ForRun(Scope(), ContractRunId);

        Read<Guid>(parameters, "RunId").Should().Be(SqlRunId);
        Read<Guid>(parameters, "TenantId").Should().Be(TenantId);
        Read<Guid>(parameters, "WorkspaceId").Should().Be(WorkspaceId);
        Read<Guid>(parameters, "ScopeProjectId").Should().Be(ProjectId);
    }

    [Theory]
    [InlineData(-5, 0)]
    [InlineData(0, 0)]
    [InlineData(40, 40)]
    public void ForRunPage_clamps_a_negative_offset_to_the_first_page(int offset, int expected) =>
        Read<int>(AgentExecutionTraceQueryParameters.ForRunPage(Scope(), ContractRunId, offset, 25), "Offset")
            .Should()
            .Be(expected);

    [Theory]
    [InlineData(0, 1)]
    [InlineData(-1, 1)]
    [InlineData(25, 25)]
    [InlineData(500, 500)]
    [InlineData(5_000, 500)]
    public void ForRunPage_clamps_the_page_size_into_the_supported_range(int limit, int expected) =>
        Read<int>(AgentExecutionTraceQueryParameters.ForRunPage(Scope(), ContractRunId, 0, limit), "Limit")
            .Should()
            .Be(expected);

    /// <summary>
    ///     Guid[] rather than a string list is what lets Dapper expand the IN list — see the remarks on the method.
    /// </summary>
    [Fact]
    public void ForRuns_passes_run_keys_as_a_guid_array()
    {
        object parameters = AgentExecutionTraceQueryParameters.ForRuns(Scope(), [ContractRunId]);

        Read<Guid[]>(parameters, "RunIds").Should().Equal(SqlRunId);
    }

    [Fact]
    public void ForRunsWithLlmFallbackPrefix_matches_the_shared_completion_deployment_prefix() =>
        Read<string>(
                AgentExecutionTraceQueryParameters.ForRunsWithLlmFallbackPrefix(Scope(), [ContractRunId]),
                "PrefixPattern")
            .Should()
            .Be(AgentExecutionTraceModelMetadata.LlmCompletionFallbackDeploymentPrefix + "%");

    [Fact]
    public void NormalizeRunIds_trims_drops_blanks_and_de_duplicates_case_insensitively() =>
        AgentExecutionTraceQueryParameters.NormalizeRunIds([" r-1 ", "R-1", "", "   ", "r-2"])
            .Should()
            .Equal("r-1", "r-2");

    [Fact]
    public void NormalizeRunIds_returns_an_empty_list_when_every_id_is_blank() =>
        AgentExecutionTraceQueryParameters.NormalizeRunIds(["", " "]).Should().BeEmpty();

    private static ScopeContext Scope() =>
        new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
        };

    /// <summary>
    ///     Parameter objects are anonymous types shaped for Dapper, so tests read them by name via reflection rather than
    ///     forcing a named DTO the production path does not need.
    /// </summary>
    private static T Read<T>(object parameters, string propertyName)
    {
        object? value = parameters.GetType().GetProperty(propertyName)?.GetValue(parameters);

        value.Should().NotBeNull($"parameter '{propertyName}' must be supplied to Dapper");

        return (T)value!;
    }
}
