using ArchLucid.AgentRuntime.Explanation;
using ArchLucid.Core.Explanation;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.AgentRuntime.Tests.Explanation;

[Trait("Category", "Unit")]
public sealed class DeterministicExplanationServiceImplicationsTests
{
    [SkippableFact]
    public void ExtractRunKeyDrivers_labels_missing_selected_option()
    {
        DeterministicExplanationService sut = new(NullLogger<DeterministicExplanationService>.Instance);
        ManifestDocument manifest = new()
        {
            RunId = Guid.NewGuid(),
            Decisions =
            [
                new ResolvedArchitectureDecision
                {
                    Category = "Storage",
                    Title = "Blob tier",
                    SelectedOption = null!
                }
            ]
        };

        List<string> drivers = sut.ExtractRunKeyDrivers(manifest, null);

        drivers.Should().ContainSingle().Which.Should().Contain("Selected option was not stored.");
    }

    [SkippableFact]
    public void ExtractRiskImplications_labels_missing_severity_and_empty_manifest_list()
    {
        DeterministicExplanationService sut = new(NullLogger<DeterministicExplanationService>.Instance);
        ManifestDocument manifest = new()
        {
            RunId = Guid.NewGuid(),
            UnresolvedIssues = new UnresolvedIssuesSection
            {
                Items =
                [
                    new ManifestIssue
                    {
                        Severity = "",
                        Title = "Gap",
                        Description = "Details"
                    }
                ]
            }
        };

        List<string> risks = sut.ExtractRiskImplications(manifest);

        risks.Should().ContainSingle().Which.Should().Contain("Severity was not stored");

        ManifestDocument empty = new() { RunId = Guid.NewGuid(), UnresolvedIssues = new UnresolvedIssuesSection() };

        sut.ExtractRiskImplications(empty).Should().ContainSingle()
            .Which.Should().Be("No unresolved issues were listed on the manifest.");
    }

    [SkippableFact]
    public void ExtractCostImplications_labels_missing_max_monthly_cost()
    {
        DeterministicExplanationService sut = new(NullLogger<DeterministicExplanationService>.Instance);
        ManifestDocument manifest = new() { RunId = Guid.NewGuid() };

        List<string> costs = sut.ExtractCostImplications(manifest);

        costs.Should().ContainSingle().Which.Should().Be("Max monthly cost was not stored on the manifest.");
    }

    [SkippableFact]
    public void FormatProvenanceSummary_states_when_graph_missing()
    {
        DeterministicExplanationService sut = new(NullLogger<DeterministicExplanationService>.Instance);

        sut.FormatProvenanceSummary(null).Should().Be("Provenance graph was not supplied for this run.");
    }
}
