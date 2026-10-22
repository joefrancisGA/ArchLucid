using ArchLucid.Contracts.Integrations;

namespace ArchLucid.Application.Integrations.Itsm.OAuth;

public interface IItsmAtlassianOAuthConsentService
{
    Task<(ItsmAtlassianOAuthConsentStartResponse? Response, string? ErrorMessage)> TryStartAsync(
        Guid tenantId,
        ItsmAtlassianOAuthConsentStartRequest request,
        CancellationToken cancellationToken);

    Task<(ItsmAtlassianOAuthConsentCompleteResponse? Response, string? ErrorMessage)> TryCompleteAsync(
        Guid tenantId,
        ItsmAtlassianOAuthConsentCompleteRequest request,
        CancellationToken cancellationToken);
}
