namespace ArchLucid.Application.Templates;

/// <summary>
///     Catalog metadata for a wizard-selectable architecture request template (read via
///     <c>GET /v1/architecture/templates</c>).
/// </summary>
public sealed record ArchitectureRequestTemplateSummary
{
    public string TemplateId
    {
        get;
        init;
    }

    public string Title
    {
        get;
        init;
    }

    public string ShortDescription
    {
        get;
        init;
    }

    public ArchitectureRequestTemplateSummary(string templateId, string title, string shortDescription)
    {
        TemplateId = templateId ?? throw new ArgumentNullException(nameof(templateId));
        Title = title ?? throw new ArgumentNullException(nameof(title));
        ShortDescription = shortDescription ?? throw new ArgumentNullException(nameof(shortDescription));
    }
}
