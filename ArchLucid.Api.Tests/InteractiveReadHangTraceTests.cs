using ArchLucid.Api.Diagnostics;
using ArchLucid.Core.Diagnostics;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InteractiveReadHangTraceTests
{
    [Fact]
    public void Classify_learning_plans_list_is_traced()
    {
        InteractiveReadHangTrace.Classify("GET", "/v1/learning/plans")
            .Should()
            .Be(InteractiveReadHangKind.LearningPlansList);

        InteractiveReadHangTrace.Classify("GET", "/v1/learning/plans/")
            .Should()
            .Be(InteractiveReadHangKind.LearningPlansList);
    }

    [Fact]
    public void Classify_architecture_draft_get_is_traced()
    {
        InteractiveReadHangTrace.Classify(
                "GET",
                "/v1/architecture/draft/cf9ddef7-3a8b-4e10-aebb-79302e7c691c")
            .Should()
            .Be(InteractiveReadHangKind.ArchitectureDraftGet);
    }

    [Theory]
    [InlineData("/v1.0/learning/plans/", InteractiveReadHangKind.LearningPlansList)]
    [InlineData("/V1.0/architecture/draft/cf9ddef7-3a8b-4e10-aebb-79302e7c691c", InteractiveReadHangKind.ArchitectureDraftGet)]
    [InlineData("/v1.0/architecture/draft/cf9ddef7-3a8b-4e10-aebb-79302e7c691c/questions", InteractiveReadHangKind.None)]
    [InlineData("/v1.1/learning/plans", InteractiveReadHangKind.None)]
    [InlineData("/v10/learning/plans", InteractiveReadHangKind.None)]
    public void Classify_matches_v1_zero_alias_without_widening_the_routes(string path, InteractiveReadHangKind expected)
    {
        InteractiveReadHangTrace.Classify("GET", path).Should().Be(expected);
    }

    [Fact]
    public void Classify_ignores_nested_draft_routes_and_non_gets()
    {
        InteractiveReadHangTrace.Classify(
                "GET",
                "/v1/architecture/draft/cf9ddef7-3a8b-4e10-aebb-79302e7c691c/questions")
            .Should()
            .Be(InteractiveReadHangKind.None);

        InteractiveReadHangTrace.Classify("POST", "/v1/architecture/draft")
            .Should()
            .Be(InteractiveReadHangKind.None);

        InteractiveReadHangTrace.Classify("GET", "/v1/learning/plans/00000000-0000-0000-0000-000000000001")
            .Should()
            .Be(InteractiveReadHangKind.None);
    }

    [Fact]
    public void ResolveComponent_maps_kind_to_stderr_component()
    {
        InteractiveReadHangTrace.ResolveComponent(InteractiveReadHangKind.LearningPlansList)
            .Should()
            .Be(LearningPlansHangDiagnostics.Component);

        InteractiveReadHangTrace.ResolveComponent(InteractiveReadHangKind.ArchitectureDraftGet)
            .Should()
            .Be(DraftGetHangDiagnostics.Component);
    }

    [Fact]
    public void ResolveComponent_none_throws()
    {
        Action act = () => InteractiveReadHangTrace.ResolveComponent(InteractiveReadHangKind.None);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }
}
