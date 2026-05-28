# Seed Test Accounts — FightPort

> Step-by-step manual guide for creating three test accounts in Supabase Authentication and linking them to the correct roles and data.

---

## ACCOUNT 1 — Admin

1. Go to **Supabase Dashboard → Authentication → Users → "Add user" → "Create new user"**
   - **Email:** `admin@fightport.pro`
   - **Password:** `Admin@12345`
   - **Auto Confirm User:** YES (check this box)
2. Copy the UUID generated for this user.
3. Run this SQL in the **SQL Editor** (replace `<UUID>` with the copied UUID):

```sql
UPDATE public.schools 
SET is_admin = true 
WHERE id = '<UUID>';

UPDATE public.user_roles 
SET role = 'admin' 
WHERE auth_id = '<UUID>';
```

> **Note:** The `handle_new_user_confirmed` trigger will have already created the `public.schools` and `public.user_roles` rows when the user was confirmed.

**Expected result:** login with `admin@fightport.pro` redirects to `/dash`

---

## ACCOUNT 2 — School

1. Go to **Supabase Dashboard → Authentication → Users → "Add user" → "Create new user"**
   - **Email:** `escola@fightport.pro`
   - **Password:** `Escola@12345`
   - **Auto Confirm User:** YES
2. Copy the UUID generated for this user.
3. The trigger `handle_new_user_confirmed` will automatically create:
   - `public.schools` row with `name='Nova Organização'`
   - `public.credits` row with `balance=0`
   - `public.user_roles` row with `role='school'`
4. Run this SQL to give the school a proper name and 10 test credits (replace `<UUID>`):

```sql
UPDATE public.schools 
SET name = 'Academia Teste FightPort', 
    martial_art = 'Jiu-Jitsu',
    city = 'Rio de Janeiro',
    state = 'RJ'
WHERE id = '<UUID>';

SELECT public.add_credits('<UUID>', 10);

INSERT INTO public.head_coaches (school_id, name, graduation)
VALUES ('<UUID>', 'Prof. Carlos Silva', 'Faixa Preta 3º Grau');
```

**Expected result:** login with `escola@fightport.pro` redirects to `/painel/praticantes`

---

## ACCOUNT 3 — Athlete

1. First, go to **Supabase Dashboard → Authentication → Users → "Add user"**
   - **Email:** `atleta@fightport.pro`
   - **Password:** `Atleta@12345`
   - **Auto Confirm User:** YES
2. Copy the UUID generated for this user (**Athlete UUID**).
3. You will also need the **School UUID** from Account 2 (`escola@fightport.pro`).
4. Run this SQL in order (replace the placeholders):

### Step 3a — Create the person record
```sql
INSERT INTO public.people (
  id, fp_id, first_name, last_name, cpf, birth_date, gender
) VALUES (
  gen_random_uuid(),
  public.generate_fp_id(),
  'João',
  'Silva Teste',
  '123.456.789-00',
  '1995-03-15',
  'Masculino'
);
```

### Step 3b — Get the person id
```sql
SELECT id FROM public.people WHERE first_name = 'João' AND last_name = 'Silva Teste';
```
> Copy the returned `id` as `<PERSON_ID>`.

### Step 3c — Link the athlete
```sql
INSERT INTO public.athlete_accounts (person_id, auth_id, email)
VALUES ('<PERSON_ID>', '<ATHLETE_UUID>', 'atleta@fightport.pro');

INSERT INTO public.user_roles (auth_id, role)
VALUES ('<ATHLETE_UUID>', 'athlete')
ON CONFLICT (auth_id) DO UPDATE SET role = 'athlete';

INSERT INTO public.person_schools (person_id, school_id, martial_art, current_belt, active)
VALUES ('<PERSON_ID>', '<SCHOOL_UUID>', 'Jiu-Jitsu', 'Azul', true);
```

**Expected result:** login with `atleta@fightport.pro` redirects to `/minha-conta`

---

## VALIDATION CHECKLIST

After creating all three accounts, test:

- [ ] `admin@fightport.pro` → logs in → redirected to `/dash` → dashboard loads
- [ ] `escola@fightport.pro` → logs in → redirected to `/painel/praticantes` → panel loads
- [ ] `atleta@fightport.pro` → logs in → redirected to `/minha-conta` → portal loads
- [ ] `/dash` without session → redirects to `/cadastro` (already confirmed working)
- [ ] `/painel` without session → redirects to `/cadastro`
- [ ] `/minha-conta` without session → redirects to `/cadastro`
