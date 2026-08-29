namespace ArchLucid.Persistence.Connections;

/// <summary>SQL error number/state extracted from an exception chain.</summary>
public readonly record struct SqlErrorSnapshot(int Number, byte State);
