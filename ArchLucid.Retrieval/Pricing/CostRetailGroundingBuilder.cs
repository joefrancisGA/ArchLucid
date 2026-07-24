using System.Text;
using System.Text.RegularExpressions;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Retrieval.Pricing;

/// <summary>Builds Cost-agent prompt sections from structured retail-price lookups — no embeddings.</summary>
public static class CostRetailGroundingBuilder
{
    private static readonly Regex AzureRegionTokenPattern =
        new(@"\b(eastus|eastus2|westus2|centralus|westeurope|northeurope|uksouth)\b", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex AzureSkuTokenPattern =
        new(@"\b(Standard_[A-Za-z0-9_]+|P\d{1,2})\b", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex AwsRegionTokenPattern =
        new(@"\b(us|eu|ap|sa|ca|me|af)-(east|west|central|north|south|southeast|northeast|southwest|westcentral)-[0-9]\b", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex AwsInstanceTypeTokenPattern =
        new(@"\b([a-z][0-9]+[a-z0-9]*\.[a-z0-9]+)\b", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex GcpRegionTokenPattern =
        new(@"\b(us|europe|asia|australia|southamerica|northamerica)-(central|east|west|south|north|northeast|northwest|southeast|southwest)[0-9]?\b", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex GcpMachineTypeTokenPattern =
        new(@"\b((?:e2|n1|n2|c2|t2d)-[a-z]+(?:-[0-9]+)?)\b", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public static CostRetailGroundingResult Build(
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        CostRetailGroundingLookups lookups,
        CloudProvider? effectiveCloudTarget = null)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(evidence);
        ArgumentNullException.ThrowIfNull(lookups);

        CloudProvider? provider = ResolveGroundingProvider(request, evidence, effectiveCloudTarget);

        if (provider is null)
        {
            return new CostRetailGroundingResult(string.Empty, [], false, SkippedRetailGrounding: true, GroundedProvider: null);
        }

        return provider.Value switch
        {
            CloudProvider.Azure => BuildAzure(request, evidence, lookups.Azure, provider.Value),
            CloudProvider.Aws => BuildAws(request, evidence, lookups.Aws, provider.Value),
            CloudProvider.Gcp => BuildGcp(request, evidence, lookups.Gcp, provider.Value),
            _ => new CostRetailGroundingResult(string.Empty, [], false, SkippedRetailGrounding: true, GroundedProvider: null),
        };
    }

    internal static CloudProvider? ResolveGroundingProvider(
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        CloudProvider? effectiveCloudTarget = null)
    {
        if (effectiveCloudTarget == CloudProvider.None)
            return null;

        if (effectiveCloudTarget is CloudProvider.Azure or CloudProvider.Aws or CloudProvider.Gcp)
            return effectiveCloudTarget;

        if (!string.IsNullOrWhiteSpace(evidence.CloudProvider))
        {
            if (evidence.CloudProvider.Contains("aws", StringComparison.OrdinalIgnoreCase))
                return CloudProvider.Aws;

            if (evidence.CloudProvider.Contains("gcp", StringComparison.OrdinalIgnoreCase)
                || evidence.CloudProvider.Contains("google", StringComparison.OrdinalIgnoreCase))
                return CloudProvider.Gcp;

            if (evidence.CloudProvider.Contains("azure", StringComparison.OrdinalIgnoreCase))
                return CloudProvider.Azure;
        }

        return request.CloudProvider switch
        {
            CloudProvider.Azure => CloudProvider.Azure,
            CloudProvider.Aws => CloudProvider.Aws,
            CloudProvider.Gcp => CloudProvider.Gcp,
            _ => null,
        };
    }

    internal static bool IsAzureProvider(CloudProvider requestProvider, string evidenceCloudProvider)
    {
        if (!string.IsNullOrWhiteSpace(evidenceCloudProvider)
            && !evidenceCloudProvider.Contains("azure", StringComparison.OrdinalIgnoreCase))
            return false;

        return requestProvider == CloudProvider.Azure;
    }

    private static CostRetailGroundingResult BuildAzure(
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        IAzureRetailPriceStructuredLookup lookup,
        CloudProvider provider)
    {
        string region = ResolveAzureRegion(request, evidence);
        IReadOnlyList<CostRetailProbe> probes = ResolveAzureProbes(request, evidence);
        List<CostRetailCitationRow> citedRows = [];

        foreach (CostRetailProbe probe in probes)
        {
            if (!lookup.TryLookup(probe.ServiceName, region, probe.Sku, out AzureRetailPriceRow row))
                continue;

            citedRows.Add(new CostRetailCitationRow(
                CloudProvider.Azure,
                row.ServiceName,
                row.Region,
                row.Sku,
                row.UnitPriceUsd,
                row.CurrencyCode,
                row.IsHeuristicFallback));
        }

        bool groundingMissing = citedRows.Count == 0;
        string block = FormatAzurePromptBlock(citedRows, lookup, groundingMissing);

        return new CostRetailGroundingResult(block, citedRows, groundingMissing, SkippedRetailGrounding: false, provider);
    }

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

    private static string ResolveAzureRegion(ArchitectureRequest request, AgentEvidencePackage evidence)
    {
        foreach (string source in EnumerateRegionSources(request, evidence))
        {
            Match match = AzureRegionTokenPattern.Match(source);

            if (match.Success)
                return match.Groups[1].Value.ToLowerInvariant();
        }

        return "eastus";
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

    private static IReadOnlyList<CostRetailProbe> ResolveAzureProbes(ArchitectureRequest request, AgentEvidencePackage evidence)
    {
        HashSet<string> skuHints = new(StringComparer.OrdinalIgnoreCase);

        foreach (string source in EnumerateSkuSources(request, evidence))
        {
            foreach (Match match in AzureSkuTokenPattern.Matches(source))
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

    private static string FormatAzurePromptBlock(
        IReadOnlyList<CostRetailCitationRow> citedRows,
        IAzureRetailPriceStructuredLookup lookup,
        bool groundingMissing)
    {
        StringBuilder sb = new();
        sb.AppendLine("Azure Retail Prices grounding (RAG-V1-003):");
        sb.AppendLine("- Quote Azure infrastructure USD only when CloudProvider is Azure.");
        sb.AppendLine("- When quoting USD infrastructure figures, cite at least one row below or mark the estimate as non-cited.");

        if (groundingMissing)
        {
            sb.AppendLine("- groundingMissing: true — no Retail row matched; avoid precise USD totals or label estimates as illustrative only.");
            return sb.ToString();
        }

        sb.AppendLine("- groundingMissing: false — cite these rows in evidenceRefs or finding messages when stating USD amounts:");

        foreach (CostRetailCitationRow cited in citedRows)
        {
            AzureRetailPriceRow row = new(
                cited.ServiceName,
                cited.Sku,
                cited.Region,
                cited.Sku,
                cited.EstimatedMonthlyUsd,
                cited.CurrencyCode,
                cited.IsHeuristicFallback);

            sb.AppendLine("  • " + lookup.FormatForPrompt(row));
        }

        return sb.ToString();
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

    private readonly record struct CostRetailProbe(string ServiceName, string? Sku);
}
