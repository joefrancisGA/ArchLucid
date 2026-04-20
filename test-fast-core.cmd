@echo off
REM Legacy shim: delegates to test.cmd FastCore. See docs/TEST_EXECUTION_MODEL.md.
REM Will be retired after 2026-Q3; new docs/runbooks should call test.cmd FastCore directly.
setlocal
cd /d "%~dp0"
call "%~dp0test.cmd" FastCore
exit /b %ERRORLEVEL%
