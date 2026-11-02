# DisasterConnect Frontend

This is the corrected React + Vite frontend source.

## Backend URL

The API client is configured to use:

`http://disasterconnect-env.eba-un8ixjpz.us-east-2.elasticbeanstalk.com`

The URL is centralized in `src/services/api.js`. To override it locally, copy `.env.example` to `.env` and set `VITE_API_BASE_URL`.

## Run locally

1. Install Node.js (LTS).
2. Open a terminal in this folder.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open the local URL printed by Vite.

## Build for deployment

Run `npm run build`. Vite writes the production frontend to `dist/`.

## Important AWS deployment notes

- This archive originally contained only the `src/` folder. A Vite project shell (`package.json`, `index.html`, and `vite.config.js`) has been added so it can be installed and built as a frontend project.
- The Elastic Beanstalk URL supplied for the backend uses **HTTP**. If you host the frontend on an **HTTPS** domain, browsers will block calls from the secure frontend to this insecure backend (mixed-content security). Enable HTTPS for the backend (for example, with an HTTPS load balancer and a certificate) and then update `VITE_API_BASE_URL`.
- The Spring Boot backend must allow the frontend's deployed origin in its CORS configuration. Allow the required methods and the `Authorization` and `Content-Type` headers.
- The registration screen calls `POST /api/auth/register`. That route must exist in the backend; otherwise registration will return 404.
- API endpoint names and request/response fields are retained from the supplied frontend. I can validate frontend syntax and imports, but cannot guarantee every endpoint's business logic without the matching deployed backend API contract and runtime responses.
