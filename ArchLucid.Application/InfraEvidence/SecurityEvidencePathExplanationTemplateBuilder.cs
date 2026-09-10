using System.Text;
using System.Text.Json;

using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

internal static class SecurityEvidencePathExplanationTemplateBuilder
{
    public static SecurityEvidencePathExplanationTemplateResponse Build(
        SecurityEvidencePathRecord path,
        IReadOnlyList<SecurityEvidencePathHopRecord> hops)
    {
        return Build(path, hops, []);
    }

    public static SecurityEvidencePathExplanationTemplateResponse Build(
        SecurityEvidencePathRecord path,
        IReadOnlyList<SecurityEvidencePathHopRecord> hops,
        IReadOnlyList<SecurityEvidenceCutPointRecord> cutPoints)
    {
        ArgumentNullException.ThrowIfNull(path);
        ArgumentNullException.ThrowIfNull(hops);
        ArgumentNullException.ThrowIfNull(cutPoints);

        if (hops.Count == 0)
        {
            return new SecurityEvidencePathExplanationTemplateResponse
            {
                WeakControl = path.WeakestHopReason,
                ArchitectSentence = string.IsNullOrWhiteSpace(path.WeakestHopReason)
                    ? null
                    : $"The path exists because {path.WeakestHopReason.Trim()}.",
            };
        }

        SecurityEvidencePathHopRecord firstHop = hops[0];
        SecurityEvidencePathHopRecord lastHop = hops[^1];
        SecurityEvidencePathHopRecord? weakestHop = hops.FirstOrDefault(hop => hop.HopOrdinal == path.WeakestHopOrdinal)
                                           ?? hops.OrderByDescending(static hop => (int)hop.HopConfidenceBand).First();

        string? identity = ResolveIdentityLabel(hops);
        string? network = ResolveNetworkLabel(hops);
        string? actor = ShortNodeLabel(firstHop.FromNodeId);
        string? asset = ShortNodeLabel(lastHop.ToNodeId);
        string? weakControl = ResolveWeakControl(path, weakestHop);
        SecurityEvidenceCutPointRecord? primaryCutPoint = SelectPrimaryCutPoint(cutPoints);
        string? proposedChange = ResolveProposedChange(path, primaryCutPoint);
        string? verify = ResolveVerify(path, hops, primaryCutPoint);

        SecurityEvidencePathExplanationTemplateResponse slots = new()
        {
            Actor = actor,
            Identity = identity,
            Network = network,
            Asset = asset,
            WeakControl = weakControl,
            ProposedChange = proposedChange,
            Verify = verify,
            ArchitectSentence = BuildArchitectSentence(
                path.PathKind,
                actor,
                identity,
                network,
                asset,
                weakControl,
                proposedChange,
                verify),
        };

        return slots;
    }

    internal static string BuildArchitectSentence(
        PathKind pathKind,
        string? actor,
        string? identity,
        string? network,
        string? asset,
        string? weakControl,
        string? proposedChange,
        string? verify)
    {
        StringBuilder sentence = new();

        if (pathKind == PathKind.CapabilityToFlow)
        {
            AppendCapabilityToFlowOpening(sentence, actor, identity, network, asset);
        }
        else
        {
            AppendStandardPathOpening(sentence, actor, identity, network, asset);
        }

        if (!string.IsNullOrWhiteSpace(weakControl))
        {
            sentence.Append(" The path exists because ");
            sentence.Append(weakControl.Trim());
            sentence.Append('.');
        }

        if (!string.IsNullOrWhiteSpace(proposedChange))
        {
            sentence.Append(" Change ");
            sentence.Append(proposedChange.Trim());
            sentence.Append(" will break the path with minimal operational risk.");
        }

        if (!string.IsNullOrWhiteSpace(verify))
        {
            sentence.Append(" Verify using ");
            sentence.Append(verify.Trim());
            sentence.Append('.');
        }

        string result = sentence.ToString().Trim();

        return SecureNowArchitectHonestyCopyGuard.IsHonestCopy(result)
            ? result
            : string.Empty;
    }

    private static void AppendStandardPathOpening(
        StringBuilder sentence,
        string? actor,
        string? identity,
        string? network,
        string? asset)
    {
        sentence.Append("This configuration creates a path");

        if (!string.IsNullOrWhiteSpace(actor))
        {
            sentence.Append(" from ");
            sentence.Append(actor.Trim());
        }

        if (!string.IsNullOrWhiteSpace(identity))
        {
            sentence.Append(" through identity ");
            sentence.Append(identity.Trim());
        }

        if (!string.IsNullOrWhiteSpace(network))
        {
            sentence.Append(" and network path ");
            sentence.Append(network.Trim());
        }

        if (!string.IsNullOrWhiteSpace(asset))
        {
            sentence.Append(" to asset ");
            sentence.Append(asset.Trim());
        }

        sentence.Append('.');
    }

    private static void AppendCapabilityToFlowOpening(
        StringBuilder sentence,
        string? actor,
        string? identity,
        string? network,
        string? asset)
    {
        string? subject = !string.IsNullOrWhiteSpace(identity) ? identity : actor;

        sentence.Append("This configuration may allow ");

        if (!string.IsNullOrWhiteSpace(subject))
        {
            sentence.Append(subject.Trim());
            sentence.Append(' ');
        }

        sentence.Append("to access ");

        if (!string.IsNullOrWhiteSpace(asset))
        {
            sentence.Append("asset ");
            sentence.Append(asset.Trim());
        }
        else
        {
            sentence.Append("a cited data-bearing asset");
        }

        if (!string.IsNullOrWhiteSpace(network))
        {
            sentence.Append(" via network path ");
            sentence.Append(network.Trim());
            sentence.Append(" that may reach additional destinations");
        }

        sentence.Append('.');
    }

    private static string? ResolveWeakControl(
        SecurityEvidencePathRecord path,
        SecurityEvidencePathHopRecord weakestHop)
    {
        if (!string.IsNullOrWhiteSpace(path.WeakestHopReason))
        {
            return path.WeakestHopReason.Trim();
        }

        return $"{weakestHop.EdgeType} ({weakestHop.HopConfidenceBand})";
    }

    private static SecurityEvidenceCutPointRecord? SelectPrimaryCutPoint(
        IReadOnlyList<SecurityEvidenceCutPointRecord> cutPoints) =>
        cutPoints
            .OrderBy(static cutPoint => cutPoint.CutOrder)
            .ThenByDescending(static cutPoint => cutPoint.PathsCollapsedCount)
            .FirstOrDefault();

    private static string? ResolveProposedChange(
        SecurityEvidencePathRecord path,
        SecurityEvidenceCutPointRecord? primaryCutPoint)
    {
        if (primaryCutPoint is not null)
        {
            if (!string.IsNullOrWhiteSpace(primaryCutPoint.SuggestedPatternKey))
            {
                return HumanizePatternKey(primaryCutPoint.SuggestedPatternKey);
            }

            if (primaryCutPoint.CutKind == SecurityEvidenceCutPointKind.Edge
                && !string.IsNullOrWhiteSpace(primaryCutPoint.EdgeType))
            {
                string fromLabel = ShortNodeLabel(primaryCutPoint.FromNodeId ?? "unknown");
                string toLabel = ShortNodeLabel(primaryCutPoint.ToNodeId ?? "unknown");

                return $"removing {primaryCutPoint.EdgeType} from {fromLabel} to {toLabel}";
            }

            return $"removing cut point {primaryCutPoint.CutKey}";
        }

        if (!string.IsNullOrWhiteSpace(path.WeakestHopReason))
        {
            return path.WeakestHopReason.Trim();
        }

        return null;
    }

    private static string? ResolveVerify(
        SecurityEvidencePathRecord path,
        IReadOnlyList<SecurityEvidencePathHopRecord> hops,
        SecurityEvidenceCutPointRecord? primaryCutPoint)
    {
        if (primaryCutPoint is not null)
        {
            IReadOnlyList<string> evidenceReferences = ParseStringList(primaryCutPoint.EvidenceReferencesJson);

            if (evidenceReferences.Count > 0)
            {
                return evidenceReferences[0];
            }

            return $"cut-point recheck ({primaryCutPoint.CutPointId:D})";
        }

        SecurityEvidencePathHopRecord? weakestHop = hops.FirstOrDefault(hop => hop.HopOrdinal == path.WeakestHopOrdinal);

        if (weakestHop is not null && !string.IsNullOrWhiteSpace(weakestHop.EvidenceReference))
        {
            return weakestHop.EvidenceReference.Trim();
        }

        return "cited hop evidence on the next inventory snapshot";
    }

    private static string HumanizePatternKey(string patternKey)
    {
        string normalized = patternKey
            .Replace(".", " ", StringComparison.Ordinal)
            .Replace("-", " ", StringComparison.Ordinal)
            .Replace("_", " ", StringComparison.Ordinal)
            .Trim();

        return normalized.Length == 0 ? patternKey.Trim() : normalized;
    }

    private static string? ResolveIdentityLabel(IReadOnlyList<SecurityEvidencePathHopRecord> hops)
    {
        IEnumerable<string> identityLabels = hops
            .Where(static hop => hop.EdgeType is GraphEdgeTypes.UsesIdentity
                or GraphEdgeTypes.CanAssume
                or GraphEdgeTypes.HasRole
                or GraphEdgeTypes.FederatesAs)
            .SelectMany(static hop => new[] { hop.FromNodeId, hop.ToNodeId })
            .Where(static nodeId => nodeId.StartsWith(AzureInventoryPrincipalNodeId.Prefix, StringComparison.Ordinal)
                || nodeId.Contains("ManagedIdentity", StringComparison.OrdinalIgnoreCase))
            .Select(ShortNodeLabel)
            .Distinct(StringComparer.OrdinalIgnoreCase);

        string joined = string.Join(" → ", identityLabels);

        return string.IsNullOrWhiteSpace(joined) ? null : joined;
    }

    private static string? ResolveNetworkLabel(IReadOnlyList<SecurityEvidencePathHopRecord> hops)
    {
        SecurityEvidencePathHopRecord? networkHop = hops.FirstOrDefault(static hop =>
            hop.EdgeType is GraphEdgeTypes.RoutesTo or GraphEdgeTypes.Exposes);

        if (networkHop is null)
        {
            return null;
        }

        return $"{ShortNodeLabel(networkHop.FromNodeId)} → {ShortNodeLabel(networkHop.ToNodeId)}";
    }

    internal static string ShortNodeLabel(string nodeId)
    {
        if (string.IsNullOrWhiteSpace(nodeId))
        {
            return string.Empty;
        }

        if (nodeId.StartsWith(AzureInventoryPrincipalNodeId.Prefix, StringComparison.Ordinal))
        {
            return $"principal:{nodeId[^8..]}";
        }

        int lastSlash = nodeId.LastIndexOf('/');

        return lastSlash >= 0 ? nodeId[(lastSlash + 1)..] : nodeId;
    }

    private static IReadOnlyList<string> ParseStringList(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }

        try
        {
            return JsonSerializer.Deserialize<List<string>>(json) ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }
}
