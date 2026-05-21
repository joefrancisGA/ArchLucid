using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

using ArchLucid.Core.Scoping;

using Microsoft.IdentityModel.Tokens;

namespace ArchLucid.Api.Services.Admin;

/// <summary>Mints short-lived preview JWTs for the SSO wizard sandbox (not accepted by live API auth).</summary>
public static class SsoWizardSandboxJwtIssuer
{
    private const string PreviewIssuer = "archlucid-sso-wizard-preview";
    private const string PreviewAudience = "archlucid-sso-wizard-sandbox";

    public static string IssuePreviewToken(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        IReadOnlyList<string> mappedRoles,
        TimeSpan lifetime)
    {
        byte[] keyBytes = Encoding.UTF8.GetBytes("archlucid-sso-wizard-preview-signing-key-v1");
        SymmetricSecurityKey signingKey = new(keyBytes);
        SigningCredentials creds = new(signingKey, SecurityAlgorithms.HmacSha256);

        DateTimeOffset now = TimeProvider.System.GetUtcNow();
        DateTimeOffset expires = now.Add(lifetime);

        List<Claim> claims =
        [
            new(JwtRegisteredClaimNames.Sub, "sso-wizard-sandbox"),
            new("name", "SSO Wizard Sandbox Principal"),
            new("tenant_id", tenantId.ToString("D")),
            new("workspace_id", workspaceId.ToString("D")),
            new("project_id", projectId.ToString("D")),
            new("sso_wizard_preview", "true")
        ];

        foreach (string role in mappedRoles)
            claims.Add(new Claim("roles", role));

        JwtSecurityToken token = new(
            PreviewIssuer,
            PreviewAudience,
            claims,
            now.UtcDateTime,
            expires.UtcDateTime,
            creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public static int DefaultLifetimeSeconds => 300;
}
