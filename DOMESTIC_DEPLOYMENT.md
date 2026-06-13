# Domestic Deployment Guide

This project is split into:

- Frontend: Tencent EdgeOne Pages
- Backend: Tencent Cloud Lighthouse/CVM with Docker Compose

## 1. Backend on Tencent Cloud

Use a Tencent Cloud Lighthouse or CVM instance with Docker and Docker Compose installed.

Recommended firewall/security group rule:

- Open `22` for SSH.
- Open `80` and `443` if you put Nginx and HTTPS in front of the backend.
- Open `3000` only for temporary testing. For production, proxy HTTPS to the container and avoid exposing `3000` publicly.

Upload or clone the repository on the server:

```bash
git clone https://github.com/Spanrua/coffee-shop-schedule.git
cd coffee-shop-schedule
```

Create the production environment file:

```bash
cp .env.tencent.example .env
openssl rand -hex 32
```

Edit `.env` and set:

```env
JWT_SECRET=<the-random-secret-from-openssl>
```

Start the backend:

```bash
docker compose -f docker-compose.tencent.yml --env-file .env up -d --build
```

Check status and logs:

```bash
docker compose -f docker-compose.tencent.yml ps
docker compose -f docker-compose.tencent.yml logs -f backend
```

Test health:

```bash
curl http://localhost:3000/health
```

The SQLite database is stored in the named Docker volume `coffee-shop-data`, mounted at `/app/data`.

## 2. Backend Domain and HTTPS

For production, bind a domain such as:

```text
api.example.com
```

Point the domain DNS record to your Tencent Cloud server. Then configure Nginx or a Tencent Cloud load balancer to proxy:

```text
https://api.example.com -> http://127.0.0.1:3000
```

The frontend API base URL should be:

```text
https://api.example.com/api
```

## 3. Frontend on EdgeOne Pages

Create an EdgeOne Pages project from the Git repository.

Build settings:

```text
Build command: cd frontend && npm install && npm run build
Output directory: frontend/dist
Node version: 18 or 20
```

Environment variables:

```env
VITE_API_URL=https://api.example.com/api
```

Replace `https://api.example.com/api` with the real Tencent Cloud backend API URL.

## 4. SPA Routing

The EdgeOne config includes a fallback from all routes to `/index.html`, so direct page refreshes in React Router should work.

## 5. Updating Deployments

Backend update:

```bash
git pull
docker compose -f docker-compose.tencent.yml --env-file .env up -d --build
```

Frontend update:

Push to the Git branch connected to EdgeOne Pages. EdgeOne should rebuild automatically.

## 6. Important Notes

- Do not commit the real `.env` file.
- Keep `JWT_SECRET` stable after launch, otherwise existing logins will be invalidated.
- Back up the Docker volume before major backend changes.
- The default frontend fallback API path is `/api`, but production should set `VITE_API_URL` to the backend HTTPS URL in EdgeOne.
