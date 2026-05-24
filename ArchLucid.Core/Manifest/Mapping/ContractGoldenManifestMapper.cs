using ArchLucid.Core.Scoping;

using ArchLucid.Core.Manifest.Sections;


using Cm = ArchLucid.Contracts.Manifest;

namespace ArchLucid.Core.Manifest.Mapping;

/// <summary>
///     Maps a coordinator-shaped <see cref="Cm.GoldenManifest" /> into an authority
///     <see cref="ManifestDocument" /> for persistence.
/// </summary>
/// <remarks>
///     <para>
///         <strong>Naming:</strong> <c>GoldenManifest</c> (Contracts coordinator DTO) is the wire/snapshot shape produced
///         by the coordinator pipeline; <see cref="ManifestDocument" /> is the authority persistence model written to
///         <c>dbo.GoldenManifests</c>. Both represent the same committed manifest at different layer boundaries — not
///         two competing sources of truth.
///     </para>
/// </remarks>
public static class ContractGoldenManifestMapper
{
    public static ManifestDocument ToAuthorityModel(
        Cm.GoldenManifest contract,
        ScopeContext scope,
        SaveContractsManifestOptions keying)
    {
        if (contract is null)
            throw new ArgumentNullException(nameof(contract));

        if (scope is null)
            throw new ArgumentNullException(nameof(scope));

        if (keying is null)
            throw new ArgumentNullException(nameof(keying));

        ManifestDocument model = new()
        {
            SchemaVersion = 1,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            ManifestId = keying.ManifestId,
            RunId = keying.RunId,
            ContextSnapshotId = keying.ContextSnapshotId,
            GraphSnapshotId = keying.GraphSnapshotId,
            FindingsSnapshotId = keying.FindingsSnapshotId,
            DecisionTraceId = keying.DecisionTraceId,
            CreatedUtc = keying.CreatedUtc,
            ManifestHash = string.Empty,
            RuleSetId = keying.RuleSetId,
            RuleSetVersion = keying.RuleSetVersion,
            RuleSetHash = keying.RuleSetHash,
            Metadata = new ManifestMetadata
            {
                Name = contract.SystemName, Version = contract.Metadata.ManifestVersion, Status = "Draft", Summary = contract.Metadata.ChangeDescription
            },
            Topology =
            {
                Services = [.. contract.Services],
                Datastores = [.. contract.Datastores],
                Relationships = [.. contract.Relationships],
                Resources =
                [
                    .. contract.Services.Select(s => s.ServiceName)
                        .Concat(contract.Datastores.Select(d => d.DatastoreName))
                ]
            },
            Security =
            {
                Controls =
                [
                    .. contract.Services.SelectMany(s => s.RequiredControls.Select(c =>
                        new SecurityPostureItem { ControlName = c, Status = "stated", ControlId = c, Impact = string.Empty }))
                ]
            },
            Compliance =
            {
                Controls =
                [
                    .. contract.Governance.ComplianceTags
                        .Select(t => new CompliancePostureItem { ControlName = t, ControlId = t, AppliesToCategory = "governance", Status = "Tagged" })
                ]
            },
            Policy = { Notes = [.. contract.Governance.PolicyConstraints] }
        };

        return model;
    }
}
