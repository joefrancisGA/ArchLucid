using ArchLucid.Application.Findings;
using ArchLucid.Application.Findings.PortfolioRecurrence;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Models;
using FluentAssertions;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Suite", "Application")]
public sealed class PortfolioRecurrenceFindingEmitterTests
{
    [Fact]
    public void EmitQualifyingFindings_filters_by_current_identities_and_min_system_count()
    {
        Finding representative = new()
        {
            Category = "Security",
            Title = "Public endpoint",
            PolicyRuleId = "SEC-1",
            EngineType = "security-baseline",
            FindingType = "SecurityControlFinding",
            Severity = FindingSeverity.Warning,
        };

        string identity = FindingSnapshotMergeKey.FromFinding(representative);
        RecurrenceAccumulator accumulator = new(representative);
        accumulator.SystemNames.Add("alpha");
        accumulator.SystemNames.Add("beta");
        accumulator.SystemNames.Add("gamma");

        RecurrenceMatchResult match = new()
        {
            RecurrenceByIdentity = new Dictionary<string, RecurrenceAccumulator>(StringComparer.Ordinal)
            {
                [identity] = accumulator,
            },
            IdentitiesBySystem = new Dictionary<string, HashSet<string>>(StringComparer.OrdinalIgnoreCase),
            ScannedSystemCount = 5,
        };

        PortfolioRecurrenceFindingOptions options = new()
        {
            Enabled = true,
            MinSystemCountToReport = 3,
            MaxSystemsScanned = 50,
            MaxFindings = 10,
        };

        PortfolioRecurrenceFindingEmitter emitter = new();
        IReadOnlyList<Finding> findings = emitter.EmitQualifyingFindings(
            match,
            new HashSet<string>(StringComparer.Ordinal) { identity },
            options);

        findings.Should().ContainSingle();
        findings[0].Title.Should().Be("Recurs across 3 reviewed systems");
    }

    [Fact]
    public void EmitQualifyingFindings_uses_title_honesty_when_representative_title_missing()
    {
        Finding representative = new()
        {
            Category = "Security",
            Title = "   ",
            EngineType = "security-baseline",
            FindingType = "SecurityControlFinding",
            Severity = FindingSeverity.Info,
        };

        string identity = FindingSnapshotMergeKey.FromFinding(representative);
        RecurrenceAccumulator accumulator = new(representative);
        accumulator.SystemNames.Add("alpha");
        accumulator.SystemNames.Add("beta");
        accumulator.SystemNames.Add("gamma");

        RecurrenceMatchResult match = new()
        {
            RecurrenceByIdentity = new Dictionary<string, RecurrenceAccumulator>(StringComparer.Ordinal)
            {
                [identity] = accumulator,
            },
            IdentitiesBySystem = new Dictionary<string, HashSet<string>>(StringComparer.OrdinalIgnoreCase),
            ScannedSystemCount = 5,
        };

        PortfolioRecurrenceFindingOptions options = new()
        {
            Enabled = true,
            MinSystemCountToReport = 3,
            MaxSystemsScanned = 50,
            MaxFindings = 10,
        };

        PortfolioRecurrenceFindingEmitter emitter = new();
        IReadOnlyList<Finding> findings = emitter.EmitQualifyingFindings(
            match,
            new HashSet<string>(StringComparer.Ordinal) { identity },
            options);

        findings.Should().ContainSingle();
        findings[0].Rationale.Should().Contain("Finding title was not stored.");
        findings[0].Severity.Should().Be(FindingSeverity.Warning);
    }
}
