# Supabase order storage

1. Create a Supabase project.
2. In the Supabase SQL Editor, run:

```sql
create table public.orders (
  id text primary key,
  date timestamptz not null,
  status text not null default 'Pending',
  payment_status text not null default 'Unpaid',
  customer jsonb not null,
  payment jsonb not null,
  items jsonb not null,
  total numeric not null
);

alter table public.orders enable row level security;

create policy "Anyone can create orders"
on public.orders for insert
with check (true);

create policy "Anyone can read orders"
on public.orders for select
using (true);

create policy "Anyone can update orders"
on public.orders for update
using (true)
with check (true);

create policy "Anyone can delete orders"
on public.orders for delete
using (true);
```

3. Copy the project URL and the public anon key from Project Settings > API into `js/supabase-config.js`.
4. Deploy the updated files.

The public anon key is intended for browser use, but these open policies are suitable only for this prototype. Before using real customer data, add Supabase Auth and restrict read, update, and delete policies to authenticated admin users. Never put the service-role key in this site.

When the config values are blank, the site keeps using browser localStorage so local development still works. Once configured, checkout and the dashboard use the shared Supabase table.
