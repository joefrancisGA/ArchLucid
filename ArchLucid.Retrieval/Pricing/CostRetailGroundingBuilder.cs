using System.Text;
using System.Text.RegularExpressions;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Retrieval.Pricing;

/// <summary>Structured Azure Retail grounding block for the Cost agent (RAG-V1-003).</summary>
public sealed record CostRetailGroundingResult(
    string PromptBlock,
    IReadOnlyList<AzureRetailPriceRow> CitedRows,
    bool GroundingMissing,
    bool SkippedNonAzure);

/// <summary>Builds Cost-agent prompt sections from <see cref="IAzureRetailPriceStructuredLookup" /> — no embeddings.</summary>
public static class CostRetailGroundingBuilder
{
    private static readonly Regex RegionTokenPattern =
        new(@"\b(eastus|eastus2|westus2|centralus|westeurope|northeurope|uksouth)\b", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex SkuTokenPattern =
        new(@"\b(Standard_[A-Za-z0-9_]+|P\d{1,2})\b", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public static CostRetailGroundingResult Build(
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        IAzureRetailPriceStructuredLookup lookup)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(evidence);
        ArgumentNullException.ThrowIfNull(lookup);

        if (!IsAzureProvider(request.CloudProvider, evidence.CloudProvider))
        {
            return new CostRetailGroundingResult(string.Empty, [], false, SkippedNonAzure: true);
        }

        string region = ResolveRegion(request, evidence);
        IReadOnlyList<CostRetailProbe> probes = ResolveProbes(request, evidence);
        List<AzureRetailPriceRow> citedRows = [];

        foreach (CostRetailProbe probe in probes)
        {
            if (lookup.TryLookup(probe.ServiceName, region, probe.Sku, out AzureRetailPriceRow row))
                citedRows.Add(row);
        }

        bool groundingMissing = citedRows.Count == 0;
        string block = FormatPromptBlock(citedRows, lookup, groundingMissing);

        return new CostRetailGroundingResult(block, citedRows, groundingMissing, SkippedNonAzure: false);
    }

    internal static bool IsAzureProvider(CloudProvider requestProvider, string evidenceCloudProvider)
    {
        if (!string.IsNullOrWhiteSpace(evidenceCloudProvider)
            && !evidenceCloudProvider.Contains("azure", StringComparison.OrdinalIgnoreCase))
            return false;

        return requestProvider == CloudProvider.Azure;
    }

    private static string ResolveRegion(ArchitectureRequest request, AgentEvidencePackage evidence)
    {
        foreach (string source in EnumerateRegionSources(request, evidence))
        {
            Match match = RegionTokenPattern.Match(source);

            if (match.Success)
                return match.Groups[1].Value.ToLowerInvariant();
        }

        return "eastus";
    }

    private static IReadOnlyList<CostRetailProbe> ResolveProbes(ArchitectureRequest request, AgentEvidencePackage evidence)
    {
        HashSet<string> skuHints = new(StringComparer.OrdinalIgnoreCase);

        foreach (string source in EnumerateSkuSources(request, evidence))
        {
            foreach (Match match in SkuTokenPattern.Matches(source))
                skuHints.Add(match.Groups[1].Value);
        }

        if (skuHints.Count == 0)
            skuHints.Add("Standard_D2s_v5");

        List<CostRetailProbe> probes = [];

        foreach (string sku in skuHints.Take(3))
        {
            probes.Add(new CostRetailProbe("Virtual Machines", sku));

            if (sku.StartsWith("P", StringComparison.OrdinalIgnoreCase))
                probes.Add(new CostRetailProbe("Storage", sku));
        }

        return probes;
    }

    private static IEnumerable<string> EnumerateRegionSources(ArchitectureRequest request, AgentEvidencePackage evidence)
    {
        yield return request.Description;

        foreach (string constraint in request.Constraints)
            yield return constraint;

        foreach (string assumption in request.Assumptions)
            yield return assumption;

        foreach (EvidenceNote note in evidence.Notes)
            yield return note.Message;
    }

    private static IEnumerable<string> EnumerateSkuSources(ArchitectureRequest request, AgentEvidencePackage evidence)
    {
        yield return request.Description;

        foreach (string constraint in request.Constraints)
            yield return constraint;

        foreach (ServiceCatalogEvidence entry in evidence.ServiceCatalog)
        {
            yield return entry.ServiceName;
            yield return entry.Summary;
        }
    }

    private static string FormatPromptBlock(
        IReadOnlyList<AzureRetailPriceRow> citedRows,
        IAzureRetailPriceStructuredLookup lookup,
        bool groundingMissing)
    {
        StringBuilder sb = new();
        sb.AppendLine("Azure Retail Prices grounding (RAG-V1-003):");
        sb.AppendLine("- Do NOT attribute pricing to Azure Retail when CloudProvider is not Azure.");
        sb.AppendLine("- When quoting USD infrastructure figures, cite at least one row below or mark the estimate as non-cited.");

        if (groundingMissing)
        {
            sb.AppendLine("- groundingMissing: true — no Retail row matched; avoid precise USD totals or label estimates as illustrative only.");
            return sb.ToString();
        }

        sb.AppendLine("- groundingMissing: false — cite these rows in evidenceRefs or finding messages when stating USD amounts:");

        foreach (AzureRetailPriceRow row in citedRows)
            sb.AppendLine("  • " + lookup.FormatForPrompt(row));

        return sb.ToString();
    }

    private readonly record struct CostRetailProbe(string ServiceName, string Sku);
}
