namespace ArchLucid.Application.Import;

/// <summary>
///     Single logical row from the stub CSV (columns ComponentName, Type, Description).
/// </summary>
internal readonly record struct ArchitectureCsvComponentRow(string ComponentName, string TypeToken, string Description);
