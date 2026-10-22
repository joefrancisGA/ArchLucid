using ArchLucid.Cli.Commands;
using ArchLucid.Contracts.Roi;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ShipGateRoiCoherenceProbeTests
{
    [Fact]
    public void EvaluateJson_Pass_WhenPayloadMatchesCanonicalScopeManifest()
    {
        string json = BuildCoherentSponsorReportJson(
            headlineTotal: 150m,
            openEstimatedUsd: 100m,
            needsEvidenceUsd: 50m);

        IReadOnlyList<ShipGateRoiCoherenceProbeResult> results = ShipGateRoiCoherenceProbe.EvaluateJson(json);

        results.Should().OnlyContain(static result => result.Success);
    }

    [Fact]
    public void EvaluateJson_Fail_WhenHeadlineMathDriftsFromBasis()
    {
        string json = BuildCoherentSponsorReportJson(
            headlineTotal: 999m,
            openEstimatedUsd: 100m,
            needsEvidenceUsd: 50m);

        IReadOnlyList<ShipGateRoiCoherenceProbeResult> results = ShipGateRoiCoherenceProbe.EvaluateJson(json);

        results.Should().Contain(static result =>
            result.SignalId == "headline-math-coherent" && !result.Success);
    }

    [Fact]
    public void EvaluateJson_Fail_WhenHeadlineScopeCodeDrifts()
    {
        string json = BuildCoherentSponsorReportJson(
            headlineTotal: 150m,
            openEstimatedUsd: 100m,
            needsEvidenceUsd: 50m,
            headlineScopeCode: "wrong-code");

        IReadOnlyList<ShipGateRoiCoherenceProbeResult> results = ShipGateRoiCoherenceProbe.EvaluateJson(json);

        results.Should().Contain(static result =>
            result.SignalId == "headline-scope-code" && !result.Success);
    }

    private static string BuildCoherentSponsorReportJson(
        decimal headlineTotal,
        decimal openEstimatedUsd,
        decimal needsEvidenceUsd,
        string? headlineScopeCode = null)
    {
        object payload = new
        {
            totalEstimatedUsdSavings = headlineTotal,
            headlineSavingsScopeCode = headlineScopeCode ?? RoiSponsorFacingScopeCodes.HeadlineDispositionAware,
            headlineSavingsScopeDescription = RoiSponsorFacingScopeDescriptions.HeadlineDispositionAware,
            systemRowSavingsScopeCode = RoiSponsorFacingScopeCodes.SystemRowSnapshotPotential,
            systemRowSavingsScopeDescription = RoiSponsorFacingScopeDescriptions.SystemRowSnapshotPotential,
            systems = new[] { new { systemName = "demo", runId = "11111111-1111-1111-1111-111111111111", estimatedUsdSavings = 75m } },
            basisBreakdown = new
            {
                openEstimatedUsd,
                needsEvidenceUsd,
                realizedUsd = 0m,
                acceptedRiskUsd = 0m,
                deferredUsd = 0m,
                waivedUsd = 0m,
                rejectedNotApplicableUsd = 0m,
                totalPotentialUsd = openEstimatedUsd + needsEvidenceUsd,
            },
        };

        return System.Text.Json.JsonSerializer.Serialize(payload);
    }
}
