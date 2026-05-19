using ArchLucid.Core.Configuration.Summary;

namespace ArchLucid.Api.Services.Admin;

public interface IAdminApiKeySettingsService
{
    AdminApiKeySettingsResponse GetSnapshot();

    AdminApiKeyRotateResponse Rotate(AdminApiKeyRotateRequest request);
}
