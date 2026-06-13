@echo off
setlocal

pushd "%~dp0"

if not exist node_modules (
  echo Installing dependencies...
  call npm.cmd install
  if errorlevel 1 goto :fail
)

echo Running tests...
call npm.cmd test
if errorlevel 1 goto :fail

echo Starting PDF-Fasi...
call npm.cmd start
if errorlevel 1 goto :fail

popd
exit /b 0

:fail
echo.
echo PDF-Fasi helper script failed.
popd
exit /b 1
