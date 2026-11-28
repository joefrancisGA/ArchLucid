using System.Security.Cryptography;

using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph.Serialization;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>Opt-in observation of exact projection repeats. It does not cache, persist, or serve a projection.</summary>
public sealed partial class SecureNowProjectionReuseObserver(
    TimeProvider clock, ILogger<SecureNowProjectionReuseObserver> logger)
{
    internal const int Capacity = 64;
    private static readonly TimeSpan Window = TimeSpan.FromHours(1);
    private const int MaxPayloadBytes = 4 * 1024 * 1024;
    private readonly object _gate = new();
    private readonly Dictionary<Key, Cohort> _active = [];

    internal long? Start(AzureInventorySnapshotDetailReadModel snapshot, ScopeContext scope, Guid snapshotId)
    {
        try
        {
            AzureInventorySnapshotRecord header = snapshot.Header;
            return logger.IsEnabled(LogLevel.Trace)
                && header.SnapshotId == snapshotId
                && scope.TenantId != Guid.Empty && scope.WorkspaceId != Guid.Empty && scope.ProjectId != Guid.Empty
                && header.TenantId == scope.TenantId && header.WorkspaceId == scope.WorkspaceId && header.ProjectId == scope.ProjectId
                && header is { CaptureStatus: AzureInventoryCaptureStatus.Succeeded, ContentHashSha256.Length: 32,
                    CompletenessScore: 1m, ErrorCount: 0, WarningCount: 0 }
                && snapshot.Resources.Count is >= 2048 and <= 8192
                && snapshot.Properties.Count <= 32768 && snapshot.Relationships.Count <= 32768
                ? clock.GetTimestamp()
                : null;
        }
        catch (Exception ex) when (ex is not OutOfMemoryException)
        {
            return null;
        }
    }

    internal void Record(AzureInventorySnapshotRecord snapshot, GraphSnapshot graph, long started,
        bool includeNeverShowArmTypes, bool retainIdentityDiagramArmTypes)
    {
        try
        {
            long projected = clock.GetTimestamp();

            if (graph.Nodes.Count is < 2048 or > 8192 || graph.Edges.Count > 32768)
                return;

            byte[] bytes = GraphSnapshotMessagePackSerialization.SerializeSnapshot(graph);

            if (bytes.Length is 0 or > MaxPayloadBytes)
            {
                LogDropped("payload_size");
                return;
            }

            Key key = new(snapshot.TenantId, snapshot.WorkspaceId, snapshot.ProjectId, snapshot.SnapshotId,
                Convert.ToHexString(snapshot.ContentHashSha256!), Convert.ToHexString(SHA256.HashData(bytes)),
                includeNeverShowArmTypes, retainIdentityDiagramArmTypes);
            List<Cohort> closed = [];
            bool capacityDrop = false;

            lock (_gate)
            {
                long observed = clock.GetTimestamp();

                foreach ((Key expiredKey, Cohort cohort) in _active)
                {
                    if (clock.GetElapsedTime(cohort.Published, observed) >= Window)
                    {
                        closed.Add(cohort);
                        _active.Remove(expiredKey);
                    }
                }

                if (_active.TryGetValue(key, out Cohort? active))
                {
                    // A concurrent projection begun before publication could not have reused the derivative.

                    if (started >= active.Published && active.Repeats < int.MaxValue)
                        active.Repeats++;
                }
                else if (_active.Count >= Capacity)
                {
                    capacityDrop = true;
                }
                else
                {
                    _active.Add(key, new Cohort(observed, graph.Nodes.Count, bytes.Length,
                        clock.GetElapsedTime(started, projected).TotalMilliseconds));
                }
            }

            foreach (Cohort cohort in closed)
            {
                LogClosed(cohort.Nodes, cohort.Bytes, cohort.Repeats, cohort.ComputeMs);
            }

            if (capacityDrop)
                LogDropped("capacity");
        }
        catch (Exception ex) when (ex is not OutOfMemoryException)
        {
            // Diagnostics are best-effort. Never change a successfully computed response.
        }
    }

    [LoggerMessage(EventId = 8505, Level = LogLevel.Trace,
        Message = "FND-085 projection cohort closed. Nodes={Nodes} BinaryBytes={BinaryBytes} Repeats={Repeats} ComputeMs={ComputeMs}")]
    private partial void LogClosed(int nodes, int binaryBytes, int repeats, double computeMs);

    [LoggerMessage(EventId = 8506, Level = LogLevel.Trace, Message = "FND-085 projection observation dropped. Reason={Reason}")]
    private partial void LogDropped(string reason);

    private readonly record struct Key(Guid Tenant, Guid Workspace, Guid Project, Guid Snapshot,
        string CaptureDigest, string ProjectionDigest, bool IncludeInvisible, bool RetainIdentity);

    private sealed class Cohort(long published, int nodes, int bytes, double computeMs)
    {
        public long Published { get; } = published;
        public int Nodes { get; } = nodes;
        public int Bytes { get; } = bytes;
        public double ComputeMs { get; } = computeMs;
        public int Repeats { get; set; }
    }
}
