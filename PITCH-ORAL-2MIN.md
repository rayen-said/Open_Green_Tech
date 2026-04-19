# Pitch Oral 2 Minutes - Crop Advisor

## Version Jury Hackathon

Bonjour, nous presentons Crop Advisor, une plateforme SaaS qui combine IoT agricole, IA et monitoring temps reel pour aider les exploitants a prendre de meilleures decisions, plus vite.

Le probleme est simple: les donnees terrain existent, mais elles sont souvent disperses, techniques, et difficiles a exploiter en action concrète. Notre solution transforme ces donnees en recommandations compréhensibles en quelques secondes.

Techniquement, nous avons une architecture full-stack production-ready:
- Backend NestJS securise avec JWT, refresh token, RBAC et rate limiting.
- Base PostgreSQL avec Prisma et un modele de donnees propre pour users, devices, telemetry, alerts et recommandations.
- Frontend Next.js premium, multilingue francais, anglais, arabe avec RTL.
- WebSocket pour la telemetrie live et les alertes en direct.

Pour la demo, nous avons un mode Start Demo Mode en un clic:
- les capteurs virtuels envoient des donnees toutes les 2 secondes,
- les anomalies apparaissent en live,
- l'IA genere des recommandations avec score de confiance, problemes detectes et explication du pourquoi.

Cote admin, on a un dashboard SaaS complet:
- KPI globaux,
- devices les plus problematiques,
- flux d'activite recent,
- et monitoring live terrain.

La valeur business est immediate:
- moins de pertes liees aux stress hydriques et thermiques,
- decisions plus rapides,
- meilleure priorisation des interventions,
- et une base exploitable pour passer du hackathon a un produit commercialisable.

Notre ambition est claire: devenir la couche d'intelligence decisionnelle entre le terrain agricole et l'action operationnelle.

Merci.

## Version Investisseur (plus business)

Crop Advisor est une plateforme SaaS d'aide a la decision pour l'agriculture de precision. Nous captons la telemetrie IoT en temps reel, detectons les anomalies et produisons des recommandations actionnables via IA.

Notre avantage produit: experience tres simple pour un utilisateur non technique, avec demo live instantanee et recommandations expliquees, pas seulement des chiffres.

Notre avantage technique: stack moderne, securisee et scalable, prete au deploiement, avec architecture modulaire facilitant la monetisation par abonnement, multi-tenant et extension rapide a de nouveaux capteurs ou modeles agronomiques.

Notre traction immediate est la capacite de demonstration: en moins de 3 minutes, un decideur comprend la valeur, voit les alertes, la prediction de risque et l'impact operationnel.

Nous construisons un produit capable de passer d'un pilote terrain a une offre SaaS regionale.
