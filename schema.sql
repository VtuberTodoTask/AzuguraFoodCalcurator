-- This script is for setting up the 'materials' table in your PostgreSQL database.

CREATE TABLE materials (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price INTEGER NOT NULL
);

-- You can add some initial data for testing if you like:
-- INSERT INTO materials (name, price) VALUES ('小麦粉', 500);
-- INSERT INTO materials (name, price) VALUES ('砂糖', 300);
-- INSERT INTO materials (name, price) VALUES ('卵', 250);

-- Tables for Stores
CREATE TABLE stores (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

-- Tables for Employees
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  is_manager BOOLEAN DEFAULT false
);

-- Tables for Recipes
CREATE TABLE recipes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  store_id INTEGER REFERENCES stores(id) ON DELETE SET NULL,
  price INTEGER NOT NULL DEFAULT 0
);

-- Defines the relationship between recipes and their ingredients (which can be materials or other recipes)
CREATE TYPE item_type AS ENUM ('MATERIAL', 'RECIPE');

CREATE TABLE recipe_items (
    id SERIAL PRIMARY KEY,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL,
    item_type item_type NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    UNIQUE (recipe_id, item_id, item_type) -- Prevents duplicate items in the same recipe
);

-- Sales history table: stores individual sale records linked to an employee (optional)
CREATE TABLE sales_history (
  id SERIAL PRIMARY KEY,
  amount INTEGER NOT NULL,
  customer VARCHAR(255),
  employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Example recipe: Pancake (uses 1 flour, 2 eggs)
-- INSERT INTO stores (name) VALUES ('Default Store');
-- INSERT INTO employees (name, store_id, is_manager) VALUES ('店長A', 1, true);
-- INSERT INTO employees (name, store_id) VALUES ('店員B', 1);
-- INSERT INTO recipes (name, store_id) VALUES ('パンケーキ', 1);
-- INSERT INTO recipe_items (recipe_id, item_id, item_type, quantity) VALUES (1, 1, 'MATERIAL', 1); -- 1 is Flour
-- INSERT INTO recipe_items (recipe_id, item_id, item_type, quantity) VALUES (1, 3, 'MATERIAL', 2); -- 3 is Egg
