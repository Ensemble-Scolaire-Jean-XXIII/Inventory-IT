COMPOSE_DEV=docker compose -f docker-compose.yml
COMPOSE_PROD=docker compose -f docker-compose.prod.yml

.PHONY: dev-up dev-down dev-build dev-logs prod-up prod-down prod-build prod-logs

dev-up:
	$(COMPOSE_DEV) up -d

dev-down:
	$(COMPOSE_DEV) down

dev-build:
	$(COMPOSE_DEV) build

dev-logs:
	$(COMPOSE_DEV) logs -f

prod-up:
	$(COMPOSE_PROD) up -d

prod-down:
	$(COMPOSE_PROD) down

prod-build:
	$(COMPOSE_PROD) build

prod-logs:
	$(COMPOSE_PROD) logs -f