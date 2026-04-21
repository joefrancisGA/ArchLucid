namespace ArchLucid.Application.Tenancy;

/// <summary>Optional baseline review-cycle hours + provenance captured at self-service trial signup.</summary>
public sealed record TrialSignupBaselineReviewCycleCapture(
    decimal Hours,
    string? SourceNote,
    DateTimeOffset CapturedUtc);
