namespace ArchLucid.Cli.Commands;

/// <summary>Authentication branch chosen in <see cref="InitCommand" />.</summary>
public enum InitAuthWizardKind
{
    JwtBearer,
    ApiKey,
    DevelopmentBypass,
}

/// <summary>Captured answers used to emit appsettings JSON.</summary>
public sealed class InitWizardAnswers
{
    public required string ConnectionStringsArchLucid { get; init; }

    public required InitAuthWizardKind AuthKind { get; init; }

    public string? JwtAuthority { get; init; }

    public string? JwtAudience { get; init; }

    public string? JwtNameClaimType { get; init; }

    public string? ApiAdminKey { get; init; }

    public string DevUserId { get; init; } = "dev-user";

    public string DevUserName { get; init; } = "Developer";

    public string DevRole { get; init; } = "Admin";
}
