# Inventory-IT

Inventaire du parc informatique de l'Ensemble Scolaire Jean-XXIII.
Gérez les équipements par gabarit de type (Switch, Écran, Serveur, Ordinateur,
Clavier, Souris) : champs personnalisables, validation des adresses MAC/IP,
DataTables filtrables et graphiques par type.

## Stack

- **Backend** : Node.js 20 + Express + MariaDB (`mysql2`), JWT, TypeScript.
- **Frontend** : Next.js 16 (App Router, `output: standalone`) + Tailwind CSS v4, React.
- **Déploiement** : Docker Compose sur le VPS, exposé via Cloudflare Tunnel.

## Architecture

```
backend/     API REST TypeScript (Express + MariaDB)
frontend/    Application Next.js (pages inventaire, connexion, gabarits, profil)
init.sql     Schéma + seed des 6 types (exécuté au premier démarrage de la DB)
docker-compose.yml        Environnement de développement
docker-compose.prod.yml   Environnement de production (VPS)
.github/workflows/        CI (PR auto) + CD (deploy)
docs/technical-doc.md     Documentation technique (schémas Mermaid)
```

## Démarrage en développement

1. Créez `.env` à partir de `.env.example` et remplissez les valeurs
   (`MYSQL_*`, `JWT_SECRET`, `NEXT_PUBLIC_API_URL=http://localhost:5000/api`).
2. Lancez la stack :

```bash
make dev-build   # construit les images
make dev-up      # démarre db (init.sql appliqué), backend (:5000), frontend (:3000)
make dev-down    # arrête la stack
make dev-logs    # logs
```

3. Ouvrez http://localhost:3000 et créez le premier utilisateur via le script
   exécuté dans le conteneur backend (le mot de passe est haché en bcrypt) :

```bash
docker exec -it backend-inventory-it npx tsx scripts/add-user.ts admin votre-mdp
```

## Développement sans Docker

- **Backend** : `cd backend && npm install && npm run dev` (attend une MariaDB
  `inventory_it` et les variables `DB_*` / `JWT_SECRET` dans `backend/.env`).
- **Frontend** : `cd frontend && npm install && npm run dev`.

## Tests manuels de l'API

```bash
TOKEN=$(curl -s -X POST localhost:5000/api/auth/login -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"votre-mdp"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])')

curl -s localhost:5000/api/types -H "Authorization: Bearer $TOKEN"
curl -s -X POST localhost:5000/api/objects -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"object_type_id":1,"name":"Switch Salle 12","data":{"adresse_mac":"AA:BB:CC:DD:EE:01"}}'
```

## Production (VPS)

- `docker-compose.prod.yml` : réseau interne `inventory-it_prod_internal`, accès
  reverse-proxy via le réseau externe `proxy-net`, volume de données
  `db_data_prod`.
- Variables requises : `NEXT_PUBLIC_API_URL`, `MYSQL_*`, `JWT_SECRET`,
  `FRONTEND_URL`, et `DB_PORT_REMOTE` si vous exposez MariaDB pour les backups.
- Rebranchez le domaine dans Cloudflare en cas de réinstallation.
- Le workflow `.github/workflows/deploy.yml` déploie automatiquement sur le VPS
  (`/home/jeanxxiii-apps/inventory-it`) à chaque push sur `main`.

## Notes

- `npm run lint` est cassé sur TypeScript 7 avec `typescript-eslint` (pb connu,
  identique sur tous les projets Jean-XXIII) ; le typecheck de `next build` reste
  l'autorité.
- **`/profil`** — compte connecté : e-mail et mot de passe modifiables depuis
  le header (« Profil »).
- Un seul rôle : tout compte authentifié administre l'inventaire.
- Licence : MIT — voir `LICENSE`.