namespace ArchLucid.Contracts.Integrations;

/// <summary>Outcome of a Key Vault secret probe for Teams incoming webhook configuration.</summary>
public enum TeamsIncomingWebhookSecretValidationOutcome
{
    Found,
    InvalidName,
    NotFound,
    PermissionDenied,
    InvalidValue,
}

/// <summary>Safe customer-facing result for POST <c>/v1/integrations/teams/connections/validate-secret</c>.</summary>
public sealed class TeamsIncomingWebhookSecretValidationResponse
{
    public required TeamsIncomingWebhookSecretValidationOutcome Outcome
    {
        get;
        init;
    }

    public required string Message
    {
        get;
        init;
    }
}

/// <summary>Result of a synthetic Teams notification test.</summary>
public sealed class TeamsIncomingWebhookConnectionTestResponse
{
    public required bool Delivered
    {
        get;
        init;
    }

    public string? Message
    {
        get;
        init;
    }
}

public sealed class TeamsIncomingWebhookSecretValidationRequest
{
    public required string KeyVaultSecretName
    {
        get;
        init;
    }
}

public sealed class TeamsIncomingWebhookConnectionTestRequest
{
    public string? KeyVaultSecretName
    {
        get;
        init;
    }
}
