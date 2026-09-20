---
name: my-api
description: Local dev, Docker, and Azure Container Apps deployment workflow for the my-api Express service (Cosmos DB + Service Bus). Use for running it locally, building/running its Docker image, or debugging its GitHub Actions deploy to Azure.
---

# my-api dev & deploy workflow

Express API that processes Cosmos DB events and Azure Blob storage events delivered via
Azure Service Bus, and persists results to Cosmos DB. See [README.md](../../../README.md)
for the full env var table and project structure.

## Local development

```bash
npm install
cp .env.example .env   # fill in real values, see README for the full list
npm run dev             # tsx watch, live reload
npm run build            # tsc -> dist/
npm start                 # run compiled build
```

Required env vars (all in `.env`): `AZURE_SERVICE_BUS_CONNECTION_STRING`,
`AZURE_SERVICE_BUS_QUEUE_NAME`, `AZURE_SERVICE_BUS_BLOB_QUEUE_NAME`,
`COSMOS_DB_CONNECTION_STRING`, `COSMOS_DB_DATABASE_ID`, `COSMOS_DB_CONTAINER_ID`, `PORT`.

**Both** `AZURE_SERVICE_BUS_QUEUE_NAME` (Cosmos events) and
`AZURE_SERVICE_BUS_BLOB_QUEUE_NAME` (blob events) must be set — they can point at the
same queue. If `AZURE_SERVICE_BUS_BLOB_QUEUE_NAME` is empty, `blobEventListener.ts` calls
`createReceiver("")`, which fails at runtime with
`ServiceBusError: InvalidFieldError: Attach.Source/Target.Address cannot be null`.

`COSMOS_DB_CONNECTION_STRING` must be the **full** connection string
(`AccountEndpoint=https://<account>.documents.azure.com:443/;AccountKey=<key>;`), not just
the bare account key — a bare key throws `Could not parse the provided connection string`
from `@azure/cosmos`'s `parseConnectionString`.

## Docker

```bash
docker build -t my-api .
docker run --env-file .env -p 3000:3000 my-api
```

`.env` is excluded via `.dockerignore` by design (never baked into the image) — it must be
supplied at `docker run` time with `--env-file .env`, or the container starts with every
env var empty and crashes immediately on the Cosmos connection string parse.

If `docker run` fails with `port is already allocated`, another container already holds
host port 3000 — check `docker ps` for a stale container from a previous run and
`docker stop` it (or remap with `-p 3001:3000`).

If a container can resolve nothing (`EAI_AGAIN` on any hostname, not just Azure ones) and
the host is on a VPN, Docker Desktop's internal DNS forwarder can fail to reach the VPN's
resolver. Confirm with `docker run --rm --dns 1.1.1.1 alpine nslookup <host>` (works) vs the
default (fails), then fix via Docker Desktop's daemon config (`dns` key) — note Docker
Desktop rewrites `~/.docker/daemon.json` on its own restarts, so a manually-added `dns` key
there does not reliably survive; the Docker Desktop UI's own Settings takes precedence.
Restarting Docker Desktop takes down the whole VM briefly (all other running containers
too) and can occasionally leave the VM in a broken state (`no route to host` to
`192.168.65.7`) requiring a full `pkill -f "Docker Desktop"` + `pkill -f com.docker.backend`
+ relaunch to actually recover — a plain `osascript -e 'quit app "Docker"'` isn't always
enough.

## Azure deployment

Deploys via GitHub Actions to Azure Container Apps (`myvault-container-api` in resource
group `myvalut-rg`, image pushed to ACR `myvaultapiacr-a9cyfhdkakd3gwb7.azurecr.io`).

The **real, live** workflow is whatever is committed under `.github/workflows/` on
`origin/main` — check with `git fetch && git ls-tree -r origin/main --name-only | grep
workflows` before trusting a local file, since Azure Portal's "Continuous Deployment"
wizard commits its own auto-generated workflow directly to the repo (commit message
"Create an auto-deploy file"), which can silently coexist with or replace a hand-written
one you have locally but never pushed.

That auto-generated workflow uses `azure/container-apps-deploy-action@v2`. Known Portal
wizard bug: it can emit **literal unsubstituted template placeholders** instead of real
input keys, e.g.:

```yaml
_dockerfilePathKey_: _dockerfilePath_
_targetLabelKey_: _targetLabel_
_buildArgumentsKey_: |
  _buildArgumentsValues_
```

The action silently ignores unrecognized inputs and falls back to its Oryx/buildpack
auto-builder, which fails on this project with `No builder was able to build the provided
application source`. Fix: replace with the real key, `dockerfilePath: Dockerfile` (and drop
`targetLabel`/`buildArguments` if unused). Valid inputs for that action (from its own error
message when given a bad key): `appSourcePath`, `acrName`, `acrUsername`, `acrPassword`,
`registryUrl`, `registryUsername`, `registryPassword`, `azureCredentials`, `imageToBuild`,
`imageToDeploy`, `dockerfilePath`, `containerAppName`, `resourceGroup`,
`containerAppEnvironment`, `runtimeStack`, `builderStack`, `buildArguments`, `targetPort`,
`location`, `environmentVariables`, `ingress`, `yamlConfigPath`, `disableTelemetry`,
`targetLabel`.

Azure login in that workflow uses OIDC via a **user-assigned managed identity**
(`managedEnvironment-myvalutrg-8fd1myvaultapiacrmyvalut-rgOidc`, client ID
`dc180f39-e8f4-4bcf-8078-85b797d23f0a`), not a traditional app registration — inspect its
federated credentials with `az identity federated-credential list --identity-name
managedEnvironment-myvalutrg-8fd1myvaultapiacrmyvalut-rgOidc -g myvalut-rg`, not
`az ad app federated-credential list` (that 404s on a managed identity's client ID). The
credential's `subject` must exactly match the OIDC token's `sub` claim: since the workflow
job sets `environment: production`, that's `repo:pravinrajk/myvault-api:environment:production`
— a `ref:refs/heads/main`-based subject (or one with malformed org/repo names) will not match
and Azure AD will reject the token exchange.

**GitHub Actions secrets vs. Container App env vars are separate concerns.** The
`MYVAULTCONTAINERAPI_AZURE_*` / `MYVAULTCONTAINERAPI_REGISTRY_*` secrets only authenticate
the CI pipeline to Azure/ACR — they are never passed into the running container. The app's
own runtime env vars (`COSMOS_DB_CONNECTION_STRING`, `AZURE_SERVICE_BUS_*`, etc.) must be
set separately on the Container App itself:

```bash
az containerapp show --name myvault-container-api --resource-group myvalut-rg \
  --query "properties.template.containers[0].env" -o json   # check what's actually set
```

In the Portal, these aren't a standalone page — go to the Container App → **Containers**
(left nav, under Application) → **Edit and deploy** → click the container row → tab
**Environment variables** → add each one (use "Reference a secret" for connection strings,
adding the actual value under **Secrets** first) → **Save** → **Create** to deploy the new
revision.
