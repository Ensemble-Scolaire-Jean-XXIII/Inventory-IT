# Directives pour l'Agent IA

## 1. Sécurité et Exécution

- Ne jamais exécuter de commande `rm -rf` sans l'accord explicite de l'utilisateur.
- Ne jamais utiliser `sudo` sans l'accord explicite de l'utilisateur (la saisie du mot de passe est requise).
- Ne pas regarder dans le .env, le .env.example est toléré

## 2. Gestion de Version (Git)

- Lors de l'ajout de fichiers, utiliser systématiquement `git add .` (ne pas ajouter les fichiers un par un afin d'éviter les oublis).
- Ne jamais exécuter `git commit` ou `git push` sans l'accord explicite de l'utilisateur.

## 3. Normes de Code

- N'ajouter absolument aucun commentaire dans le code source généré.

## 4. Documentation Technique

- Produire une documentation technique séparée (fichiers `.md`) pour chaque composant ou fonctionnalité.
- Mettre à jour cette documentation de manière rigoureuse à chaque modification apportée au composant correspondant.

## 5. Modélisation et Représentation

- Se demander systématiquement quelle est la représentation la plus pertinente pour expliquer ou documenter une partie spécifique de l'application.
- Utiliser des diagrammes Mermaid au sein des fichiers `.md` pour illustrer l'architecture, les flux et les interactions des différents composants.