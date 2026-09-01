using System.Text;
using System.Text.RegularExpressions;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Retrieval.Pricing;

public static partial class CostRetailGroundingBuilder
{
    private static readonly Regex GcpRegionTokenPattern =
        new(@"\b(us|europe|asia|australia|southamerica|northamerica)-(central|east|west|south|north|northeast|northwest|southeast|southwest)[0-9]?\b", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex GcpMachineTypeTokenPattern =
        new(@"\b((?:e2|n1|n2|c2|t2d)-[a-z]+(?:-[0-9]+)?)\b", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static CostRetailGroundingResult BuildGcp(
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        IGcpRetailPriceStructuredLookup lookup,
        CloudProvider provider)
    {
        string region = ResolveGcpRegion(request, evidence);
        IReadOnlyList<CostRetailProbe> probes = ResolveGcpProbes(request, evidence);
        List<CostRetailCitationRow> citedRows = [];

        foreach (CostRetailProbe probe in probes)
        {
            if (!lookup.TryLookup(probe.ServiceName, region, probe.Sku, out GcpRetailPriceRow row))
                continue;

            citedRows.Add(new CostRetailCitationRow(
                CloudProvider.Gcp,
                row.ServiceName,
                row.Region,
                row.MachineType,
                row.EstimatedMonthlyUsd,
                row.CurrencyCode,
                row.IsHeuristicFallback));
        }

        bool groundingMissing = citedRows.Count == 0;
        string block = FormatGcpPromptBlock(citedRows, lookup, groundingMissing);

        return new CostRetailGroundingResult(block, citedRows, groundingMissing, SkippedRetailGrounding: false, provider);
    }

    private static string ResolveGcpRegion(ArchitectureRequest request, AgentEvidencePackage evidence)
    {
        foreach (string source in EnumerateRegionSources(request, evidence))
        {
            Match match = GcpRegionTokenPattern.Match(source);

            if (match.Success)
                return match.Value.ToLowerInvariant();
        }

        return "us-central1";
    }

    private static IReadOnlyList<CostRetailProbe> ResolveGcpProbes(ArchitectureRequest request, AgentEvidencePackage evidence)
    {
        HashSet<string> machineHints = new(StringComparer.OrdinalIgnoreCase);

        foreach (string source in EnumerateSkuSources(request, evidence))
        {
            foreach (Match match in GcpMachineTypeTokenPattern.Matches(source))
                machineHints.Add(match.Groups[1].Value);
        }

        if (machineHints.Count == 0)
            machineHints.Add("n1-standard-2");

        return machineHints
            .Take(3)
            .Select(static machineType => new CostRetailProbe("Compute Engine", machineType))
            .ToList();
    }

    private static string FormatGcpPromptBlock(
        IReadOnlyList<CostRetailCitationRow> citedRows,
        IGcpRetailPriceStructuredLookup lookup,
        bool groundingMissing)
    {
        StringBuilder sb = new();
        sb.AppendLine("GCP Cloud Billing Catalog grounding (TB-603):");
        sb.AppendLine("- Quote GCP infrastructure USD only when CloudProvider is GCP.");
        sb.AppendLine("- When quoting USD infrastructure figures, cite at least one row below or mark the estimate as non-cited.");

        if (groundingMissing)
        {
            sb.AppendLine("- groundingMissing: true — no Billing Catalog row matched; avoid precise USD totals or label estimates as illustrative only.");
            return sb.ToString();
        }

        sb.AppendLine("- groundingMissing: false — cite these rows in evidenceRefs or finding messages when stating USD amounts:");

        foreach (CostRetailCitationRow cited in citedRows)
        {
            GcpRetailPriceRow row = new(
                cited.ServiceName,
                cited.Region,
                cited.Sku,
                cited.EstimatedMonthlyUsd,
                cited.CurrencyCode,
                cited.IsHeuristicFallback);

            sb.AppendLine("  • " + lookup.FormatForPrompt(row));
        }

        return sb.ToString();
    }
}
