using System.Reflection;

namespace ArchLucid.Api.Tests;

/// <summary>Invokes catalog scanners by name for theory-driven guard tests.</summary>
internal static class IntegrationTestHarnessGoldenPathGuardCatalogRunner
{
    internal static List<string> InvokeScan(string scannerName)
    {
        ArgumentException.ThrowIfNullOrEmpty(scannerName);

        MethodInfo? method =
            typeof(IntegrationTestHarnessGoldenPathGuardSupport).GetMethod(
                scannerName,
                BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic)
            ?? typeof(IntegrationTestHarnessDocumentationGuardSupport).GetMethod(
                scannerName,
                BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic);

        if (method is null)
            throw new InvalidOperationException($"Guard scanner '{scannerName}' was not found.");

        object? result = method.Invoke(null, null);

        if (result is not List<string> violations)
            throw new InvalidOperationException($"Guard scanner '{scannerName}' must return List<string>.");

        return violations;
    }

    internal static int InvokeCount(string scannerName)
    {
        ArgumentException.ThrowIfNullOrEmpty(scannerName);

        MethodInfo? method = typeof(IntegrationTestHarnessGoldenPathGuardSupport).GetMethod(
            scannerName,
            BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic);

        if (method is null)
            throw new InvalidOperationException($"Guard counter '{scannerName}' was not found.");

        object? result = method.Invoke(null, null);

        if (result is not int count)
            throw new InvalidOperationException($"Guard counter '{scannerName}' must return int.");

        return count;
    }
}
