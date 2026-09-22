# Inventory-IT — Documentation technique

Application web d'inventaire du parc informatique de l'Ensemble Scolaire Jean-XXIII.
Monorepo : backend `Express` + `MariaDB`, frontend `Next.js`, déployé sur le VPS
via Docker et exposé par Cloudflare Tunnel.

## 1. Architecture

```mermaid
flowchart LR
    subgraph VPS
        CF[Cloudflare Tunnel] --> N[nginx proxy-net]
        N --> F[frontend<br/>Next.js :3000]
        N --> B[backend<br/>Express :5000]

        subgraph reseau internal
            B --> DB[(MariaDB :3306)]
            F -.-> B
        end
    end

    U[Utilisateur ‍— navigateur] --> CF
```

- Le frontend appelle l'API uniquement via `NEXT_PUBLIC_API_URL` (URL publique,
  ex. `https://inventory-it.2025.jeanxxiii.net/api`).
- En production, les trois conteneurs vivent sur un réseau interne (`internal`),
  seule nginx accède aux ports applicatifs, via le réseau externe `proxy-net`.

## 2. Base de données

```mermaid
erDiagram
    users {
        varchar id PK
        varchar email UK
        varchar first_name
        varchar last_name
        varchar password_hash
        timestamp created_at
    }
    object_types {
        int id PK
        varchar name UK
        int sort_order
        timestamp created_at
    }
    object_fields {
        int id PK
        int object_type_id FK
        varchar label
        varchar field_key
        enum input_type
        json options
        bool is_required
        int sort_order
    }
    objects {
        int id PK
        int object_type_id FK
        varchar name
        json data
        timestamp created_at
        timestamp updated_at
    }

    object_types ||--o{ object_fields : "a"
    object_types ||--o{ objects : "type"
```

- `objects.data` est un JSON libre validé côté backend contre le gabarit du type
  (`object_fields`) : clés inconnues rejetées, format validé par `input_type`
  (`text`, `number`, `date`, `mac`, `ip`, `select`, `boolean`) et champs
  obligatoires (`is_required`) contrôlés.
- `init.sql` fournit le schéma + le seed des 6 types : Switch, Écran, Serveur,
  Ordinateur, Clavier, Souris. Les tables `object_types` / `object_fields` sont
  déclarées avec un `AUTO_INCREMENT` de départ (7 et 36) : les champs du seed
  prennent donc les `id` 36-76, le premier champ créé ensuite reçoit le `id` 77.
- Suppression d'un type : `ON DELETE CASCADE` détruit ses objets et ses gabarits.

## 3. API REST

Toutes les routes sauf `/api/auth/login` exigent le header
`Authorization: Bearer <jwt>` (JWT signé via `JWT_SECRET`).

| Méthode | Route                     | Description                                  |
| ------- | ------------------------- | -------------------------------------------- |
| POST    | `/api/auth/login`         | Connecte par e-mail, retourne `{ token, user }` |
| GET     | `/api/auth/me`            | Compte courant (valide le token)             |
| PUT     | `/api/auth/profile`       | Modifie l'e-mail du compte                   |
| PUT     | `/api/auth/password`      | Modifie le mot de passe (vérifie l'actuel)   |
| GET     | `/api/users`              | Liste des comptes (sans `password_hash`)     |
| POST    | `/api/users`              | Crée un compte (prénom + nom + e-mail, mdp temporaire envoyé par e-mail) |
| DELETE  | `/api/users/:id`          | Supprime un compte (auto-suppression refusée) |
| GET     | `/api/types`              | Types + champs du gabarit                    |
| POST    | `/api/types`              | Crée un type                                 |
| PUT     | `/api/types/:id`          | Renomme / décrit un type                     |
| DELETE  | `/api/types/:id`          | Supprime type + objets + gabarit (cascade)   |
| POST    | `/api/types/:id/fields`   | Ajoute un champ au gabarit                   |
| PUT     | `/api/fields/:id`         | Modifie un champ                             |
| DELETE  | `/api/fields/:id`         | Supprime un champ                            |
| GET     | `/api/objects?typeId=`    | Tous les objets (filtrés par type si fourni) |
| POST    | `/api/objects`            | Crée un objet (`object_type_id`, `name`, `data`) |
| PUT     | `/api/objects/:id`        | Modifie `name` / `data`                      |
| DELETE  | `/api/objects/:id`        | Supprime un objet                            |

### Gestion d'erreur

- Erreurs métier : `AppError` (statut HTTP + champ `error`).
- Erreurs imprévues : 500 « Erreur interne de la base de données. » sans fuite de
  détail vers le client.

## 4. Frontend

### Pages

```mermaid
flowchart LR
    R{Route} --> C{Token valide ?}
    C -- non --> CON[/connexion/]
    C -- oui --> I[/ inventaire par type /]
    C -- oui --> G[/gabarits/]
    CON -->|login| I
```

- **`/`** — inventaire : un panneau par type (DataTable + graphiques SVG maison
  réactifs à la recherche), barre d'onglets fixe hors du conteneur de scroll,
  en-têtes de colonnes sticky dans chaque DataTable, rechargement au focus,
  édition inline (récupération du champ MAC via le double-clic).
- **`/connexion`** — connexion (e-mail + mot de passe + JWT). Les comptes sont
  créés depuis `/utilisateurs` ou via le script `backend/scripts/add-user.ts`
  exécuté dans le conteneur backend (`docker exec`).
- **`/utilisateurs`** — création et liste des comptes (prénom, nom, e-mail,
  DataTable avec recherche et tri) : `POST /api/users` génère un mot de passe
  temporaire qui est envoyé par e-mail (SMTP) ou renvoyé dans la réponse si
  SMTP est absent ; suppression avec confirmation, auto-suppression bloquée
  côté API.
- **`/gabarits`** — gestion des types et de leurs champs (création, renommage,
  suppression, réordonnancement).
- **`/profil`** — compte connecté : modification de l'e-mail et du mot de passe
  (change l'e-mail via `PUT /api/auth/profile`, le mot de passe via
  `PUT /api/auth/password`).

### État

- `useInventory` charge `types` + `objects` et expose les opérations CRUD avec
  rechargement après mutation.
- `useSearch` / `useSort` partagés entre les panneaux (filtre par objet, colonne,
  type).
- 401 → suppression du token + redirection `/connexion` ; exception : une erreur
  401 de login (pas de token stocké) est remontée telle quelle.

## 5. Déploiement

- `docker-compose.prod.yml` utilise le réseau externe `proxy-net` et une image
  frontend standalone (Next.js `output: standalone`).
- Workflow GitHub `.github/workflows/deploy.yml` : build dist + compose up sur le
  VPS (`/home/jeanxxiii-apps/inventory-it`, runner self-hosted).
- Variables attendues côté prod : `NEXT_PUBLIC_API_URL`, `MYSQL_*`, `JWT_SECRET`,
  `FRONTEND_URL`, `DB_PORT_REMOTE` (port exposé de MariaDB pour backups), et
  optionnellement `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` pour
  l'envoi des identifiants à la création d'un compte (sans elles, le mot de
  passe temporaire est renvoyé en clair dans la réponse API).

## 6. État connu / limites

- `npm run lint` (eslint-config-next + typescript-eslint) échoue sur TypeScript 7 :
  erreur identique sur tous les projets (DEFI-Vie-de-classe compris). Le contrôle
  TS du build (`next build`) reste actif et passe.
- Un seul rôle : tout compte authentifié a accès à tout ; identifiants = e-mail
  unique + mot de passe (colonne `username` supprimée de `users`).