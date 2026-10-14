namespace ArchLucid.Core.InfraEvidence;

/// <summary>Well-known Microsoft Graph first-party application identifiers for privilege-path collection.</summary>
public static class AzureInventoryMicrosoftGraphWellKnown
{
    public const string ServicePrincipalAppId = "00000003-0000-0000-c000-000000000000";

    /// <summary>Application.ReadWrite.All app role id on Microsoft Graph (book Ch. 4 §4.4).</summary>
    public const string ApplicationReadWriteAllAppRoleId = "1bfefb4e-e0b5-418b-a88f-73c46d2cc8e9";
}
