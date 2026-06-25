using ArchLucid.Contracts.Common;

namespace ArchLucid.Core.Costing;

/// <summary>Builds infrastructure cost summary notes from estimated line platforms.</summary>
internal static class InfrastructureCostSummaryNotes
{
    internal static string ComposeIllustrativeOnlyNote(InfrastructureCostEstimateTotals totals)
    {
        if (totals.TotalUsdPerMonth <= 0m)
            return "No billable topology rows surfaced for illustrative costing.";

        CloudProvider? soleFamily = ResolveSoleCloudFamily(totals.Lines);

        if (soleFamily == CloudProvider.Aws)
            return "Illustrative AWS service USD/month (public Price List adapters deferred; not Azure Retail).";

        if (soleFamily == CloudProvider.Gcp)
            return "Illustrative GCP service USD/month (Billing Catalog adapters deferred; not Azure Retail).";

        return "Illustrative infrastructure USD/month (Retail API probing disabled).";
    }

    internal static string ComposeRetailBlendNote(InfrastructureCostEstimateTotals totals)
    {
        if (totals.TotalUsdPerMonth <= 0m)
            return "No billable topology rows surfaced for sizing.";

        if (totals.AllRetailPricing)
            return "Azure Retail Prices API sizing (consumption assumptions; see line-level price sources).";

        CloudProvider? soleFamily = ResolveSoleCloudFamily(totals.Lines);

        if (soleFamily == CloudProvider.Aws)
            return "Illustrative AWS service sizing (Azure Retail API not applicable for AWS target cloud).";

        if (soleFamily == CloudProvider.Gcp)
            return "Illustrative GCP service sizing (Azure Retail API not applicable for GCP target cloud).";

        return "Blend of Retail API matches and illustrative fallbacks (consumption SKU/region probes do not guarantee agreement with your bill).";
    }

    private static CloudProvider? ResolveSoleCloudFamily(IReadOnlyList<InfrastructureCostLine> lines)
    {
        if (lines.Count == 0)
            return null;

        CloudProvider first = RuntimePlatformCloudFamily.ResolveCloudFamily(lines[0].Platform);

        foreach (InfrastructureCostLine line in lines.Skip(1))
        {
            if (RuntimePlatformCloudFamily.ResolveCloudFamily(line.Platform) != first)
                return null;
        }

        return first is CloudProvider.Azure ? null : first;
    }
}
