namespace ArchLucid.Api.Auth.Services;

public interface ILocalTrialJwtIssuer
{
    string IssueAccessToken(Guid userId, string email, string role, Guid tenantId, Guid workspaceId, Guid projectId);
}
