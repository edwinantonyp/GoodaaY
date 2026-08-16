-- Run this in Supabase Dashboard > SQL Editor for the project
-- tgltdckcifzkvvlraymx.supabase.co

alter table public.orders enable row level security;

drop policy if exists "Anyone can create orders" on public.orders;
create policy "Anyone can create orders"
on public.orders
for insert
to anon, authenticated
with check (true);

-- Verify the policy exists after running this script:
select policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename = 'orders';
