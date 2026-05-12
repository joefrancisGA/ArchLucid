namespace ArchLucid.Core.Billing;

/// <summary>Raised when an admin trial conversion is blocked until billing activation completes.</summary>
public sealed class BillingConversionBlockedException(string message) : InvalidOperationException(message);
