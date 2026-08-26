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
               && HasSubstantiveText(EvidenceBundleId);
    }

    /// <summary>
    ///     Rejects blank and invisible-only strings (for example U+200B) that pass
    ///     <see cref="string.IsNullOrWhiteSpace(string?)" /> but are not usable ids.
    /// </summary>
    private static bool HasSubstantiveText(string? value)
    {
        if (string.IsNullOrEmpty(value))
            return false;

        bool hasSubstantive = false;

        foreach (char character in value)
        {

            if (char.IsWhiteSpace(character))
                continue;

            UnicodeCategory category = char.GetUnicodeCategory(character);

            if (category is UnicodeCategory.Format or UnicodeCategory.Control)
                return false;

            hasSubstantive = true;
        }

        return hasSubstantive;
    }

    /// <summary>
    ///     STJ leaves explicit <c>null</c> list properties; connector extractors require materialized lists.
    ///     STJ also preserves <c>null</c> elements inside JSON arrays; normalizers dereference entries and NRE.
    /// </summary>
    public void EnsureMutableCollections()
    {
        if (ContextIngestionRequest is null)
            return;

        ContextIngestionRequest request = ContextIngestionRequest;

        request.InlineRequirements = MaterializeStringList(request.InlineRequirements);
        request.Documents = MaterializeDocumentList(request.Documents);
        request.PolicyReferences = MaterializeStringList(request.PolicyReferences);
        request.TopologyHints = MaterializeStringList(request.TopologyHints);
        request.SecurityBaselineHints = MaterializeStringList(request.SecurityBaselineHints);
        request.InfrastructureDeclarations = MaterializeInfrastructureDeclarationList(request.InfrastructureDeclarations);
        request.RequiredCapabilities = MaterializeStringList(request.RequiredCapabilities);
        request.Constraints = MaterializeStringList(request.Constraints);
        request.Assumptions = MaterializeStringList(request.Assumptions);
    }

    private static List<string> MaterializeStringList(List<string>? values)
    {
        if (values is null)
            return [];

        return values.Where(static value => value is not null).ToList();
    }

    private static List<ContextDocumentReference> MaterializeDocumentList(List<ContextDocumentReference>? values)
    {
        if (values is null)
            return [];

        return values.Where(static document => document is not null).ToList();
    }

    private static List<InfrastructureDeclarationReference> MaterializeInfrastructureDeclarationList(
        List<InfrastructureDeclarationReference>? values)
    {
        if (values is null)
            return [];

        return values.Where(static declaration => declaration is not null).ToList();
    }
}
