insert into public.cafes (
  city,
  slug,
  name,
  description,
  latitude,
  longitude,
  study_score,
  wifi,
  noise,
  sockets,
  busyness,
  rating,
  price,
  walk_time,
  image_url,
  coffee,
  seating,
  opening_hours,
  is_independent,
  is_active
)
values
  (
    'Exeter',
    'arrietty',
    'Arrietty',
    'Bright, relaxed speciality coffee shop well suited to studying and laptop work.',
    50.726516, -3.527072, 85, 'Great WiFi', 'Quiet', 'Plenty', 'Moderate',
    4.7, '££', null, '/cafes/placeholder.jpg', 'Excellent', 'Comfortable',
    '08:30 - 15:00', true, true
  ),
  (
    'Cambridge',
    'bould-brothers-coffee',
    'Bould Brothers Coffee',
    'Independent speciality coffee shop with excellent natural lighting and reliable WiFi. A favourite among Cambridge students.',
    52.2053, 0.1195, 50, 'Great WiFi', 'Moderate', 'Plenty', 'Busy',
    4.8, '££', 5, '/cafes/placeholder.jpg', 'Excellent', 'Comfortable',
    '08:00 - 18:00', true, true
  ),
  (
    'Cambridge',
    'hot-numbers',
    'Hot Numbers',
    'Large artisan café with plenty of seating and a relaxed atmosphere ideal for longer study sessions.',
    52.2007, 0.1322, 90, 'Great WiFi', 'Moderate', 'Plenty', 'Moderate',
    4.7, '££', 8, '/cafes/hot-numbers.jpg', 'Excellent', 'Comfortable',
    '07:30 - 17:30', true, true
  ),
  (
    'Cambridge',
    'espresso-library',
    'Espresso Library',
    'Popular student workspace with reliable WiFi, spacious tables and a calm working environment.',
    52.2026, 0.1258, 80, 'Great WiFi', 'Quiet', 'Plenty', 'Moderate',
    4.8, '££', 6, '/cafes/placeholder.jpg', 'Excellent', 'Comfortable',
    '08:00 - 18:00', null, true
  ),
  (
    'Cambridge',
    'urban-larder',
    'Urban Larder',
    'Relaxed independent café with quieter corners and comfortable seating for focused work.',
    52.2084, 0.1164, 70, 'Good WiFi', 'Quiet', 'Some', 'Quiet',
    4.6, '££', 9, '/cafes/placeholder.jpg', 'Good', 'Comfortable',
    '08:00 - 17:00', null, true
  ),
  (
    'Cambridge',
    'aromi',
    'Aromi',
    'Authentic Sicilian café with amazing food and coffee, better suited to shorter study sessions.',
    52.2058, 0.1227, 75, 'Good WiFi', 'Loud', 'Few', 'Busy',
    4.8, '££', 4, '/cafes/placeholder.jpg', 'Excellent', 'Basic',
    '08:00 - 19:00', true, true
  ),
  (
    'Cambridge',
    'fitzbillies',
    'Fitzbillies',
    'Historic Cambridge café famous for its Chelsea buns and lively atmosphere rather than long study sessions.',
    52.2044, 0.1242, 40, 'Okay WiFi', 'Moderate', 'Few', 'Busy',
    4.6, '£££', 5, '/cafes/placeholder.jpg', 'Good', 'Basic',
    '08:30 - 17:30', true, true
  )
on conflict (slug) do update set
  city = excluded.city,
  name = excluded.name,
  description = excluded.description,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  study_score = excluded.study_score,
  wifi = excluded.wifi,
  noise = excluded.noise,
  sockets = excluded.sockets,
  busyness = excluded.busyness,
  rating = excluded.rating,
  price = excluded.price,
  walk_time = excluded.walk_time,
  image_url = excluded.image_url,
  coffee = excluded.coffee,
  seating = excluded.seating,
  opening_hours = excluded.opening_hours,
  is_independent = excluded.is_independent,
  is_active = excluded.is_active;
