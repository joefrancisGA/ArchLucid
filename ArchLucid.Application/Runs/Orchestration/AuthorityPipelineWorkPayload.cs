using ArchLucid.Contracts.Persistence.Context;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     JSON payload stored in <c>dbo.AuthorityPipelineWorkOutbox</c> for deferred authority continuation.
/// </summary>
public sealed class AuthorityPipelineWorkPayload
{
    public ContextIngestionRequest ContextIngestionRequest
    {
        get;
        set;
    } = null!;

    /// <summary>
    ///     Evidence bundle id persisted during deferred create before the worker completes.
    /// </summary>
    public string EvidenceBundleId
    {
        get;
        set;
    } = "";

    /// <summary>
    ///     Whether the worker can resume deferred authority pipeline work from this payload.
    /// </summary>
    public bool IsValidForProcessing()
    {
        return ContextIngestionRequest is not null
               && !string.IsNullOrWhiteSpace(EvidenceBundleId)
               && !string.IsNullOrWhiteSpace(ContextIngestionRequest.ProjectId);
    }

    /// <summary>
    ///     STJ leaves explicit <c>null</c> list properties; connector extractors require materialized lists.
    /// </summary>
    public void EnsureMutableCollections()
    {
        if (ContextIngestionRequest is null)
            return;

        ContextIngestionRequest request = ContextIngestionRequest;

        request.InlineRequirements ??= [];
        request.Documents ??= [];
        request.PolicyReferences ??= [];
        request.TopologyHints ??= [];
        request.SecurityBaselineHints ??= [];
        request.InfrastructureDeclarations ??= [];
        request.RequiredCapabilities ??= [];
        request.Constraints ??= [];
        request.Assumptions ??= [];

        PruneNullReferenceElements(request.Documents);
        PruneNullReferenceElements(request.InfrastructureDeclarations);
    }

    private static void PruneNullReferenceElements<T>(List<T> values)
        where T : class
    {
        if (values.Count == 0)
            return;

        values.RemoveAll(static value => value is null);
    }
}
