using System.Text;
using System.Text.RegularExpressions;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Retrieval.Pricing;

public static partial class CostRetailGroundingBuilder
{
    private static readonly Regex AwsRegionTokenPattern =
        new(@"\b(us|eu|ap|sa|ca|me|af)-(east|west|central|north|south|southeast|northeast|southwest|westcentral)-[0-9]\b", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex AwsInstanceTypeTokenPattern =
        new(@"\b([a-z][0-9]+[a-z0-9]*\.[a-z0-9]+)\b", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static CostRetailGroundingResult BuildAws(
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        IAwsRetailPriceStructuredLookup lookup,
        CloudProvider provider)
    {
        string region = ResolveAwsRegion(request, evidence);
        IReadOnlyList<CostRetailProbe> probes = ResolveAwsProbes(request, evidence);
        List<CostRetailCitationRow> citedRows = [];

        foreach (CostRetailProbe probe in probes)
        {
            if (!lookup.TryLookup(probe.ServiceName, region, probe.Sku, out AwsRetailPriceRow row))
                continue;

            citedRows.Add(new CostRetailCitationRow(
                CloudProvider.Aws,
                row.ServiceName,
                row.Region,
                row.InstanceType,
                row.EstimatedMonthlyUsd,
                row.CurrencyCode,
                row.IsHeuristicFallback));
        }

        bool groundingMissing = citedRows.Count == 0;
        string block = FormatAwsPromptBlock(citedRows, lookup, groundingMissing);

        return new CostRetailGroundingResult(block, citedRows, groundingMissing, SkippedRetailGrounding: false, provider);
    }

    private static string ResolveAwsRegion(ArchitectureRequest request, AgentEvidencePackage evidence)
    {
        foreach (string source in EnumerateRegionSources(request, evidence))
        {
            Match match = AwsRegionTokenPattern.Match(source);

            if (match.Success)
                return match.Value.ToLowerInvariant();
        }

        return "us-east-1";
    }

    private static IReadOnlyList<CostRetailProbe> ResolveAwsProbes(ArchitectureRequest request, AgentEvidencePackage evidence)
    {
        HashSet<string> instanceHints = new(StringComparer.OrdinalIgnoreCase);

        foreach (string source in EnumerateSkuSources(request, evidence))
        {
            foreach (Match match in AwsInstanceTypeTokenPattern.Matches(source))
                instanceHints.Add(match.Groups[1].Value);
        }

        if (instanceHints.Count == 0)
            instanceHints.Add("m5.large");

        return instanceHints
            .Take(3)
            .Select(static instanceType => new CostRetailProbe("AmazonEC2", instanceType))
            .ToList();
    }

    private static string FormatAwsPromptBlock(
        IReadOnlyList<CostRetailCitationRow> citedRows,
        IAwsRetailPriceStructuredLookup lookup,
        bool groundingMissing)
    {
        StringBuilder sb = new();
        sb.AppendLine("AWS Price List grounding (TB-603):");
        sb.AppendLine("- Quote AWS infrastructure USD only when CloudProvider is AWS.");
        sb.AppendLine("- When quoting USD infrastructure figures, cite at least one row below or mark the estimate as non-cited.");

        if (groundingMissing)
        {
            sb.AppendLine("- groundingMissing: true — no Price List row matched; avoid precise USD totals or label estimates as illustrative only.");
            return sb.ToString();
        }

        sb.AppendLine("- groundingMissing: false — cite these rows in evidenceRefs or finding messages when stating USD amounts:");

        foreach (CostRetailCitationRow cited in citedRows)
        {
            AwsRetailPriceRow row = new(
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
