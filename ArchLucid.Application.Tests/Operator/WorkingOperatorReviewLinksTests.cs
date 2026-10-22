using ArchLucid.Application.Operator;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Operator;

[Trait("Category", "Unit")]
[Trait("Prompt", "AO-10")]
public sealed class WorkingOperatorReviewLinksTests
{
    private static readonly Guid ArchitectureId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private const string RunId = "11111111222233334444555566666666";

    [Fact]
    public void BuildReviewWorkspaceRelativePath_uses_nested_path_when_architecture_id_is_known()
    {
        WorkingOperatorReviewLinks.BuildReviewWorkspaceRelativePath(RunId, ArchitectureId)
            .Should()
            .Be($"/architecture/architectures/{ArchitectureId:D}/reviews/{RunId}");
    }

    [Fact]
    public void BuildReviewWorkspaceRelativePath_uses_peer_path_when_architecture_id_is_missing()
    {
        WorkingOperatorReviewLinks.BuildReviewWorkspaceRelativePath(RunId, null)
            .Should()
            .Be($"/architecture/reviews/{RunId}");
    }

    [Fact]
    public void BuildReviewWorkspaceUrl_prefixes_operator_base_when_configured()
    {
        WorkingOperatorReviewLinks.BuildReviewWorkspaceUrl("https://app.example.com", RunId, ArchitectureId)
            .Should()
            .Be($"https://app.example.com/architecture/architectures/{ArchitectureId:D}/reviews/{RunId}");
    }
}
