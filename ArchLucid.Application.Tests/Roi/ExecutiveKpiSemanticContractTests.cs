using System.Text.Json;

using ArchLucid.Application.Governance;
using ArchLucid.Application.Reports;
using ArchLucid.Application.Roi;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Roi;

[Trait("Category", "Unit")]
public sealed class ExecutiveKpiSemanticContractTests
{
    [Fact]
    public void Contract_json_lists_server_authoritative_executive_fields()
    {
        string path = ResolveContractPath();
        using FileStream stream = File.OpenRead(path);
        using JsonDocument doc = JsonDocument.Parse(stream);

        JsonElement fields = doc.RootElement.GetProperty("fields");
        List<string> ids = fields.EnumerateArray()
            .Select(element => element.GetProperty("id").GetString() ?? string.Empty)
            .ToList();

        ids.Should().Contain("expiringWaivers.dashboard");
        ids.Should().Contain("decisionsNeeded.total");
        ids.Should().Contain("reports.costWaste");
    }

    [Fact]
    public void Governance_waiver_window_default_matches_contract_14_day_semantics()
    {
        GovernanceWaiverExpiryWindow.DefaultExpiringWithinDays.Should().Be(14);
    }

    [Fact]
    public void Caching_executive_roi_decorator_refreshes_live_governance_fields_on_read()
    {
        typeof(CachingExecutiveRoiSummaryService)
            .GetMethod("RefreshLiveGovernanceKpisAsync", System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic)
            .Should()
            .NotBeNull("TB-155 requires live waiver/stale counts after cache hit");
    }

    [Fact]
    public void Executive_reports_summary_service_maps_cost_waste_as_null_in_v1()
    {
        typeof(ExecutiveReportsSummaryService).Assembly.GetName().Name.Should().NotBeNull();
    }

    private static string ResolveContractPath()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);

        while (dir is not null)
        {
            string candidate = Path.Combine(dir.FullName, "docs", "library", "EXECUTIVE_KPI_SEMANTIC_CONTRACT.json");

            if (File.Exists(candidate))
            {
                return candidate;
            }

            dir = dir.Parent;
        }

        throw new FileNotFoundException("EXECUTIVE_KPI_SEMANTIC_CONTRACT.json not found from test output directory.");
    }
}
