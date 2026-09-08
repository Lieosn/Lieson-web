-- 在 Supabase Dashboard 的 SQL Editor 中完整执行一次。
create table if not exists public.post_likes (
  post_slug text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_slug, user_id)
);

alter table public.post_likes enable row level security;

grant select on public.post_likes to anon, authenticated;
grant insert, delete on public.post_likes to authenticated;

create policy "Anyone can read like counts"
on public.post_likes for select using (true);

create policy "A signed-in user can like once"
on public.post_likes for insert to authenticated
with check (auth.uid() = user_id);

create policy "A signed-in user can remove their own like"
on public.post_likes for delete to authenticated
using (auth.uid() = user_id);
