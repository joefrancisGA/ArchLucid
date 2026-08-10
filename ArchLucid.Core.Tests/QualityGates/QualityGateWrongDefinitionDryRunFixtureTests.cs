using ArchLucid.Core.Configuration;
using ArchLucid.Core.QualityGates;

using FluentAssertions;

namespace ArchLucid.Core.Tests.QualityGates;

/// <summary>TB-974 dry-run fixture: original recorded snapshot stays immutable when supersede is appended.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class QualityGateWrongDefinitionDryRunFixtureTests
{
    [Fact]
    public void DryRun_append_only_supersede_preserves_original_recorded_snapshot()
    {
        QualityGateDefinitionSnapshot originalDefinition = new()
        {
            DefinitionVersion = "2026.07.01-pilot",
            ContentHashSha256 = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            Mode = AgentOutputQualityGateMode.PilotStrict,
            EffectiveFromUtc = new DateTimeOffset(2026, 7, 1, 0, 0, 0, TimeSpan.Zero),
        };

        TraceRecordedSnapshot trace = new(
            TraceId: Guid.Parse("11111111-1111-1111-1111-111111111111"),
            RecordedOutcome: "Accepted",
            Definition: originalDefinition);

        QualityGateDefinitionSnapshot successorDefinition = new()
        {
            DefinitionVersion = "2026.08.09-hotfix",
            ContentHashSha256 = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            Mode = AgentOutputQualityGateMode.PilotStrict,
            EffectiveFromUtc = new DateTimeOffset(2026, 8, 9, 0, 0, 0, TimeSpan.Zero),
            DeprecatedReason = null,
        };

        QualityGateDefinitionSnapshot deprecatedOriginal = new()
        {
            DefinitionVersion = originalDefinition.DefinitionVersion,
            ContentHashSha256 = originalDefinition.ContentHashSha256,
            Mode = originalDefinition.Mode,
            EffectiveFromUtc = originalDefinition.EffectiveFromUtc,
            DeprecatedReason = "PilotStrict semantic floor too loose — accepted unsafe outputs",
        };

        QualityGateSupersedingEvaluation supersede = new()
        {
            SupersedingEvaluationId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            RunId = "run-dry-run-tb974",
            TraceId = trace.TraceId,
            ActorPrincipalId = "operator@contoso.test",
            MisclassificationClass = QualityGateWrongDefinitionClass.TooLoose,
            Reason = "Dry-run: would reject under corrected floors",
            OriginalDefinition = deprecatedOriginal,
            SuccessorDefinition = successorDefinition,
            OriginalRecordedOutcome = trace.RecordedOutcome,
            SupersedingOutcome = "Rejected",
            RecordedAtUtc = new DateTimeOffset(2026, 8, 9, 12, 0, 0, TimeSpan.Zero),
        };

        trace.Definition.DefinitionVersion.Should().Be("2026.07.01-pilot");
        trace.Definition.ContentHashSha256.Should().Be(originalDefinition.ContentHashSha256);
        trace.RecordedOutcome.Should().Be("Accepted");

        supersede.OriginalRecordedOutcome.Should().Be("Accepted");
        supersede.SupersedingOutcome.Should().Be("Rejected");
        supersede.OriginalDefinition.ContentHashSha256.Should().Be(originalDefinition.ContentHashSha256);
        supersede.SuccessorDefinition.ContentHashSha256.Should().NotBe(originalDefinition.ContentHashSha256);
    }

    private sealed record TraceRecordedSnapshot(Guid TraceId, string RecordedOutcome, QualityGateDefinitionSnapshot Definition);
}
