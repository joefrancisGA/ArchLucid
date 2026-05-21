using System.Reflection;

using ArchLucid.Application.Exports.ArchitectureReviewBoard;

using HandlebarsDotNet;

namespace ArchLucid.Application.Exports;

/// <summary>Renders <see cref="RunSummaryOnePagerDocumentModel" /> via embedded Handlebars template.</summary>
public static class RunSummaryOnePagerMarkdownRenderer
{
    private const string TemplateResourceName =
        "ArchLucid.Application.Exports.Templates.run-summary-one-pager.md.hbs";

    private static readonly Lazy<Func<object, string>> CompiledTemplate = new(CompileTemplate);

    public static string Render(RunSummaryOnePagerDocumentModel model)
    {
        ArgumentNullException.ThrowIfNull(model);
        return CompiledTemplate.Value(model);
    }

    private static Func<object, string> CompileTemplate()
    {
        Assembly assembly = typeof(RunSummaryOnePagerMarkdownRenderer).Assembly;
        using Stream? stream = assembly.GetManifestResourceStream(TemplateResourceName);

        if (stream is null)
            throw new InvalidOperationException($"Embedded template not found: {TemplateResourceName}");

        using StreamReader reader = new(stream);
        string templateSource = reader.ReadToEnd();
        HandlebarsTemplate<object, object> template = Handlebars.Compile(templateSource);

        return context =>
        {
            object? rendered = template(context);
            return rendered?.ToString() ?? string.Empty;
        };
    }
}
