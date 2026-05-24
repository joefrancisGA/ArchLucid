namespace ArchLucid.Core.Notifications.Email;

/// <summary>Renders transactional email bodies from template ids and view models.</summary>
public interface IEmailTemplateRenderer
{
    Task<string> RenderHtmlAsync(string templateId, object model, CancellationToken cancellationToken);

    Task<string> RenderTextAsync(string templateId, object model, CancellationToken cancellationToken);
}
