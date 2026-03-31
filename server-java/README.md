# server-java

Spring Boot version of the Guangda strategy demo backend.

## Run

1. Copy `src/main/resources/application-local.yml.example` to your local config or set env vars:
   - `MODEL_API_URL`
   - `MODEL_API_KEY`
   - `MODEL_NAME`
2. Start the service:

```bash
mvn spring-boot:run
```

Default port: `3002`

## Endpoints

- `GET /health`
- `GET /ready`
- `POST /api/product-ai-brief`
- `POST /api/extract-preference`
