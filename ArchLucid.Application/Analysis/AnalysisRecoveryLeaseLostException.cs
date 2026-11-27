namespace ArchLucid.Application.Analysis;

internal sealed class AnalysisRecoveryLeaseLostException(string stage)
    : InvalidOperationException($"The analysis recovery claim is active elsewhere or has expired for stage '{stage}'.");
