using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.RemediationInstances;

public sealed class RemediationPathNarrativeBuilder(
    ISecurityEvidencePathRepository pathRepository,
    ISecurityEvidenceCutPointRepository cutPointRepository) : IRemediationPathNarrativeBuilder
{
    public async Task<RemediationPathNarrative?> TryBuildAsync(
        ScopeContext scope,
        OperationalSecurityFindingRecord finding,
        RemediationPatternVersionRecord patternVersion,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(finding);
        ArgumentNullException.ThrowIfNull(patternVersion);

        if (finding.PathId is not Guid pathId || pathId == Guid.Empty)
        {
            return null;
        }

        SecurityEvidencePathRecord? path =
            await pathRepository.TryGetByIdAsync(scope.TenantId, pathId, cancellationToken);

        if (path is null
            || path.WorkspaceId != scope.WorkspaceId
            || path.ProjectId != scope.ProjectId)
        {
            return null;
        }

        IReadOnlyList<SecurityEvidencePathHopRecord> hops =
            await pathRepository.ListHopsByPathAsync(scope.TenantId, pathId, cancellationToken);

        IReadOnlyList<SecurityEvidenceCutPointRecord> cutPoints =
            await cutPointRepository.ListByPathIdAsync(scope.TenantId, pathId, cancellationToken);

        RemediationInstanceGuard.TryParsePatternContent(
            patternVersion,
            out RemediationPatternVersionContent? patternContent,
            out _);

        IReadOnlyList<Guid> dependencyIds = ExtractDependencyCloudResourceIds(hops);
        SecurityEvidenceCutPointRecord? preferredCutPoint = SelectPreferredCutPoint(cutPoints);
        bool publicAccessPath = IsPublicAccessPath(path.PathKind, hops);

        (string recommendedChange, string recommendedChangeSource) = BuildRecommendedChange(
            path,
            hops,
            preferredCutPoint,
            patternContent);

        IReadOnlyList<string> rolloutSteps = publicAccessPath
            ? BuildPublicAccessRolloutSteps()
            : BuildGenericRolloutSteps();

        IReadOnlyList<string> verificationQueries = BuildVerificationQueries(
            path,
            patternContent,
            publicAccessPath);

        return new RemediationPathNarrative
        {
            PathId = pathId,
            PathKind = path.PathKind.ToString(),
            PathConfidenceBand = path.PathConfidenceBand.ToString(),
            ProblemStatement = BuildProblemStatement(path, hops),
            WhyItMatters = BuildWhyItMatters(path),
            ExposureSummary = BuildExposureSummary(path),
            AffectedDependencyCloudResourceIds = dependencyIds,
            RecommendedChange = recommendedChange,
            RecommendedChangeSource = recommendedChangeSource,
            Preconditions = BuildPreconditions(patternVersion, publicAccessPath),
            BlastRadiusWarning = BuildBlastRadiusWarning(dependencyIds),
            SafeRolloutSteps = rolloutSteps,
            VerificationQueries = verificationQueries,
            WeakestHopReason = path.WeakestHopReason,
            CanonicalHopHashHex = Convert.ToHexStringLower(path.CanonicalHopHashSha256),
        };
    }

    private static IReadOnlyList<Guid> ExtractDependencyCloudResourceIds(
        IReadOnlyList<SecurityEvidencePathHopRecord> hops) =>
        hops
            .Where(hop => hop.CloudResourceId is Guid cloudResourceId && cloudResourceId != Guid.Empty)
            .Select(hop => hop.CloudResourceId!.Value)
            .Distinct()
            .OrderBy(id => id)
            .ToList();

    private static SecurityEvidenceCutPointRecord? SelectPreferredCutPoint(
        IReadOnlyList<SecurityEvidenceCutPointRecord> cutPoints) =>
        cutPoints
            .OrderBy(cutPoint => cutPoint.CutOrder)
            .ThenByDescending(cutPoint => cutPoint.PathsCollapsedCount)
            .FirstOrDefault();

    private static (string RecommendedChange, string RecommendedChangeSource) BuildRecommendedChange(
        SecurityEvidencePathRecord path,
        IReadOnlyList<SecurityEvidencePathHopRecord> hops,
        SecurityEvidenceCutPointRecord? cutPoint,
        RemediationPatternVersionContent? patternContent)
    {
        if (cutPoint is not null)
        {
            string patternHint = string.IsNullOrWhiteSpace(cutPoint.SuggestedPatternKey)
                ? string.Empty
                : $" Approved-pattern hint: {cutPoint.SuggestedPatternKey}.";

            return (
                $"Cut {cutPoint.CutKind} at '{cutPoint.CutKey}' — collapses {cutPoint.PathsCollapsedCount} ranked path(s). "
                + $"Operational cost class: {cutPoint.OperationalCostClass}.{patternHint}",
                RemediationPathNarrativeRecommendedChangeSources.CutPoint);
        }

        if (!string.IsNullOrWhiteSpace(patternContent?.ControlObjective))
        {
            return (patternContent.ControlObjective.Trim(), RemediationPathNarrativeRecommendedChangeSources.Pattern);
        }

        return (
            $"Address weakest hop on path {path.PathId:D}: {path.WeakestHopReason}",
            RemediationPathNarrativeRecommendedChangeSources.WeakestHop);
    }

    private static string BuildProblemStatement(
        SecurityEvidencePathRecord path,
        IReadOnlyList<SecurityEvidencePathHopRecord> hops)
    {
        string terminal = ShortNodeLabel(hops.LastOrDefault()?.ToNodeId ?? "unknown-target");

        return path.PathKind switch
        {
            PathKind.Privilege =>
                $"Transitive privilege path {path.PathId:D} grants access ending at {terminal}. Weakest link: {path.WeakestHopReason}.",
            PathKind.IntendedReachability =>
                $"Intended reachability path {path.PathId:D} exposes a control-plane route from public exposure to {terminal}.",
            PathKind.ToxicCombination =>
                $"Toxic combination path {path.PathId:D} composes public exposure, privileged identity, and/or unrestricted egress.",
            PathKind.FourRealityDrift =>
                $"Four-reality drift path {path.PathId:D} shows observed Azure access wider than Terraform, diagram, or historical posture.",
            PathKind.SharedControlBlastRadius =>
                $"Shared-control blast-radius path {path.PathId:D} fans out through a shared identity or policy.",
            PathKind.CapabilityToFlow =>
                $"Capability-to-flow path {path.PathId:D} may enable information movement to {terminal} (not observed traffic).",
            _ =>
                $"Security evidence path {path.PathId:D} ({path.PathKind}) requires architect remediation.",
        };
    }

    private static string BuildWhyItMatters(SecurityEvidencePathRecord path) =>
        path.PathConfidenceBand switch
        {
            PathConfidenceBand.HighlyLikely =>
                "Highly likely path — compromise or misconfiguration can be exercised with limited additional assumptions.",
            PathConfidenceBand.Probable =>
                "Probable path — treat as production exposure until independently verified closed on the next snapshot.",
            PathConfidenceBand.Possible =>
                "Possible path — validate before broad rollout, but do not dismiss without snapshot verification.",
            _ =>
                "Path confidence is insufficient — gather evidence before production change, then verify on the next snapshot.",
        };

    private static string BuildExposureSummary(SecurityEvidencePathRecord path) =>
        $"{path.PathKind} path with {path.PathConfidenceBand} confidence. Weakest hop: {path.WeakestHopReason}.";

    private static IReadOnlyList<string> BuildPreconditions(
        RemediationPatternVersionRecord patternVersion,
        bool publicAccessPath)
    {
        List<string> preconditions =
        [
            "Active operational-security exception on the finding (IE-12) must pass preflight.",
            $"Frozen remediation pattern {patternVersion.PatternId:D} v{patternVersion.Version} is bound to this instance.",
        ];

        if (patternVersion.AutomationLevel is RemediationAutomationLevel.SemiAutomated
            or RemediationAutomationLevel.Automated)
        {
            preconditions.Add("Rollback definition must be present in the frozen pattern before semi/automated execute.");
        }

        if (publicAccessPath)
        {
            preconditions.Add("Private DNS zone and subnet routing for the target service must be prepared before disabling public access.");
        }

        return preconditions;
    }

    private static string BuildBlastRadiusWarning(IReadOnlyList<Guid> dependencyIds)
    {
        if (dependencyIds.Count == 0)
        {
            return "No CloudResourceId hops were captured on this path; validate dependents manually before change.";
        }

        string idList = string.Join(", ", dependencyIds.Select(id => id.ToString("D")));

        return $"Operational blast radius — changing this path may affect CloudResourceIds: {idList}.";
    }

    private static IReadOnlyList<string> BuildPublicAccessRolloutSteps() =>
    [
        "Create a private endpoint for the target service in the consuming VNet/subnet.",
        "Validate private DNS resolution from a canary subnet or jump host.",
        "Migrate one canary workload to private connectivity and confirm application health.",
        "Migrate remaining dependents listed in the blast-radius warning.",
        "Disable public network access / remove public endpoint exposure on the target resource.",
        "Capture a new inventory snapshot and run verification queries (including path-hash-absent).",
    ];

    private static IReadOnlyList<string> BuildGenericRolloutSteps() =>
    [
        "Review cited path hops and dependent CloudResourceIds with service owners.",
        "Apply the recommended change during an approved maintenance window.",
        "Capture a new inventory snapshot after the change.",
        "Run verification queries against the post-change snapshot.",
    ];

    private static IReadOnlyList<string> BuildVerificationQueries(
        SecurityEvidencePathRecord path,
        RemediationPatternVersionContent? patternContent,
        bool publicAccessPath)
    {
        HashSet<string> queries = new(StringComparer.OrdinalIgnoreCase);

        foreach (string query in patternContent?.Execution?.VerificationQueries ?? [])
        {
            if (!string.IsNullOrWhiteSpace(query))
            {
                queries.Add(query.Trim());
            }
        }

        queries.Add($"path:hash-absent={Convert.ToHexStringLower(path.CanonicalHopHashSha256)}");

        if (publicAccessPath)
        {
            queries.Add("property:enablePublicNetworkAccess=false");
        }

        return queries.OrderBy(query => query, StringComparer.Ordinal).ToList();
    }

    private static bool IsPublicAccessPath(PathKind pathKind, IReadOnlyList<SecurityEvidencePathHopRecord> hops)
    {
        if (pathKind is PathKind.IntendedReachability
            or PathKind.ToxicCombination
            or PathKind.FourRealityDrift)
        {
            return hops.Any(hop =>
                hop.FromNodeId.Equals(SecureNowArchitectConstants.InternetPublicExposureNodeId, StringComparison.Ordinal)
                || hop.EdgeType.Equals(SecureNowArchitectConstants.PublicNetworkAccessHopEdgeType, StringComparison.OrdinalIgnoreCase));
        }

        return false;
    }

    private static string ShortNodeLabel(string nodeId)
    {
        if (nodeId.Equals(SecureNowArchitectConstants.InternetPublicExposureNodeId, StringComparison.Ordinal))
        {
            return "internet";
        }

        int lastSlash = nodeId.LastIndexOf('/');

        return lastSlash >= 0 ? nodeId[(lastSlash + 1)..] : nodeId;
    }
}
