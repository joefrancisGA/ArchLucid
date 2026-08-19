using System.Reflection;

using ArchLucid.Persistence.Audit;

using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>INV-011: append-only repository interfaces expose no mutating <c>Update*</c>/<c>Delete*</c> surface.</summary>
[Trait("Suite", "Core")]
public sealed class AppendOnlyRepositoryInterfaceShapeTests
{
    private static readonly string[] ForbiddenMethodPrefixes =
    [
        "Update", "Delete", "Remove", "Patch", "Upsert", "Truncate"
    ];

    [Fact]
    public void Exported_append_only_interfaces_have_no_mutating_method_names()
    {
        HashSet<Assembly> assemblies =
        [
            typeof(IAuditRepository).Assembly,
            typeof(ArchLucid.Core.Audit.AuditEvent).Assembly
        ];

        List<string> violations = new();

        foreach (Assembly assembly in assemblies)
        {
            foreach (Type t in assembly.GetExportedTypes())
            {
                if (!t.IsInterface)
                    continue;

                if (!IsAppendOnlyCandidate(t.Name))
                    continue;

                AssertInterfaceShape(t, violations);
            }
        }

        violations.Should().BeEmpty(
            "Append-only interfaces must not expose mutating method names: "
            + string.Join(Environment.NewLine, violations.OrderBy(static s => s, StringComparer.Ordinal)));
    }

    private static bool IsAppendOnlyCandidate(string typeName) =>
        typeName.Equals(nameof(IAuditRepository), StringComparison.Ordinal)
        || (typeName.StartsWith("IAppendOnly", StringComparison.Ordinal) && typeName.Length >= "IAppendOnly".Length)
        || (typeName.StartsWith("IImmutableTrace", StringComparison.Ordinal) && typeName.Length >= "IImmutableTrace".Length);

    private static void AssertInterfaceShape(Type interfaceType, List<string> violations)
    {
        foreach (MethodInfo method in interfaceType.GetMethods())
        {
            if (method.DeclaringType != interfaceType)
                continue;

            foreach (string prefix in ForbiddenMethodPrefixes)
            {
                if (method.Name.StartsWith(prefix, StringComparison.Ordinal))
                    violations.Add($"{interfaceType.FullName}.{method.Name}");
            }
        }
    }
}
