namespace ArchLucid.Architecture.Tests;

/// <summary>Which types of an assembly a type-absence rule inspects.</summary>
internal enum ArchitectureTypeVisibilityScope
{
    /// <summary>Public surface only (<see cref="System.Reflection.Assembly.GetExportedTypes"/>).</summary>
    Exported = 0,

    /// <summary>All types, including internal ones (<see cref="System.Reflection.Assembly.GetTypes"/>).</summary>
    All = 1,
}
