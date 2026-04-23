# 🙏 Jai Guru Ji — Salary App
## Deploy kaise karein — Step by Step Guide

---

## Kya milega?
- Mobile + Desktop dono pe chalega
- Kisi bhi jagah, kisi bhi device pe — bas internet chahiye
- Data cloud (Supabase) mein save hoga
- FREE hosting (Vercel + Supabase dono free hain)

---

## STEP 1 — GitHub Account banao (agar nahi hai)
1. https://github.com pe jao
2. "Sign up" karo — email se
3. Done!

---

## STEP 2 — Supabase Account banao (Database ke liye)
1. https://supabase.com pe jao
2. "Start your project" → GitHub se login karo
3. "New Project" click karo
   - Name: `jai-guruji-salary`
   - Password: koi bhi strong password
   - Region: South Asia (Singapore)
4. Project bante hain ~2 minute lagte hain

### Database tables banao:
5. Left sidebar mein "SQL Editor" click karo
6. `supabase-schema.sql` file ka sara content copy karo
7. SQL Editor mein paste karo → "Run" button dabao
8. "Success" aayega — done!

### Keys copy karo (baad mein lagenge):
9. Left sidebar → Settings → API
10. Yeh do cheezein copy karke notepad mein save karo:
    - **Project URL** (jaise: https://abcxyz.supabase.co)
    - **anon public** key (lamba sa string)

---

## STEP 3 — Code GitHub pe upload karo
1. https://github.com pe jao → "New repository"
2. Name: `jai-guruji-salary` → "Create repository"
3. Apne computer mein yeh `jai-guruji-salary` folder hai
4. GitHub Desktop app use karo (https://desktop.github.com) — easy hai
   - "Add existing repository" → folder select karo
   - "Commit to main" → "Push origin"
5. Ya zip file upload kar do directly GitHub pe

---

## STEP 4 — Vercel pe Deploy karo (Free hosting)
1. https://vercel.com pe jao
2. "Sign up" → GitHub se login karo
3. "New Project" → apna `jai-guruji-salary` repo select karo
4. **Environment Variables** add karo (Step 2 mein copy ki thi):
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://apka-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = apki-anon-key
   ```
5. "Deploy" click karo — 2-3 minute lagenge
6. Done! Aapko ek link milega jaise:
   `https://jai-guruji-salary.vercel.app`

---

## STEP 5 — Phone pe use karo
- Woh Vercel link kisi bhi phone mein browser se kholo
- Chrome mein "Add to Home Screen" karo → app jaisa feel aayega
- Kisi bhi jagah se, kisi bhi device se chalega!

---

## Kuch bhi problem aaye toh?
Nitin bhai, screenshot le lo aur Claude ko dikhao — help kar denge!

---

## Files ka structure:
```
jai-guruji-salary/
├── app/
│   ├── layout.tsx      — App ka frame
│   ├── page.tsx        — Main salary app
│   └── globals.css     — Styling
├── lib/
│   ├── supabase.ts     — Database connection
│   └── helpers.ts      — Salary calculation formulas
├── supabase-schema.sql — Database tables (Supabase mein run karo)
├── .env.local.example  — Environment variables template
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── README.md
```
