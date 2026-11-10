namespace ArchLucid.Api.Tests;

/// <summary>Conditional skips for environment-specific SQL harness behavior.</summary>
public static class HarnessSkipWhen
{
    /// <summary>Skips when execute-on-create returns authority-pipeline-complete (execute idempotency tests do not apply).</summary>
    public static async Task AuthorityPipelineCompleteOnCreateAsync(HttpResponseMessage executeResponse)
    {
        ArgumentNullException.ThrowIfNull(executeResponse);

        if (await executeResponse.IsAuthorityPipelineCompleteExecuteConflictAsync().ConfigureAwait(false))
            Skip.If(true, HarnessSkipReasons.AuthorityPipelineCompleteOnCreate);
    }

    /// <summary>Pilot-specific skip message for first-real-value execute audit tests.</summary>
    public static async Task AuthorityPipelineCompleteOnCreateForPilotAsync(HttpResponseMessage executeResponse)
    {
        ArgumentNullException.ThrowIfNull(executeResponse);

        if (await executeResponse.IsAuthorityPipelineCompleteExecuteConflictAsync().ConfigureAwait(false))
            Skip.If(true, HarnessSkipReasons.AuthorityPipelineCompleteOnCreatePilot);
    }
}
