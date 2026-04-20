-- This query will help show which food banks 
-- have highest or lowest stock
-- this will help show where to send stock on a priority
SELECT fb.foodbank_name,
SUM(s.quantity_in_stock) AS total_stock
FROM Stock s
JOIN FoodBank fb ON s.foodbank_id = fb.foodbank_id
GROUP BY fb.foodbank_name
ORDER BY total_stock DESC;

--this query will show which businesses
-- contributed most items
SELECT d.donor_name,
SUM(di.quantity) AS total_donated
FROM Donation d
JOIN DonationItem di ON d.donation_id = di.donation_id
GROUP BY d.donor_name
ORDER BY total_donated DESC;


--this query will help identify
-- what is the average size of households served by
-- each foodbank
SELECT fb.foodbank_name,
AVG(h.household_size) AS avg_household_size
FROM FoodBank fb
JOIN Distribution d ON fb.foodbank_id = d.foodbank_id
JOIN Household h ON d.household_id = h.household_id
GROUP BY fb.foodbank_name;
