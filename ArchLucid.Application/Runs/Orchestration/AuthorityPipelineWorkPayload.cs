using ArchLucid.Application.Runs.Orchestration.Pipeline;
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
    ///     Deferred outbox continuation phase handled by <see cref="IAuthorityPipelineWorkHandler" /> routing.
    /// </summary>
    public AuthorityPipelineWorkKind WorkKind
    {
        get;
        set;
    } = AuthorityPipelineWorkKind.Execute;

    /// <summary>
    ///     Whether the worker can resume deferred authority pipeline work from this payload.
    /// </summary>
    public bool IsValidForProcessing()
    {
        return ContextIngestionRequest is not null
               && HasUsableEvidenceBundleId(EvidenceBundleId)
               && Enum.IsDefined(WorkKind);
    }

    private static bool HasUsableEvidenceBundleId(string? value) => HasUsableIdentifierText(value);

    private static bool HasUsableIdentifierText(string? value)
    {
        if (!HasSubstantiveText(value))
            return false;

        foreach (char character in value!)
        {
            UnicodeCategory category = char.GetUnicodeCategory(character);

            if (category is UnicodeCategory.NonSpacingMark
                or UnicodeCategory.SpacingCombiningMark
                or UnicodeCategory.EnclosingMark)
                return false;
        }

        return true;
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

            if (category is UnicodeCategory.NonSpacingMark
                or UnicodeCategory.SpacingCombiningMark
                or UnicodeCategory.EnclosingMark)
                continue;

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

        request.InlineRequirements = MaterializeReferenceStringList(request.InlineRequirements);
        request.Documents = MaterializeDocumentList(request.Documents);
        request.PolicyReferences = MaterializeReferenceStringList(request.PolicyReferences);
        request.TopologyHints = MaterializeReferenceStringList(request.TopologyHints);
        request.SecurityBaselineHints = MaterializeReferenceStringList(request.SecurityBaselineHints);
        request.InfrastructureDeclarations = MaterializeInfrastructureDeclarationList(request.InfrastructureDeclarations);
        request.RequiredCapabilities = MaterializeReferenceStringList(request.RequiredCapabilities);
        request.Constraints = MaterializeReferenceStringList(request.Constraints);
        request.Assumptions = MaterializeReferenceStringList(request.Assumptions);
    }

    private static List<string> MaterializeStringList(List<string>? values)
    {
        if (values is null)
            return [];

        return values
            .Where(static value => value is not null && HasSubstantiveText(value))
            .ToList();
    }

    private static List<string> MaterializeReferenceStringList(List<string>? values)
    {
        if (values is null)
            return [];

        return values
            .Where(static value => value is not null && HasUsableIdentifierText(value))
            .ToList();
    }

    private static List<ContextDocumentReference> MaterializeDocumentList(List<ContextDocumentReference>? values)
    {
        if (values is null)
            return [];

        return values
            .Where(static document => document is not null && HasSubstantiveDocument(document))
            .ToList();
    }

    private static bool HasSubstantiveDocument(ContextDocumentReference document) =>
        HasUsableIdentifierText(document.Name)
        && HasUsableIdentifierText(document.ContentType)
        && HasUsableIdentifierText(document.Content);

    private static List<InfrastructureDeclarationReference> MaterializeInfrastructureDeclarationList(
        List<InfrastructureDeclarationReference>? values)
    {
        if (values is null)
            return [];

        return values
            .Where(static declaration => declaration is not null && HasSubstantiveInfrastructureDeclaration(declaration))
            .ToList();
    }

    private static bool HasSubstantiveInfrastructureDeclaration(InfrastructureDeclarationReference declaration)
    {
        return HasUsableIdentifierText(declaration.Name)
               && HasUsableIdentifierText(declaration.Format)
               && HasUsableIdentifierText(declaration.Content);
    }
}
