namespace ArchLucid.Application.Notifications.Email;

public interface IEmailTemplateRenderer
{
    Task<string> RenderHtmlAsync(string templateId, object model, CancellationToken cancellationToken);

    Task<string> RenderTextAsync(string templateId, object model, CancellationToken cancellationToken);
}
