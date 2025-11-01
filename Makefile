# Initiative Tracker - Makefile
# Simplified Docker commands for development and testing

.PHONY: help
help: ## Show this help message
	@echo "Initiative Tracker - Docker Development Environment"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

# Development Commands
.PHONY: dev
dev: ## Start development environment with hot reload
	docker-compose -f infrastructure/docker-compose.dev.yml up

.PHONY: dev-build
dev-build: ## Build and start development environment
	docker-compose -f infrastructure/docker-compose.dev.yml up --build

.PHONY: dev-down
dev-down: ## Stop development environment
	docker-compose -f infrastructure/docker-compose.dev.yml down

.PHONY: dev-logs
dev-logs: ## View development container logs
	docker-compose -f infrastructure/docker-compose.dev.yml logs -f

# Testing Commands
.PHONY: test
test: ## Run all tests in Docker containers
	@scripts/test.bat all

.PHONY: test-server
test-server: ## Run server tests only
	@scripts/test.bat server

.PHONY: test-dm
test-dm: ## Run DM console tests only
	@scripts/test.bat dm-console

.PHONY: test-integration
test-integration: ## Run integration tests
	@scripts/test.bat integration

.PHONY: test-watch
test-watch: ## Run tests in watch mode
	@scripts/test.bat all --watch

.PHONY: test-coverage
test-coverage: ## Run tests with coverage report
	@scripts/test.bat all --coverage

.PHONY: test-build
test-build: ## Build test containers
	docker-compose -f infrastructure/docker-compose.test.yml build

.PHONY: test-down
test-down: ## Stop test containers
	docker-compose -f infrastructure/docker-compose.test.yml down

# Production Commands
.PHONY: prod
prod: ## Start production environment
	docker-compose -f infrastructure/docker-compose.yml up -d

.PHONY: prod-build
prod-build: ## Build and start production environment
	docker-compose -f infrastructure/docker-compose.yml up -d --build

.PHONY: prod-down
prod-down: ## Stop production environment
	docker-compose -f infrastructure/docker-compose.yml down

.PHONY: prod-logs
prod-logs: ## View production container logs
	docker-compose -f infrastructure/docker-compose.yml logs -f

# Utility Commands
.PHONY: clean
clean: ## Clean all containers, volumes, and test artifacts
	docker-compose -f infrastructure/docker-compose.yml down -v
	docker-compose -f infrastructure/docker-compose.dev.yml down -v
	docker-compose -f infrastructure/docker-compose.test.yml down -v
	@if exist server\coverage rmdir /s /q server\coverage
	@if exist web\dm-console\coverage rmdir /s /q web\dm-console\coverage
	@if exist tests\results rmdir /s /q tests\results

.PHONY: clean-images
clean-images: clean ## Clean all containers, volumes, and Docker images
	docker-compose -f infrastructure/docker-compose.yml down --rmi all
	docker-compose -f infrastructure/docker-compose.dev.yml down --rmi all
	docker-compose -f infrastructure/docker-compose.test.yml down --rmi all

.PHONY: install
install: ## Install dependencies in containers
	docker-compose -f infrastructure/docker-compose.dev.yml run --rm server npm install
	docker-compose -f infrastructure/docker-compose.dev.yml run --rm dm-console npm install

.PHONY: lint
lint: ## Run linters in containers
	docker-compose -f infrastructure/docker-compose.dev.yml run --rm server npm run lint
	docker-compose -f infrastructure/docker-compose.dev.yml run --rm dm-console npm run lint

.PHONY: format
format: ## Run code formatters in containers
	docker-compose -f infrastructure/docker-compose.dev.yml run --rm server npm run format
	docker-compose -f infrastructure/docker-compose.dev.yml run --rm dm-console npm run format

.PHONY: shell-server
shell-server: ## Open shell in server container
	docker-compose -f infrastructure/docker-compose.dev.yml exec server sh

.PHONY: shell-dm
shell-dm: ## Open shell in DM console container
	docker-compose -f infrastructure/docker-compose.dev.yml exec dm-console sh

.PHONY: shell-redis
shell-redis: ## Open Redis CLI
	docker-compose -f infrastructure/docker-compose.dev.yml exec redis redis-cli

.PHONY: ps
ps: ## Show running containers
	@echo "Development containers:"
	@docker-compose -f infrastructure/docker-compose.dev.yml ps
	@echo ""
	@echo "Test containers:"
	@docker-compose -f infrastructure/docker-compose.test.yml ps
	@echo ""
	@echo "Production containers:"
	@docker-compose -f infrastructure/docker-compose.yml ps

# Quick setup commands
.PHONY: setup
setup: ## Initial project setup
	@echo "Setting up Initiative Tracker development environment..."
	@echo "Building Docker images..."
	@$(MAKE) dev-build
	@echo "Installing dependencies..."
	@$(MAKE) install
	@echo "Setup complete! Run 'make dev' to start the development environment."

.PHONY: reset
reset: clean ## Reset everything to clean state
	@echo "Resetting Initiative Tracker to clean state..."
	@$(MAKE) clean-images
	@echo "Reset complete! Run 'make setup' to reinitialize."

# Default target
.DEFAULT_GOAL := help