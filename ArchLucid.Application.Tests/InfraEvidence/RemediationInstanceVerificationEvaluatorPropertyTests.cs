using ArchLucid.Application.InfraEvidence.RemediationInstances;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;
using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class RemediationInstanceVerificationEvaluatorPropertyTests
{
    [Theory]
    [InlineData("false", true)]
    [InlineData("[REDACTED]", true)]
    [InlineData("[REDACTED]", false)]
    [InlineData(" [redacted] ", false)]
    [InlineData("{\"secret\":\"[REDACTED]\"}", false)]
    public void Redacted_evidence_cannot_satisfy_even_a_matching_postcondition(string value, bool isRedacted)
    {
        RemediationInstanceVerificationResult result = Evaluate(value, value, isRedacted);
        result.Passed.Should().BeFalse();
        result.Failures.Should().Contain(failure => failure.StartsWith("Insufficient evidence:", StringComparison.Ordinal)
            && failure.Contains("redacted", StringComparison.Ordinal));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData(" ")]
    public void Unavailable_value_is_explicitly_insufficient(string? value)
    {
        RemediationInstanceVerificationResult result = Evaluate(value, value ?? string.Empty);
        result.Passed.Should().BeFalse();
        result.Failures.Should().Contain(failure => failure.StartsWith("Insufficient evidence:", StringComparison.Ordinal));
    }

    [Fact]
    public void Missing_property_cannot_be_verified()
    {
        Evaluate("false", "false", omitProperty: true).Failures.Should()
            .Contain(failure => failure.StartsWith("Insufficient evidence:", StringComparison.Ordinal));
    }

    [Fact]
    public void Collected_property_can_verify_matching_postcondition()
    {
        Evaluate("FALSE", "false").Passed.Should().BeTrue();
    }

    [Theory]
    [InlineData(true, true, 1, false, true)]
    [InlineData(false, true, 1, false, false)]
    [InlineData(true, false, 1, false, false)]
    [InlineData(true, true, 0, false, false)]
    [InlineData(true, true, 2, false, false)]
    [InlineData(true, true, 1, true, false)]
    public void Advisory_needs_later_unambiguous_observed_artifact_and_approved_postcondition(
        bool approvedQuery, bool matchesFixedArtifact, int observedRows, bool stale, bool expected)
    {
        string digest = new('a', 64);
        AdvisoryRemediationEvidence advisory = new()
        {
            AdvisoryId = "ADVISORY-1",
            Owner = AdvisoryRemediationOwner.Shared,
            ProviderFix = AdvisoryProviderFix.Fixed,
            CustomerAction = AdvisoryCustomerAction.Required,
            FixedDeploymentArtifactSha256 = digest,
            CompensatingControlEvidenceReference = "waf-evidence",
        };
        Guid resourceId = Guid.NewGuid();
        Guid rowId = Guid.NewGuid();
        DateTime capture = new(2026, 9, 27, 12, 1, 0, DateTimeKind.Utc);
        List<AzureInventoryResourcePropertyReadModel> properties =
        [
            new() { ResourceRowId = rowId, PropertyKey = "wafEnabled", PropertyValue = "true" },
        ];
        properties.AddRange(Enumerable.Range(0, observedRows).Select(_ => new AzureInventoryResourcePropertyReadModel
        {
            ResourceRowId = rowId,
            PropertyKey = AdvisoryRemediationEvidence.ObservedDeployedArtifactProperty,
            PropertyValue = matchesFixedArtifact ? digest : new string('b', 64),
        }));
        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = Guid.NewGuid(), CapturedUtc = capture, CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
            },
            Resources = [new AzureInventoryResourceRecord { ResourceRowId = rowId, CloudResourceId = resourceId }],
            Properties = properties,
        };

        RemediationInstanceVerificationResult result = RemediationInstanceVerificationEvaluator.Evaluate(
            new RemediationInstanceRecord { CloudResourceId = resourceId },
            new RemediationPatternVersionContent
            {
                Execution = new RemediationPatternExecutionDefinition
                {
                    VerificationQueries = approvedQuery
                        ? ["property:wafEnabled=true", advisory.RequiredVerificationQuery!]
                        : ["property:wafEnabled=true"],
                },
            },
            snapshot, Guid.NewGuid(), capture.AddMinutes(-2),
            changeImplementedUtc: capture.AddMinutes(-1), advisory: advisory,
            advisoryObservedUtc: stale ? capture : capture.AddMinutes(-1));

        result.Passed.Should().Be(expected);
        if (expected)
            result.ResultJson.Should().Contain(digest).And.Contain("ADVISORY-1");
    }

    private static RemediationInstanceVerificationResult Evaluate(
        string? value, string expected, bool isRedacted = false, bool omitProperty = false)
    {
        Guid cloudResourceId = Guid.NewGuid();
        Guid resourceRowId = Guid.NewGuid();
        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = Guid.NewGuid(),
                CapturedUtc = new DateTime(2026, 9, 27, 12, 1, 0, DateTimeKind.Utc),
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
            },
            Resources = [new AzureInventoryResourceRecord { ResourceRowId = resourceRowId, CloudResourceId = cloudResourceId }],
            Properties = omitProperty ? [] : [new AzureInventoryResourcePropertyReadModel
            {
                ResourceRowId = resourceRowId,
                PropertyKey = "enablePublicNetworkAccess",
                PropertyValue = value,
                IsRedacted = isRedacted,
            }],
        };
        return RemediationInstanceVerificationEvaluator.Evaluate(
            new RemediationInstanceRecord { CloudResourceId = cloudResourceId },
            new RemediationPatternVersionContent
            {
                Execution = new RemediationPatternExecutionDefinition
                {
                    VerificationQueries = ["property:enablePublicNetworkAccess=" + expected],
                },
            },
            snapshot,
            Guid.NewGuid(),
            new DateTime(2026, 9, 27, 12, 0, 0, DateTimeKind.Utc));
    }
}
