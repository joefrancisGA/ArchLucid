@echo off
REM Legacy shim: delegates to test.cmd Core. See docs/TEST_EXECUTION_MODEL.md.
REM Will be retired after 2026-Q3; new docs/runbooks should call test.cmd Core directly.
setlocal
cd /d "%~dp0"
call "%~dp0test.cmd" Core
exit /b %ERRORLEVEL%
