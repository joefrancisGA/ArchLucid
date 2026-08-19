namespace ArchLucid.Core.Identity;

/// <summary>Hourly OTP request counts used for composite rate-limit evaluation.</summary>
public sealed record EmailOtpRecentRequestCounts(int EmailRequestCount, int ClientIpRequestCount);
