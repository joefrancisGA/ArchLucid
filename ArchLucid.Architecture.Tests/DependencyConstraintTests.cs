using System.Reflection;
using System.Text.RegularExpressions;

using ArchLucid.Backfill.Cli;
using ArchLucid.Core.Audit;

using FluentAssertions;

using NetArchTest.Rules;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Layer-boundary guards. The rules themselves live in the constraint manifests
///     (<see cref="ArchitectureNamespaceConstraintManifest"/>, <see cref="ArchitectureAssemblyReferenceConstraintManifest"/>,
///     <see cref="ArchitectureProjectReferenceConstraintManifest"/>, <see cref="ArchitectureTypeAbsenceConstraintManifest"/>);
///     each rule runs as its own theory row so CI names the violated rule. Rules that need bespoke evidence
///     (source scans, allowlists) stay as facts below.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class DependencyConstraintTests
{
    private static readonly Regex DirectIntegrationEventPublish = new(
        @"publisher\.PublishAsync\(",
        RegexOptions.Compiled);

    /// <summary>Only Host.Composition (and test projects) may wire the deterministic agent simulator.</summary>
    private static readonly IReadOnlySet<string> AgentSimulatorReferenceAllowlist =
        new HashSet<string>(StringComparer.Ordinal) { "ArchLucid.Host.Composition" };

    public static TheoryData<string> NamespaceDependencyRuleNames
        => ArchitectureConstraintTheoryData.FromRuleNames(ArchitectureNamespaceConstraintManifest.Rules.Keys);

    public static TheoryData<string> AssemblyReferenceRuleNames
        => ArchitectureConstraintTheoryData.FromRuleNames(ArchitectureAssemblyReferenceConstraintManifest.Rules.Keys);

    public static TheoryData<string> ProjectReferenceRuleNames
        => ArchitectureConstraintTheoryData.FromRuleNames(ArchitectureProjectReferenceConstraintManifest.Rules.Keys);

    public static TheoryData<string> TypeAbsenceRuleNames
        => ArchitectureConstraintTheoryData.FromRuleNames(ArchitectureTypeAbsenceConstraintManifest.Rules.Keys);

    [Theory]
    [MemberData(nameof(NamespaceDependencyRuleNames))]
    public void Namespace_dependency_constraint_holds(string ruleName)
    {
        NamespaceDependencyConstraint constraint = ArchitectureNamespaceConstraintManifest.Rule(ruleName);
        TestResult result = NamespaceDependencyConstraintEvaluator.Evaluate(constraint);

        result.IsSuccessful.Should().BeTrue(
            because: "{0} Offending types: {1}",
            constraint.Because,
            ArchitectureConstraintFailureReport.FormatFailingTypeNames(result));
    }

    [Theory]
    [MemberData(nameof(AssemblyReferenceRuleNames))]
    public void Assembly_reference_constraint_holds(string ruleName)
    {
        AssemblyReferenceConstraint constraint = ArchitectureAssemblyReferenceConstraintManifest.Rule(ruleName);

        ArchitectureReferenceExpectationAssertions.AssertExpectation(
            ArchitectureConstraintAssemblies.ReferencedAssemblyNames(constraint.AssemblyName),
            constraint.ReferencedAssemblies,
            constraint.Expectation,
            constraint.Because);
    }

    [Theory]
    [MemberData(nameof(ProjectReferenceRuleNames))]
    public void Project_reference_constraint_holds(string ruleName)
    {
        ProjectReferenceConstraint constraint = ArchitectureProjectReferenceConstraintManifest.Rule(ruleName);

        ArchitectureReferenceExpectationAssertions.AssertExpectation(
            ArchitectureConstraintRepositoryPaths.DeclaredProjectReferences(constraint.ProjectName),
            constraint.ReferencedProjects,
            constraint.Expectation,
            constraint.Because);
    }

    [Theory]
    [MemberData(nameof(TypeAbsenceRuleNames))]
    public void Type_absence_constraint_holds(string ruleName)
    {
        TypeAbsenceConstraint constraint = ArchitectureTypeAbsenceConstraintManifest.Rule(ruleName);

        ArchitectureConstraintAssemblies.TypeNames(constraint.AssemblyName, constraint.Scope)
            .Should()
            .NotContain(constraint.TypeNames, because: constraint.Because);
    }

    [Fact]
    public void Constraint_manifest_assembly_names_match_the_anchored_assemblies()
    {
        foreach (string registeredName in ArchitectureConstraintAssemblies.RegisteredNames)
        {
            ArchitectureConstraintAssemblies.Resolve(registeredName).GetName().Name.Should().Be(
                registeredName,
                because: "manifest rows address assemblies by name; a mismatched anchor type would silently test the wrong assembly.");
        }
    }

    [Fact]
    public void Product_code_must_not_call_IIntegrationEventPublisher_PublishAsync_outside_authorized_wrappers()
    {
        string root = ArchitectureConstraintRepositoryPaths.RepositoryRoot;
        List<string> violations = [];

        foreach (string path in Directory.EnumerateFiles(root, "*.cs", SearchOption.AllDirectories))
        {
            if (IsExcludedSourceScanPath(path) || IsAuthorizedDirectIntegrationPublishFile(path))
            {
                continue;
            }

            CollectDirectIntegrationPublishViolations(path, violations);
        }

        violations.Should().BeEmpty(
            "integration events must go through OutboxAwareIntegrationEventPublishing.TryPublishOrEnqueueAsync; " +
            "only IntegrationEventPublishing (TryPublishAsync) and IntegrationEventOutboxProcessor may call IIntegrationEventPublisher.PublishAsync directly. Violations:{0}{1}",
            Environment.NewLine,
            violations.Count == 0 ? "(none)" : string.Join(Environment.NewLine, violations));
    }

    [Fact]
    public void Legacy_CoordinatorRun_audit_constants_are_removed_from_AuditEventTypes()
    {
        IReadOnlyList<string> names = typeof(AuditEventTypes)
            .GetFields(BindingFlags.Public | BindingFlags.Static | BindingFlags.FlattenHierarchy)
            .Where(static f => f is { IsLiteral: true, IsInitOnly: false } && f.FieldType == typeof(string))
            .Select(static f => f.Name)
            .ToArray();

        names.Should().NotContain(
            n => n.StartsWith("CoordinatorRun", StringComparison.Ordinal),
            "legacy CoordinatorRun* durable constants were removed; use AuditEventTypes.Run.*");
    }

    [Fact]
    public void AgentSimulator_may_only_be_referenced_by_allowlisted_assemblies()
    {
        string root = ArchitectureConstraintRepositoryPaths.RepositoryRoot;

        string[] violations = Directory
            .EnumerateFiles(root, "*.csproj", SearchOption.AllDirectories)
            .Where(static csprojPath => !IsAgentSimulatorProject(csprojPath))
            .Where(static csprojPath => DeclaresAgentSimulatorReference(csprojPath))
            .Select(static csprojPath => Path.GetFileNameWithoutExtension(csprojPath))
            .Where(static assemblyName => !MayReferenceAgentSimulator(assemblyName))
            .ToArray();

        violations.Should().BeEmpty(
            because: "TB-027 positive-list: only Host.Composition and *.Tests may reference AgentSimulator via csproj; violations: {0}",
            string.Join(", ", violations));
    }

    [Fact]
    public void BackfillCli_first_party_assembly_references_must_match_allowlist()
    {
        Assembly backfillCli = typeof(BackfillCliAssemblyAnchor).Assembly;
        string[] directFirstPartyReferences = backfillCli
            .GetReferencedAssemblies()
            .Select(static a => a.Name)
            .Where(static name => name is not null && IsFirstPartyAssemblyName(name))
            .Select(static name => name!)
            .OrderBy(static name => name, StringComparer.Ordinal)
            .ToArray();

        directFirstPartyReferences.Should().BeEquivalentTo(
            ArchitectureConstraintMaintenanceHosts.DirectFirstPartyAssembliesForBackfillCli,
            because:
            "Backfill.Cli may reference only Core, Contracts, KnowledgeGraph, and Persistence at assembly metadata. " +
            "See docs/library/SqlRelationalBackfill.md and docs/library/ARCHITECTURE_CONSTRAINTS.md.");

        string[] transitiveFirstPartyReferences = CollectTransitiveFirstPartyAssemblyReferences(backfillCli)
            .OrderBy(static name => name, StringComparer.Ordinal)
            .ToArray();

        transitiveFirstPartyReferences.Should().BeEquivalentTo(
            ArchitectureConstraintMaintenanceHosts.AllowedFirstPartyAssembliesForBackfillCli,
            because:
            "Backfill.Cli is a one-time migration host that composes SqlRelationalBackfillService directly; " +
            "it must not pull in Application, Api, Host.*, or other product layers.");
    }

    [Fact]
    public void BackfillCli_csproj_must_only_declare_allowed_project_references()
    {
        string csprojPath = ArchitectureConstraintRepositoryPaths.ProjectFilePath("ArchLucid.Backfill.Cli");
        File.Exists(csprojPath).Should().BeTrue(because: "Backfill.Cli project file must exist at {0}", csprojPath);

        string[] declaredReferences = ArchitectureConstraintRepositoryPaths
            .ReadProjectReferenceAssemblyNames(csprojPath)
            .OrderBy(static name => name, StringComparer.Ordinal)
            .ToArray();

        declaredReferences.Should().BeEquivalentTo(
            ArchitectureConstraintMaintenanceHosts.DirectProjectReferencesForBackfillCli,
            because:
            "Backfill.Cli must declare only Persistence + KnowledgeGraph project references; " +
            "transitive Core/Contracts references come from those leaves.");
    }

    [Fact]
    public void Ui_openapi_types_must_trace_to_canonical_snapshot()
    {
        string root = ArchitectureConstraintRepositoryPaths.RepositoryRoot;

        string snapshotPath = Path.Combine(
            root,
            "ArchLucid.Api.Tests",
            "Contracts",
            "openapi-v1.contract.snapshot.json");
        string reexportPath = Path.Combine(root, "archlucid-ui", "src", "lib", "openapi-schemas.ts");
        string generatedPath = Path.Combine(root, "archlucid-ui", "src", "lib", "api-types.generated.ts");

        File.Exists(snapshotPath).Should().BeTrue(because: "canonical OpenAPI snapshot must exist at {0}", snapshotPath);
        File.Exists(reexportPath).Should().BeTrue(because: "UI OpenAPI re-export must exist at {0}", reexportPath);
        File.Exists(generatedPath).Should().BeTrue(because: "generated UI API types must exist at {0}", generatedPath);

        string reexportText = File.ReadAllText(reexportPath);
        reexportText.Should().Contain("./api-types.generated", because: "UI types must be sourced from generated OpenAPI output.");
    }

    private static void CollectDirectIntegrationPublishViolations(string path, List<string> violations)
    {
        string[] lines = File.ReadAllLines(path);

        for (int i = 0; i < lines.Length; i++)
        {
            string line = lines[i];

            if (IsCommentLine(line) || !DirectIntegrationEventPublish.IsMatch(line))
            {
                continue;
            }

            violations.Add($"{path}:{i + 1}: {line.Trim()}");
        }
    }

    private static bool IsCommentLine(string line)
    {
        string trimmed = line.TrimStart();

        return trimmed.StartsWith("//", StringComparison.Ordinal)
            || trimmed.StartsWith("///", StringComparison.Ordinal)
            || trimmed.StartsWith('*');
    }

    private static bool IsAgentSimulatorProject(string csprojPath)
        => string.Equals(
            Path.GetFileNameWithoutExtension(csprojPath),
            "ArchLucid.AgentSimulator",
            StringComparison.Ordinal);

    private static bool DeclaresAgentSimulatorReference(string csprojPath)
        => ArchitectureConstraintRepositoryPaths
            .ReadProjectReferenceAssemblyNames(csprojPath)
            .Contains("ArchLucid.AgentSimulator", StringComparer.Ordinal);

    private static bool MayReferenceAgentSimulator(string assemblyName)
        => AgentSimulatorReferenceAllowlist.Contains(assemblyName)
            || assemblyName.EndsWith(".Tests", StringComparison.Ordinal);

    private static bool IsFirstPartyAssemblyName(string assemblyName)
        => assemblyName.StartsWith("ArchLucid.", StringComparison.Ordinal);

    private static HashSet<string> CollectTransitiveFirstPartyAssemblyReferences(Assembly assembly)
    {
        HashSet<string> seen = new(StringComparer.Ordinal);
        Queue<AssemblyName> pending = new();

        EnqueueFirstPartyReferences(assembly, pending);

        while (pending.Count > 0)
        {
            AssemblyName reference = pending.Dequeue();

            if (reference.Name is null || !seen.Add(reference.Name))
            {
                continue;
            }

            EnqueueFirstPartyReferences(Assembly.Load(reference), pending);
        }

        return seen;
    }

    private static void EnqueueFirstPartyReferences(Assembly assembly, Queue<AssemblyName> pending)
    {
        foreach (AssemblyName reference in assembly.GetReferencedAssemblies())
        {
            if (reference.Name is not null && IsFirstPartyAssemblyName(reference.Name))
            {
                pending.Enqueue(reference);
            }
        }
    }

    private static bool IsExcludedSourceScanPath(string fullPath)
    {
        string n = fullPath.Replace('\\', '/');

        return n.Contains("/bin/", StringComparison.OrdinalIgnoreCase)
            || n.Contains("/obj/", StringComparison.OrdinalIgnoreCase)
            || n.Contains("/.git/", StringComparison.OrdinalIgnoreCase)
            || n.Contains("Tests/", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsAuthorizedDirectIntegrationPublishFile(string fullPath)
    {
        string file = Path.GetFileName(fullPath);

        return file.Equals("IntegrationEventPublishing.cs", StringComparison.OrdinalIgnoreCase)
            || file.Equals("IntegrationEventOutboxProcessor.cs", StringComparison.OrdinalIgnoreCase);
    }
}
