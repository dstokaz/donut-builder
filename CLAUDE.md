# Local development rules

This project is a static site (index.html, donut.html, combo.html) managed by Docker Compose and the central `dev` command.

Project root: /Users/dmitriystokaz/Claude
Local dev control plane: /Users/dmitriystokaz/Claude/local-dev

Do not serve this site manually with commands such as `python -m http.server`, `npx serve`, `caddy run`, or similar. Use only:

- Start: `dev start donut-builder`
- Stop: `dev stop donut-builder`
- Status: `dev status`
- Logs: `dev logs donut-builder`
- URL: `dev url donut-builder`

Before browser checks, run:

```bash
dev status
```

Do not choose or change ports without updating:

- docker-compose.yml
- /Users/dmitriystokaz/Claude/local-dev/apps.tsv
- /Users/dmitriystokaz/Claude/local-dev/Caddyfile

The assigned local URL is:

http://donut-builder.localhost

## Port assignments (fixed)

- Host port: 3007 (also http://localhost:3007)
- Container port: 80 (Caddy file server)
