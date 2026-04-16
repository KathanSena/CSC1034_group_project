UPDATED ERD DRAFT
Open Table Belfast / Food Support System

+----------------------+
|       FoodBank       |
|----------------------|
| PK foodbank_id       |
| name                 |
| area                 |
| phone_number         |
+----------------------+
           |
           | 1
           |------< has >------------------- N
           |
+----------------------+
|         Hub          |
|----------------------|
| PK hub_id            |
| FK foodbank_id       |
| hub_name             |
| address              |
| opening_day          |
+----------------------+
      |                          |
      | 1                        | 1
      |------< supports >--- N   |------< stores >------ N
      |                          |
+----------------------+    +----------------------+
|      Household       |    |        Stock         |
|----------------------|    |----------------------|
| PK household_id      |    | PK stock_id          |
| FK hub_id            |    | FK hub_id            |
| contact_name         |    | FK item_id           |
| household_size       |    | quantity_on_hand     |
| postcode             |    | best_before          |
| dietary_notes        |    +----------------------+
+----------------------+
           |
           | 1
           |------< can have >-------------- N
           |
+----------------------+
|       Referral       |
|----------------------|
| PK referral_id       |
| FK household_id      |
| referral_source      |
| referral_date        |
| urgency_level        |
| status               |
+----------------------+


+----------------------+
|       Donation       |
|----------------------|
| PK donation_id       |
| FK foodbank_id       |
| donor_name           |
| donation_date        |
| donation_type        |
+----------------------+
           |
           | 1
           |------< contains >------------- N
           |
+----------------------+
|     DonationItem     |
|----------------------|
| PK donation_item_id  |
| FK donation_id       |
| FK item_id           |
| quantity             |
+----------------------+
           |
           | N
           |------< links to >------------- 1
           |
+----------------------+
|       FoodItem       |
|----------------------|
| PK item_id           |
| item_name            |
| category             |
| unit                 |
+----------------------+
           |
           | 1
           |------< used in >-------------- N
           |
+------------------------+
|    DistributionItem    |
|------------------------|
| PK distribution_item_id|
| FK distribution_id     |
| FK item_id             |
| quantity               |
+------------------------+
           |
           | N
           |------< belongs to >----------- 1
           |
+----------------------+
|     Distribution     |
|----------------------|
| PK distribution_id   |
| FK hub_id            |
| FK household_id      |
| distribution_date    |
| collection_method    |
+----------------------+


Extra notes:
- A FoodBank can have multiple Hubs.
- A Hub supports multiple Households and stores Stock.
- A Household can have more than one Referral over time.
- Hub and FoodItem is a many-to-many relationship resolved by Stock.
- Donation and FoodItem is a many-to-many relationship resolved by DonationItem.
- Distribution and FoodItem is a many-to-many relationship resolved by DistributionItem.
