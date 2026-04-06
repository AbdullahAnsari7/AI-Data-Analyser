# 📊 AI Data Analyst Dashboard

Upload any CSV and ask questions in plain English. Powered by **Gemini 1.5 Flash (Free!)** + Next.js.

## Step 1 — Get your FREE Gemini API Key
1. Go to https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key" → copy it (starts with AIza...)
4. That's it — completely free!

## Step 2 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ai-data-dashboard.git
git push -u origin main
```

## Step 3 — Deploy on Vercel
1. Go to https://vercel.com → sign up with GitHub
2. Click "Add New Project" → import your repo
3. Add Environment Variable: GEMINI_API_KEY = AIza...your key...
4. Click Deploy 🎉

## Run Locally
```bash
npm install
cp .env.example .env.local
# Edit .env.local and add your key
npm run dev
```
