namespace ArchLucid.Application.Scim;

public sealed class ScimSeatLimitExceededException() : Exception("Enterprise seat limit reached for this tenant.");
