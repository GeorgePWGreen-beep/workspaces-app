# Cambridge Study Score verification audit — 26 October 2026

Status: **desk research completed for seven previously dated venues; 0 full seven-factor scores verified**.

## Standard

A full Study Score may receive a non-null `study_score_verified_at` only when all seven score inputs have dated evidence: (1) accessible Wi-Fi quality for a normal visitor, (2) typical noise, (3) seating comfort, (4) power socket availability, (5) coffee quality, (6) typical crowding, and (7) approximate seating capacity. Also check whether laptops are permitted, and opening hours. A published timetable or a customer review alone is **not** full Study Score verification. Public evidence may establish particular facts but cannot reliably measure every factor. Retain `last_verified_at` as an older venue research timestamp only.

Recommended field-test log: visit date/time, source URL or observation, visitor Wi-Fi join + speed/stability, ambient noise at peak and off-peak, table/chair comfort after a working session, accessible sockets count, coffee tasting basis, occupancy vs typical time of day, seating capacity count, and laptop policy confirmed with staff.

| Café | Publicly supported | Remaining evidence for full score |
| --- | --- | --- |
| ARC Café | University of Cambridge: weekdays 08:30–16:30. Independent 2024 laptop-space report describes power sockets, laptop use, and reliance on eduroam. | Verify Wi-Fi as a visitor without eduroam, typical noise/crowding, 25-seat estimate, socket access, seating and coffee. |
| Florey Café & Gardens | Visit Cambridge: open to all, free Wi-Fi listed, indoor/outdoor seating, M–F 08:30–16:00; weekends 10:00–16:00. | Test Wi-Fi speed, socket access, noise, busyness, 35-seat estimate, seating comfort and coffee. |
| Imp Café & Eco Shop | 2026 customer review: free Wi-Fi, sockets by tables and laptop use; local directory: closed Tuesdays, 09:00–18:00 other days. Customer reporting, **not** the owner's verified policy. | Get current policy from staff including busy lunch periods; independently test the seven factors and 15-seat estimate. |
| Pages Coffee House | Owner site: laptop-friendly 08:00–11:00, hours M–Sat 08:00–16:00, Sun 09:00–16:00. Visit Cambridge lists Wi-Fi; a local coffee guide reports a few sockets. | Measure Wi-Fi, noise, crowding, sockets, 15-seat estimate and seating; validate coffee assessment. |
| Stir – Chesterton | Owner site: Mon–Sun 08:00–16:00. Specialist coffee and laptop guides report Wi-Fi and work-friendly atmosphere, but location coverage may vary. | Confirm sockets specifically for Chesterton, and test all seven metrics, including 35-seat estimate. |
| The Box Café | Owner site: M–Thu 08:00–17:00, Fri 08:00–20:00, Sat 10:00–20:00, Sun closed; indoor and courtyard seating. Third-party listing calls it laptop-friendly. | Confirm permitted laptop durations and Wi-Fi/sockets; test seven score factors and 35-seat estimate. |
| The Locker Café | Multiple listings report Wi-Fi. Older 2024 student guide says weekdays laptops upstairs only and none on weekends; 2026 listing characterises it as entirely laptop-free. **Policy conflict; do not claim confirmed.** | Ask staff current laptop policy (days and floors), test seven factors, 60-seat estimate and Wi-Fi quality. |

## Source register

- ARC official: https://www.catering.admin.cam.ac.uk/cafes/arc-cafe
- ARC laptop-space report (2024): https://laptopfriendly.co/cambridge/arc-cafe
- Florey Cambridge visitor guide: https://www.visitcambridge.org/place/florey-cafe-gardens/
- Florey independent review: https://www.filternotes.com/cambridge/florey
- Imp 2026 customer review and listing: https://restaurantguru.com/Imp-Cafe-and-Eco-Shop-Cambridge-England
- Imp opening hours: https://worldcafemap.com/en/uk/cambridge/imp-cafe-and-eco-shop
- Pages official: https://www.pagescambridge.com/
- Pages Wi-Fi listing: https://www.visitcambridge.org/place/pages-cambridge/
- Pages sockets guide: https://dialledcoffee.house/pages-cambridge
- Stir official Chesterton: https://www.yourstir.co.uk/pages/chesterton-road
- Stir independent assessment: https://laptopfriendly.co/cambridge/stir
- Box official: https://boxcafe.co.uk/
- Box work-friendly listing: https://laptopfriendlycafe.com/cafes/cambridge/the-box-cafe
- Locker 2024 student guide: https://thetab.com/2024/02/25/SHIFTING-SCHOLARS-CAMBRIDGE-STUDY-SPOTS-YOUVE-NEVER-TRIED
- Locker newer conflicting listing (updated July 2026): https://www.corner.inc/place/pqEtDMgpyjBT
- Locker Wi-Fi listing: https://www.tripadvisor.co.uk/Restaurant_Review-g186225-d13001199-Reviews-The_Locker_Cafe-Cambridge_Cambridgeshire_England.html

## Implemented during this audit

- Added `public.cafes.study_score_verified_at` (all null); this is the explicit evidence-backed indicator of full-score verification.
- Separated it from the historical `last_verified_at` date, which only represents venue information research.
- UI labels score as *Estimated* until `study_score_verified_at` is filled.
- Updated public descriptions for ARC (eduroam caveat) and The Locker (policy uncertainty).
- Original score factors and score values were not changed without sufficient evidence.

## Next review

Prioritise an in-person check with The Locker about laptop policy, and ARC about public Wi-Fi. Check Pages sockets and quietness during 08:00–11:00 laptop window. Then sample Florey, Imp, Stir and Box at both quiet and busy times. No full-score status should be upgraded until evidence is complete.
