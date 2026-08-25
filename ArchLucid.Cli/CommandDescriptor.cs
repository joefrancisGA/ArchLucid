namespace ArchLucid.Cli;

/// <summary>
///     Metadata for a top-level CLI command used for dispatch and generated help.
/// </summary>
/// <param name="Name">Primary command name (first token after <c>archlucid</c>).</param>
/// <param name="Description">Short human-readable summary.</param>
/// <param name="Usage">Usage fragment printed in root help (without the <c>archlucid</c> prefix).</param>
internal sealed record CommandDescriptor(string Name, string Description, string Usage);
