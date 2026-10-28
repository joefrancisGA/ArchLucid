using ArchLucid.AgentRuntime.Explanation;
using ArchLucid.Core.Explanation;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests.Explanation;

[Trait("Category", "Unit")]
public sealed class RunExplanationCitationBuilderTests
{
    [Fact]
    public void Build_finding_citation_without_title_uses_not_stored_copy()
    {
        Guid runId = Guid.Parse("11111111-2222-3333-4444-555555555555");
        RunDetailDto detail = new()
        {
            GoldenManifest = new ManifestDocument
            {
                ManifestId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
                RunId = runId,
                DecisionTraceId = Guid.Parse("bbbbbbbb-cccc-dddd-eeee-ffffffffffff"),
                ContextSnapshotId = Guid.Parse("cccccccc-dddd-eeee-ffff-000000000000"),
                GraphSnapshotId = Guid.Parse("dddddddd-eeee-ffff-0000-111111111111"),
            },
            FindingsSnapshot = new FindingsSnapshot
            {
                Findings =
                [
                    new Finding
                    {
                        FindingId = "find-1",
                        Title = "   ",
                    },
                ],
            },
        };

        IReadOnlyList<CitationReference> citations = RunExplanationCitationBuilder.Build(detail);

        citations.Should().Contain(c =>
            c.Kind == CitationKind.Finding
            && c.Label.Contains(RunExplanationCitationBuilder.FindingTitleNotStoredCopy, StringComparison.Ordinal)
            && c.Label.Contains("find-1", StringComparison.Ordinal));
    }
}
