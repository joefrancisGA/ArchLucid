using System.Reflection;

using ArchLucid.Contracts.Common;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Repositories;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunListQueryParametersTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000001");
    private static readonly Guid WorkspaceId = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000002");
    private static readonly Guid ProjectId = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000003");

    [Fact]
    public void ForProjectList_carries_the_project_slug_and_scope_triple()
    {
        object parameters = RunListQueryParameters.ForProjectList(Scope(), "billing-platform", 10);

        Read<string>(parameters, "ProjectSlug").Should().Be("billing-platform");
        Read<Guid>(parameters, "TenantId").Should().Be(TenantId);
        Read<Guid>(parameters, "WorkspaceId").Should().Be(WorkspaceId);
        Read<Guid>(parameters, "ScopeProjectId").Should().Be(ProjectId);
        Read<int>(parameters, "Take").Should().Be(10);
    }

    [Theory]
    [InlineData(0, 20)]
    [InlineData(-5, 20)]
    [InlineData(1, 1)]
    [InlineData(200, 200)]
    [InlineData(5_000, 200)]
    public void ForProjectList_defaults_and_clamps_the_take(int take, int expected) =>
        Read<int>(RunListQueryParameters.ForProjectList(Scope(), "slug", take), "Take").Should().Be(expected);

    [Theory]
    [InlineData(0, 200)]
    [InlineData(-1, 200)]
    [InlineData(50, 50)]
    [InlineData(1_000, 200)]
    public void ForRecentInScope_defaults_an_unset_take_to_the_full_ceiling(int take, int expected) =>
        Read<int>(RunListQueryParameters.ForRecentInScope(Scope(), take), "Take").Should().Be(expected);

    /// <summary>The extra row is how the caller detects a further page without a second COUNT query.</summary>
    [Fact]
    public void ForRecentInScopeKeysetPage_requests_one_row_beyond_the_page()
    {
        object parameters = RunListQueryParameters.ForRecentInScopeKeysetPage(Scope(), null, null, 25);

        Read<int>(parameters, "Fetch").Should().Be(RunPagination.ClampTake(25) + 1);
    }

    [Fact]
    public void ForRecentInScopeKeysetPage_passes_the_cursor_through()
    {
        DateTime cursorCreatedUtc = new(2026, 8, 11, 12, 0, 0, DateTimeKind.Utc);
        Guid cursorRunId = Guid.Parse("cccccccc-0000-0000-0000-000000000001");

        object parameters = RunListQueryParameters.ForRecentInScopeKeysetPage(
            Scope(),
            cursorCreatedUtc,
            cursorRunId,
            25);

        Read<DateTime>(parameters, "CursorCreatedUtc").Should().Be(cursorCreatedUtc);
        Read<Guid>(parameters, "CursorRunId").Should().Be(cursorRunId);
    }

    [Fact]
    public void ForProjectKeysetPage_requests_one_row_beyond_the_page() =>
        Read<int>(
                RunListQueryParameters.ForProjectKeysetPage(Scope(), "slug", null, null, 25),
                "Fetch")
            .Should()
            .Be(RunPagination.ClampTake(25) + 1);

    [Theory]
    [InlineData(-10, 0)]
    [InlineData(0, 0)]
    [InlineData(75, 75)]
    public void ForRecentInScopeOffsetPage_normalizes_a_negative_offset(int offset, int expected) =>
        Read<int>(RunListQueryParameters.ForRecentInScopeOffsetPage(Scope(), offset, 50), "Offset")
            .Should()
            .Be(expected);

    [Fact]
    public void ForRecentInScopeOffsetPage_requests_one_row_beyond_the_limit() =>
        Read<int>(RunListQueryParameters.ForRecentInScopeOffsetPage(Scope(), 0, 50), "Fetch")
            .Should()
            .Be(RunPagination.ClampLimit(50) + 1);

    /// <summary>
    ///     The stored <c>AsOfUtc</c> column is UTC, so an unspecified-kind timestamp is stamped rather than converted.
    /// </summary>
    [Fact]
    public void ForLatestGraphAtOrBefore_marks_the_as_of_timestamp_as_utc()
    {
        DateTime unspecified = new(2026, 8, 11, 12, 0, 0, DateTimeKind.Unspecified);

        DateTime asOfUtc = Read<DateTime>(
            RunListQueryParameters.ForLatestGraphAtOrBefore(Scope(), "slug", unspecified),
            "AsOfUtc");

        asOfUtc.Kind.Should().Be(DateTimeKind.Utc);
        asOfUtc.Should().Be(DateTime.SpecifyKind(unspecified, DateTimeKind.Utc));
    }

    [Fact]
    public void ForLatestCommittedByManifestCreatedUtc_filters_on_the_committed_status() =>
        Read<string>(
                RunListQueryParameters.ForLatestCommittedByManifestCreatedUtc(Scope(), "slug"),
                "CommittedStatus")
            .Should()
            .Be(nameof(ArchitectureRunStatus.Committed));

    [Fact]
    public void ForActiveRunCountByArchitectureRequest_excludes_the_three_terminal_statuses()
    {
        object parameters = RunListQueryParameters.ForActiveRunCountByArchitectureRequest(Scope(), "  req-1  ");

        Read<string>(parameters, "ArchitectureRequestId").Should().Be("req-1");
        Read<string>(parameters, "CommittedStatus").Should().Be(nameof(ArchitectureRunStatus.Committed));
        Read<string>(parameters, "FailedStatus").Should().Be(nameof(ArchitectureRunStatus.Failed));
        Read<string>(parameters, "QualityRejectedStatus")
            .Should()
            .Be(nameof(ArchitectureRunStatus.ExecutionCompletedQualityRejected));
    }

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
        PropertyInfo? property = parameters.GetType().GetProperty(propertyName);

        property.Should().NotBeNull($"parameter '{propertyName}' must be supplied to Dapper");

        object? value = property!.GetValue(parameters);

        value.Should().NotBeNull($"parameter '{propertyName}' must have a value");

        return (T)value!;
    }
}
