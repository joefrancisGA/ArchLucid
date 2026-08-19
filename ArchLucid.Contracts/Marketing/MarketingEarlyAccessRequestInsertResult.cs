namespace ArchLucid.Contracts.Marketing;

/// <summary>Result of persisting an anonymous <c>/welcome</c> early-access request (<c>dbo.MarketingEarlyAccessRequests</c>).</summary>
public readonly record struct MarketingEarlyAccessRequestInsertResult(Guid Id, DateTime CreatedUtc);
