namespace ArchLucid.Worker.Tests;

/// <summary>Preserves ArchLucidAuth environment variables across worker integration tests (parallel runs share process-global env).</summary>
internal sealed class WorkerTestArchLucidAuthEnvSnapshot
{
    private readonly string? _authority;
    private readonly string? _audience;

    private WorkerTestArchLucidAuthEnvSnapshot(string? authority, string? audience)
    {
        _authority = authority;
        _audience = audience;
    }

    public static WorkerTestArchLucidAuthEnvSnapshot CaptureAndApplyWorkerDefaults()
    {
        string? authority = Environment.GetEnvironmentVariable("ArchLucidAuth__Authority");
        string? audience = Environment.GetEnvironmentVariable("ArchLucidAuth__Audience");

        Environment.SetEnvironmentVariable("ArchLucidAuth__Authority", "https://mock.example.com/");
        Environment.SetEnvironmentVariable("ArchLucidAuth__Audience", "mock");

        return new WorkerTestArchLucidAuthEnvSnapshot(authority, audience);
    }

    public void Restore()
    {
        SetOrClear("ArchLucidAuth__Authority", _authority);
        SetOrClear("ArchLucidAuth__Audience", _audience);
    }

    private static void SetOrClear(string name, string? value)
    {
        if (string.IsNullOrEmpty(value))
            Environment.SetEnvironmentVariable(name, null);
        else
            Environment.SetEnvironmentVariable(name, value);
    }
}
