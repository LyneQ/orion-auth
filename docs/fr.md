# Documentation API d'Authentification

## Introduction

Cette API fournit un système d'authentification complet avec inscription, connexion, rafraîchissement de token et
déconnexion.

## Configuration Requise

### Variables d'environnement:

- `DATABASE_URL`: URL de connexion à la base de données
- `JWT_SECRET`: Clé secrète pour la génération des JWT tokens
- `JWT_EXPIRES_IN`: Durée de validité des JWT tokens (ex: "1h")

## Modèles de Données

### Utilisateur (User)

- `id`: Identifiant unique (UUID)
- `email`: Adresse email unique
- `username`: Nom d'utilisateur unique
- `password`: Mot de passe hashé
- `createdAt`: Date de création
- `updatedAt`: Date de dernière mise à jour

### RefreshToken

- `id`: Identifiant unique (UUID)
- `token`: Token de rafraîchissement unique
- `userId`: ID de l'utilisateur associé
- `expiresAt`: Date d'expiration
- `createdAt`: Date de création

## Points d'Accès (Endpoints)

### Inscription

- **POST** `/auth/register`
- **Corps de la requête**:
  ```json
  {
    "email": "utilisateur@exemple.com",
    "username": "utilisateur",
    "password": "motdepasse"
  }
  ```
- **Réponse**: Données de l'utilisateur créé

### Connexion

- **POST** `/auth/login`
- **Corps de la requête**:
  ```json
  {
    "email": "utilisateur@exemple.com",
    "password": "motdepasse"
  }
  ```
- **Réponse**: Access token, refresh token et données utilisateur

### Rafraîchissement du Token

- **POST** `/auth/refresh`
- **Corps de la requête**:
  ```json
  {
    "refreshToken": "votre-refresh-token"
  }
  ```
- **Réponse**: Nouveau access token

### Déconnexion

- **POST** `/auth/logout`
- **Corps de la requête**:
  ```json
  {
    "refreshToken": "votre-refresh-token"
  }
  ```
- **Réponse**: Message de confirmation

## Gestion des Erreurs

- Utilisateur déjà existant: 409 Conflict
- Identifiants invalides: 401 Unauthorized
- Token invalide/expiré: 401 Unauthorized
- Utilisateur déjà connecté: 409 Conflict
- Requête invalide: 400 Bad Request
