@echo off
REM Legacy shim: delegates to test.cmd SqlServerIntegration. See docs/TEST_EXECUTION_MODEL.md.
REM Set ARCHLUCID_SQL_TEST to a full SQL connection string before running.
REM Will be retired after 2026-Q3; new docs/runbooks should call test.cmd SqlServerIntegration directly.
setlocal
cd /d "%~dp0"
call "%~dp0test.cmd" SqlServerIntegration
exit /b %ERRORLEVEL%
