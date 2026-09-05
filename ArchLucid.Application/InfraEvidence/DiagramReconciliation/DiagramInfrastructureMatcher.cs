using ArchLucid.Application.InfraEvidence;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.DiagramReconciliation;

public static class DiagramInfrastructureMatcher
{
    public static DiagramInfrastructureReconciliationResult Match(
        ArchitectureDiagramModelRecord diagram,
        AzureInventorySnapshotDetailReadModel snapshot,
        Guid runId,
        Guid snapshotId)
    {
        ArgumentNullException.ThrowIfNull(diagram);
        ArgumentNullException.ThrowIfNull(snapshot);

        Dictionary<Guid, AzureInventoryResourceRecord> resourcesByRowId = snapshot.Resources
            .ToDictionary(resource => resource.ResourceRowId);

        Dictionary<Guid, InventoryResourceProfile> resourceProfiles = snapshot.Resources
            .Select(resource => BuildResourceProfile(resource, snapshot))
            .ToDictionary(profile => profile.ResourceRowId);

        HashSet<Guid> claimedResourceRowIds = [];
        List<DiagramInfrastructureCorrespondenceRow> rows = [];

        List<ArchitectureDiagramNodeRecord> activeNodes = diagram.Nodes
            .Where(node => !node.Removed)
            .OrderBy(node => node.Id, StringComparer.Ordinal)
            .ToList();

        foreach (ArchitectureDiagramNodeRecord node in activeNodes)
        {
            DiagramInfrastructureLabelProfile labelProfile = DiagramInfrastructureLabelParser.Parse(node.Label);
            List<InventoryResourceProfile> candidates = FindCandidates(labelProfile, resourceProfiles.Values);

            DiagramInfrastructureCorrespondenceRow row = ClassifyNodeMatch(node, labelProfile, candidates, resourcesByRowId);
            rows.Add(row);

            if (row.CloudResourceId is Guid cloudResourceId)
            {
                InventoryResourceProfile? matched = resourceProfiles.Values
                    .FirstOrDefault(profile => profile.CloudResourceId == cloudResourceId);

                if (matched is not null)
                {
                    claimedResourceRowIds.Add(matched.ResourceRowId);
                }
            }
        }

        foreach (InventoryResourceProfile resource in resourceProfiles.Values.OrderBy(profile => profile.AzureResourceId, StringComparer.Ordinal))
        {
            if (claimedResourceRowIds.Contains(resource.ResourceRowId))
            {
                continue;
            }

            rows.Add(new DiagramInfrastructureCorrespondenceRow
            {
                CorrespondenceId = $"infra-only-{resource.ResourceRowId:D}",
                CloudResourceId = resource.CloudResourceId,
                AzureResourceId = resource.AzureResourceId,
                ResourceType = resource.ResourceType,
                ResourceGroup = resource.ResourceGroup,
                TerraformAddress = resource.TerraformAddress,
                MatchKind = DiagramInfrastructureMatchKinds.InfrastructureOnly,
                ConfidenceBand = DiagramInfrastructureConfidenceBands.InsufficientEvidence,
                ExplainText = "Inventory resource has no corresponding diagram node.",
            });
        }

        return new DiagramInfrastructureReconciliationResult
        {
            RunId = runId,
            SnapshotId = snapshotId,
            Rows = rows.OrderBy(row => row.CorrespondenceId, StringComparer.Ordinal).ToList(),
            DiagramNodeCount = activeNodes.Count,
            InventoryResourceCount = snapshot.Resources.Count,
        };
    }

    private static DiagramInfrastructureCorrespondenceRow ClassifyNodeMatch(
        ArchitectureDiagramNodeRecord node,
        DiagramInfrastructureLabelProfile labelProfile,
        List<InventoryResourceProfile> candidates,
        Dictionary<Guid, AzureInventoryResourceRecord> resourcesByRowId)
    {
        if (string.IsNullOrWhiteSpace(labelProfile.NormalizedName))
        {
            return new DiagramInfrastructureCorrespondenceRow
            {
                CorrespondenceId = $"diagram-{node.Id}",
                DiagramNodeId = node.Id,
                DiagramNodeLabel = node.Label,
                MatchKind = DiagramInfrastructureMatchKinds.Unknown,
                ConfidenceBand = DiagramInfrastructureConfidenceBands.InsufficientEvidence,
                ExplainText = "Diagram node label did not yield a matchable resource name.",
            };
        }

        if (candidates.Count == 0)
        {
            return new DiagramInfrastructureCorrespondenceRow
            {
                CorrespondenceId = $"diagram-{node.Id}",
                DiagramNodeId = node.Id,
                DiagramNodeLabel = node.Label,
                MatchKind = DiagramInfrastructureMatchKinds.DiagramOnly,
                ConfidenceBand = DiagramInfrastructureConfidenceBands.InsufficientEvidence,
                ExplainText = "No inventory resource matched the diagram node name, type, and resource group.",
            };
        }

        List<InventoryResourceProfile> exactCandidates = candidates
            .Where(candidate => IsExactMatch(labelProfile, candidate))
            .ToList();

        if (exactCandidates.Count > 1)
        {
            return BuildConflictRow(node, exactCandidates, "Multiple inventory resources matched name, type, and resource group.");
        }

        if (exactCandidates.Count == 1)
        {
            return BuildMatchedRow(
                node,
                labelProfile,
                exactCandidates[0],
                resourcesByRowId,
                DiagramInfrastructureMatchKinds.Exact,
                "Name, resource group, and resource type matched exactly.");
        }

        List<InventoryResourceProfile> probableCandidates = candidates
            .Where(candidate => IsProbableMatch(labelProfile, candidate))
            .ToList();

        if (probableCandidates.Count > 1)
        {
            return BuildConflictRow(node, probableCandidates, "Multiple probable inventory matches for the diagram node.");
        }

        if (probableCandidates.Count == 1)
        {
            return BuildMatchedRow(
                node,
                labelProfile,
                probableCandidates[0],
                resourcesByRowId,
                DiagramInfrastructureMatchKinds.Probable,
                "Name and resource group matched; resource type was compatible.");
        }

        if (candidates.Count == 1)
        {
            return BuildMatchedRow(
                node,
                labelProfile,
                candidates[0],
                resourcesByRowId,
                DiagramInfrastructureMatchKinds.Possible,
                "Only the diagram node name matched the inventory resource.");
        }

        if (candidates.Count > 1)
        {
            return BuildConflictRow(node, candidates, "Multiple inventory resources partially matched the diagram node.");
        }

        return new DiagramInfrastructureCorrespondenceRow
        {
            CorrespondenceId = $"diagram-{node.Id}",
            DiagramNodeId = node.Id,
            DiagramNodeLabel = node.Label,
            MatchKind = DiagramInfrastructureMatchKinds.Unknown,
            ConfidenceBand = DiagramInfrastructureConfidenceBands.InsufficientEvidence,
            ExplainText = "Diagram node could not be classified against inventory resources.",
        };
    }

    private static DiagramInfrastructureCorrespondenceRow BuildMatchedRow(
        ArchitectureDiagramNodeRecord node,
        DiagramInfrastructureLabelProfile labelProfile,
        InventoryResourceProfile resource,
        Dictionary<Guid, AzureInventoryResourceRecord> resourcesByRowId,
        string matchKind,
        string explainText)
    {
        bool securityDiscrepancy = DetectSecurityDiscrepancy(labelProfile, resource);
        string effectiveMatchKind = securityDiscrepancy && matchKind == DiagramInfrastructureMatchKinds.Exact
            ? DiagramInfrastructureMatchKinds.Conflict
            : matchKind;

        DiagramInfrastructureCorrespondenceRow row = new()
        {
            CorrespondenceId = $"corr-{node.Id}-{resource.ResourceRowId:D}",
            DiagramNodeId = node.Id,
            DiagramNodeLabel = node.Label,
            CloudResourceId = resource.CloudResourceId,
            AzureResourceId = resource.AzureResourceId,
            ResourceType = resource.ResourceType,
            ResourceGroup = resource.ResourceGroup,
            TerraformAddress = resource.TerraformAddress,
            MatchKind = effectiveMatchKind,
            ConfidenceBand = MapConfidenceBand(effectiveMatchKind, securityDiscrepancy),
            ExplainText = explainText,
            SecurityDiscrepancy = securityDiscrepancy,
        };

        if (securityDiscrepancy)
        {
            row.ExplainText =
                $"{explainText} Security discrepancy: diagram implies private exposure but inventory shows public exposure.";
        }

        _ = resourcesByRowId;

        return row;
    }

    private static DiagramInfrastructureCorrespondenceRow BuildConflictRow(
        ArchitectureDiagramNodeRecord node,
        IReadOnlyList<InventoryResourceProfile> candidates,
        string explainText) =>
        new()
        {
            CorrespondenceId = $"diagram-conflict-{node.Id}",
            DiagramNodeId = node.Id,
            DiagramNodeLabel = node.Label,
            MatchKind = DiagramInfrastructureMatchKinds.Conflict,
            ConfidenceBand = DiagramInfrastructureConfidenceBands.Possible,
            ExplainText = $"{explainText} Candidate count: {candidates.Count}.",
        };

    private static List<InventoryResourceProfile> FindCandidates(
        DiagramInfrastructureLabelProfile labelProfile,
        IEnumerable<InventoryResourceProfile> resources)
    {
        if (string.IsNullOrWhiteSpace(labelProfile.NormalizedName))
        {
            return [];
        }

        return resources
            .Where(resource =>
                string.Equals(resource.NormalizedName, labelProfile.NormalizedName, StringComparison.Ordinal)
                || resource.NormalizedName.Contains(labelProfile.NormalizedName, StringComparison.Ordinal)
                || labelProfile.NormalizedName.Contains(resource.NormalizedName, StringComparison.Ordinal))
            .OrderBy(resource => resource.AzureResourceId, StringComparer.Ordinal)
            .ToList();
    }

    private static bool IsExactMatch(DiagramInfrastructureLabelProfile labelProfile, InventoryResourceProfile resource)
    {
        if (!string.Equals(resource.NormalizedName, labelProfile.NormalizedName, StringComparison.Ordinal))
        {
            return false;
        }

        if (labelProfile.NormalizedResourceGroup is not null
            && !string.Equals(resource.NormalizedResourceGroup, labelProfile.NormalizedResourceGroup, StringComparison.Ordinal))
        {
            return false;
        }

        return TypeTokensCompatible(labelProfile.TypeTokens, resource.ResourceType);
    }

    private static bool IsProbableMatch(DiagramInfrastructureLabelProfile labelProfile, InventoryResourceProfile resource)
    {
        if (!string.Equals(resource.NormalizedName, labelProfile.NormalizedName, StringComparison.Ordinal))
        {
            return false;
        }

        bool resourceGroupMatches = labelProfile.NormalizedResourceGroup is null
            || string.Equals(resource.NormalizedResourceGroup, labelProfile.NormalizedResourceGroup, StringComparison.Ordinal);

        bool typeMatches = labelProfile.TypeTokens.Count == 0
            || TypeTokensCompatible(labelProfile.TypeTokens, resource.ResourceType);

        return resourceGroupMatches || typeMatches;
    }

    private static bool TypeTokensCompatible(IReadOnlyList<string> typeTokens, string resourceType)
    {
        if (typeTokens.Count == 0)
        {
            return true;
        }

        string lowerType = resourceType.ToLowerInvariant();

        foreach (string token in typeTokens)
        {
            if (token == "sql" && lowerType.Contains("sql", StringComparison.Ordinal))
                return true;

            if (token == "storage" && lowerType.Contains("storage", StringComparison.Ordinal))
                return true;

            if (token == "vnet" && lowerType.Contains("virtualnetwork", StringComparison.Ordinal))
                return true;

            if (token == "vm" && lowerType.Contains("virtualmachine", StringComparison.Ordinal))
                return true;

            if (token == "keyvault" && lowerType.Contains("keyvault", StringComparison.Ordinal))
                return true;

            if (token == "publicip" && lowerType.Contains("publicipaddress", StringComparison.Ordinal))
                return true;

            if (token == "appservice" && lowerType.Contains("sites", StringComparison.Ordinal))
                return true;
        }

        return false;
    }

    private static bool DetectSecurityDiscrepancy(
        DiagramInfrastructureLabelProfile labelProfile,
        InventoryResourceProfile resource)
    {
        if (!labelProfile.ImpliesPrivateExposure)
        {
            return false;
        }

        return resource.IsPublicFacing;
    }

    private static string MapConfidenceBand(string matchKind, bool securityDiscrepancy)
    {
        if (securityDiscrepancy)
        {
            return DiagramInfrastructureConfidenceBands.Likely;
        }

        return matchKind switch
        {
            DiagramInfrastructureMatchKinds.Exact => DiagramInfrastructureConfidenceBands.Confirmed,
            DiagramInfrastructureMatchKinds.Probable => DiagramInfrastructureConfidenceBands.Likely,
            DiagramInfrastructureMatchKinds.Possible => DiagramInfrastructureConfidenceBands.Possible,
            DiagramInfrastructureMatchKinds.Conflict => DiagramInfrastructureConfidenceBands.Possible,
            _ => DiagramInfrastructureConfidenceBands.InsufficientEvidence,
        };
    }

    private static InventoryResourceProfile BuildResourceProfile(
        AzureInventoryResourceRecord resource,
        AzureInventorySnapshotDetailReadModel snapshot)
    {
        AdvisoryTerraformAddressInfo terraform = AdvisoryTerraformAddressBuilder.Build(resource);

        bool isPublicFacing = resource.ResourceType.Contains(
            "Microsoft.Network/publicIPAddresses",
            StringComparison.OrdinalIgnoreCase);

        if (!isPublicFacing)
        {
            isPublicFacing = snapshot.Properties
                .Where(property => property.ResourceRowId == resource.ResourceRowId)
                .Any(property =>
                    property.PropertyKey.Contains("enablePublicNetworkAccess", StringComparison.OrdinalIgnoreCase)
                    && string.Equals(property.PropertyValue, "true", StringComparison.OrdinalIgnoreCase));
        }

        return new InventoryResourceProfile
        {
            ResourceRowId = resource.ResourceRowId,
            CloudResourceId = resource.CloudResourceId,
            AzureResourceId = resource.AzureResourceId,
            ResourceType = resource.ResourceType,
            ResourceGroup = resource.ResourceGroup,
            NormalizedName = NormalizeResourceName(resource.AzureResourceId),
            NormalizedResourceGroup = string.IsNullOrWhiteSpace(resource.ResourceGroup)
                ? null
                : resource.ResourceGroup.Trim().ToLowerInvariant(),
            TerraformAddress = terraform.TerraformAddress,
            IsPublicFacing = isPublicFacing,
        };
    }

    private static string NormalizeResourceName(string azureResourceId)
    {
        string name = azureResourceId.Split('/').Last();

        return name.Trim().ToLowerInvariant();
    }

    private sealed class InventoryResourceProfile
    {
        public Guid ResourceRowId
        {
            get;
            init;
        }

        public Guid? CloudResourceId
        {
            get;
            init;
        }

        public string AzureResourceId
        {
            get;
            init;
        } = string.Empty;

        public string ResourceType
        {
            get;
            init;
        } = string.Empty;

        public string? ResourceGroup
        {
            get;
            init;
        }

        public string NormalizedName
        {
            get;
            init;
        } = string.Empty;

        public string? NormalizedResourceGroup
        {
            get;
            init;
        }

        public string TerraformAddress
        {
            get;
            init;
        } = string.Empty;

        public bool IsPublicFacing
        {
            get;
            init;
        }
    }
}
