using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Manifest;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class ArchitectureSealDeltaComparerTests
{
    [Fact]
    public void Compare_does_not_emit_trail_removals_when_draft_trail_was_never_populated()
    {
        ManifestDocument sealedManifest = new()
        {
            FeasibilityVerdict = new FeasibilityVerdict
            {
                TransparencyTrail = new TransparencyTrail
                {
                    Asserted = [new AssertedTrailEntry { Key = "cloudTarget", Value = "Azure" }],
                },
            },
        };

        DraftRequestDocument draftDocument = new()
        {
            TransparencyTrail = new TransparencyTrail(),
        };

        ArchitectureRequest projectedDraft = new() { Assumptions = [] };

        List<ArchitectureSealDeltaItem> diffs = ArchitectureSealDeltaComparer.Compare(
            sealedManifest,
            draftDocument,
            projectedDraft);

        diffs.Should().NotContain(item => item.Section == "Asserted" || item.Section == "Inferred");
    }
}
