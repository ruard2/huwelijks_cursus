# Deploying to Railway

## 1. Pusher account

Maak een gratis account aan op https://pusher.com  
→ Create a new **Channels** app  
→ Cluster: **eu** (dichter bij Nederland)  
→ Bewaar: App ID, Key, Secret, Cluster

## 2. Railway setup

1. Ga naar https://railway.com en log in
2. **New Project → Deploy from GitHub repo** (of: Empty Project)
3. Voeg een **PostgreSQL** database toe: New → Database → PostgreSQL
4. Voeg de app toe: New → GitHub Repo → selecteer `Huwelijkscursus/app`
   - Root Directory: `/app` (als je de repo klonede met de outer folder erbij)

## 3. Environment variables instellen

In Railway → je app service → **Variables**, voeg toe:

```
DATABASE_URL            = ${{Postgres.DATABASE_URL}}   ← automatisch via Railway
PUSHER_APP_ID           = (van Pusher dashboard)
PUSHER_KEY              = (van Pusher dashboard)
PUSHER_SECRET           = (van Pusher dashboard)
PUSHER_CLUSTER          = eu
NEXT_PUBLIC_PUSHER_KEY  = (zelfde als PUSHER_KEY)
NEXT_PUBLIC_PUSHER_CLUSTER = eu
```

> `DATABASE_URL` kun je in Railway instellen als `${{Postgres.DATABASE_URL}}` — Railway vult dit automatisch in.

## 4. Deploy

Railway detecteert `railway.json` automatisch en voert bij de eerste deploy:
1. `npm install`
2. `prisma generate` (via postinstall)
3. `prisma migrate deploy` (maakt de database tabellen aan)
4. `next build`
5. `next start`

## 5. Eerste keer koppelcode aanmaken

Ga naar de gepubliceerde URL → "Nieuw koppel starten" → vul naam in.  
Je krijgt een koppelcode zoals `TROUW-4821`. Deel deze met je partner.

## Lokaal ontwikkelen

```bash
cp .env.example .env
# Vul .env in met je lokale postgres en pusher credentials
npx prisma migrate dev
npm run dev
```
