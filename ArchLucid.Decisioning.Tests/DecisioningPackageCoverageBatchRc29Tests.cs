using ArchLucid.Decisioning.Compliance.Loaders;
using ArchLucid.Decisioning.Compliance.Models;
using ArchLucid.Decisioning.Configuration;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.DecisionTraces;
using ArchLucid.Decisioning.Merge;
using ArchLucid.Decisioning.Validation;

using FluentAssertions;

using Moq;

namespace ArchLucid.Decisioning.Tests;

/// <summary>RC29 package-coverage batch: finding review initializer, compliance validator, merge trace recorder, passthrough schema.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DecisioningPackageCoverageBatchRc29Tests
{
    [Fact]
    public void FindingHumanReviewInitializer_sets_pending_for_critical_non_deterministic_findings()
    {
        Finding finding = new()
        {
            FindingType = "custom",
            Severity = FindingSeverity.Critical,
            HumanReviewStatus = FindingHumanReviewStatus.NotRequired,
            Trace = new ExplainabilityTrace { AlternativePathsConsidered = ["peer disagreement"] }
        };

        HumanReviewFindingOptions options = new()
        {
            RequireForCriticalOrErrorWhenNotDeterministic = true,
            RequiredFindingTypes = []
        };

        FindingHumanReviewInitializer.Apply([finding], options);

        finding.HumanReviewStatus.Should().Be(FindingHumanReviewStatus.Pending);
    }

    [Fact]
    public void FindingHumanReviewInitializer_skips_deterministic_rule_based_findings()
    {
        Finding finding = new()
        {
            FindingType = "custom",
            Severity = FindingSeverity.Critical,
            HumanReviewStatus = FindingHumanReviewStatus.NotRequired,
            Trace = new ExplainabilityTrace
            {
                AlternativePathsConsidered = [ExplainabilityTraceMarkers.RuleBasedDeterministicSinglePathNote]
            }
        };

        HumanReviewFindingOptions options = new()
        {
            RequireForCriticalOrErrorWhenNotDeterministic = true,
            RequiredFindingTypes = []
        };

        FindingHumanReviewInitializer.Apply([finding], options);

        finding.HumanReviewStatus.Should().Be(FindingHumanReviewStatus.NotRequired);
    }

    [Fact]
    public void ComplianceRulePackValidator_rejects_duplicate_rule_ids()
    {
        ComplianceRulePack pack = new()
        {
            RulePackId = "pack-1",
            Version = "1.0",
            Rules =
            [
                new ComplianceRule { RuleId = "dup" },
                new ComplianceRule { RuleId = "dup" }
            ]
        };

        ComplianceRulePackValidator validator = new();

        FluentActions
            .Invoking(() => validator.Validate(pack))
            .Should()
            .Throw<InvalidOperationException>()
            .WithMessage("*Duplicate compliance rule IDs*");
    }

    [Fact]
    public void FindingPayloadValidatorExtensions_TryValidate_maps_validator_exceptions()
    {
        Mock<IFindingPayloadValidator> validator = new();
        Finding finding = new() { FindingType = "x" };

        validator.Setup(v => v.Validate(finding)).Throws(new InvalidOperationException("payload bad"));

        bool ok = FindingPayloadValidatorExtensions.TryValidate(validator.Object, finding, out string error);

        ok.Should().BeFalse();
        error.Should().Be("payload bad");
    }

    [Fact]
    public void DecisionMergeTraceRecorder_AddTrace_appends_run_event_trace()
    {
        DecisionMergeResult output = new();
        Dictionary<string, string> metadata = new() { ["k"] = "v" };

        DecisionMergeTraceRecorder.AddTrace(output, "run-1", "merge.event", "desc", metadata);

        output.DecisionTraces.Should().ContainSingle();
        RunEventTracePayload payload = output.DecisionTraces[0].RequireRunEvent();
        payload.RunId.Should().Be("run-1");
        payload.EventType.Should().Be("merge.event");
        payload.Metadata.Should().ContainKey("k").WhoseValue.Should().Be("v");
    }

    [Fact]
    public async Task PassthroughSchemaValidationService_always_returns_valid_results()
    {
        PassthroughSchemaValidationService service = new();

        service.ValidateAgentResultJson("{}").IsValid.Should().BeTrue();
        service.ValidateGoldenManifestJson("{}").IsValid.Should().BeTrue();
        service.ValidateExplanationRunJson("{}").IsValid.Should().BeTrue();
        service.ValidateComparisonExplanationJson("{}").IsValid.Should().BeTrue();
        (await service.ValidateAgentResultJsonAsync("{}")).IsValid.Should().BeTrue();
        (await service.ValidateGoldenManifestJsonAsync("{}")).IsValid.Should().BeTrue();
    }
}
