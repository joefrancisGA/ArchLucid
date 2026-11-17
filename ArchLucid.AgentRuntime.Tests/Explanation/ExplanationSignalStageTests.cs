using ArchLucid.AgentRuntime.Explanation;
using ArchLucid.AgentRuntime.Explanation.Stages;
using ArchLucid.Core.Comparison;
using ArchLucid.Core.Explanation;
using ArchLucid.Core.Manifest.Sections;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.AgentRuntime.Tests.Explanation;

[Trait("Category", "Unit")]
public sealed class ExplanationSignalStageTests
{
    [SkippableFact]
    public void ExtractRunSignals_uses_not_stored_manifest_summary_copy()
    {
        ExplanationSignalStage stage = new(
            new DeterministicExplanationService(NullLogger<DeterministicExplanationService>.Instance));
        ManifestDocument manifest = new()
        {
            RunId = Guid.NewGuid(),
            Metadata = new ManifestMetadata { Summary = null! }
        };

        RunExplanationSignals signals = stage.ExtractRunSignals(manifest, null);

        signals.UserPrompt.Should().Contain("Manifest summary was not stored.");
        signals.UserPrompt.Should().NotContain("(none)");
    }

    [SkippableFact]
    public void ExtractComparisonSignals_includes_security_not_stored_lines_in_prompt()
    {
        ExplanationSignalStage stage = new(
            new DeterministicExplanationService(NullLogger<DeterministicExplanationService>.Instance));
        ComparisonResult comparison = new()
        {
            SecurityChanges =
            [
                new SecurityDelta { ControlName = "TLS", BaseStatus = null, TargetStatus = "Enabled" }
            ]
        };

        ComparisonExplanationSignals signals = stage.ExtractComparisonSignals(comparison);

        signals.UserPrompt.Should().Contain("Base run control status was not stored.");
    }
}
