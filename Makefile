# ===================================
# Nintendo 100% Checklists - Makefile
# ===================================

PORT ?= 8000
HOST ?= 127.0.0.1
URL  := http://$(HOST):$(PORT)

# Detecta automaticamente python3 ou python
PYTHON ?= $(shell which python3 2>/dev/null || which python 2>/dev/null)

.PHONY: help
help:
	@echo "Available commands:"
	@echo "  make serve     - Start local server"
	@echo "  make open      - Open browser"
	@echo "  make dev       - Serve + open browser"
	@echo "  make test      - Run automated tests"
	@echo "  make check     - Basic project checks"
	@echo "  make clean     - Clean temp files"

.PHONY: serve
serve:
	@if [ -z "$(PYTHON)" ]; then \
		echo "Error: Python is required (python3 or python). Stop."; \
		exit 1; \
	fi
	@echo "Starting server at $(URL)"
	$(PYTHON) -m http.server $(PORT) --bind $(HOST)

.PHONY: open
open:
	@echo "Opening $(URL)"
	@if command -v xdg-open > /dev/null; then xdg-open $(URL); \
	elif command -v open > /dev/null; then open $(URL); \
	else echo "Open manually: $(URL)"; fi

.PHONY: dev
dev:
	@$(MAKE) -j2 serve open

.PHONY: test
test:
	@node --test

.PHONY: check
check:
	@echo "Checking project structure..."
	@test -f games/games.json || (echo "Missing games.json" && exit 1)
	@test -f assets/js/main.js || (echo "Missing main.js" && exit 1)
	@test -f assets/js/markdown.js || (echo "Missing markdown.js" && exit 1)
	@echo "All checks passed ✔"

.PHONY: clean
clean:
	@echo "Cleaning..."
	@find . -name ".DS_Store" -delete
	@echo "Done"