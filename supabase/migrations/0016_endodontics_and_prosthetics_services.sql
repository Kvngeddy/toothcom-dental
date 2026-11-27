-- Add Endodontics and Prosthetics services to the shared services catalog.
-- This seed is idempotent and can be safely applied more than once.

insert into public.services (
  category,
  name,
  note,
  price_type,
  price,
  price_min,
  price_max,
  is_active
)
select seed.category, seed.name, seed.note, seed.price_type, seed.price, seed.price_min, seed.price_max, true
from (
  values
    ('Endodontics', 'Pulpectomy', null, 'fixed', 60000::numeric, null::numeric, null::numeric),
    ('Endodontics', 'Root Canal Treatment - Anterior', null, 'fixed', 90000::numeric, null::numeric, null::numeric),
    ('Endodontics', 'Root Canal Treatment - Premolar', null, 'fixed', 110000::numeric, null::numeric, null::numeric),
    ('Endodontics', 'Root Canal Treatment - Molar', null, 'fixed', 130000::numeric, null::numeric, null::numeric),
    ('Endodontics', 'Root Canal Treatment - 3rd Molar', null, 'fixed', 150000::numeric, null::numeric, null::numeric),
    ('Endodontics', 'Root Canal Treatment - Repeat', null, 'fixed', 130000::numeric, null::numeric, null::numeric),
    ('Endodontics', 'Apicetomy', null, 'fixed', 60000::numeric, null::numeric, null::numeric),
    ('Endodontics', 'Apical Curretage', null, 'fixed', 70000::numeric, null::numeric, null::numeric),
    ('Prosthetics', 'Ceramic Veneer', 'per tooth', 'fixed', 280000::numeric, null::numeric, null::numeric),
    ('Prosthetics', 'Stainless Steel Crown', 'per tooth', 'fixed', 130000::numeric, null::numeric, null::numeric),
    ('Prosthetics', 'Acrylic Crown', 'per tooth', 'fixed', 120000::numeric, null::numeric, null::numeric),
    ('Prosthetics', 'PFMC Crown', 'per tooth', 'fixed', 250000::numeric, null::numeric, null::numeric),
    ('Prosthetics', 'Zirconia Crown', 'per tooth', 'fixed', 270000::numeric, null::numeric, null::numeric),
    ('Prosthetics', 'Gold Crown', 'depending', 'variable', null::numeric, null::numeric, null::numeric),
    ('Prosthetics', 'Emax Crown', 'per tooth', 'fixed', 350000::numeric, null::numeric, null::numeric),
    ('Prosthetics', 'Post and Core', 'per tooth', 'fixed', 100000::numeric, null::numeric, null::numeric)
) as seed(category, name, note, price_type, price, price_min, price_max)
where not exists (
  select 1
  from public.services as existing
  where existing.category = seed.category
    and existing.name = seed.name
);
