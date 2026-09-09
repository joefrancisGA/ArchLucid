using ArchLucid.Application.Findings.ProseAssumption;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class ProseAssumptionDocumentLineScannerTests
{
    [Fact]
    public void Scan_maps_must_not_be_public_to_public_network_access()
    {
        List<ContextDocumentRequest> documents =
        [
            new()
            {
                Name = "architecture.md",
                Content = "The payment datastore must not be public.\n",
            },
        ];

        IReadOnlyList<ProseAssumptionCandidate> candidates = ProseAssumptionDocumentLineScanner.Scan(documents, maxCandidates: 8);

        ProseAssumptionCandidate candidate = candidates.Should().ContainSingle().Subject;
        candidate.LogicalPropertyName.Should().Be(DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess);
        candidate.ImpliedPropertyValue.Should().Be("Disabled");
        candidate.EvidenceRef.Should().Be("doc:architecture.md#L1");
    }

    [Fact]
    public void Scan_returns_empty_for_unmapped_prose()
    {
        List<ContextDocumentRequest> documents =
        [
            new()
            {
                Name = "architecture.md",
                Content = "The payment provider owns PCI scope.\n",
            },
        ];

        ProseAssumptionDocumentLineScanner.Scan(documents, maxCandidates: 8).Should().BeEmpty();
    }
}
