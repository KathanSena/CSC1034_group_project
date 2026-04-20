-- =========================================
-- Query 1: Total Stock per Food Bank
-- Purpose:
-- Identifies which food banks have the highest and lowest stock levels.
-- Helps prioritise redistribution of resources.
-- =========================================
SELECT 
    fb.foodbank_name,
    SUM(s.quantity_in_stock) AS total_stock
FROM Stock s
JOIN FoodBank fb ON s.foodbank_id = fb.foodbank_id
GROUP BY fb.foodbank_id, fb.foodbank_name
ORDER BY total_stock DESC;


-- =========================================
-- Query 2: Top Donors by Contribution
-- Purpose:
-- Identifies which donors contribute the most items.
-- Helps recognise key contributors and maintain relationships.
-- =========================================
SELECT 
    d.donor_name,
    SUM(di.quantity) AS total_donated
FROM Donation d
JOIN DonationItem di ON d.donation_id = di.donation_id
GROUP BY d.donor_name
ORDER BY total_donated DESC;


-- =========================================
-- Query 3: Average Household Size per Food Bank
-- Purpose:
-- Determines the average household size served by each food bank.
-- Helps understand the demographic needs of each location.
-- =========================================
SELECT 
    fb.foodbank_name,
    AVG(h.household_size) AS avg_household_size
FROM FoodBank fb
JOIN Distribution d ON fb.foodbank_id = d.foodbank_id
JOIN Household h ON d.household_id = h.household_id
GROUP BY fb.foodbank_id, fb.foodbank_name;
