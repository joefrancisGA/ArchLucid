# Starts Next.js dev server in buyer-polished demo mode (no env var footgun).
# Unsets NEXT_PUBLIC_OPERATOR_EXPERIENCE so the buyer shell is active, then
# sets the two demo flags and the compare-route allow flag.
# Usage: npm run demo  OR  pwsh -File ./scripts/start-demo.ps1

Set-StrictMode -Version Latest

$Env:NEXT_PUBLIC_DEMO_MODE = "1"
$Env:NEXT_PUBLIC_DEMO_STATIC_OPERATOR = "1"
$Env:NEXT_PUBLIC_DEMO_ALLOW_COMPARE_ROUTE = "1"
$Env:NEXT_PUBLIC_CTO_DEMO_NAV_EXPANDED = "1"

# Remove the flag that switches the shell back to raw operator mode.
if (Test-Path Env:\NEXT_PUBLIC_OPERATOR_EXPERIENCE) {
    Remove-Item Env:\NEXT_PUBLIC_OPERATOR_EXPERIENCE
}

Write-Host "==> Demo env active: DEMO_MODE=1, STATIC_OPERATOR=1, COMPARE_ROUTE=1, NAV_EXPANDED=1"
Write-Host "==> Starting Next.js on http://localhost:3001"

& npx next dev --webpack -p 3001
