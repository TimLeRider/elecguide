# ElecGuide

Application web 100 % client-side (React 18 + Vite + TypeScript strict + Tailwind CSS + Zustand) qui génère des schémas de câblage multifilaires, dimensionne câbles et protections selon la **NF C 15-100** (série révisée publiée le 23/08/2024) et produit la nomenclature du matériel.

> Outil pédagogique d'aide à la conception : il ne remplace ni la norme, ni les notices des fabricants, ni un électricien qualifié.

## Démarrer

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # tests du moteur de règles (vitest)
npm run build      # vérification TypeScript + build dans dist/
```

## Déploiement GitHub Pages

1. Pousser le dépôt sur GitHub (branche `main`).
2. **Settings → Pages → Build and deployment → Source : GitHub Actions**.
3. Chaque push sur `main` lance `.github/workflows/deploy.yml` (build + déploiement).

`vite.config.ts` utilise `base: './'` : le site fonctionne sous `https://<utilisateur>.github.io/<dépôt>/` sans réglage.

Avant de publier, vérifier les liens LinkedIn et GitHub dans `src/config/site.ts`.

## Architecture

```
src/
├── types/electrical.ts          Modèles de données (CircuitType, WiringSpecification…)
├── rules/
│   ├── electricalRules.ts       Moteur de règles NF C 15-100
│   ├── electricalRules.test.ts  Tests unitaires
│   └── catalog.ts               Catalogue des besoins (cartes de la zone A)
├── store/useElecStore.ts        État Zustand (non persisté)
├── components/
│   ├── ConfigPanel.tsx          Zone A — type d'espace, catalogue, sélection, options
│   ├── WiringDiagram.tsx        Zone B — onglets tableau / circuits + légende
│   ├── diagram/
│   │   ├── CircuitDiagram.tsx   Schéma multifilaire SVG d'un circuit
│   │   ├── BoardDiagram.tsx     Synoptique SVG du tableau
│   │   └── primitives.tsx       Fils, bornes, modules, symboles
│   ├── SummaryPanel.tsx         Zone C — fiche technique, sécurité, nomenclature, exports
│   ├── PrintReport.tsx          Dossier imprimable / PDF
│   ├── Footer.tsx + LegalModal.tsx   Copyright et informations légales
│   └── WelcomeScreen.tsx, Header.tsx, icons.tsx
└── lib/                         Thème clair/sombre, accès localStorage
```

## Règles intégrées (résumé)

| Circuit | Section | Disjoncteur | ID 30 mA | Règles |
|---|---|---|---|---|
| Éclairage (simple, va-et-vient, télérupteur) | 1,5 mm² | 16 A | AC | 8 points max |
| Prises 16 A | 1,5 / 2,5 mm² | 16 / 20 A | AC | 8 / 12 prises max |
| Prise commandée | 1,5 mm² | 16 A | AC | sur circuit éclairage |
| Four, lave-linge, lave-vaisselle | 2,5 mm² | 20 A | A | 1 appareil par circuit |
| Plaques de cuisson | 6 mm² (10 mm² si ΔU > 5 %) | 32 A | A | circuit spécialisé |
| Chauffe-eau HC | 2,5 mm² | 20 A | AC | contacteur jour/nuit |
| PAC / climatisation | 2,5 mm² | 20 A | F | variateur de vitesse |
| IRVE 3,7 kW | 2,5 mm² | 20 A | A (ou F) | DDR dédié |
| IRVE 7,4 kW | 10 mm² (16 mm² > 30 m) | 40 A courbe C | A (ou F), B en triphasé | DDR dédié |

Plus : 8 circuits max par ID, au moins un ID Type A, chute de tension (3 % éclairage / 5 % autres), réserve 20 % au tableau, parafoudre selon risque foudre, DDA optionnels, règles pièces d'eau et extérieur.

© 2026 Timothée Josso.
