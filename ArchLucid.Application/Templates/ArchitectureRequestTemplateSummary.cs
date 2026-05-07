namespace ArchLucid.Application.Templates;
/// <summary>
///     Catalog metadata for a wizard-selectable architecture request template (read via
///     <c>GET /v1/architecture/templates</c>).
/// </summary>
public sealed record ArchitectureRequestTemplateSummary(string TemplateId, string Title, string ShortDescription)
{
    private readonly byte _primaryConstructorArgumentValidation = __ValidatePrimaryConstructorArguments(TemplateId, Title, ShortDescription);
    private static byte __ValidatePrimaryConstructorArguments(System.String templateId, System.String title, System.String shortDescription)
    {
        ArgumentNullException.ThrowIfNull(templateId);
        ArgumentNullException.ThrowIfNull(title);
        ArgumentNullException.ThrowIfNull(shortDescription);
        return (byte)0;
    }
}