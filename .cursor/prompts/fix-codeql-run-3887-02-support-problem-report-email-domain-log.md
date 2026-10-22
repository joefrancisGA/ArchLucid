# Fix: CodeQL #3887 / alert #767 — `cs/exposure-of-sensitive-information` in SupportProblemReportNotifier

> Parent: [`fix-codeql-run-3887-00-index.md`](fix-codeql-run-3887-00-index.md)
> Alert: https://github.com/joefrancisGA/ArchLucid/security/code-scanning/767
> Run: `29590827329` · commit `312731f10e9bbd931bd99e75414eec8aaf3f27fd`

## Symptom

C# SARIF gate:

```text
Unresolved cs/exposure-of-sensitive-information at ArchLucid.Application/Notifications/Email/SupportProblemReportNotifier.cs:120
```

Sink (Noop provider path):

```csharp
_logger.LogInformation(
    "Would send problem report acknowledgement to domain {EmailDomain} for report id {ReportId} (Email:Provider is {Provider}).",
    LogSanitizer.EmailDomainForLogs(submitterMailbox),
    report.Id,
    _emailProvider.ProviderName);
```

CodeQL message chains `email` → `normalizedEmail` → `EmailDomainForLogs` → external log location.

## Assessment

| Aspect | Detail |
|--------|--------|
| Severity | Medium (CWE-359) |
| Intent | Log **email domain only** when Email provider is Noop (dev/test), never the full mailbox. |
| Why it still fires | Direct `ILogger.LogInformation(..., params object?[])` boxes the sanitizer return value; CodeQL often stops treating `EmailDomainForLogs` as an effective `ExternalLocationSanitizer` / `file-content-store` barrier across that hop (same class of issue as TB-610 / trial bootstrap). |
| Model pack | `.github/codeql/archlucid-csharp-log-sanitizer-models` already lists `EmailDomainForLogs` as `log-injection` + `file-content-store` barriers — insufficient alone for this call shape. |

## Required fix (match existing pattern)

Reuse the **trial bootstrap** pattern in Core — do not invent a new logging stack.

1. Add sibling helpers on a Core sanitized logger class (prefer extending an existing support/email helper if one exists; otherwise add `SanitizedLoggerSupportProblemReportExtensions` + `.LoggerMessage.cs` next to `SanitizedLoggerTrialBootstrapExtensions`):

   - Public method e.g. `LogInformationProblemReportAckWouldSend(ILogger logger, Guid reportId, string submitterMailbox, string providerName)`.
   - Inside: `string emailDomain = LogSanitizer.EmailDomainForLogs(submitterMailbox);` then call a private `[LoggerMessage]` emitter (pick a free EventId in the 30xx range used by Core sanitized helpers — do not collide with 3016 / 3001–3009 / 3101–3103 / 3201–3204).
   - Prefer **static methods** (not `this ILogger` extensions) so exposure alerts do not re-anchor at Application call sites (see remarks on `SanitizedLoggerTrialBootstrapExtensions`).

2. Replace the Application call site in `SupportProblemReportNotifier.NotifySubmitterAsync` with the Core helper. Remove the raw `LogInformation` template at that site.

3. Grep the same file (and nearby support email notifiers) for other `EmailDomainForLogs` + `LogInformation`/`LogWarning` direct sinks; migrate any siblings in the same change if present.

4. Optionally reinforce MaD if still needed after `[LoggerMessage]` migration — only if a re-run still flags. Prefer emitter migration first (TB-610 style).

5. Add/extend a small unit test that the helper invokes without throwing and that Application no longer calls `_logger.LogInformation` with a mailbox string on the Noop path (mirror trial-bootstrap tests if present).

## Alternatives considered

| Alternative | Trade-off |
|-------------|-----------|
| Delete the Noop log line | Loses useful local diagnostics; unnecessary if helper pattern exists. |
| Inline `// codeql[cs/exposure-of-sensitive-information]` | Last resort; repo prefers Core `[LoggerMessage]` + sanitizer. |
| Log only `report.Id` | Weaker ops signal; domain-only is already the intended compromise. |

## Acceptance

1. Alert #767 cleared from C# SARIF.
2. `SupportProblemReportNotifier` Noop path uses Core sanitized helper only.
3. Application.Tests (or Core.Tests) cover the new helper / call-site behavior.
4. No full email address in log templates.
