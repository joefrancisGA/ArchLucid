using NetArchTest.Rules;

namespace ArchLucid.Architecture.Tests;

/// <summary>Translates a <see cref="NamespaceDependencyConstraint"/> into a NetArchTest run.</summary>
internal static class NamespaceDependencyConstraintEvaluator
{
    /// <summary>Runs the rule and returns the NetArchTest outcome.</summary>
    internal static TestResult Evaluate(NamespaceDependencyConstraint constraint)
    {
        ArgumentNullException.ThrowIfNull(constraint);

        return SelectedTypes(constraint)
            .HaveDependencyOnAny(constraint.ForbiddenNamespaces.ToArray())
            .GetResult();
    }

    /// <summary>Applies the rule's type filters, then negates the dependency condition.</summary>
    private static Conditions SelectedTypes(NamespaceDependencyConstraint constraint)
    {
        Types types = Types.InAssembly(ArchitectureConstraintAssemblies.Resolve(constraint.AssemblyName));
        PredicateList? filtered = TypeFilters(types, constraint);

        return filtered is null ? types.ShouldNot() : filtered.ShouldNot();
    }

    /// <summary>Null when the rule scans every type in the assembly.</summary>
    private static PredicateList? TypeFilters(Types types, NamespaceDependencyConstraint constraint)
    {
        PredicateList? filtered = null;

        if (constraint.OnlyTypesInNamespace is not null)
        {
            filtered = types.That().ResideInNamespace(constraint.OnlyTypesInNamespace);
        }

        if (constraint.ExceptTypesInNamespace is not null)
        {
            filtered = NextFilter(types, filtered).DoNotResideInNamespace(constraint.ExceptTypesInNamespace);
        }

        foreach (string excludedTypeName in constraint.ExcludedTypeNames)
        {
            filtered = NextFilter(types, filtered).DoNotHaveName(excludedTypeName);
        }

        return filtered;
    }

    /// <summary>Opens the first filter, or chains an "and" onto the filters already applied.</summary>
    private static Predicates NextFilter(Types types, PredicateList? filtered)
        => filtered is null ? types.That() : filtered.And();
}
