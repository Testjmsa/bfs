-- =====================================================================
-- BFS CRM — Supabase database (একবারই চালাতে হবে)
-- Supabase → SQL Editor → New query → পুরো ফাইল paste করে RUN দিন।
-- এখানে টেবিল + Row Level Security আছে: কে কী দেখতে/বদলাতে পারবে তা
-- ডাটাবেস নিজেই ঠিক করে, তাই ব্রাউজার থেকে ফাঁকি দেওয়া যায় না।
-- =====================================================================

-- ---------- employees ----------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text, email text,
  role text not null default 'pending',     -- admin, manager, operation, senior, counsellor, moderator, teacher, accounts, staff
  department text, designation text, phone text, joined date, photo text,
  active boolean not null default false,
  must_change boolean not null default false,   -- true হলে পরের login-এ নিজের পাসওয়ার্ড বসাতেই হবে
  last_auto_lead timestamptz,
  extra_perms text[] not null default '{}',     -- Admin-এর দেওয়া "Special access": শুধু এই একজনের বাড়তি অনুমতি (পদের বাইরে)                   -- website-এর lead শেষ কবে নিজে থেকে পেয়েছে (পালা ঠিক রাখতে)
  created_at timestamptz not null default now()
);

-- প্রথম যে অ্যাকাউন্ট খোলা হবে সে-ই Admin; বাকিরা Admin অনুমোদন না দেওয়া পর্যন্ত কিছুই দেখতে পাবে না
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare first_user boolean := not exists (select 1 from profiles);
begin
  insert into profiles (id, email, name, role, active)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
          case when first_user then 'admin' else 'pending' end, first_user);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create function public.my_role() returns text language sql stable security definer set search_path = public as
$$ select role from profiles where id = auth.uid() and active
     -- যার 2-step login চালু, সে code না দেওয়া পর্যন্ত (aal2) কোনো ডেটা পাবে না
     and (coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2'
          or not exists (select 1 from auth.mfa_factors f where f.user_id = auth.uid() and f.status = 'verified')) $$;
create function public.is_role(variadic r text[]) returns boolean language sql stable security definer set search_path = public as
$$ select coalesce(public.my_role() = any(r), false) $$;
-- কোন পদ কী পারবে — Admin CRM থেকে বদলাতে পারেন (Team & Settings → Role permissions)
create table public.settings (key text primary key, value jsonb not null, updated_at timestamptz not null default now(), updated_by uuid);
insert into public.settings (key, value) values ('perms', '{
  "students_all": ["manager","operation","senior"], "students_own": ["manager","operation","senior","counsellor","moderator"],
  "students_view": ["manager","operation","senior","counsellor","moderator"],
  "admission": ["manager","operation","senior","counsellor"], "docs": ["manager","operation","senior","counsellor"], "docs_verify": ["manager","operation","senior"],
  "ielts_manage": ["manager"], "finance": ["manager","accounts"], "tasks_all": ["manager","operation","senior"],
  "reports": ["manager","operation","senior","accounts","developer"], "export": ["manager"], "logs": ["manager","developer"],
  "lead_pool": ["counsellor","senior"], "team": [], "catalog": ["manager","operation","senior","developer"], "emgs_ctl": ["manager","operation","senior"], "delete": []}');
-- Admin সব সময় সব পারে; বাকিদের জন্য settings টেবিল দেখা হয়
create function public.has_perm(k text) returns boolean language sql stable security definer set search_path = public as
$$ select coalesce(public.my_role() = 'admin' or exists (select 1 from settings s where s.key = 'perms' and s.value -> k ? public.my_role())
      or exists (select 1 from profiles p where p.id = auth.uid() and p.active and k = any(p.extra_perms)), false) $$;
create function public.is_top() returns boolean language sql stable security definer set search_path = public as
$$ select public.has_perm('students_all') $$;
create function public.settings_stamp() returns trigger language plpgsql as $$ begin new.updated_at := now(); new.updated_by := auth.uid(); return new; end $$;
create trigger settings_stamp before insert or update on public.settings for each row execute function public.settings_stamp();
alter table public.settings enable row level security;
create policy set_sel on settings for select to authenticated using (public.my_role() is not null);
-- perms শুধু Admin; university/দেশের তালিকা (catalog) Admin + উপরের পদ
create policy set_ins on settings for insert to authenticated with check (public.is_role('admin') or (key = 'catalog' and public.has_perm('catalog')));
create policy set_upd on settings for update to authenticated using (public.is_role('admin') or (key = 'catalog' and public.has_perm('catalog'))) with check (public.is_role('admin') or (key = 'catalog' and public.has_perm('catalog')));

create function public.set_creator() returns trigger language plpgsql as
$$ begin new.created_by := auth.uid(); new.created_at := now(); return new; end $$;

-- ---------- students ----------
create sequence public.student_seq start 1001;
create sequence public.invoice_seq;
create sequence public.receipt_seq;

create table public.students (
  id uuid primary key default gen_random_uuid(),
  sid text unique not null default ('BFS' || nextval('public.student_seq')::text),   -- BFS1001, BFS1002 …
  name text not null, photo text, phone text, whatsapp text, email text, dob date, gender text, nationality text, referred_by text,
  present_address text, permanent_address text, passport_no text, passport_expiry date,
  ssc text, hsc text, bachelor text, masters text, study_gap text, test_type text, test_score text,
  pref_country text, pref_university text, pref_level text, pref_subject text, pref_intake text, budget text,
  source text, priority text, counsellor_id uuid references profiles, team_ids uuid[] not null default '{}', next_followup date,
  status text not null default 'new', lost_reason text,
  departure_date date, flight text, accommodation text, emergency_contact text, arrival_confirmed boolean default false,
  portal_pin text, portal_fails int not null default 0, portal_lock timestamptz,
  -- EMGS অগ্রগতি (EMGS-এর সাইট থেকে অটো আসে); emgs_show = false হলে student % দেখে না
  emgs_percent int check (emgs_percent between 0 and 100), emgs_status text, emgs_found boolean, emgs_checked timestamptz, emgs_show boolean not null default true,
  created_by uuid references profiles, created_at timestamptz not null default now()
);
create index on public.students (counsellor_id);
create index on public.students (status);

create table public.batches (
  id uuid primary key default gen_random_uuid(),
  name text not null, course_type text, teacher_id uuid references profiles, start_date date, end_date date,
  schedule text, class_time text, room text, capacity int, status text default 'upcoming', meeting_link text,
  created_by uuid references profiles, created_at timestamptz not null default now()
);
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references batches on delete cascade, student_id uuid not null references students on delete restrict,
  fee numeric default 0, discount numeric default 0, admitted_on date, status text default 'active',
  created_by uuid references profiles, created_at timestamptz not null default now()
);

-- access helpers (security definer → নিজেরা RLS-এ আটকায় না, তাই policy-র ভেতরে নিরাপদে ব্যবহার করা যায়)
create function public.student_access(sid uuid) returns boolean language sql stable security definer set search_path = public as
$$ select public.is_top() or (public.has_perm('students_own') and exists (select 1 from students s where s.id = $1 and (s.counsellor_id = auth.uid() or s.created_by = auth.uid() or auth.uid() = any(s.team_ids)))) $$;
-- শুধু দেখা: "students_view" থাকলে সবার তথ্য পড়া যায়, কিন্তু লেখা যায় শুধু student_access-এ
create function public.student_view(sid uuid) returns boolean language sql stable security definer set search_path = public as
$$ select public.student_access(sid) or public.has_perm('students_view') $$;
create function public.doc_access(sid uuid) returns boolean language sql stable security definer set search_path = public as
$$ select public.has_perm('docs') and (public.is_top() or exists (select 1 from students s where s.id = $1 and (s.counsellor_id = auth.uid() or auth.uid() = any(s.team_ids)))) $$;
create function public.teaches_batch(bid uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from batches b where b.id = bid and b.teacher_id = auth.uid()) $$;
create function public.teaches_student(sid uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from enrollments e join batches b on b.id = e.batch_id where e.student_id = sid and b.teacher_id = auth.uid()) $$;
-- একই ফোন নাম্বার অন্য counsellor-এর কাছে আছে কি না (নাম-আইডি ছাড়া আর কিছু ফাঁস হয় না)
create function public.dup_student(p text) returns text language sql stable security definer set search_path = public as
$$ select s.sid || ' — ' || s.name from students s
   where public.my_role() is not null and length(p) >= 7
     and (right(regexp_replace(coalesce(s.phone, ''), '\D', '', 'g'), 10) = p or right(regexp_replace(coalesce(s.whatsapp, ''), '\D', '', 'g'), 10) = p) limit 1 $$;

-- ---------- everything that belongs to a student ----------
create table public.notes (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references students on delete cascade,
  type text not null, text text,
  created_by uuid references profiles, created_at timestamptz not null default now()
);
create table public.applications (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references students on delete cascade,
  country text, university text, course text, intake text, status text default 'draft', deadline date, submitted_on date,
  app_ref text, app_fee numeric, offer_date date, cas_ref text, scholarship text, tuition_fee numeric, deposit_amount numeric, deposit_date date, remarks text,
  created_by uuid references profiles, created_at timestamptz not null default now()
);
create table public.visas (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references students on delete cascade,
  country text, owner_id uuid references profiles, status text default 'preparing', start_date date, submitted_on date, appointment_date date,
  biometrics_date date, interview_date date, medical_status text, decision_date date, fee_paid boolean default false, refusal_reason text, remarks text,
  created_by uuid references profiles, created_at timestamptz not null default now()
);
create table public.documents (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references students on delete cascade,
  type text not null, status text default 'pending', expiry date, remarks text,
  versions jsonb not null default '[]',          -- প্রতিটা আপলোড: {path, name, size, by, at} — পুরোনো ভার্সন মোছা হয় না
  verified_by uuid references profiles, verified_at timestamptz,
  created_by uuid references profiles, created_at timestamptz not null default now()
);
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  no text unique not null default ('INV-' || lpad(nextval('public.invoice_seq')::text, 5, '0')),
  student_id uuid not null references students on delete restrict,
  category text, total numeric not null default 0, discount numeric default 0, due_date date, note text,
  created_by uuid references profiles, created_at timestamptz not null default now()
);
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  receipt_no text unique not null default ('RC-' || lpad(nextval('public.receipt_seq')::text, 5, '0')),
  invoice_id uuid not null references invoices on delete restrict, student_id uuid not null references students on delete restrict,
  amount numeric not null, date date not null default current_date, method text, trx_id text, refund boolean default false,
  created_by uuid references profiles, created_at timestamptz not null default now()
);
create table public.expenses (
  id uuid primary key default gen_random_uuid(), category text, amount numeric not null, date date not null default current_date, note text,
  created_by uuid references profiles, created_at timestamptz not null default now()
);
create table public.attendance (
  id uuid primary key default gen_random_uuid(), batch_id uuid not null references batches on delete cascade, date date not null,
  marks jsonb not null default '{}',             -- {enrollment_id: "P" | "L" | "A"}
  created_by uuid references profiles, created_at timestamptz not null default now(), unique (batch_id, date)
);
create table public.mocks (
  id uuid primary key default gen_random_uuid(), batch_id uuid not null references batches on delete cascade, enrollment_id uuid not null references enrollments on delete cascade,
  date date, kind text, listening numeric, reading numeric, writing numeric, speaking numeric, overall numeric,
  created_by uuid references profiles, created_at timestamptz not null default now()
);
-- টিচারের দেওয়া homework / নোটিশ / পড়ার জিনিস — batch-এর সব student portal-এ দেখে
create table public.batch_posts (
  id uuid primary key default gen_random_uuid(), batch_id uuid not null references batches on delete cascade,
  kind text not null default 'homework', title text not null, body text, link text, due_date date,
  student_ids uuid[] not null default '{}',          -- খালি = পুরো batch; না হলে শুধু এই student-রা দেখে
  created_by uuid references profiles, created_at timestamptz not null default now()
);
create table public.tasks (
  id uuid primary key default gen_random_uuid(), title text not null, description text, assignees uuid[] not null default '{}',
  priority text default 'medium', deadline date, student_id uuid references students on delete set null,
  status text default 'todo', progress int default 0, comments jsonb not null default '[]', feedback text, done_at timestamptz,
  created_by uuid references profiles, created_at timestamptz not null default now()
);
-- কে কখন কী করল — কেউ বদলাতে বা মুছতে পারে না (update/delete policy নেই)
create table public.activity (
  id uuid primary key default gen_random_uuid(), action text, entity text, entity_id text, detail text,
  created_by uuid references profiles, created_at timestamptz not null default now()
);

do $$ declare t text; begin
  foreach t in array array['students','notes','applications','visas','documents','invoices','payments','expenses','batches','enrollments','attendance','mocks','batch_posts','tasks','activity'] loop
    execute format('create trigger set_creator before insert on public.%I for each row execute function public.set_creator()', t);
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;
alter table public.profiles enable row level security;

-- =====================================================================
-- Row Level Security
-- =====================================================================
create policy p_sel on profiles for select to authenticated using (public.my_role() is not null or id = auth.uid());
-- নিজের ছবি নিজে বদলানো যায় (role বা অন্য কিছু নয়)
create function public.set_my_photo(p text) returns void language sql security definer set search_path = public as
$$ update profiles set photo = p where id = auth.uid() and length(coalesce(p, '')) < 60000 $$;
create function public.password_changed() returns void language sql security definer set search_path = public as
$$ update profiles set must_change = false where id = auth.uid() $$;
-- কেউ পাসওয়ার্ড ভুলে গেলে Admin CRM থেকেই নতুন পাসওয়ার্ড বসাতে পারে
create function public.admin_reset_password(uid uuid, pw text) returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not (public.is_role('admin') or (public.has_perm('team') and not exists (select 1 from profiles where id = uid and role = 'admin'))) then raise exception 'You don''t have permission to reset this password'; end if;
  if length(pw) < 8 then raise exception 'Password must be at least 8 characters'; end if;
  update auth.users set encrypted_password = extensions.crypt(pw, extensions.gen_salt('bf')), updated_at = now() where id = uid;
  update profiles set must_change = true where id = uid;
  delete from auth.sessions where user_id = uid;      -- পুরোনো সব ডিভাইস থেকে লগআউট
end $$;
create policy p_upd on profiles for update to authenticated using (public.is_role('admin') or public.has_perm('team')) with check (public.is_role('admin') or public.has_perm('team'));
-- "team" অনুমতি থাকলেও Admin-এর অ্যাকাউন্ট বদলানো, কাউকে Admin বানানো বা নিজের পদ বদলানো যায় না
create function public.guard_profile() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_role('admin') then return new; end if;
  if old.role = 'admin' or new.role = 'admin' then raise exception 'Only the Admin can change the Admin account'; end if;
  if new.id = auth.uid() and (new.role is distinct from old.role or new.active is distinct from old.active) then raise exception 'You cannot change your own role or access'; end if;
  if new.extra_perms is distinct from old.extra_perms then raise exception 'Only the Admin can give special access'; end if;
  return new;
end $$;
create trigger guard_profile before update on public.profiles for each row execute function public.guard_profile();

create policy s_sel on students for select to authenticated using (
  public.is_top() or public.has_perm('finance') or public.has_perm('students_view')
  or (public.has_perm('students_own') and (counsellor_id = auth.uid() or created_by = auth.uid() or auth.uid() = any(team_ids)))
  or (public.is_role('teacher') and public.teaches_student(id)));
create policy s_ins on students for insert to authenticated with check (public.is_top() or public.has_perm('students_own'));
create policy s_upd on students for update to authenticated
  using (public.is_top() or (public.has_perm('students_own') and (counsellor_id = auth.uid() or created_by = auth.uid() or auth.uid() = any(team_ids))))
  with check (public.my_role() is not null);          -- অন্য counsellor-কে transfer করা যায়
create policy s_del on students for delete to authenticated using (public.has_perm('delete'));

do $$ declare t text; begin
  foreach t in array array['notes','applications','visas'] loop
    execute format('create policy c_sel on public.%I for select to authenticated using (public.student_view(student_id))', t);
    execute format('create policy c_ins on public.%I for insert to authenticated with check (public.student_access(student_id))', t);
    execute format('create policy c_upd on public.%I for update to authenticated using (public.student_access(student_id))', t);
    execute format('create policy c_del on public.%I for delete to authenticated using (public.is_role(''admin'',''manager''))', t);
  end loop;
end $$;

-- Applications ও Visa: student দেখতে পারা + "admission" permission দুটোই লাগবে
create policy adm_gate on applications as restrictive for all to authenticated using (public.has_perm('admission')) with check (public.has_perm('admission'));
create policy adm_gate on visas as restrictive for all to authenticated using (public.has_perm('admission')) with check (public.has_perm('admission'));

-- Passport, Bank Statement ইত্যাদি: শুধু Admin/Manager/Operation/Senior আর assigned counsellor
create policy d_sel on documents for select to authenticated using (public.doc_access(student_id));
create policy d_ins on documents for insert to authenticated with check (public.doc_access(student_id));
create policy d_upd on documents for update to authenticated using (public.doc_access(student_id));
-- শুধু খালি (কোনো ফাইল তোলা হয়নি) সারি checklist থেকে সরানো যায়; ফাইলসহ সারি শুধু Admin
create policy d_del on documents for delete to authenticated using (public.is_role('admin') or (public.doc_access(student_id) and versions = '[]'::jsonb));

do $$ declare t text; begin
  foreach t in array array['invoices','payments'] loop
    execute format('create policy f_sel on public.%I for select to authenticated using (public.has_perm(''finance'') or public.student_access(student_id))', t);
    execute format('create policy f_ins on public.%I for insert to authenticated with check (public.has_perm(''finance''))', t);
    execute format('create policy f_upd on public.%I for update to authenticated using (public.is_role(''admin'',''manager''))', t);
  end loop;
end $$;
create policy e_all on expenses for all to authenticated using (public.has_perm('finance')) with check (public.has_perm('finance'));

create policy b_sel on batches for select to authenticated using (public.my_role() is not null);
create policy b_ins on batches for insert to authenticated with check (public.has_perm('ielts_manage'));
create policy b_upd on batches for update to authenticated using (public.has_perm('ielts_manage'));
-- টিচার নিজের batch-এর শুধু অনলাইন ক্লাসের লিংক বদলাতে পারেন (বাকি batch-এর তথ্য নয়)
create function public.set_class_link(p_batch uuid, p_link text) returns void language plpgsql security definer set search_path = public as $$
begin
  if not (public.has_perm('ielts_manage') or public.teaches_batch(p_batch)) then raise exception 'permission denied'; end if;
  if p_link is not null and p_link !~* '^https?://' then raise exception 'The link must start with https://'; end if;
  update batches set meeting_link = nullif(trim(p_link), '') where id = p_batch;
end $$;
create policy b_del on batches for delete to authenticated using (public.is_role('admin'));

create policy en_sel on enrollments for select to authenticated using (public.has_perm('finance') or public.has_perm('ielts_manage') or public.teaches_batch(batch_id) or public.student_access(student_id));
create policy en_ins on enrollments for insert to authenticated with check (public.has_perm('finance') or public.has_perm('ielts_manage'));
create policy en_upd on enrollments for update to authenticated using (public.has_perm('finance') or public.has_perm('ielts_manage'));

do $$ declare t text; begin
  foreach t in array array['attendance','mocks','batch_posts'] loop
    execute format('create policy i_all on public.%I for all to authenticated using (public.has_perm(''ielts_manage'') or public.teaches_batch(batch_id)) with check (public.has_perm(''ielts_manage'') or public.teaches_batch(batch_id))', t);
  end loop;
end $$;

create policy t_sel on tasks for select to authenticated using (public.has_perm('tasks_all') or (public.my_role() is not null and (created_by = auth.uid() or auth.uid() = any(assignees))));
create policy t_ins on tasks for insert to authenticated with check (public.my_role() is not null);
create policy t_upd on tasks for update to authenticated using (public.has_perm('tasks_all') or (public.my_role() is not null and (created_by = auth.uid() or auth.uid() = any(assignees))));
create policy t_del on tasks for delete to authenticated using (public.is_role('admin','manager') or created_by = auth.uid());

create policy a_ins on activity for insert to authenticated with check (public.my_role() is not null);
create policy a_sel on activity for select to authenticated using (public.has_perm('logs'));

-- =====================================================================
-- Student portal: login ছাড়া, শুধু Student ID + PIN দিয়ে নিজের অগ্রগতির সারাংশ।
-- ৫ বার ভুল PIN দিলে ১৫ মিনিট বন্ধ। কোনো ফাইল বা নোট ফেরত দেয় না; পাসপোর্ট নাম্বার শুধু EMGS কার্ডের জন্য (নিজেরটা)।
-- =====================================================================
create function public.student_portal(p_sid text, p_pin text) returns jsonb language plpgsql security definer set search_path = public as $$
declare s students;
begin
  -- p_sid-এ Student ID অথবা মোবাইল নাম্বার — দুটোই চলে
  select * into s from students
   where regexp_replace(upper(sid), '[^A-Z0-9]', '', 'g') = regexp_replace(upper(p_sid), '[^A-Z0-9]', '', 'g')
      or (p_sid ~ '^[+0-9 ()-]{8,}$' and right(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 10) = right(regexp_replace(p_sid, '\D', '', 'g'), 10))
   order by created_at limit 1;
  if not found or s.portal_pin is null then perform pg_sleep(1); return null; end if;
  if s.portal_lock is not null and s.portal_lock > now() then raise exception 'locked'; end if;
  if s.portal_pin <> trim(p_pin) then
    update students set portal_lock = case when portal_fails + 1 >= 5 then now() + interval '15 minutes' else portal_lock end,
                        portal_fails = case when portal_fails + 1 >= 5 then 0 else portal_fails + 1 end where id = s.id;
    perform pg_sleep(1); return null;
  end if;
  if s.portal_fails > 0 then update students set portal_fails = 0, portal_lock = null where id = s.id; end if;
  return jsonb_build_object(
    'name', s.name, 'sid', s.sid, 'phone', s.phone, 'status', s.status, 'country', s.pref_country, 'test_type', s.test_type,
    'bachelor', s.bachelor is not null, 'masters', s.masters is not null, 'departure_date', s.departure_date, 'flight', s.flight,
    'counsellor', (select jsonb_build_object('name', p.name, 'phone', p.phone) from profiles p where p.id = s.counsellor_id),
    'apps', coalesce((select jsonb_agg(jsonb_build_object('university', a.university, 'course', a.course, 'intake', a.intake, 'status', a.status, 'country', a.country) order by a.created_at) from applications a where a.student_id = s.id), '[]'::jsonb),
    'visa', (select to_jsonb(v) from (select status, country, submitted_on, appointment_date, biometrics_date, interview_date, decision_date from visas where student_id = s.id order by created_at desc limit 1) v),
    'docs', coalesce((select jsonb_agg(jsonb_build_object('type', d.type, 'status', d.status)) from documents d where d.student_id = s.id), '[]'::jsonb),
    'classes', coalesce((select jsonb_agg(jsonb_build_object(
        'batch', b.name, 'course', b.course_type, 'status', b.status, 'schedule', b.schedule, 'time', b.class_time, 'room', b.room,
        'start', b.start_date, 'end', b.end_date, 'link', b.meeting_link, 'teacher', (select p.name from profiles p where p.id = b.teacher_id),
        'classes', (select count(*) from attendance a where a.batch_id = b.id and a.marks ? e.id::text),
        'present', (select count(*) from attendance a where a.batch_id = b.id and a.marks ? e.id::text and a.marks ->> e.id::text <> 'A'),
        'absent', coalesce((select jsonb_agg(x.date order by x.date desc) from (select a.date from attendance a where a.batch_id = b.id and a.marks ->> e.id::text = 'A' order by a.date desc limit 5) x), '[]'::jsonb),
        'results', coalesce((select jsonb_agg(jsonb_build_object('date', m.date, 'kind', m.kind, 'l', m.listening, 'r', m.reading, 'w', m.writing, 's', m.speaking, 'overall', m.overall) order by m.date desc) from mocks m where m.enrollment_id = e.id), '[]'::jsonb),
        'posts', coalesce((select jsonb_agg(jsonb_build_object('kind', x.kind, 'title', x.title, 'body', x.body, 'link', x.link, 'due', x.due_date, 'at', x.created_at) order by x.created_at desc) from (select * from batch_posts bp where bp.batch_id = b.id and (cardinality(bp.student_ids) = 0 or s.id = any(bp.student_ids)) order by bp.created_at desc limit 30) x), '[]'::jsonb)))
      from enrollments e join batches b on b.id = e.batch_id where e.student_id = s.id and e.status = 'active'), '[]'::jsonb),
    'emgs', case when coalesce(s.pref_country, '') = 'Malaysia' or exists (select 1 from applications a where a.student_id = s.id and a.country = 'Malaysia') or exists (select 1 from visas v where v.student_id = s.id and v.country = 'Malaysia') then (
      select jsonb_build_object(
        'paid', exists (select 1 from invoices i where i.student_id = s.id and i.category ~* '(emgs|visa processing)' and i.total - coalesce(i.discount, 0) > 0
                          and (select coalesce(sum(case when x.refund then -x.amount else x.amount end), 0) from payments x where x.invoice_id = i.id) >= i.total - coalesce(i.discount, 0))
                or coalesce(v.fee_paid, false),
        'uni', u.uni, 'passport', s.passport_no, 'nationality', 'Bangladesh', 'show', s.emgs_show, 'found', case when s.emgs_show then s.emgs_found end, 'checked', case when s.emgs_show then s.emgs_checked end,
        'percent', case when s.emgs_show then s.emgs_percent end, 'note', case when s.emgs_show then s.emgs_status end, 'submitted_on', v.submitted_on,
        'custom_rm', (select (x ->> 'emgs_rm')::numeric from settings st, jsonb_array_elements(coalesce(st.value -> 'unis', '[]'::jsonb)) x where st.key = 'catalog' and x ->> 'name' = u.uni limit 1))
      from (select coalesce((select a.university from applications a where a.student_id = s.id and a.country = 'Malaysia' order by (a.status in ('cas','deposit','unconditional','conditional')) desc, a.created_at desc limit 1), s.pref_university) as uni) u
      left join lateral (select * from visas vv where vv.student_id = s.id and vv.country = 'Malaysia' order by vv.created_at desc limit 1) v on true) end,
    'pay', jsonb_build_object(
      'total', (select coalesce(sum(i.total - coalesce(i.discount, 0)), 0) from invoices i where i.student_id = s.id),
      'paid', (select coalesce(sum(case when x.refund then -x.amount else x.amount end), 0) from payments x where x.student_id = s.id)));
end $$;
grant execute on function public.student_portal(text, text) to anon, authenticated;

-- =====================================================================
-- Student portal থেকে ফাইল তোলা (login ছাড়া, ID/নাম্বার + PIN দিয়ে)
-- ১) portal_upload_start: PIN মিলিয়ে একটা "টিকিট" (ফাইলের path) দেয়, ১০ মিনিট চলে, একবারই
-- ২) ব্রাউজার ফাইলটা ঠিক ওই path-এ তোলে (storage policy শুধু টিকিট থাকলেই দেয়)
-- ৩) portal_upload_done: document-এ নতুন version যোগ করে, status "uploaded", timeline-এ নোট
-- Student নিজের বা কারও ফাইল দেখতে/নামাতে পারে না।
-- =====================================================================
create table public.portal_uploads (path text primary key, student_id uuid not null references students on delete cascade, doc_id uuid not null, used boolean not null default false, created_at timestamptz not null default now());
alter table public.portal_uploads enable row level security;   -- কোনো policy নেই → সরাসরি কেউ পড়তে/লিখতে পারে না

create function public.portal_student(p_sid text, p_pin text) returns students language plpgsql security definer set search_path = public as $$
declare s students;
begin
  select * into s from students
   where regexp_replace(upper(sid), '[^A-Z0-9]', '', 'g') = regexp_replace(upper(p_sid), '[^A-Z0-9]', '', 'g')
      or (p_sid ~ '^[+0-9 ()-]{8,}$' and right(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 10) = right(regexp_replace(p_sid, '\D', '', 'g'), 10))
   order by created_at limit 1;
  if not found or s.portal_pin is null then return null; end if;
  if s.portal_lock is not null and s.portal_lock > now() then raise exception 'locked'; end if;
  if s.portal_pin <> trim(p_pin) then
    update students set portal_lock = case when portal_fails + 1 >= 5 then now() + interval '15 minutes' else portal_lock end,
                        portal_fails = case when portal_fails + 1 >= 5 then 0 else portal_fails + 1 end where id = s.id;
    return null;
  end if;
  return s;
end $$;
revoke execute on function public.portal_student(text, text) from public, anon, authenticated;

create function public.portal_upload_start(p_sid text, p_pin text, p_type text, p_name text) returns text language plpgsql security definer set search_path = public as $$
declare s students; d documents; p text;
begin
  s := public.portal_student(p_sid, p_pin);
  if s.id is null then perform pg_sleep(1); return null; end if;
  if length(coalesce(p_type, '')) not between 2 and 60 or p_name !~* '\.(pdf|jpe?g|png)$' then raise exception 'bad file'; end if;
  if (select count(*) from portal_uploads where student_id = s.id and created_at > now() - interval '1 day') >= 30 then raise exception 'too many uploads today'; end if;
  select * into d from documents where student_id = s.id and type = p_type;
  if not found then insert into documents (student_id, type, status, versions) values (s.id, p_type, 'pending', '[]') returning * into d;
  elsif d.status = 'verified' then raise exception 'already verified'; end if;
  p := s.id || '/' || d.id || '/student-' || (extract(epoch from clock_timestamp()) * 1000)::bigint || '-' || left(regexp_replace(p_name, '[^A-Za-z0-9._-]', '_', 'g'), 80);
  insert into portal_uploads (path, student_id, doc_id) values (p, s.id, d.id);
  return p;
end $$;

create function public.portal_upload_ok(p_path text) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from portal_uploads where path = p_path and not used and created_at > now() - interval '10 minutes') $$;

create function public.portal_upload_done(p_sid text, p_pin text, p_path text, p_name text, p_size bigint) returns void language plpgsql security definer set search_path = public as $$
declare s students; u portal_uploads; t text;
begin
  s := public.portal_student(p_sid, p_pin);
  if s.id is null then raise exception 'bad pin'; end if;
  select * into u from portal_uploads where path = p_path and student_id = s.id and not used;
  if not found or not exists (select 1 from storage.objects where bucket_id = 'documents' and name = p_path) then raise exception 'upload not found'; end if;
  update portal_uploads set used = true where path = p_path;
  update documents set status = 'uploaded', verified_by = null, verified_at = null,
    versions = versions || jsonb_build_array(jsonb_build_object('path', p_path, 'name', left(p_name, 120), 'size', p_size, 'by', 'student', 'at', now()))
   where id = u.doc_id returning type into t;
  insert into notes (student_id, type, text) values (s.id, 'internal', 'Student uploaded “' || t || '” from the portal (' || left(p_name, 120) || '). Please check and verify.');
end $$;
grant execute on function public.portal_upload_start(text, text, text, text), public.portal_upload_done(text, text, text, text, bigint) to anon, authenticated;

-- =====================================================================
-- Website → CRM: website-এ কেউ নাম-নাম্বার দিলে lead তৈরি হয় আর CRM-এর Student ID ফেরত যায়।
-- একই নাম্বার আবার এলে নতুন রেকর্ড হয় না (আগের ID ফেরত যায়, PIN নয়)। ঘণ্টায় সর্বোচ্চ ১২০টা।
-- =====================================================================
-- কোন কোন পদ website-এর lead পালা করে পাবে (Role permissions → "Gets new website leads automatically")
create function public.lead_pool_roles() returns text[] language sql stable security definer set search_path = public as $$
  select case when exists (select 1 from settings where key = 'perms' and value ? 'lead_pool')
    then array(select jsonb_array_elements_text(value -> 'lead_pool') from settings where key = 'perms')
    else array['counsellor', 'senior'] end $$;
create function public.website_lead(p_name text, p_phone text, p_edu text default '', p_source text default 'Website') returns jsonb language plpgsql security definer set search_path = public as $$
declare d text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10); s students; pin text; c record;
begin
  if length(trim(coalesce(p_name, ''))) < 2 or length(p_name) > 80 or length(d) < 8 then raise exception 'invalid'; end if;
  select * into s from students where right(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 10) = d or right(regexp_replace(coalesce(whatsapp, ''), '\D', '', 'g'), 10) = d order by created_at limit 1;
  if found then return jsonb_build_object('sid', s.sid, 'pin', null, 'existing', true); end if;
  if (select count(*) from students where created_by is null and created_at > now() - interval '1 hour') >= 120 then raise exception 'busy'; end if;
  pin := lpad((floor(random() * 1000000))::int::text, 6, '0');
  insert into students (name, phone, source, status, priority, next_followup, nationality, pref_country, portal_pin)
    values (trim(p_name), left(p_phone, 20), left(coalesce(nullif(p_source, ''), 'Website'), 30), 'new', 'warm', current_date, 'Bangladeshi', 'Malaysia', pin) returning * into s;
  -- পালা করে counsellor বসানো: "Gets new website leads" অনুমতির পদের মধ্যে যে সবচেয়ে বেশি সময় ধরে lead পায়নি, সে পাবে
  select p.id, p.name into c from profiles p
    where p.active and p.role <> 'admin' and (p.role = any(public.lead_pool_roles()) or 'lead_pool' = any(p.extra_perms))
    order by p.last_auto_lead nulls first, random() limit 1 for update skip locked;
  if c.id is not null then
    update students set counsellor_id = c.id where id = s.id;
    update profiles set last_auto_lead = greatest(clock_timestamp(), (select max(last_auto_lead) from profiles) + interval '1 millisecond') where id = c.id;
    insert into notes (student_id, type, text) values (s.id, 'internal', 'Auto-assigned to ' || coalesce(c.name, 'counsellor') || ' (website leads are shared in turn).');
  end if;
  insert into notes (student_id, type, text) values (s.id, 'internal', 'Came from the website (' || left(coalesce(p_source, 'Website'), 30) || '). Latest education: ' || left(coalesce(nullif(p_edu, ''), 'not given'), 40) || '.');
  return jsonb_build_object('sid', s.sid, 'pin', pin, 'existing', false);
end $$;
grant execute on function public.website_lead(text, text, text, text) to anon, authenticated;

-- =====================================================================
-- File storage (private bucket) — path: <student_id>/<document_id>/<file>
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 188743680, array['application/pdf','image/jpeg','image/png']);
create policy doc_read on storage.objects for select to authenticated using (bucket_id = 'documents' and public.doc_access(((storage.foldername(name))[1])::uuid));
create policy doc_write on storage.objects for insert to authenticated with check (bucket_id = 'documents' and public.doc_access(((storage.foldername(name))[1])::uuid));
-- Student portal: শুধু টিকিটে লেখা path-এ, ১০ মিনিটের মধ্যে, একবার
create policy doc_portal on storage.objects for insert to anon with check (bucket_id = 'documents' and public.portal_upload_ok(name));
-- update/delete policy নেই → আপলোড করা ফাইল কেউ বদলাতে বা মুছতে পারে না (শুধু Supabase dashboard থেকে owner পারবে)

-- Student portal থেকে নিজের পাসপোর্ট নাম্বার দেওয়া (EMGS দেখার জন্য) — আগে থেকে থাকলে বদলানো যায় না
create function public.portal_set_passport(p_sid text, p_pin text, p_no text) returns void language plpgsql security definer set search_path = public as $$
declare s students; n text := upper(regexp_replace(coalesce(p_no, ''), '[^A-Za-z0-9]', '', 'g'));
begin
  s := public.portal_student(p_sid, p_pin);
  if s.id is null then perform pg_sleep(1); raise exception 'pin'; end if;
  if n !~ '^[A-Z]{1,2}[0-9]{6,8}$' then raise exception 'bad passport'; end if;
  if s.passport_no is not null then raise exception 'already set'; end if;
  update students set passport_no = n where id = s.id;
  insert into notes (student_id, type, text) values (s.id, 'internal', 'Student added passport number ' || n || ' from the portal.');
end $$;
grant execute on function public.portal_set_passport(text, text, text) to anon, authenticated;

-- University / programme / EMGS ফি-র তালিকা: website আর CRM দুটোই এটা পড়ে (login ছাড়া পড়া যায়, বদলানো যায় শুধু CRM থেকে)
create function public.public_catalog() returns jsonb language sql stable security definer set search_path = public as
$$ select coalesce((select value from settings where key = 'catalog'), '{}'::jsonb) $$;
grant execute on function public.public_catalog() to anon, authenticated;

-- emgs_show (student EMGS % দেখবে কি না) শুধু Admin / Manager / Operation / Senior বদলাতে পারেন
create function public.guard_emgs_show() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.emgs_show is distinct from old.emgs_show and auth.uid() is not null and not public.has_perm('emgs_ctl') then
    raise exception 'You don''t have permission for this';
  end if;
  return new;
end $$;
create trigger guard_emgs_show before update on public.students for each row execute function public.guard_emgs_show();
