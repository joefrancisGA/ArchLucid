using System.Reflection;
using System.Text.RegularExpressions;

namespace ArchLucid.Api.Tests;

/// <summary>Ensures <c>docs/library/TEST_STRUCTURE.md</c> mentions public lifecycle harness helpers.</summary>
internal static class IntegrationTestHarnessDocumentationGuardSupport
{
    private static readonly Regex BacktickIdentifierRegex = new(
        @"`([A-Za-z][A-Za-z0-9]+)`",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    internal static List<string> ScanUndocumentedLifecycleHelpers()
    {
        string repoRoot = IntegrationTestSourceScanSupport.FindRepoRoot();
        string docPath = Path.Combine(repoRoot, "docs", "library", "TEST_STRUCTURE.md");
        string doc = File.ReadAllText(docPath);

        List<string> missing = [];

        foreach (string helper in EnumerateLifecycleHelperNames())
        {
            if (doc.Contains(helper, StringComparison.Ordinal))
                continue;

            missing.Add(helper);
        }

        return missing;
    }

    private static IEnumerable<string> EnumerateLifecycleHelperNames()
    {
        Type lifecycle = typeof(IntegrationTestRunLifecycleSupport);
        MethodInfo[] methods = lifecycle.GetMethods(BindingFlags.Public | BindingFlags.Static | BindingFlags.DeclaredOnly);

        foreach (MethodInfo method in methods)
        {
            string name = method.Name;

            if (name.EndsWith("ForTestAsync", StringComparison.Ordinal)
                || name.Contains("ForTest", StringComparison.Ordinal))
                yield return name;
        }
    }
}
