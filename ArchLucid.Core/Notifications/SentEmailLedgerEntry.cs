namespace ArchLucid.Core.Notifications;

/// <summary>Row insert for <c>dbo.SentEmails</c> idempotency ledger.</summary>
public sealed record SentEmailLedgerEntry(
    string IdempotencyKey,
    Guid TenantId,
    string TemplateId,
    string Provider,
    string? ProviderMessageId);
