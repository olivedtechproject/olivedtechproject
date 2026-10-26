create type public.app_role as enum ('admin','moderator');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

alter table public.stories add column status text not null default 'approved';
alter table public.stories alter column status set default 'pending';
alter table public.stories add constraint stories_status_chk check (status in ('pending','approved','rejected'));
alter table public.stories add column hearts int not null default 0;
alter table public.stories add column upvotes int not null default 0;
alter table public.feedback add column hearts int not null default 0;
alter table public.feedback add column upvotes int not null default 0;
alter table public.feedback add column downvotes int not null default 0;

drop policy "read stories" on public.stories;
drop policy "post stories" on public.stories;
create policy "read approved stories" on public.stories for select to anon, authenticated using (status = 'approved' or public.has_role(auth.uid(),'moderator'));
create policy "post pending stories" on public.stories for insert to anon, authenticated with check (status = 'pending' and hearts = 0 and upvotes = 0);
create policy "moderators update stories" on public.stories for update to authenticated using (public.has_role(auth.uid(),'moderator')) with check (public.has_role(auth.uid(),'moderator'));
grant update on public.stories to authenticated;

create table public.tips (
  id uuid primary key default gen_random_uuid(),
  nickname text not null check (char_length(nickname) between 1 and 30),
  title text not null check (char_length(title) between 3 and 120),
  body text not null check (char_length(body) between 5 and 2000),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
grant select, insert on public.tips to anon, authenticated;
grant update on public.tips to authenticated;
grant all on public.tips to service_role;
alter table public.tips enable row level security;
create policy "read approved tips" on public.tips for select to anon, authenticated using (status = 'approved' or public.has_role(auth.uid(),'moderator'));
create policy "post pending tips" on public.tips for insert to anon, authenticated with check (status = 'pending');
create policy "moderators update tips" on public.tips for update to authenticated using (public.has_role(auth.uid(),'moderator')) with check (public.has_role(auth.uid(),'moderator'));

create or replace function public.react(_kind text, _target text, _id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if _target = 'story' and _kind = 'heart' then update stories set hearts = hearts + 1 where id = _id and status = 'approved';
  elsif _target = 'story' and _kind = 'up' then update stories set upvotes = upvotes + 1 where id = _id and status = 'approved';
  elsif _target = 'feedback' and _kind = 'heart' then update feedback set hearts = hearts + 1 where id = _id;
  elsif _target = 'feedback' and _kind = 'up' then update feedback set upvotes = upvotes + 1 where id = _id;
  elsif _target = 'feedback' and _kind = 'down' then update feedback set downvotes = downvotes + 1 where id = _id;
  else raise exception 'bad reaction';
  end if;
end $$;
grant execute on function public.react(text,text,uuid) to anon, authenticated;