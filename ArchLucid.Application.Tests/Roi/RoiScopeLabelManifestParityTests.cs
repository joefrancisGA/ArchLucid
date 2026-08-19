using ArchLucid.Contracts.Roi;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Roi;

/// <summary>Canonical ROI scope manifest parity across fixtures, contracts, and UI copy (assessment §17 #9).</summary>
[Trait("Suite", "Core")]
public sealed class RoiScopeLabelManifestParityTests
{
    [Fact]
    public void Manifest_descriptions_match_contract_constants()
    {
        RoiSponsorFacingScopeManifestDocument manifest = RoiSponsorFacingScopeManifest.Load();

        manifest.Descriptions.HeadlineDispositionAware.Should().Be(RoiSponsorFacingScopeDescriptions.HeadlineDispositionAware);
        manifest.Descriptions.SystemRowSnapshotPotential.Should().Be(RoiSponsorFacingScopeDescriptions.SystemRowSnapshotPotential);
        manifest.Descriptions.CrossTenantPortfolioHeadline.Should().Be(RoiSponsorFacingScopeDescriptions.CrossTenantPortfolioHeadline);
        manifest.Descriptions.Trailing30DayFindingEvents.Should().Be(RoiSponsorFacingScopeDescriptions.Trailing30DayFindingEvents);
        manifest.Descriptions.ValueReportActivityWindowGeneric.Should().Be(RoiSponsorFacingScopeDescriptions.ValueReportActivityWindowGeneric);
        manifest.Descriptions.PilotScorecardUtcWindowGeneric.Should().Be(RoiSponsorFacingScopeDescriptions.PilotScorecardUtcWindowGeneric);
        manifest.NonAdditivityCaveat.Should().Be(RoiSponsorFacingScopeDescriptions.NonAdditivityCaveat);
    }

    [Fact]
    public void Manifest_codes_match_contract_constants()
    {
        RoiSponsorFacingScopeManifestDocument manifest = RoiSponsorFacingScopeManifest.Load();

        manifest.Codes.HeadlineDispositionAware.Should().Be(RoiSponsorFacingScopeCodes.HeadlineDispositionAware);
        manifest.Codes.SystemRowSnapshotPotential.Should().Be(RoiSponsorFacingScopeCodes.SystemRowSnapshotPotential);
        manifest.Codes.CrossTenantPortfolioHeadline.Should().Be(RoiSponsorFacingScopeCodes.CrossTenantPortfolioHeadline);
        manifest.Codes.ValueReportActivityWindow.Should().Be(RoiSponsorFacingScopeCodes.ValueReportActivityWindow);
        manifest.Codes.Trailing30DayFindingEvents.Should().Be(RoiSponsorFacingScopeCodes.Trailing30DayFindingEvents);
        manifest.Codes.PilotScorecardUtcWindow.Should().Be(RoiSponsorFacingScopeCodes.PilotScorecardUtcWindow);
    }

    [Fact]
    public void Ui_manifest_copy_matches_fixture_manifest()
    {
        string repoRoot = ResolveRepositoryRoot();
        string fixtureJson = File.ReadAllText(Path.Combine(repoRoot, "fixtures", "roi", "roi-sponsor-facing-scope-labels.v1.json"));
        string uiJson = File.ReadAllText(
            Path.Combine(repoRoot, "archlucid-ui", "src", "lib", "data", "roi-sponsor-facing-scope-labels.v1.json"));

        NormalizeJson(fixtureJson).Should().Be(NormalizeJson(uiJson));
    }

    private static string ResolveRepositoryRoot()
    {
        string? current = Directory.GetCurrentDirectory();

        for (int depth = 0; depth < 8 && current is not null; depth++)
        {
            if (File.Exists(Path.Combine(current, "ArchLucid.sln")))
                return current;

            current = Directory.GetParent(current)?.FullName;
        }

        throw new InvalidOperationException("Repository root not found.");
    }

    private static string NormalizeJson(string json)
    {
        return json.Replace("\r\n", "\n", StringComparison.Ordinal).Trim();
    }
}
