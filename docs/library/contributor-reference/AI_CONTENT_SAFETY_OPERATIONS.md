> **Scope:** LLM content-safety operations for hosted environments.
>
> **Status:** current

# AI content safety operations

## LLM content safety (optional; fail-closed in production-like hosts)

**`ArchLucid:ContentSafety:Enabled`** toggles **`IContentSafetyGuard`** registration for **non-production-like** hosts (see **`ContentSafetyOptions`** / **`appsettings.Advanced.json`**). This path is **configuration-driven** (not a **`FeatureManagement`** flag today).

When the host is **Production**, **Staging**, or **`ARCHLUCID_ENVIRONMENT`** is **`Production`** / **`Staging`**, ArchLucid **always** registers **`AzureContentSafetyGuard`** and **startup validation** requires **`ArchLucid:ContentSafety:Endpoint`** and **`ArchLucid:ContentSafety:ApiKey`**. **`FailClosedOnSdkError`** is forced **true** in those environments so SDK/network failures block rather than allow traffic.

| State | Behavior |
|--------|----------|
| **Production-like host** | **`AzureContentSafetyGuard`** mandatory when SQL-backed agents run; missing **`Endpoint`**/**`ApiKey`** fails **`ArchLucidConfigurationRules`** at startup. |
| **Non-production-like, disabled** (default) | **`NullContentSafetyGuard`** — pass-through; no outbound calls, gated by **`ArchLucid:ContentSafety:AllowNullGuardInDevelopment`** (default **true**). |
| **Non-production-like, enabled** without **`Endpoint`** or **`ApiKey`** | **`ContentSafetyEnabledButUnconfiguredGuard`** — **throws** on **`CheckInputAsync`** / **`CheckOutputAsync`** (fail-fast misconfiguration). |
| **Non-production-like, enabled** with absolute **`Endpoint`** and **`ApiKey`** | **`AzureContentSafetyGuard`** — calls **Azure AI Content Safety** text analysis (four severity levels). **`BlockSeverityThreshold`** (default **4**) blocks when any category severity is **≥** threshold. |

**Product status:** **`Azure.AI.ContentSafety`** is wired in **`ArchLucid.AgentRuntime.Safety.AzureContentSafetyGuard`** and registered from **`ArchLucid.Host.Composition`**. Offline **prompt-injection** fixture shape is validated in CI via **`scripts/ci/eval_agent_quality.py --prompt-injection-only`**. See **`docs/AI_AGENT_PROMPT_REGRESSION.md`**.
