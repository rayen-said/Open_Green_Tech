# Rapport technique complet de l’application Crop Advisor

## 1. Introduction générale

Crop Advisor est une plateforme SaaS d’aide à la décision pour l’agriculture connectée. Le projet combine trois briques complémentaires:

- une application frontend moderne pour visualiser les données terrain et interagir avec l’IA;
- un backend NestJS sécurisé pour l’authentification, la gestion des équipements, la télémétrie, les recommandations et les alertes;
- une base PostgreSQL pilotée par Prisma pour stocker les entités métier et l’historique.

L’objectif fonctionnel est clair: aider un exploitant agricole à comprendre l’état de ses capteurs, détecter des anomalies, recevoir des recommandations agronomiques exploitables et administrer son parc d’équipements. Le produit vise aussi une démonstration réaliste en contexte hackathon ou PFE, avec une interface premium, un mode temps réel et un assistant IA contextuel.

Le projet est donc à la croisée de trois domaines:

- IA générative et assistance conversationnelle;
- IoT agricole et télémétrie temps réel;
- SaaS sécurisé multi-rôles.

---

## 2. Architecture globale

### 2.1 Monorepo

Le dépôt est structuré en monorepo pnpm. Les espaces de travail principaux sont:

- [apps/backend](apps/backend)
- [apps/web](apps/web)
- [edge](edge)
- [packages/shared-types](packages/shared-types)

### 2.2 Rôle des dossiers

#### apps/backend
Contient l’API NestJS, la couche métier, Prisma, la sécurité et les modules de domaine.

#### apps/web
Contient l’application Next.js App Router, l’interface premium, la gestion de l’état client, l’i18n et la connexion à l’API.

#### edge
Contient un fichier Python `requirements.txt`. La couche edge est présente dans l’arborescence, mais elle n’est pas encore réellement exploitée dans le flux applicatif.

#### packages/shared-types
Le package partagé existe comme base d’un futur partage de types entre frontend et backend. Dans l’état actuel, il reste un point d’extension plus qu’un composant déjà central.

### 2.3 Vue logique du flux

```text
Capteur / opérateur
   ↓
Frontend Next.js
   ↓
API NestJS (auth, devices, telemetry, recommendations, alerts, chat)
   ↓
Prisma
   ↓
PostgreSQL
   ↓
Réponse API + WebSocket + assistant IA
   ↓
Frontend temps réel
```

### 2.4 Vue d’ensemble technique

Le projet s’appuie sur:

- NestJS 11 côté backend;
- Next.js 16 côté frontend;
- Prisma 7 pour l’accès aux données;
- PostgreSQL comme base relationnelle;
- Socket.IO pour le temps réel;
- OpenAI comme couche IA optionnelle;
- Tailwind CSS et styles custom pour l’interface;
- Zustand pour l’état client;
- Axios pour les appels API.

---

## 3. Analyse du backend NestJS

### 3.1 Point d’entrée: `main.ts`

Fichier: [apps/backend/src/main.ts](apps/backend/src/main.ts)

Rôle:
- créer l’application NestJS;
- configurer les pipes de validation globaux;
- activer le préfixe global `api`;
- activer CORS;
- brancher le logger Pino;
- enregistrer les hooks d’arrêt propres sur Prisma;
- démarrer l’écoute HTTP.

Méthodes:
- `bootstrap()`
  - instancie `AppModule`;
  - configure `ValidationPipe` avec `whitelist`, `transform` et `forbidNonWhitelisted`;
  - lit `Logger` depuis le conteneur Nest;
  - récupère `PrismaService` pour gérer l’arrêt propre de l’application;
  - lance `app.listen()` sur `PORT` ou `3000`.

Flux:
- requête HTTP entrante → NestJS → pipes globaux → contrôleur ciblé.

### 3.2 Module racine: `app.module.ts`

Fichier: [apps/backend/src/app.module.ts](apps/backend/src/app.module.ts)

Rôle:
- assembler tous les sous-modules du backend;
- déclarer les gardes globaux;
- configurer le logger, la limitation de débit et la configuration globale.

Imports majeurs:
- `ConfigModule`
- `LoggerModule`
- `ThrottlerModule`
- `PrismaModule`
- `AuthModule`
- `UsersModule`
- `DevicesModule`
- `TelemetryModule`
- `RecommendationsModule`
- `AlertsModule`
- `AdminModule`
- `DemoModule`
- `ChatModule`

Providers globaux:
- `JwtAuthGuard` pour l’authentification JWT;
- `RolesGuard` pour le RBAC;
- `ThrottlerGuard` pour la protection anti-spam.

### 3.3 Contrôleur racine: `app.controller.ts`

Fichier: [apps/backend/src/app.controller.ts](apps/backend/src/app.controller.ts)

Rôle:
- exposer un endpoint public de santé de l’API.

Méthode:
- `getHealth()`
  - renvoie un objet contenant le nom du service, son statut et la date courante.

Flux:
- `GET /api` → `AppController.getHealth()` → `AppService.getHealth()`.

### 3.4 Service racine: `app.service.ts`

Fichier: [apps/backend/src/app.service.ts](apps/backend/src/app.service.ts)

Rôle:
- fournir les données retournées par le point de santé.

Méthode:
- `getHealth()`
  - construit un objet `{ service, status, now }`.

### 3.5 Authentification: module, contrôleur, service

Fichiers:
- [apps/backend/src/auth/auth.module.ts](apps/backend/src/auth/auth.module.ts)
- [apps/backend/src/auth/auth.controller.ts](apps/backend/src/auth/auth.controller.ts)
- [apps/backend/src/auth/auth.service.ts](apps/backend/src/auth/auth.service.ts)
- [apps/backend/src/auth/jwt.strategy.ts](apps/backend/src/auth/jwt.strategy.ts)
- DTOs:
  - [apps/backend/src/auth/dto/signup.dto.ts](apps/backend/src/auth/dto/signup.dto.ts)
  - [apps/backend/src/auth/dto/login.dto.ts](apps/backend/src/auth/dto/login.dto.ts)
  - [apps/backend/src/auth/dto/refresh-token.dto.ts](apps/backend/src/auth/dto/refresh-token.dto.ts)
  - [apps/backend/src/auth/dto/logout.dto.ts](apps/backend/src/auth/dto/logout.dto.ts)

Rôle du module:
- configurer `PassportModule`;
- configurer `JwtModule` dynamiquement depuis les variables d’environnement;
- exposer `AuthService`.

Méthodes du contrôleur:
- `signup()`
  - endpoint public `POST /api/auth/signup`;
  - appelle `AuthService.signup()`.
- `login()`
  - endpoint public `POST /api/auth/login`;
  - appelle `AuthService.login()`.
- `refresh()`
  - endpoint public `POST /api/auth/refresh`;
  - appelle `AuthService.refresh()`.
- `logout()`
  - endpoint protégé `POST /api/auth/logout`;
  - appelle `AuthService.logout()`.
- `me()`
  - endpoint protégé `GET /api/auth/me`;
  - appelle `AuthService.me()`.

Méthodes du service:
- `signup(dto)`
  - vérifie si l’email existe déjà;
  - hash le mot de passe avec bcrypt;
  - crée l’utilisateur;
  - émet les tokens d’accès et de refresh.
- `login(dto)`
  - récupère l’utilisateur par email;
  - compare le mot de passe;
  - émet les tokens.
- `refresh(dto)`
  - vérifie le refresh token avec `JWT_REFRESH_SECRET`;
  - valide le hash stocké en base;
  - réémet une nouvelle paire de tokens.
- `logout(dto)`
  - invalide le refresh token côté base via `updateMany()`;
  - évite les erreurs si l’utilisateur a disparu après reseed.
- `me(userId)`
  - retourne le profil courant.
- `issueTokens(...)`
  - crée les JWT;
  - hache le refresh token;
  - persiste le hash en base.

Méthode de stratégie JWT:
- `validate(payload)`
  - renvoie le payload JWT comme `req.user`.

Flux métier:
1. l’utilisateur se connecte;
2. le backend vérifie le mot de passe;
3. le backend crée un access token et un refresh token;
4. le refresh token est haché en base;
5. les requêtes protégées utilisent le JWT via `JwtStrategy`.

### 3.6 Gestion des utilisateurs

Fichiers:
- [apps/backend/src/users/users.module.ts](apps/backend/src/users/users.module.ts)
- [apps/backend/src/users/users.controller.ts](apps/backend/src/users/users.controller.ts)
- [apps/backend/src/users/users.service.ts](apps/backend/src/users/users.service.ts)
- DTO: [apps/backend/src/users/dto/update-user-role.dto.ts](apps/backend/src/users/dto/update-user-role.dto.ts)

Objectif:
- administrer les comptes utilisateurs et les rôles.

Méthodes du contrôleur:
- `listUsers()`
  - endpoint `GET /api/users`;
  - réservé à l’ADMIN;
  - retourne la liste des utilisateurs.
- `updateRole(id, dto)`
  - endpoint `PATCH /api/users/:id/role`;
  - réservé à l’ADMIN;
  - modifie le rôle d’un utilisateur.

Méthodes du service:
- `listUsers()`
  - renvoie les utilisateurs triés par date de création;
  - inclut le nombre de devices associés.
- `updateRole(userId, dto)`
  - vérifie l’existence de l’utilisateur;
  - met à jour le rôle;
  - retourne une vue réduite du compte.

### 3.7 Gestion des devices

Fichiers:
- [apps/backend/src/devices/devices.module.ts](apps/backend/src/devices/devices.module.ts)
- [apps/backend/src/devices/devices.controller.ts](apps/backend/src/devices/devices.controller.ts)
- [apps/backend/src/devices/devices.service.ts](apps/backend/src/devices/devices.service.ts)
- DTOs:
  - [apps/backend/src/devices/dto/create-device.dto.ts](apps/backend/src/devices/dto/create-device.dto.ts)
  - [apps/backend/src/devices/dto/update-device.dto.ts](apps/backend/src/devices/dto/update-device.dto.ts)

Objectif:
- permettre la gestion CRUD des capteurs et équipements agricoles.

Méthodes du contrôleur:
- `create()`
  - `POST /api/devices`;
  - crée un device pour l’utilisateur courant.
- `findAll()`
  - `GET /api/devices`;
  - renvoie les devices de l’utilisateur ou tous les devices si ADMIN.
- `findOne()`
  - `GET /api/devices/:id`;
  - vérifie l’accès au device.
- `update()`
  - `PATCH /api/devices/:id`;
  - met à jour le device.
- `remove()`
  - `DELETE /api/devices/:id`;
  - supprime le device.

Méthodes du service:
- `create(ownerId, dto)`
  - crée un device en lui affectant `ownerId`.
- `findAll(userId, role)`
  - filtre les devices selon le rôle;
  - inclut le propriétaire.
- `findOne(id, userId, role)`
  - charge le device et vérifie les droits.
- `update(id, userId, role, dto)`
  - vérifie les droits puis modifie le device.
- `remove(id, userId, role)`
  - vérifie les droits puis supprime le device.

DTOs:
- `CreateDeviceDto`
  - valide `name`, `location`, `soilType`, `cropType`, `status`.
- `UpdateDeviceDto`
  - rend les mêmes champs optionnels pour les mises à jour partielles.

### 3.8 Télémétrie

Fichiers:
- [apps/backend/src/telemetry/telemetry.module.ts](apps/backend/src/telemetry/telemetry.module.ts)
- [apps/backend/src/telemetry/telemetry.controller.ts](apps/backend/src/telemetry/telemetry.controller.ts)
- [apps/backend/src/telemetry/telemetry.service.ts](apps/backend/src/telemetry/telemetry.service.ts)
- [apps/backend/src/telemetry/telemetry.gateway.ts](apps/backend/src/telemetry/telemetry.gateway.ts)
- DTO: [apps/backend/src/telemetry/dto/create-telemetry.dto.ts](apps/backend/src/telemetry/dto/create-telemetry.dto.ts)

Objectif:
- recevoir les mesures terrain en temps réel;
- les stocker;
- déclencher les alertes;
- pousser les événements au frontend via Socket.IO.

Méthodes du contrôleur:
- `latest()`
  - `GET /api/telemetry/latest`;
  - renvoie le dernier point de télémétrie par device.
- `list(deviceId)`
  - `GET /api/telemetry/:deviceId`;
  - renvoie l’historique d’un device.
- `create(deviceId, dto)`
  - `POST /api/telemetry/:deviceId`;
  - enregistre une mesure.

Méthodes du service:
- `create(deviceId, userId, role, dto)`
  - vérifie que le device existe;
  - contrôle les droits;
  - crée la mesure;
  - émet un événement WebSocket `telemetry:update`;
  - crée une alerte si anomalie, faible humidité ou forte température;
  - émet l’alerte via `alerts:new`.
- `list(deviceId, userId, role)`
  - retourne l’historique des mesures du device.
- `latest(userId, role)`
  - récupère les devices accessibles;
  - pour chacun, récupère la dernière mesure.

Méthodes du gateway:
- `emitTelemetry(payload)`
  - pousse un événement `telemetry:update`.
- `emitAlert(payload)`
  - pousse un événement `alerts:new`.
- `onPing(body)`
  - endpoint WebSocket de test `telemetry:ping`;
  - renvoie un accusé de réception.

DTO:
- `CreateTelemetryDto`
  - valide les seuils de température, humidité, luminosité et anomalie.

### 3.9 Recommandations IA

Fichiers:
- [apps/backend/src/recommendations/recommendations.module.ts](apps/backend/src/recommendations/recommendations.module.ts)
- [apps/backend/src/recommendations/recommendations.controller.ts](apps/backend/src/recommendations/recommendations.controller.ts)
- [apps/backend/src/recommendations/recommendations.service.ts](apps/backend/src/recommendations/recommendations.service.ts)
- DTO: [apps/backend/src/recommendations/dto/generate-recommendations.dto.ts](apps/backend/src/recommendations/dto/generate-recommendations.dto.ts)

Objectif:
- produire des recommandations agronomiques compréhensibles;
- utiliser l’IA si configurée, sinon un fallback déterministe.

Méthodes du contrôleur:
- `generate()`
  - `POST /api/recommendations/generate`;
  - génère des recommandations pour un device.
- `list()`
  - `GET /api/recommendations/:deviceId`;
  - retourne les recommandations déjà persistées.

Méthodes du service:
- `buildRules(temperature, humidity, light)`
  - construit un socle de règles métier pour irrigation, santé des cultures, fertilisation et choix de culture.
- `generateWithLLM(latest)`
  - tente un appel OpenAI;
  - retourne un payload JSON s’il est valide.
- `generate(deviceId, userId, role)`
  - vérifie les droits;
  - récupère la dernière mesure;
  - produit des recommandations LLM ou règles métier;
  - supprime les anciennes recommandations du device;
  - persiste les nouvelles recommandations.
- `list(deviceId, userId, role)`
  - vérifie les droits;
  - retourne les recommandations du device.

Logique fonctionnelle:
- si humidité basse, le système recommande d’augmenter l’irrigation;
- si température élevée, il signale un risque de stress thermique;
- si luminosité faible, il ajuste les conseils de fertilisation;
- selon le climat, il conseille des cultures plus résistantes ou plus diversifiées.

### 3.10 Alertes

Fichiers:
- [apps/backend/src/alerts/alerts.module.ts](apps/backend/src/alerts/alerts.module.ts)
- [apps/backend/src/alerts/alerts.controller.ts](apps/backend/src/alerts/alerts.controller.ts)
- [apps/backend/src/alerts/alerts.service.ts](apps/backend/src/alerts/alerts.service.ts)

Objectif:
- exposer les alertes détectées automatiquement par le système.

Méthodes du contrôleur:
- `list()`
  - `GET /api/alerts`;
  - retourne les alertes de l’utilisateur ou de tous les utilisateurs pour l’ADMIN.
- `acknowledge(id)`
  - `PATCH /api/alerts/:id/ack`;
  - marque une alerte comme lue.

Méthodes du service:
- `list(userId, role)`
  - filtre les alertes selon le rôle;
  - inclut les informations du device concerné.
- `acknowledge(alertId, userId, role)`
  - vérifie l’existence de l’alerte;
  - vérifie les droits;
  - passe `acknowledged` à `true`.

### 3.11 Administration

Fichiers:
- [apps/backend/src/admin/admin.module.ts](apps/backend/src/admin/admin.module.ts)
- [apps/backend/src/admin/admin.controller.ts](apps/backend/src/admin/admin.controller.ts)
- [apps/backend/src/admin/admin.service.ts](apps/backend/src/admin/admin.service.ts)

Objectif:
- fournir une vue globale pour l’ADMIN avec KPI, activité récente et devices critiques.

Méthode du contrôleur:
- `overview()`
  - `GET /api/admin/overview`;
  - réservé au rôle ADMIN.

Méthode du service:
- `overview()`
  - calcule:
    - le nombre total d’utilisateurs;
    - le nombre total de devices;
    - le nombre d’anomalies détectées;
    - le volume de télémétrie sur 24h;
    - le nombre d’alertes non acquittées;
  - charge l’activité récente;
  - groupe les devices problématiques;
  - renvoie les indicateurs pour le tableau de bord.

### 3.12 Mode démo

Fichiers:
- [apps/backend/src/demo/demo.module.ts](apps/backend/src/demo/demo.module.ts)
- [apps/backend/src/demo/demo.controller.ts](apps/backend/src/demo/demo.controller.ts)
- [apps/backend/src/demo/demo.service.ts](apps/backend/src/demo/demo.service.ts)

Objectif:
- automatiser une boucle de démonstration en temps réel pour les démos produit.

Fonctions clés:
- démarrage du flux démo;
- arrêt du flux démo;
- état courant du mode démo;
- génération périodique de télémétrie et d’anomalies.

### 3.13 Assistant IA conversationnel

Fichiers:
- [apps/backend/src/chat/chat.module.ts](apps/backend/src/chat/chat.module.ts)
- [apps/backend/src/chat/chat.controller.ts](apps/backend/src/chat/chat.controller.ts)
- [apps/backend/src/chat/chat.service.ts](apps/backend/src/chat/chat.service.ts)
- DTO: [apps/backend/src/chat/dto/send-chat-message.dto.ts](apps/backend/src/chat/dto/send-chat-message.dto.ts)

Objectif:
- fournir un assistant conversationnel de type ChatGPT, mais contextualisé pour Crop Advisor.

Méthodes du contrôleur:
- `sendMessage()`
  - `POST /api/chat/message`;
  - protégé par throttling;
  - transmet le prompt au service.
- `getHistory()`
  - `GET /api/chat/history`;
  - retourne l’historique utilisateur.

Méthodes du service:
- `getHistory(userId, limit)`
  - lit les messages persistés;
  - renvoie l’historique chronologique.
- `sendMessage(userId, role, dto)`
  - vérifie la saisie;
  - applique une limitation de débit;
  - vérifie le device contextuel si `deviceId` est fourni;
  - enregistre le message utilisateur;
  - injecte le contexte métier réel;
  - tente un appel OpenAI;
  - bascule automatiquement vers un fallback local si l’IA n’est pas disponible;
  - enregistre la réponse assistant;
  - renvoie l’assistant et l’historique complet.
- `enforceRateLimit(userId)`
  - limite le nombre de messages utilisateurs sur une minute.
- `resolveLanguage(prompt, preferred)`
  - détecte automatiquement la langue à partir du texte ou d’un choix explicite.
- `buildContext(userId, role, deviceId)`
  - charge les devices, dernières télémétries, alertes et recommandations pour enrichir la réponse.
- `generateWithLlm(recentMessages, contextBlock, language)`
  - appelle OpenAI avec un system prompt métier;
  - renvoie `null` en cas d’indisponibilité ou d’erreur LLM.
- `generateFallbackAnswer(prompt, contextBlock, language)`
  - construit une réponse intelligente locale à partir du contexte réel.

Le modèle conversationnel répond donc à trois catégories:
- questions générales;
- questions contextuelles liées aux données de l’utilisateur;
- assistance produit et navigation dans la plateforme.

### 3.14 Couches communes et sécurité

Fichiers:
- [apps/backend/src/common/guards/jwt-auth.guard.ts](apps/backend/src/common/guards/jwt-auth.guard.ts)
- [apps/backend/src/common/guards/roles.guard.ts](apps/backend/src/common/guards/roles.guard.ts)
- [apps/backend/src/common/decorators/public.decorator.ts](apps/backend/src/common/decorators/public.decorator.ts)
- [apps/backend/src/common/decorators/roles.decorator.ts](apps/backend/src/common/decorators/roles.decorator.ts)
- [apps/backend/src/common/types/request-user.type.ts](apps/backend/src/common/types/request-user.type.ts)

Rôle:
- centraliser les rôles;
- sécuriser les endpoints;
- marquer les routes publiques;
- typer correctement `req.user`.

---

## 4. Analyse de la base de données Prisma

Fichier: [apps/backend/prisma/schema.prisma](apps/backend/prisma/schema.prisma)

### 4.1 Configuration générale

- générateur Prisma Client;
- datasource PostgreSQL;
- compatibilité avec Prisma 7 et configuration de connexion directe via `prisma.config.ts`.

### 4.2 Modèles métier

#### User
Champs:
- `id`
- `fullName`
- `email`
- `passwordHash`
- `refreshTokenHash`
- `role`
- `createdAt`
- `updatedAt`

Relations:
- `devices`
- `alerts`
- `chatMessages`

Rôle métier:
- représenter l’identité d’un utilisateur;
- stocker le hash du refresh token;
- porter le rôle USER ou ADMIN.

#### Device
Champs:
- `id`
- `name`
- `location`
- `soilType`
- `cropType`
- `status`
- `ownerId`
- `createdAt`
- `updatedAt`

Relations:
- `owner`
- `telemetries`
- `recommendations`
- `alerts`

Rôle métier:
- représenter un capteur ou nœud terrain rattaché à un exploitant.

#### Telemetry
Champs:
- `id`
- `deviceId`
- `temperature`
- `humidity`
- `light`
- `anomaly`
- `timestamp`

Relation:
- `device`

Rôle métier:
- conserver la série temporelle des mesures terrain.

#### Recommendation
Champs:
- `id`
- `deviceId`
- `type`
- `title`
- `explanation`
- `reason`
- `detectedIssues`
- `confidence`
- `createdAt`

Relation:
- `device`

Rôle métier:
- stocker les conseils agronomiques interprétables.

#### Alert
Champs:
- `id`
- `userId`
- `deviceId`
- `severity`
- `title`
- `message`
- `acknowledged`
- `createdAt`

Relations:
- `user`
- `device`

Rôle métier:
- matérialiser les anomalies et warnings.

#### ChatMessage
Champs:
- `id`
- `userId`
- `role`
- `content`
- `createdAt`

Relation:
- `user`

Rôle métier:
- persister l’historique de conversation de l’assistant IA.

### 4.3 Améliorations possibles du schéma

- ajouter un modèle d’audit pour les actions admin;
- ajouter une notion de tenant si la plateforme devient multi-client;
- prévoir des index supplémentaires si le volume de télémétrie augmente fortement;
- enrichir `Device` avec des seuils personnalisables par capteur.

---

## 5. Analyse du frontend Next.js / React

### 5.1 Structure générale

Le frontend repose sur l’App Router de Next.js.

Fichiers principaux:
- [apps/web/src/app/layout.tsx](apps/web/src/app/layout.tsx)
- [apps/web/src/app/page.tsx](apps/web/src/app/page.tsx)
- [apps/web/src/app/live-monitoring/page.tsx](apps/web/src/app/live-monitoring/page.tsx)
- [apps/web/src/app/globals.css](apps/web/src/app/globals.css)

Composants:
- [apps/web/src/components/auth-card.tsx](apps/web/src/components/auth-card.tsx)
- [apps/web/src/components/language-switcher.tsx](apps/web/src/components/language-switcher.tsx)
- [apps/web/src/components/toast-stack.tsx](apps/web/src/components/toast-stack.tsx)
- [apps/web/src/components/chat-widget.tsx](apps/web/src/components/chat-widget.tsx)

Stores:
- [apps/web/src/store/auth-store.ts](apps/web/src/store/auth-store.ts)
- [apps/web/src/store/toast-store.ts](apps/web/src/store/toast-store.ts)

Services frontend:
- [apps/web/src/lib/api.ts](apps/web/src/lib/api.ts)
- [apps/web/src/lib/types.ts](apps/web/src/lib/types.ts)

### 5.2 Layout global

Fichier: [apps/web/src/app/layout.tsx](apps/web/src/app/layout.tsx)

Rôle:
- définir les polices et la structure HTML globale;
- injecter le provider i18n;
- monter les toasts globaux;
- monter le widget de chat global.

### 5.3 Page principale

Fichier: [apps/web/src/app/page.tsx](apps/web/src/app/page.tsx)

Rôle:
- piloter l’authentification visuelle;
- afficher le dashboard selon le rôle;
- charger les devices, alertes, télémétrie, recommandations et l’overview admin;
- maintenir les interactions de démonstration;
- écouter le flux Socket.IO.

Méthodes principales:
- `loadAppData()`
  - charge les données nécessaires selon le rôle;
  - récupère devices, télémétrie, alertes, utilisateurs et overview admin;
  - gère explicitement le `401` en réinitialisant l’état local.
- `generateRecommendations()`
  - déclenche la génération de recommandations pour le device sélectionné.
- `loadRecommendations()`
  - recharge les recommandations d’un device.
- `addDevice()`
  - ajoute un nouveau device via l’API.
- `removeDevice()`
  - supprime un device.
- `acknowledgeAlert()`
  - acquitte une alerte.
- `startDemoMode()`
  - démarre le générateur de démo.
- `resetAndStartDemoMode()`
  - réinitialise les données de démo puis relance le flux;
  - demande confirmation à l’utilisateur.
- `stopDemoMode()`
  - arrête le mode démo.
- `logoutSession()`
  - notifie le backend;
  - vide le store d’authentification.
- `issueLabel()`
  - formate les issues détectées pour l’affichage.

Comportement UI:
- si non authentifié, l’utilisateur voit l’écran de login/register;
- si authentifié, l’utilisateur voit le dashboard;
- les administrateurs disposent des vues globales, de la gestion démo et des indicateurs de contrôle.

### 5.4 Page de monitoring live

Fichier: [apps/web/src/app/live-monitoring/page.tsx](apps/web/src/app/live-monitoring/page.tsx)

Rôle:
- afficher le flux temps réel de télémétrie;
- fournir une vue lisible en direct pour la supervision.

Méthodes / logique:
- écoute `telemetry:update` via Socket.IO;
- calcule un statut de gravité selon température, humidité et anomalie;
- redirige vers la page de login si l’utilisateur n’est pas connecté.

### 5.5 AuthCard

Fichier: [apps/web/src/components/auth-card.tsx](apps/web/src/components/auth-card.tsx)

Rôle:
- gérer signup/login dans une seule carte.

Méthode:
- `submit(e)`
  - appelle `/auth/login` ou `/auth/signup`;
  - alimente le store `useAuthStore` avec les tokens et l’utilisateur.

Comportement:
- mode `login` ou `signup`;
- affichage conditionnel du champ full name;
- gestion simple des erreurs d’authentification.

### 5.6 LanguageSwitcher

Fichier: [apps/web/src/components/language-switcher.tsx](apps/web/src/components/language-switcher.tsx)

Rôle:
- permettre le changement dynamique de langue.

Méthode:
- la sélection met à jour `lang` dans le provider i18n;
- le texte et la direction de page changent sans rechargement.

### 5.7 Toast stack

Fichier: [apps/web/src/components/toast-stack.tsx](apps/web/src/components/toast-stack.tsx)

Rôle:
- afficher les notifications globales success, warn et error.

Comportement:
- les toasts s’empilent;
- chaque toast a une auto-disparition.

Store associé:
- [apps/web/src/store/toast-store.ts](apps/web/src/store/toast-store.ts)
  - `pushToast()`
  - `removeToast()`

### 5.8 Chat widget

Fichier: [apps/web/src/components/chat-widget.tsx](apps/web/src/components/chat-widget.tsx)

Rôle:
- fournir un assistant IA flottant style SaaS premium;
- interroger l’API de chat;
- afficher l’historique;
- proposer des questions préchargées.

Méthodes / logique:
- ouverture/fermeture du panneau;
- chargement de l’historique via `/chat/history`;
- envoi d’un message via `/chat/message`;
- affichage d’un indicateur typing;
- auto-scroll vers le bas;
- gestion des erreurs et affichage de toasts.

### 5.9 i18n

Fichiers:
- [apps/web/src/i18n/provider.tsx](apps/web/src/i18n/provider.tsx)
- [apps/web/src/i18n/locales/fr.json](apps/web/src/i18n/locales/fr.json)
- [apps/web/src/i18n/locales/en.json](apps/web/src/i18n/locales/en.json)
- [apps/web/src/i18n/locales/ar.json](apps/web/src/i18n/locales/ar.json)

Méthodes du provider:
- `I18nProvider()`
  - charge la langue depuis localStorage;
  - détecte la langue du navigateur;
  - applique `lang` et `dir` sur la page;
  - expose `t()`.
- `useI18n()`
  - retourne le contexte i18n;
  - lève une erreur s’il est utilisé hors provider.

Rôle métier:
- internationalisation complète en français, anglais et arabe;
- support RTL pour l’arabe;
- traduction dynamique sans reload.

### 5.10 API client et types

Fichiers:
- [apps/web/src/lib/api.ts](apps/web/src/lib/api.ts)
- [apps/web/src/lib/types.ts](apps/web/src/lib/types.ts)

Méthodes du client API:
- `setApiToken(token)`
  - injecte ou retire le header Authorization.
- intercepteur de réponse:
  - tente un refresh automatique en cas de `401`;
  - logout si le refresh échoue.

Types métier exposés:
- `User`
- `Device`
- `TelemetryPoint`
- `Recommendation`
- `Alert`
- `AdminOverview`
- `ChatMessage`

### 5.11 Styles globaux

Fichier: [apps/web/src/app/globals.css](apps/web/src/app/globals.css)

Rôle:
- définir la direction artistique premium;
- gérer l’affichage responsive;
- styler les cartes, les tableaux, le dashboard, les toasts, le chat et les graphiques.

Points visuels notables:
- cartes arrondies;
- ombres douces;
- palette verte / terre / neutre;
- panneau de chat flottant;
- sections admin et monitoring avec grilles adaptatives.

---

## 6. Analyse de la couche Edge

Fichier: [edge/requirements.txt](edge/requirements.txt)

État actuel:
- le fichier existe;
- aucune dépendance Python n’y est définie;
- aucune logique edge n’est encore raccordée au flux principal.

Conclusion:
- la couche edge est un emplacement préparé pour de futures fonctions de proximité ou de calcul distribué;
- elle n’est pas encore active dans le produit.

---

## 7. Analyse des tests

### 7.1 Tests backend

Fichiers de référence:
- [apps/backend/src/app.controller.spec.ts](apps/backend/src/app.controller.spec.ts)
- [apps/backend/test/app.e2e-spec.ts](apps/backend/test/app.e2e-spec.ts)
- [apps/backend/src/telemetry/telemetry.controller.spec.ts](apps/backend/src/telemetry/telemetry.controller.spec.ts)
- [apps/backend/src/telemetry/telemetry.service.spec.ts](apps/backend/src/telemetry/telemetry.service.spec.ts)
- [apps/backend/src/recommendations/recommendations.controller.spec.ts](apps/backend/src/recommendations/recommendations.controller.spec.ts)
- [apps/backend/src/recommendations/recommendations.service.spec.ts](apps/backend/src/recommendations/recommendations.service.spec.ts)

Ce que couvrent les tests:
- la santé de l’application;
- l’initialisation des modules;
- des scénarios e2e mockés pour auth/devices/telemetry;
- une validation minimale des modules métier.

Ce qui manque:
- e2e avec vraie base PostgreSQL;
- couverture complète de tous les contrôleurs;
- tests de non-régression sur les permissions;
- tests d’erreurs réseau et d’erreurs IA;
- tests du chat conversationnel;
- tests autour du mode démo et du WebSocket.

### 7.2 Tests frontend

Le frontend n’a pas un socle de tests visible aussi riche que le backend dans ce dépôt.

Constat:
- la validation réelle a surtout été faite via le build Next.js et la validation navigateur instrumentée;
- il manque encore des tests unitaires ou d’intégration pour les composants UI critiques.

---

## 8. Flux complet de l’application

### 8.1 Données terrain → backend → DB → frontend

1. Un capteur ou un simulateur poste une mesure via `POST /api/telemetry/:deviceId`.
2. `TelemetryController` transmet au service.
3. `TelemetryService` vérifie les droits, écrit en base, et pousse un événement Socket.IO.
4. Si une anomalie est détectée, `TelemetryService` crée aussi une alerte.
5. Le frontend reçoit la mise à jour temps réel et rafraîchit les graphiques.

### 8.2 Génération des recommandations

1. L’utilisateur clique sur la génération de recommandations.
2. `RecommendationsController` appelle `RecommendationsService`.
3. Le service récupère la dernière télémétrie et tente OpenAI.
4. Si OpenAI est absent ou en erreur, le fallback métier produit une réponse déterministe.
5. Les recommandations sont stockées puis affichées côté UI.

### 8.3 Assistant conversationnel

1. L’utilisateur ouvre le widget de chat.
2. Le frontend charge l’historique via `GET /api/chat/history`.
3. Lorsqu’un message est envoyé, `POST /api/chat/message` est appelé.
4. Le backend enrichit le prompt avec le contexte réel du compte.
5. La réponse est générée par LLM ou fallback local, puis persistée.
6. Le frontend affiche la conversation complète.

### 8.4 Authentification et session

1. L’utilisateur s’inscrit ou se connecte.
2. Le backend hache le mot de passe.
3. Le backend signe access token et refresh token.
4. Le refresh token est haché en base.
5. Le frontend stocke les tokens dans Zustand + localStorage.
6. Les requêtes protégées utilisent le JWT.
7. En cas de `401`, le client tente un refresh automatique.

---

## 9. Points forts

- Architecture monorepo propre et lisible.
- Backend NestJS structuré en modules métier clairs.
- Authentification JWT avec refresh token et RBAC.
- Gestion temps réel via Socket.IO.
- UX premium, moderne et adaptée à un usage métier.
- Internationalisation réelle avec RTL.
- Assistant IA contextualisé et persistant.
- Intégration Prisma/PostgreSQL bien structurée.
- Docker et README déjà orientés déploiement.

---

## 10. Limites actuelles

- La couche edge est encore vide.
- Le package `shared-types` n’est pas encore exploité comme contrat central.
- Les tests backend restent incomplets pour un niveau production strict.
- Le frontend n’a pas encore une couverture de tests robuste.
- La plateforme ne montre pas encore de vraie multi-tenancy SaaS.
- Le mode IA dépend d’OpenAI si configuré, sinon il repose sur un fallback métier.
- Certaines fonctions d’administration avancées peuvent encore être enrichies, notamment les workflows de réattribution ou d’audit fin.

---

## 11. Améliorations recommandées

1. Ajouter une vraie stratégie de tests:
- e2e avec base isolée;
- tests d’intégration sur auth, chat et télémétrie;
- tests frontend sur le dashboard et le widget chat.

2. Industrialiser la couche data:
- migrations contrôlées;
- seed plus extensif;
- audit log des actions admin.

3. Renforcer le SaaS:
- multi-tenant;
- quotas par compte;
- RBAC plus fin;
- paramètres métier par device.

4. Durcir l’observabilité:
- trace distribuée;
- logs structurés enrichis;
- métriques applicatives;
- monitoring d’usage du mode démo et du chat.

5. Améliorer l’IA:
- streaming token par token;
- mémoire conversationnelle plus intelligente;
- classification de l’intention;
- règles métier explicables par culture, climat et saison.

6. Préparer l’exécution cloud:
- NGINX si nécessaire;
- CI/CD;
- secrets management;
- environnements dev/staging/prod clairement séparés.

---

## 12. Transformation Plan

Cette section décrit le chemin recommandé pour faire évoluer Crop Advisor vers un SaaS production-grade.

### Étape 1: Stabilisation fonctionnelle
- finaliser les tests backend et frontend;
- couvrir le chat, l’auth et le temps réel;
- verrouiller les endpoints sensibles;
- vérifier les parcours de démo de bout en bout.

### Étape 2: Durcissement sécurité
- rotation systématique des secrets;
- audit des routes publiques;
- durcissement CORS;
- refresh token rotation plus stricte;
- rate limiting par route sensible.

### Étape 3: Industrialisation des données
- migrations Prisma versionnées;
- jeu de seed multi-scénarios;
- nettoyage des datasets démo;
- historique d’alertes et de recommandations mieux exploité.

### Étape 4: Évolution produit
- multi-tenant;
- gestion des organisations;
- paramètres agronomiques par culture et saison;
- notifications in-app et email;
- scoring de risque plus avancé.

### Étape 5: IA avancée
- chat streaming temps réel;
- classification automatique des demandes;
- réponses plus contextuelles par device et par saison;
- base de connaissances agricole indexée;
- mode offline fallback renforcé.

### Étape 6: Observabilité et exploitation
- dashboard d’administration plus riche;
- logs centralisés;
- métriques Prometheus/Grafana;
- alerting opérationnel;
- suivi des erreurs IA et des quotas.

### Étape 7: Déploiement production
- CI/CD complet;
- Docker production;
- variables d’environnement séparées;
- NGINX ou reverse proxy;
- sauvegardes PostgreSQL;
- plan de restauration.

### Étape 8: Passage SaaS commercial
- facturation et plans d’abonnement;
- quotas par client;
- support multi-langue élargi;
- onboarding guidé;
- documentation utilisateur et admin.

---

## Conclusion

Crop Advisor n’est plus un simple starter. Le projet est aujourd’hui structuré comme une vraie application SaaS agricole moderne: backend NestJS sécurisé, Prisma/PostgreSQL, temps réel, IA conversationnelle contextualisée, dashboard premium, i18n complète et base de déploiement déjà solide.

Le rapport ci-dessus décrit l’état réel du système, ses capacités actuelles, ses points forts et les chantiers à poursuivre pour le hisser au niveau d’un produit commercial mature.