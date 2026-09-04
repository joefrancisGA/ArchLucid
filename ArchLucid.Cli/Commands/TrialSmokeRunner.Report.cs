namespace ArchLucid.Cli.Commands;

public sealed partial class TrialSmokeRunner
{
    public async Task<TrialSmokeReport> RunAsync(TrialSmokeCommandOptions options, CancellationToken ct = default)
    {
        if (options is null)
            throw new ArgumentNullException(nameof(options));

        List<TrialSmokeStepResult> steps = [];

        (TrialSmokeStepResult registerStep, TrialSmokeRegisterResponse? registerResponse, string? correlationId) =
            await RegisterAsync(options, ct);
        steps.Add(registerStep);

        if (!registerStep.Passed || registerResponse is null)
            return new TrialSmokeReport { Steps = steps, AllPassed = false, RegistrationCorrelationId = correlationId };

        (TrialSmokeStepResult statusStep, TrialSmokeTrialStatusResponse? statusResponse) =
            await TrialStatusAsync(registerResponse, ct);
        steps.Add(statusStep);

        if (!statusStep.Passed || statusResponse is null)
            return new TrialSmokeReport { Steps = steps, AllPassed = false, TenantId = registerResponse.TenantId, RegistrationCorrelationId = correlationId };

        if (options.SkipPilotRunDeltas || string.IsNullOrWhiteSpace(statusResponse.TrialWelcomeRunId))
            return new TrialSmokeReport
            {
                Steps = steps,
                AllPassed = steps.All(s => s.Passed),
                TenantId = registerResponse.TenantId,
                TrialWelcomeRunId = statusResponse.TrialWelcomeRunId,
                RegistrationCorrelationId = correlationId
            };

        TrialSmokeStepResult deltasStep =
            await PilotRunDeltasAsync(registerResponse, statusResponse.TrialWelcomeRunId!, ct);
        steps.Add(deltasStep);

        return new TrialSmokeReport
        {
            Steps = steps,
            AllPassed = steps.All(s => s.Passed),
            TenantId = registerResponse.TenantId,
            TrialWelcomeRunId = statusResponse.TrialWelcomeRunId,
            RegistrationCorrelationId = correlationId
        };
    }

    private static string Truncate(string s, int max)
    {
        return string.IsNullOrEmpty(s) || s.Length <= max ? s : s[..max] + "…";
    }
}
