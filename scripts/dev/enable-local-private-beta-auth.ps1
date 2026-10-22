# Enable local private-beta sign-in: email OTP + JWT (local PEM validation).
# OIDC authorization-code (work/school) additionally requires Entra SPA values in .env.local - see archlucid-ui/.env.example.
#
# Usage (from repo root):
#   .\scripts\dev\enable-local-private-beta-auth.ps1
#   . .\.local\dev-auth\env.ps1   # before dotnet run / in a second terminal before npm run dev
#
# Email OTP codes: default Email:Provider=Noop swallows mail silently. For real delivery, set Email:Provider=Smtp
# (e.g. Mailpit on localhost:1025) in .local/dev-auth/env.ps1 after running this script.

param(
    [switch] $SkipEnvLocal
)

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$AuthDir = Join-Path $RepoRoot ".local\dev-auth"
$PrivatePem = Join-Path $AuthDir "private.pem"
$PublicPem = Join-Path $AuthDir "public.pem"
$EnvScript = Join-Path $AuthDir "env.ps1"

$Issuer = "https://local.archlucid.dev"
$Audience = "api://archlucid-local"

New-Item -ItemType Directory -Force -Path $AuthDir | Out-Null

if (-not (Test-Path $PrivatePem)) {
    Write-Host "Generating RSA key pair in .local/dev-auth/ ..." -ForegroundColor Cyan
    $openssl = @(
        (Get-Command openssl -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -ErrorAction SilentlyContinue),
        "C:\Program Files\Git\usr\bin\openssl.exe",
        "C:\Program Files (x86)\Git\usr\bin\openssl.exe"
    ) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1

    if (-not $openssl) {
        throw "openssl not found. Install Git for Windows or OpenSSL, then re-run."
    }

    & $openssl genrsa -out $PrivatePem 2048
    if ($LASTEXITCODE -ne 0) { throw "openssl genrsa failed" }
    & $openssl rsa -in $PrivatePem -pubout -out $PublicPem
    if ($LASTEXITCODE -ne 0) { throw "openssl rsa -pubout failed" }
}
else {
    Write-Host "Reusing existing keys in .local/dev-auth/" -ForegroundColor DarkGray
}

$hashPepper = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object { [char]$_ })

$relPrivate = ".local/dev-auth/private.pem"
$relPublic = ".local/dev-auth/public.pem"

$envContent = @"
# Dot-source before starting ArchLucid.Api:  . .\.local\dev-auth\env.ps1
`$env:ArchLucidAuth__Mode = "JwtBearer"
`$env:ArchLucidAuth__JwtSigningPublicKeyPemPath = "$relPublic"
`$env:ArchLucidAuth__JwtLocalIssuer = "$Issuer"
`$env:ArchLucidAuth__JwtLocalAudience = "$Audience"
`$env:Auth__Trial__LocalIdentity__JwtPrivateKeyPemPath = "$relPrivate"
`$env:Auth__Trial__LocalIdentity__JwtIssuer = "$Issuer"
`$env:Auth__Trial__LocalIdentity__JwtAudience = "$Audience"
`$env:Auth__Trial__LocalIdentity__AccessTokenLifetimeMinutes = "60"
`$env:Auth__EmailOtp__Enabled = "true"
`$env:Auth__EmailOtp__HashPepper = "$hashPepper"
`$env:Email__OperatorBaseUrl = "http://localhost:3000"
`$env:Email__Provider = "Noop"
"@

Set-Content -Path $EnvScript -Value $envContent -Encoding UTF8

if (-not $SkipEnvLocal) {
    $envLocalPath = Join-Path $RepoRoot "archlucid-ui\.env.local"
    $authBlock = @'

# --- private-beta local auth (scripts/dev/enable-local-private-beta-auth.ps1) ---
NEXT_PUBLIC_ARCHLUCID_AUTH_MODE=jwt
NEXT_PUBLIC_ARCHLUCID_EMAIL_OTP_ENABLED=true
# Uncomment and fill for Microsoft work/school OIDC (authorization code + PKCE):
# NEXT_PUBLIC_OIDC_AUTHORITY=https://login.microsoftonline.com/<tenant-id>/v2.0
# NEXT_PUBLIC_OIDC_CLIENT_ID=<spa-client-id>
# NEXT_PUBLIC_OIDC_SCOPES=openid profile offline_access api://<api-app-id>/access_as_user
# NEXT_PUBLIC_OIDC_REDIRECT_URI=http://localhost:3000/auth/callback
'@

    if (Test-Path $envLocalPath) {
        $existing = Get-Content -Path $envLocalPath -Raw
        if ($existing -notmatch "private-beta local auth") {
            Add-Content -Path $envLocalPath -Value $authBlock
            Write-Host "Appended auth flags to archlucid-ui/.env.local" -ForegroundColor Green
        }
        else {
            Write-Host "archlucid-ui/.env.local already has private-beta auth block - not modified" -ForegroundColor DarkGray
        }
    }
    else {
        Copy-Item (Join-Path $RepoRoot "archlucid-ui\.env.example") $envLocalPath
        Add-Content -Path $envLocalPath -Value $authBlock
        Write-Host "Created archlucid-ui/.env.local from .env.example + auth flags" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Local private-beta auth profile ready." -ForegroundColor Green
Write-Host "1. API terminal:  Set-Location '$RepoRoot'; . .\.local\dev-auth\env.ps1; dotnet run --project ArchLucid.Api"
Write-Host "2. UI terminal:   Set-Location '$RepoRoot\archlucid-ui'; npm run dev"
Write-Host "3. Open http://localhost:3000/auth/signin - expect Email code + (optional) Work/school after OIDC vars are set."
Write-Host ""
Write-Host "Email OTP with Email:Provider=Noop does not deliver codes. Use SMTP/Mailpit or ACS for inbox delivery." -ForegroundColor Yellow
Write-Host "Dev Azure: set DEV_PRIVATE_BETA_AUTH_ENABLED=true and GitHub vars/secrets - see docs/operations/GITHUB_CD_ENVIRONMENTS.md" -ForegroundColor Yellow
