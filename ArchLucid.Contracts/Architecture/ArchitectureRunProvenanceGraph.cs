using System.ComponentModel.DataAnnotations;

using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Architecture;

/// <summary>
///     Linkage graph and timeline for a coordinator architecture run: request, tasks, results, findings,
///     committed manifest, decision traces, and materialized decision nodes.
/// </summary>
public sealed class ArchitectureRunProvenanceGraph
{
    /// <summary>Architecture run identifier (hex string).</summary>
    [Required]
    public string RunId
    {
        get;
        set;
    } = string.Empty;

    /// <summary>Structural nodes (requests, tasks, snapshots, manifest, traces, etc.).</summary>
    private List<ArchitectureLinkageNode> nodes = [];

    public List<ArchitectureLinkageNode> Nodes
    {
        get => nodes;
        set => nodes = ContractCollectionDefaults.Coalesce(value);
    }

    /// <summary>Directed edges describing provenance and containment.</summary>
    private List<ArchitectureLinkageEdge> edges = [];

    public List<ArchitectureLinkageEdge> Edges
    {
        get => edges;
        set => edges = ContractCollectionDefaults.Coalesce(value);
    }

    /// <summary>
    ///     Chronological trace events for operator review (subset of graph, sorted ascending by time).
    /// </summary>
    private List<ArchitectureTraceTimelineEntry> timeline = [];

    public List<ArchitectureTraceTimelineEntry> Timeline
    {
        get => timeline;
        set => timeline = ContractCollectionDefaults.Coalesce(value);
    }

    /// <summary>
    ///     Automated integrity findings (e.g. manifest metadata missing trace ids). Empty when no issues detected.
    /// </summary>
    private List<string> traceabilityGaps = [];

    public List<string> TraceabilityGaps
    {
        get => traceabilityGaps;
        set => traceabilityGaps = ContractCollectionDefaults.Coalesce(value);
    }
}

/// <summary>One vertex in <see cref="ArchitectureRunProvenanceGraph" />.</summary>
public sealed class ArchitectureLinkageNode
{
    /// <summary>Stable id within this graph (e.g. <c>run:abc...</c>).</summary>
    [Required]
    public string Id
    {
        get;
        set;
    } = string.Empty;

    /// <summary>Domain type; use constants on <see cref="ArchitectureLinkageKinds.Nodes" />.</summary>
    [Required]
    public string Type
    {
        get;
        set;
    } = string.Empty;

    /// <summary>External reference (task id, trace id, request id, etc.).</summary>
    [Required]
    public string ReferenceId
    {
        get;
        set;
    } = string.Empty;

    /// <summary>Short display label.</summary>
    [Required]
    public string Name
    {
        get;
        set;
    } = string.Empty;

    /// <summary>Optional facets (agent type, event type, snapshot hints).</summary>
    private Dictionary<string, string> metadata = new(StringComparer.OrdinalIgnoreCase);

    public Dictionary<string, string> Metadata
    {
        get => metadata;
        set => metadata = ContractCollectionDefaults.CoalesceStringDictionaryOrdinalIgnoreCase(value);
    }
}

/// <summary>Directed link between <see cref="ArchitectureLinkageNode" /> instances.</summary>
public sealed class ArchitectureLinkageEdge
{
    [Required]
    public string Id
    {
        get;
        set;
    } = string.Empty;

    /// <summary>Use constants on <see cref="ArchitectureLinkageKinds.Edges" />.</summary>
    [Required]
    public string Type
    {
        get;
        set;
    } = string.Empty;

    [Required]
    public string FromNodeId
    {
        get;
        set;
    } = string.Empty;

    [Required]
    public string ToNodeId
    {
        get;
        set;
    } = string.Empty;

    private Dictionary<string, string> metadata = new(StringComparer.OrdinalIgnoreCase);

    public Dictionary<string, string> Metadata
    {
        get => metadata;
        set => metadata = ContractCollectionDefaults.CoalesceStringDictionaryOrdinalIgnoreCase(value);
    }
}

/// <summary>One row in the run trace timeline.</summary>
public sealed class ArchitectureTraceTimelineEntry
{
    public DateTime TimestampUtc
    {
        get;
        set;
    }

    /// <summary>Use constants on <see cref="ArchitectureLinkageKinds.Timeline" />.</summary>
    [Required]
    public string Kind
    {
        get;
        set;
    } = string.Empty;

    [Required]
    public string Label
    {
        get;
        set;
    } = string.Empty;

    public string? ReferenceId
    {
        get;
        set;
    }

    private Dictionary<string, string> metadata = new(StringComparer.OrdinalIgnoreCase);

    public Dictionary<string, string> Metadata
    {
        get => metadata;
        set => metadata = ContractCollectionDefaults.CoalesceStringDictionaryOrdinalIgnoreCase(value);
    }
}
