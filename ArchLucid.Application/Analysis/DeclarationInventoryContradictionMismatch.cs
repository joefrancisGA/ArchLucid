namespace ArchLucid.Application.Analysis;

public sealed record DeclarationInventoryContradictionMismatch(
    string GraphNodeId,
    string ResourceLabel,
    string InventoryResourceId,
    string DeclarationKey,
    string DeclarationValue,
    string InventoryValue,
    string CloudLabel,
    string SecurityTheme);
