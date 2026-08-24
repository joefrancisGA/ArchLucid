using ArchLucid.Contracts.Persistence.Context;
using System.Globalization;

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
               && HasSubstantiveText(EvidenceBundleId)
               && HasSubstantiveText(ContextIngestionRequest.ProjectId);
    }

    /// <summary>
    ///     Rejects blank and invisible-only strings (for example U+200B) that pass
    ///     <see cref="string.IsNullOrWhiteSpace(string?)" /> but are not usable ids.
    /// </summary>
    private static bool HasSubstantiveText(string? value)
    {
        if (string.IsNullOrEmpty(value))
            return false;

        foreach (char character in value)
        {
            if (char.IsWhiteSpace(character))
                continue;

            UnicodeCategory category = char.GetUnicodeCategory(character);

            if (category is UnicodeCategory.Format or UnicodeCategory.Control)
                continue;

            return true;
        }

        return false;
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
