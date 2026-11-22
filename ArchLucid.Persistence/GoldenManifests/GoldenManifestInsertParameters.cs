using ArchLucid.Contracts.Common;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.GoldenManifests;

/// <summary>
///     Dapper parameter objects for the <c>dbo.GoldenManifests</c> insert, its phase-1 relational slice inserts, and the
///     scoped lookups.
/// </summary>
internal static class GoldenManifestInsertParameters
{
    /// <summary>Matches <c>dbo.GoldenManifests.ContractManifestVersion</c> NVARCHAR(128).</summary>
    private const int ContractManifestVersionMaxLength = 128;

    public static object Create(
        ManifestDocument manifest,
        GoldenManifestSerializedPayload payload,
        string? manifestPayloadBlobUri)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        ArgumentNullException.ThrowIfNull(payload);

        bool payloadIsOffloaded = !string.IsNullOrWhiteSpace(manifestPayloadBlobUri);
        string metadataJson = payloadIsOffloaded ? string.Empty : payload.MetadataJson;
        string requirementsJson = payloadIsOffloaded ? string.Empty : payload.RequirementsJson;
        string topologyJson = payloadIsOffloaded ? string.Empty : payload.TopologyJson;
        string securityJson = payloadIsOffloaded ? string.Empty : payload.SecurityJson;
        string complianceJson = payloadIsOffloaded ? string.Empty : payload.ComplianceJson;
        string costJson = payloadIsOffloaded ? string.Empty : payload.CostJson;
        string constraintsJson = payloadIsOffloaded ? string.Empty : payload.ConstraintsJson;
        string unresolvedIssuesJson = payloadIsOffloaded ? string.Empty : payload.UnresolvedIssuesJson;
        string decisionsJson = payloadIsOffloaded ? string.Empty : payload.DecisionsJson;
        string assumptionsJson = payloadIsOffloaded ? string.Empty : payload.AssumptionsJson;
        string warningsJson = payloadIsOffloaded ? string.Empty : payload.WarningsJson;
        string provenanceJson = payloadIsOffloaded ? string.Empty : payload.ProvenanceJson;
        string hasherBoundJson = payloadIsOffloaded ? string.Empty : payload.HasherBoundJson;

        return new
        {
            manifest.TenantId,
            manifest.WorkspaceId,
            manifest.ProjectId,
            manifest.ManifestId,
            manifest.RunId,
            manifest.ContextSnapshotId,
            manifest.GraphSnapshotId,
            manifest.FindingsSnapshotId,
            manifest.DecisionTraceId,
            manifest.CreatedUtc,
            manifest.ManifestHash,
            manifest.RuleSetId,
            manifest.RuleSetVersion,
            manifest.RuleSetHash,
            MetadataJson = metadataJson,
            RequirementsJson = requirementsJson,
            TopologyJson = topologyJson,
            SecurityJson = securityJson,
            ComplianceJson = complianceJson,
            CostJson = costJson,
            ConstraintsJson = constraintsJson,
            UnresolvedIssuesJson = unresolvedIssuesJson,
            DecisionsJson = decisionsJson,
            AssumptionsJson = assumptionsJson,
            WarningsJson = warningsJson,
            ProvenanceJson = provenanceJson,
            HasherBoundJson = hasherBoundJson,
            ManifestPayloadBlobUri = manifestPayloadBlobUri,
            LifecycleStatus = nameof(GoldenManifestLifecycleStatus.Active),
            ContractManifestVersion = ResolveContractManifestVersion(manifest)
        };
    }

    public static object DecisionRow(ManifestDocument manifest, int sortOrder, ResolvedArchitectureDecision decision)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        ArgumentNullException.ThrowIfNull(decision);

        return new
        {
            manifest.ManifestId,
            SortOrder = sortOrder,
            decision.DecisionId,
            decision.Category,
            decision.Title,
            decision.SelectedOption,
            decision.Rationale,
            decision.RawDecisionJson,
            decision.Confidence,
            ConfidenceSource = decision.ConfidenceSource.ToString(),
            manifest.TenantId,
            manifest.WorkspaceId,
            manifest.ProjectId
        };
    }

    /// <summary>Shared by the slice count statements, which all filter on manifest plus the scope triple.</summary>
    public static object SliceScope(ManifestDocument manifest)
    {
        ArgumentNullException.ThrowIfNull(manifest);

        return new
        {
            manifest.ManifestId,
            manifest.TenantId,
            manifest.WorkspaceId,
            manifest.ProjectId
        };
    }

    public static object ForManifest(ScopeContext scope, Guid manifestId)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return new
        {
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            ManifestId = manifestId
        };
    }

    public static object ForContractManifestVersion(ScopeContext scope, string manifestVersion)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return new
        {
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            ManifestVersion = manifestVersion
        };
    }

    public static object ForPriorRetrieval(ScopeContext scope, Guid excludeRunId, int maxManifests)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return new
        {
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            ExcludeRunId = excludeRunId,
            MaxManifests = maxManifests
        };
    }

    public static object ForSupersede(ScopeContext scope, Guid newManifestId)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return new
        {
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            NewManifestId = newManifestId,
            ActiveStatus = nameof(GoldenManifestLifecycleStatus.Active),
            SupersededStatus = nameof(GoldenManifestLifecycleStatus.Superseded)
        };
    }

    /// <summary>
    ///     Maps <see cref="ManifestMetadata.Version" /> to the typed <c>ContractManifestVersion</c> column (the same value
    ///     persisted at <c>MetadataJson</c> <c>$.Version</c>).
    /// </summary>
    public static string? ResolveContractManifestVersion(ManifestDocument manifest)
    {
        ArgumentNullException.ThrowIfNull(manifest);

        string? version = manifest.Metadata?.Version;

        if (string.IsNullOrWhiteSpace(version))
            return null;

        string trimmed = version.Trim();

        return trimmed.Length > ContractManifestVersionMaxLength
            ? trimmed[..ContractManifestVersionMaxLength]
            : trimmed;
    }
}
