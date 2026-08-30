namespace ArchLucid.Persistence.Connections;

/// <summary>SQL Server error metadata extracted from an exception chain.</summary>
public readonly record struct SqlExceptionDetails(int Number, byte State);
