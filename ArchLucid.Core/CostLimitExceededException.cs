namespace ArchLucid.Core;

public sealed class CostLimitExceededException(string message) : Exception(message);
