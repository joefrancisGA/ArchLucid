using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Core.Security;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Integrations.Itsm;

/// <summary>
///     HTTP-facing facade for inbound ITSM webhook routes previously in <c>ItsmInboundWebhooksController</c>.
/// </summary>
public interface IItsmInboundWebhookFacade
{
    Task<ItsmInboundWebhookProcessHttpResult> ProcessAsync(
        ItsmInboundWebhookProcessRequest request,
        CancellationToken cancellationToken);
}
