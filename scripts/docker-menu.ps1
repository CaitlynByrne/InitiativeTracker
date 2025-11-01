# Initiative Tracker - Docker Menu (PowerShell)
# Interactive menu for Docker operations

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

function Show-Menu {
    Clear-Host
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "     Initiative Tracker - Docker Menu" -ForegroundColor Yellow
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "DEVELOPMENT" -ForegroundColor Green
    Write-Host "  1. Setup (Initial build and install)"
    Write-Host "  2. Start development environment"
    Write-Host "  3. Start development (background)"
    Write-Host "  4. View development logs"
    Write-Host "  5. Stop development environment"
    Write-Host "  6. Rebuild development containers"
    Write-Host ""
    Write-Host "TESTING" -ForegroundColor Green
    Write-Host "  7. Run all tests"
    Write-Host "  8. Run server tests"
    Write-Host "  9. Run DM console tests"
    Write-Host " 10. Run tests in watch mode"
    Write-Host ""
    Write-Host "UTILITIES" -ForegroundColor Green
    Write-Host " 11. Open server shell"
    Write-Host " 12. Open DM console shell"
    Write-Host " 13. Open Redis CLI"
    Write-Host " 14. Clean all containers and artifacts"
    Write-Host " 15. Show running containers"
    Write-Host ""
    Write-Host "  Q. Quit" -ForegroundColor Red
    Write-Host ""
}

function Start-DockerDesktop {
    try {
        docker info | Out-Null
        return $true
    }
    catch {
        Write-Host "Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
        Write-Host "Press any key to continue..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        return $false
    }
}

function Execute-DockerCommand {
    param(
        [string]$Description,
        [string]$Command
    )

    Write-Host ""
    Write-Host $Description -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Gray

    Set-Location $ProjectRoot
    Invoke-Expression $Command

    Write-Host ""
    Write-Host "Press any key to continue..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Main loop
do {
    Show-Menu
    $choice = Read-Host "Select an option"

    if ($choice -eq 'Q' -or $choice -eq 'q') {
        Write-Host "Goodbye!" -ForegroundColor Green
        break
    }

    if (-not (Start-DockerDesktop)) {
        continue
    }

    switch ($choice) {
        '1' {
            Execute-DockerCommand `
                -Description "Setting up Initiative Tracker (this may take a few minutes)..." `
                -Command "docker-compose -f infrastructure/docker-compose.dev.yml build; docker-compose -f infrastructure/docker-compose.dev.yml run --rm server npm install; docker-compose -f infrastructure/docker-compose.dev.yml run --rm dm-console npm install"
        }
        '2' {
            Execute-DockerCommand `
                -Description "Starting development environment..." `
                -Command "docker-compose -f infrastructure/docker-compose.dev.yml up"
        }
        '3' {
            Execute-DockerCommand `
                -Description "Starting development environment in background..." `
                -Command "docker-compose -f infrastructure/docker-compose.dev.yml up -d"
            Write-Host "Services running at:" -ForegroundColor Green
            Write-Host "  Server:     http://localhost:3000" -ForegroundColor Cyan
            Write-Host "  DM Console: http://localhost:5173" -ForegroundColor Cyan
            Write-Host "  Redis:      localhost:6379" -ForegroundColor Cyan
        }
        '4' {
            Execute-DockerCommand `
                -Description "Viewing development logs (Ctrl+C to stop)..." `
                -Command "docker-compose -f infrastructure/docker-compose.dev.yml logs -f"
        }
        '5' {
            Execute-DockerCommand `
                -Description "Stopping development environment..." `
                -Command "docker-compose -f infrastructure/docker-compose.dev.yml down"
        }
        '6' {
            Execute-DockerCommand `
                -Description "Rebuilding development containers..." `
                -Command "docker-compose -f infrastructure/docker-compose.dev.yml down; docker-compose -f infrastructure/docker-compose.dev.yml build; docker-compose -f infrastructure/docker-compose.dev.yml up"
        }
        '7' {
            Execute-DockerCommand `
                -Description "Running all tests..." `
                -Command @"
                    docker-compose -f infrastructure/docker-compose.test.yml up -d redis-test
                    Start-Sleep -Seconds 3
                    docker-compose -f infrastructure/docker-compose.test.yml run --rm server-test npm test
                    docker-compose -f infrastructure/docker-compose.test.yml run --rm dm-console-test npm test
                    docker-compose -f infrastructure/docker-compose.test.yml --profile integration run --rm integration-test npm run test:integration
                    docker-compose -f infrastructure/docker-compose.test.yml down
"@
        }
        '8' {
            Execute-DockerCommand `
                -Description "Running server tests..." `
                -Command @"
                    docker-compose -f infrastructure/docker-compose.test.yml up -d redis-test
                    Start-Sleep -Seconds 3
                    docker-compose -f infrastructure/docker-compose.test.yml run --rm server-test npm test
                    docker-compose -f infrastructure/docker-compose.test.yml down
"@
        }
        '9' {
            Execute-DockerCommand `
                -Description "Running DM console tests..." `
                -Command @"
                    docker-compose -f infrastructure/docker-compose.test.yml up -d redis-test
                    docker-compose -f infrastructure/docker-compose.test.yml up -d server-test
                    Start-Sleep -Seconds 3
                    docker-compose -f infrastructure/docker-compose.test.yml run --rm dm-console-test npm test
                    docker-compose -f infrastructure/docker-compose.test.yml down
"@
        }
        '10' {
            Execute-DockerCommand `
                -Description "Running tests in watch mode (Ctrl+C to stop)..." `
                -Command "docker-compose -f infrastructure/docker-compose.test.yml up"
        }
        '11' {
            Execute-DockerCommand `
                -Description "Opening server shell (type 'exit' to leave)..." `
                -Command "docker-compose -f infrastructure/docker-compose.dev.yml exec server sh"
        }
        '12' {
            Execute-DockerCommand `
                -Description "Opening DM console shell (type 'exit' to leave)..." `
                -Command "docker-compose -f infrastructure/docker-compose.dev.yml exec dm-console sh"
        }
        '13' {
            Execute-DockerCommand `
                -Description "Opening Redis CLI (type 'exit' to leave)..." `
                -Command "docker-compose -f infrastructure/docker-compose.dev.yml exec redis redis-cli"
        }
        '14' {
            Execute-DockerCommand `
                -Description "Cleaning all containers and artifacts..." `
                -Command @"
                    docker-compose -f infrastructure/docker-compose.yml down -v 2>$null
                    docker-compose -f infrastructure/docker-compose.dev.yml down -v 2>$null
                    docker-compose -f infrastructure/docker-compose.test.yml down -v 2>$null
                    if (Test-Path server/coverage) { Remove-Item -Recurse -Force server/coverage }
                    if (Test-Path web/dm-console/coverage) { Remove-Item -Recurse -Force web/dm-console/coverage }
                    if (Test-Path tests/results) { Remove-Item -Recurse -Force tests/results }
"@
        }
        '15' {
            Execute-DockerCommand `
                -Description "Showing running containers..." `
                -Command @"
                    Write-Host 'Development containers:' -ForegroundColor Yellow
                    docker-compose -f infrastructure/docker-compose.dev.yml ps
                    Write-Host ''
                    Write-Host 'Test containers:' -ForegroundColor Yellow
                    docker-compose -f infrastructure/docker-compose.test.yml ps
                    Write-Host ''
                    Write-Host 'Production containers:' -ForegroundColor Yellow
                    docker-compose -f infrastructure/docker-compose.yml ps
"@
        }
        default {
            Write-Host "Invalid option. Please try again." -ForegroundColor Red
            Start-Sleep -Seconds 2
        }
    }
} while ($true)