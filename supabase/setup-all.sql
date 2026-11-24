-- Voice of You: complete Supabase setup
-- Paste this entire file into Supabase Dashboard > SQL Editor and run.
-- Includes reports, support, private evidence, admin moderation, and comments.
-- Existing data is preserved. Policies are recreated so this script can be rerun.

begin;

-- ===== schema.sql =====
-- Run in your Supabase SQL Editor. No service-role key is needed in the browser.
create extension if not exists pgcrypto;
create table if not exists public.issues (
 id uuid primary key default gen_random_uuid(),
 reference text unique not null,
 user_id uuid not null references auth.users(id) on delete cascade,
 title text not null check(length(title) between 1 and 140),
 description text not null check(length(description) between 20 and 4000),
 category text not null check(category in ('roads','water','sanitation','electricity','drainage','transport','health','education','safety','parks','environment','construction','services','other')),
 district text not null check(length(district) between 1 and 100),
 locality text not null check(length(locality) between 1 and 180),
 status text not null default 'submitted' check(status in ('submitted','review','information_required','published','complaint_filed','followup','action_reported','verified','closed','rejected','withdrawn','restricted')),
 consent boolean not null check(consent = true),
 created_at timestamptz not null default now()
);
alter table public.issues enable row level security;
revoke all on public.issues from anon, authenticated;
grant select,insert on public.issues to authenticated;
drop policy if exists "Citizens see their own reports" on public.issues;
create policy "Citizens see their own reports" on public.issues for select to authenticated using(user_id = auth.uid());
create or replace function public.current_user_email_verified() returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from auth.users where id = auth.uid() and email_confirmed_at is not null);
$$;
revoke all on function public.current_user_email_verified() from public;
grant execute on function public.current_user_email_verified() to authenticated;
drop policy if exists "Verified citizens submit pending reports" on public.issues;
create policy "Verified citizens submit pending reports" on public.issues for insert to authenticated with check(
 user_id = auth.uid() and status = 'submitted' and public.current_user_email_verified()
);
-- Only a trusted moderator/backend with elevated privileges may change status.
-- Public projection deliberately excludes user_id and private account details.
create or replace view public.public_issues with (security_barrier = true) as
 select reference,title,description,category,district,locality,status,created_at
 from public.issues where status in ('published','complaint_filed','followup','action_reported','verified','closed');
grant select on public.public_issues to anon,authenticated;
create index if not exists issues_district_status_idx on public.issues(district,status,created_at desc);
create index if not exists issues_owner_idx on public.issues(user_id);
create table if not exists public.supports (
 issue_reference text not null references public.issues(reference) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(issue_reference,user_id)
);
alter table public.supports enable row level security;
revoke all on public.supports from anon, authenticated;
grant select, insert, delete on public.supports to authenticated;
drop policy if exists "Read own supports" on public.supports;
create policy "Read own supports" on public.supports for select to authenticated using(user_id=auth.uid());
drop policy if exists "Support approved issues" on public.supports;
create policy "Support approved issues" on public.supports for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from public.public_issues where reference=issue_reference));
drop policy if exists "Remove own support" on public.supports;
create policy "Remove own support" on public.supports for delete to authenticated using(user_id=auth.uid());
create or replace view public.support_counts with (security_barrier = true) as select issue_reference,count(*)::integer as count from public.supports group by issue_reference;
grant select on public.support_counts to anon,authenticated;
create table if not exists public.evidence (
 id uuid primary key default gen_random_uuid(),
 issue_id uuid not null references public.issues(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 path text not null,
 created_at timestamptz not null default now()
);
alter table public.evidence enable row level security;
revoke all on public.evidence from anon, authenticated;
grant select,insert on public.evidence to authenticated;
drop policy if exists "Read own evidence" on public.evidence;
create policy "Read own evidence" on public.evidence for select to authenticated using(user_id=auth.uid());
drop policy if exists "Attach evidence to own report" on public.evidence;
create policy "Attach evidence to own report" on public.evidence for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from public.issues where id=issue_id and user_id=auth.uid()));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('evidence','evidence',false,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
drop policy if exists "Upload into own private folder" on storage.objects;
create policy "Upload into own private folder" on storage.objects for insert to authenticated with check(bucket_id='evidence' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Read own private evidence" on storage.objects;
create policy "Read own private evidence" on storage.objects for select to authenticated using(bucket_id='evidence' and (storage.foldername(name))[1] = auth.uid()::text);
-- Public media must use a separate, moderated and metadata-stripped publishing pipeline.
-- Never make the evidence bucket public.


-- ===== admin.sql =====
-- Run AFTER schema.sql. Admin membership is provisioned only through the SQL Editor.
create table if not exists public.admin_users (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon,authenticated;
create or replace function public.is_platform_admin() returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.admin_users where user_id=auth.uid());
$$;
revoke all on function public.is_platform_admin() from public;
grant execute on function public.is_platform_admin() to authenticated;
drop policy if exists "Admins read reports" on public.issues;
create policy "Admins read reports" on public.issues for select to authenticated using(public.is_platform_admin());
alter table public.issues add column if not exists resolution_evidence text not null default '';
create table if not exists public.moderation_events (
 id uuid primary key default gen_random_uuid(),
 issue_reference text not null,
 actor_id uuid not null references auth.users(id),
 old_status text not null,
 new_status text not null,
 note text not null check(length(note) between 10 and 2000),
 resolution_evidence text not null default '',
 created_at timestamptz not null default now()
);
alter table public.moderation_events enable row level security;
revoke all on public.moderation_events from anon,authenticated;
grant select on public.moderation_events to authenticated;
drop policy if exists "Admins read audit history" on public.moderation_events;
create policy "Admins read audit history" on public.moderation_events for select to authenticated using(public.is_platform_admin());
create index if not exists moderation_events_created_idx on public.moderation_events(created_at desc);
create or replace function public.admin_review_issue(p_reference text,p_status text,p_note text,p_resolution_evidence text,p_expected_status text)
returns void language plpgsql security definer set search_path='' as $$
declare current_issue public.issues%rowtype;
begin
 if not public.is_platform_admin() then raise exception 'Administrator access required'; end if;
 if p_status is null or p_status not in ('submitted','review','information_required','published','complaint_filed','followup','action_reported','verified','closed','rejected','withdrawn','restricted') then raise exception 'Invalid status'; end if;
 if p_note is null or length(trim(p_note))<10 or length(p_note)>2000 then raise exception 'A review note of 10 to 2000 characters is required'; end if;
 if coalesce(length(p_resolution_evidence),0)>4000 then raise exception 'Resolution evidence exceeds 4000 characters'; end if;
 if p_status='verified' and coalesce(length(trim(p_resolution_evidence)),0)<10 then raise exception 'Document resolution evidence before verifying'; end if;
 select * into current_issue from public.issues where reference=p_reference for update;
 if not found then raise exception 'Report not found'; end if;
 if p_expected_status is distinct from current_issue.status then raise exception 'Another reviewer changed this report. Refresh before reviewing again.'; end if;
 update public.issues set status=p_status,resolution_evidence=coalesce(p_resolution_evidence,'') where id=current_issue.id;
 insert into public.moderation_events(issue_reference,actor_id,old_status,new_status,note,resolution_evidence)
 values(p_reference,auth.uid(),current_issue.status,p_status,trim(p_note),coalesce(p_resolution_evidence,''));
end;
$$;
revoke all on function public.admin_review_issue(text,text,text,text,text) from public;
grant execute on function public.admin_review_issue(text,text,text,text,text) to authenticated;
drop policy if exists "Admins read private attachment records" on public.evidence;
create policy "Admins read private attachment records" on public.evidence for select to authenticated using(public.is_platform_admin());
drop policy if exists "Admins read private attachment files" on storage.objects;
create policy "Admins read private attachment files" on storage.objects for select to authenticated using(bucket_id='evidence' and public.is_platform_admin());
-- After the intended admin has signed in and verified their email:
-- insert into public.admin_users(user_id) select id from auth.users where email='YOUR_ADMIN_EMAIL' and email_confirmed_at is not null;
-- Never let browser clients write to admin_users or store a service-role key in the frontend.


-- ===== comments.sql =====
-- Run after schema.sql. Only verified, signed-in accounts may add comments.
create table if not exists public.comments (
 id uuid primary key default gen_random_uuid(),
 issue_reference text not null references public.issues(reference) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 display_name text not null default 'Citizen' check(length(trim(display_name)) between 1 and 60),
 body text not null check(length(trim(body)) between 3 and 2000),
 created_at timestamptz not null default now()
);
alter table public.comments enable row level security;
revoke all on public.comments from anon,authenticated;
grant insert,select on public.comments to authenticated;
drop policy if exists "Read own comments" on public.comments;
create policy "Read own comments" on public.comments for select to authenticated using(user_id=auth.uid());
drop policy if exists "Verified citizens comment on approved issues" on public.comments;
create policy "Verified citizens comment on approved issues" on public.comments for insert to authenticated with check(
 user_id=auth.uid() and public.current_user_email_verified() and exists(select 1 from public.public_issues where reference=issue_reference)
);
create or replace view public.public_comments with (security_barrier=true) as
 select c.id,c.issue_reference,c.display_name,c.body,c.created_at from public.comments c
 where exists(select 1 from public.public_issues i where i.reference=c.issue_reference);
grant select on public.public_comments to anon,authenticated;
create index if not exists comments_issue_created_idx on public.comments(issue_reference,created_at);


commit;
