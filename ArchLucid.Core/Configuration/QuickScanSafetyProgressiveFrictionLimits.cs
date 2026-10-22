namespace ArchLucid.Core.Configuration;

/// <summary>Progressive friction before CAPTCHA or sign-in for anonymous Quick Scan.</summary>
public sealed class QuickScanSafetyProgressiveFrictionLimits
{
    public int ScansBeforeCaptchaRequired { get; set; } = 2;

    /// <summary>Must be greater than <see cref="ScansBeforeCaptchaRequired" /> when both frictions are enabled.</summary>
    public int ScansBeforeSignInRequired { get; set; } = 4;

    public bool CaptchaEnabled { get; set; }

    public bool SignInFrictionEnabled { get; set; } = true;
}
