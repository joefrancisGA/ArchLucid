using System.ComponentModel.DataAnnotations;

using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Manifest;

/// <summary>
///     The authoritative resolved architecture manifest produced by a committed run.
///     Contains all services, datastores, relationships, governance metadata, and versioning
///     information that describe the target architecture state.
/// </summary>
public sealed class GoldenManifest
{
    /// <summary>Identifier of the run that produced this manifest.</summary>
    [Required]
    public string RunId
    {
        get;
        set;
    } = string.Empty;

    /// <summary>Name of the system described by this architecture manifest.</summary>
    [Required]
    public string SystemName
    {
        get;
        set;
    } = string.Empty;

    /// <summary>All resolved services included in the target architecture.</summary>
    [Required]
    private List<ManifestService> services = [];

    public List<ManifestService> Services
    {
        get => services;
        set => services = ContractCollectionDefaults.Coalesce(value);
    }

    /// <summary>All resolved datastores included in the target architecture.</summary>
    [Required]
    private List<ManifestDatastore> datastores = [];

    public List<ManifestDatastore> Datastores
    {
        get => datastores;
        set => datastores = ContractCollectionDefaults.Coalesce(value);
    }

    /// <summary>All resolved inter-service and service-to-datastore relationships.</summary>
    [Required]
    private List<ManifestRelationship> relationships = [];

    public List<ManifestRelationship> Relationships
    {
        get => relationships;
        set => relationships = ContractCollectionDefaults.Coalesce(value);
    }

    /// <summary>
    ///     Governance metadata for this manifest including compliance tags, policy
    ///     constraints, required controls, and risk classification.
    /// </summary>
    [Required]
    private ManifestGovernance governance = new();

    public ManifestGovernance Governance
    {
        get => governance;
        set => governance = value ?? new ManifestGovernance();
    }

    /// <summary>
    ///     Version, schema, and provenance metadata for this manifest snapshot.
    /// </summary>
    [Required]
    private ManifestMetadata metadata = new();

    public ManifestMetadata Metadata
    {
        get => metadata;
        set => metadata = value ?? new ManifestMetadata();
    }

    /// <summary>Semantic diagram overlay: actors, trust, requirements, and decisions (TB-2351).</summary>
    private ManifestDiagramSemanticOverlay diagramSemantics = new();

    public ManifestDiagramSemanticOverlay DiagramSemantics
    {
        get => diagramSemantics;
        set => diagramSemantics = value ?? new ManifestDiagramSemanticOverlay();
    }
}
