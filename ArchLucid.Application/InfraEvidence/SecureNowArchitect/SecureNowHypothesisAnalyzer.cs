using System.Security.Cryptography;
using System.Text;

using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class SecureNowHypothesisAnalyzer
{
    internal const string ExternalReachability = "ExternalReachability";
    internal const string PrivilegeEscalation = "PrivilegeEscalation";
    internal const string SensitiveExposure = "SensitiveExposure";
    internal const string CommonModeDependency = "CommonModeDependency";

    internal const string Open = "Open";
    internal const string Eliminated = "Eliminated";
    internal const string Concluded = "Concluded";

    internal static IReadOnlyList<SecureNowHypothesisResponse> Analyze(
        IReadOnlyList<(
            SecurityEvidencePathRecord Path,
            IReadOnlyList<SecurityEvidencePathHopRecord> Hops)> paths,
        IReadOnlyDictionary<Guid, IReadOnlyList<Guid>> citingFindingIdsByPath)
    {
        List<SecureNowHypothesisResponse> hypotheses = [];

        foreach ((SecurityEvidencePathRecord path, IReadOnlyList<SecurityEvidencePathHopRecord> hops) in paths)
        {
            IReadOnlyList<Guid> citingFindingIds =
                citingFindingIdsByPath.TryGetValue(path.PathId, out IReadOnlyList<Guid>? ids)
                    ? ids
                    : [];

            AddDiagnosticHypotheses(hypotheses, path, hops, citingFindingIds);
        }

        hypotheses.AddRange(AnalyzeCommonModeDependencies(paths));
        return hypotheses;
    }

    private static void AddDiagnosticHypotheses(
        List<SecureNowHypothesisResponse> hypotheses,
        SecurityEvidencePathRecord path,
        IReadOnlyList<SecurityEvidencePathHopRecord> hops,
        IReadOnlyList<Guid> citingFindingIds)
    {
        if (path.PathKind == PathKind.IntendedReachability)
        {
            bool hasPublicExposure = HasPublicExposure(hops);
            hypotheses.Add(Create(
                path,
                ExternalReachability,
                hasPublicExposure
                    ? StatusFor(citingFindingIds)
                    : Eliminated,
                hasPublicExposure
                    ? "A cited path contains a public-exposure edge; the external-reachability hypothesis remains under investigation."
                    : "No public-exposure, route, or public-network-access edge exists in the cited path.",
                hops,
                citingFindingIds));

            if (hasPublicExposure && ContainsSensitiveAsset(hops))
            {
                hypotheses.Add(Create(
                    path,
                    SensitiveExposure,
                    StatusFor(citingFindingIds),
                    "A public-exposure edge reaches a storage, SQL, or Key Vault resource; data sensitivity is not inferred.",
                    hops,
                    citingFindingIds));
            }
        }

        if (path.PathKind == PathKind.Privilege)
        {
            bool hasIdentityHop = hops.Any(hop =>
                hop.EdgeType.Equals(GraphEdgeTypes.HasRole, StringComparison.OrdinalIgnoreCase)
                || hop.EdgeType.Equals(GraphEdgeTypes.UsesIdentity, StringComparison.OrdinalIgnoreCase));

            hypotheses.Add(Create(
                path,
                PrivilegeEscalation,
                hasIdentityHop ? StatusFor(citingFindingIds) : Eliminated,
                hasIdentityHop
                    ? "The privilege path contains an identity or role edge and remains under investigation."
                    : "The privilege path contains no identity or role edge.",
                hops,
                citingFindingIds));
        }
    }

    private static IReadOnlyList<SecureNowHypothesisResponse> AnalyzeCommonModeDependencies(
        IReadOnlyList<(
            SecurityEvidencePathRecord Path,
            IReadOnlyList<SecurityEvidencePathHopRecord> Hops)> paths)
    {
        IEnumerable<(SecurityEvidencePathRecord Path, SecurityEvidencePathHopRecord Hop)> fanOuts =
            paths.SelectMany(item => item.Hops
                .Where(hop => hop.EdgeType.Equals(
                    SecureNowArchitectConstants.SharedControlFanOutHopEdgeType,
                    StringComparison.OrdinalIgnoreCase))
                .Select(hop => (item.Path, Hop: hop)));

        return fanOuts
            .GroupBy(item => new
            {
                item.Path.SnapshotId,
                SharedNode = item.Hop.FromNodeId,
            })
            .Select(group =>
            {
                List<(SecurityEvidencePathRecord Path, SecurityEvidencePathHopRecord Hop)> rows = group.ToList();
                IReadOnlyList<string> dependents = rows
                    .Select(row => row.Hop.ToNodeId)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .OrderBy(static node => node, StringComparer.OrdinalIgnoreCase)
                    .ToList();

                if (dependents.Count < 2)
                {
                    return null;
                }

                IReadOnlyList<SecurityEvidencePathHopRecord> hops = rows
                    .Select(row => row.Hop)
                    .ToList();
                IReadOnlyList<Guid> pathIds = rows
                    .Select(row => row.Path.PathId)
                    .Distinct()
                    .OrderBy(static id => id)
                    .ToList();

                return new SecureNowHypothesisResponse
                {
                    HypothesisId = DeterministicGuid(
                        $"common-mode|{group.Key.SnapshotId:D}|{group.Key.SharedNode}"),
                    Kind = CommonModeDependency,
                    Status = Open,
                    Reason = $"These resources share {group.Key.SharedNode}; the cited dependency may defeat their separation.",
                    PathConfidenceBand = WeakestConfidence(hops).ToString(),
                    CitedPathIds = pathIds,
                    EvidenceReferences = hops
                        .Select(static hop => hop.EvidenceReference)
                        .Where(static reference => !string.IsNullOrWhiteSpace(reference))
                        .Distinct(StringComparer.Ordinal)
                        .OrderBy(static reference => reference, StringComparer.Ordinal)
                        .ToList(),
                    SharedDependencyNodeId = group.Key.SharedNode,
                    DependentResourceIds = dependents,
                    SeparationDimension = ResolveSeparationDimension(dependents),
                };
            })
            .Where(static hypothesis => hypothesis is not null)
            .Select(static hypothesis => hypothesis!)
            .ToList();
    }

    private static SecureNowHypothesisResponse Create(
        SecurityEvidencePathRecord path,
        string kind,
        string status,
        string reason,
        IReadOnlyList<SecurityEvidencePathHopRecord> hops,
        IReadOnlyList<Guid> citingFindingIds) =>
        new()
        {
            HypothesisId = DeterministicGuid($"diagnostic|{path.PathId:D}|{kind}"),
            Kind = kind,
            Status = status,
            Reason = reason,
            PathConfidenceBand = WeakestConfidence(path, hops).ToString(),
            CitedPathIds = [path.PathId],
            CitedFindingIds = citingFindingIds,
            EvidenceReferences = hops
                .Select(static hop => hop.EvidenceReference)
                .Where(static reference => !string.IsNullOrWhiteSpace(reference))
                .Distinct(StringComparer.Ordinal)
                .OrderBy(static reference => reference, StringComparer.Ordinal)
                .ToList(),
        };

    private static string StatusFor(IReadOnlyList<Guid> citingFindingIds) =>
        citingFindingIds.Count > 0 ? Concluded : Open;

    private static bool HasPublicExposure(IReadOnlyList<SecurityEvidencePathHopRecord> hops) =>
        hops.Any(hop =>
            hop.FromNodeId.Equals(
                SecureNowArchitectConstants.InternetPublicExposureNodeId,
                StringComparison.Ordinal)
            || hop.EdgeType.Equals(
                SecureNowArchitectConstants.PublicNetworkAccessHopEdgeType,
                StringComparison.OrdinalIgnoreCase)
            || hop.EdgeType.Equals(GraphEdgeTypes.Exposes, StringComparison.OrdinalIgnoreCase)
            || hop.EdgeType.Equals(GraphEdgeTypes.RoutesTo, StringComparison.OrdinalIgnoreCase));

    private static bool ContainsSensitiveAsset(IReadOnlyList<SecurityEvidencePathHopRecord> hops) =>
        hops.Any(hop =>
            hop.ToNodeId.Contains("/Microsoft.Storage/", StringComparison.OrdinalIgnoreCase)
            || hop.ToNodeId.Contains("/Microsoft.Sql/", StringComparison.OrdinalIgnoreCase)
            || hop.ToNodeId.Contains("/Microsoft.KeyVault/", StringComparison.OrdinalIgnoreCase));

    private static PathConfidenceBand WeakestConfidence(
        SecurityEvidencePathRecord path,
        IReadOnlyList<SecurityEvidencePathHopRecord> hops) =>
        (PathConfidenceBand)Math.Max(
            (int)path.PathConfidenceBand,
            hops.Count == 0 ? (int)path.PathConfidenceBand : hops.Max(hop => (int)hop.HopConfidenceBand));

    private static PathConfidenceBand WeakestConfidence(IReadOnlyList<SecurityEvidencePathHopRecord> hops) =>
        hops.Count == 0
            ? PathConfidenceBand.InsufficientEvidence
            : (PathConfidenceBand)hops.Max(hop => (int)hop.HopConfidenceBand);

    private static string ResolveSeparationDimension(IReadOnlyList<string> dependents)
    {
        IReadOnlySet<string> regions = dependents
            .Select(TryExtractRegion)
            .Where(static region => region is not null)
            .Select(static region => region!)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        return regions.Count >= 2 ? "Region" : "Application";
    }

    private static string? TryExtractRegion(string nodeId)
    {
        string[] segments = nodeId.Split('/', StringSplitOptions.RemoveEmptyEntries);

        for (int index = 0; index < segments.Length - 1; index++)
        {
            if (segments[index].Equals("region", StringComparison.OrdinalIgnoreCase)
                || segments[index].Equals("location", StringComparison.OrdinalIgnoreCase))
            {
                return segments[index + 1];
            }
        }

        return null;
    }

    private static Guid DeterministicGuid(string value)
    {
        byte[] bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return new Guid(bytes.AsSpan(0, 16));
    }
}
