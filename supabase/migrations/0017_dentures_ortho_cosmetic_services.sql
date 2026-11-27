-- Add Denture, Orthodontics, and cosmetic beauty services to the shared catalog.
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
    ('Prosthetics', 'Conventional Denture', 'per tooth', 'fixed', 45000::numeric, null::numeric, null::numeric),
    ('Prosthetics', 'Conventional Denture - Additional Tooth', null, 'fixed', 20000::numeric, null::numeric, null::numeric),
    ('Prosthetics', 'Conventional Denture - Full Full', null, 'fixed', 600000::numeric, null::numeric, null::numeric),
    ('Prosthetics', 'Conventional Denture - Per Arch', 'upper or lower only', 'fixed', 300000::numeric, null::numeric, null::numeric),
    ('Prosthetics', 'Flexible Denture', '1-3 teeth', 'fixed', 120000::numeric, null::numeric, null::numeric),
    ('Prosthetics', 'Flexible Denture - Extra Tooth', null, 'fixed', 30000::numeric, null::numeric, null::numeric),
    ('Prosthetics', 'Flexible Denture - Full Full', null, 'fixed', 800000::numeric, null::numeric, null::numeric),
    ('Prosthetics', 'Flexible Denture - Per Arch', 'upper or lower only', 'fixed', 400000::numeric, null::numeric, null::numeric),
    ('Prosthetics', 'Denture Repair', null, 'fixed', 25000::numeric, null::numeric, null::numeric),
    ('Orthodontics', 'Orthodontic Consultation', null, 'fixed', 35000::numeric, null::numeric, null::numeric),
    ('Orthodontics', 'Aligners', null, 'variable', null::numeric, 2000000::numeric, 2500000::numeric),
    ('Orthodontics', 'Braces', null, 'fixed', 1400000::numeric, null::numeric, null::numeric),
    ('Orthodontics', 'Replacement of Brackets', 'per tooth', 'fixed', 35000::numeric, null::numeric, null::numeric),
    ('Orthodontics', 'Appliance', 'depending', 'variable', null::numeric, null::numeric, null::numeric),
    ('Orthodontics', 'Night Guard', 'depending', 'variable', null::numeric, null::numeric, null::numeric),
    ('Cosmetic', 'Beauty Stone', null, 'fixed', 10000::numeric, null::numeric, null::numeric),
    ('Cosmetic', 'Gap Tooth', null, 'fixed', 10000::numeric, null::numeric, null::numeric),
    ('Cosmetic', 'Teeth Whitening', null, 'fixed', 100000::numeric, null::numeric, null::numeric)
) as seed(category, name, note, price_type, price, price_min, price_max)
where not exists (
  select 1
  from public.services as existing
  where existing.category = seed.category
    and existing.name = seed.name
);
