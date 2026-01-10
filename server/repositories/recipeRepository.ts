// server/repositories/recipeRepository.ts

import { pool } from '~/server/utils/db';
import { mockDb } from '~/server/utils/mock-db';

type ItemType = 'MATERIAL' | 'RECIPE';
interface RecipeItemDef {
  item_id: number;
  item_type: ItemType;
  quantity: number;
}
interface Recipe {
  id: number;
  name: string;
  store_id: number | null;
  price: number;
  items: RecipeItemDef[];
}

const useMock = process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL;

const pgRepo = {
  async getAll(storeId?: number): Promise<Recipe[]> {
    let recipesSql = 'SELECT id, name, store_id, price FROM recipes';
    const params = [];
    if (storeId) {
      recipesSql += ' WHERE store_id = $1';
      params.push(storeId);
    }
    recipesSql += ' ORDER BY id ASC';
    
    const itemsSql = 'SELECT recipe_id, item_id, item_type, quantity FROM recipe_items';
    
    const [recipesResult, itemsResult] = await Promise.all([
      pool!.query(recipesSql, params),
      pool!.query(itemsSql),
    ]);

    const recipes = recipesResult.rows;
    const items = itemsResult.rows;

    return recipes.map(r => ({
      ...r,
      items: items
        .filter(item => item.recipe_id === r.id)
        .map(({ recipe_id, ...item }) => item),
    }));
  },

  async getById(id: number): Promise<Recipe | null> {
    const recipeSql = 'SELECT id, name, store_id, price FROM recipes WHERE id = $1';
    const itemsSql = 'SELECT item_id, item_type, quantity FROM recipe_items WHERE recipe_id = $1';

    const recipeResult = await pool!.query(recipeSql, [id]);
    if (recipeResult.rowCount === 0) return null;

    const itemsResult = await pool!.query(itemsSql, [id]);
    
    return {
      ...recipeResult.rows[0],
      items: itemsResult.rows,
    };
  },

  async create(data: { name: string; store_id: number | null; price: number; items: RecipeItemDef[] }): Promise<Recipe> {
    const client = await pool!.connect();
    try {
      await client.query('BEGIN');
      
      const recipeSql = 'INSERT INTO recipes (name, store_id, price) VALUES ($1, $2, $3) RETURNING id, name, store_id, price';
      const recipeResult = await client.query(recipeSql, [data.name, data.store_id, data.price]);
      const newRecipe = recipeResult.rows[0];

      if (data.items.length > 0) {
        const itemsSql = 'INSERT INTO recipe_items (recipe_id, item_id, item_type, quantity) VALUES ' +
          data.items.map((_, i) => `($${i*4+1}, $${i*4+2}, $${i*4+3}, $${i*4+4})`).join(', ');
        const itemValues = data.items.flatMap(item => [newRecipe.id, item.item_id, item.item_type, item.quantity]);
        await client.query(itemsSql, itemValues);
      }
      
      await client.query('COMMIT');
      return { ...newRecipe, items: data.items };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },

  async update(id: number, data: { name: string; store_id: number | null; price: number; items: RecipeItemDef[] }): Promise<Recipe | null> {
    const client = await pool!.connect();
    try {
      await client.query('BEGIN');

      const recipeSql = 'UPDATE recipes SET name = $1, store_id = $2, price = $3 WHERE id = $4 RETURNING id, name, store_id, price';
      const recipeResult = await client.query(recipeSql, [data.name, data.store_id, data.price, id]);
      if (recipeResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return null;
      }
      const updatedRecipe = recipeResult.rows[0];

      await client.query('DELETE FROM recipe_items WHERE recipe_id = $1', [id]);

      if (data.items.length > 0) {
        const itemsSql = 'INSERT INTO recipe_items (recipe_id, item_id, item_type, quantity) VALUES ' +
          data.items.map((_, i) => `($${i*4+1}, $${i*4+2}, $${i*4+3}, $${i*4+4})`).join(', ');
        const itemValues = data.items.flatMap(item => [id, item.item_id, item.item_type, item.quantity]);
        await client.query(itemsSql, itemValues);
      }

      await client.query('COMMIT');
      return { ...updatedRecipe, items: data.items };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },

  async remove(id: number): Promise<{id: number, name: string} | null> {
    const sql = 'DELETE FROM recipes WHERE id = $1 RETURNING id, name';
    const result = await pool!.query(sql, [id]);
    return result.rows[0] || null;
  }
};

// Export either the real DB repo or the mock DB repo based on environment
export const recipeRepository = useMock ? mockDb.recipes : pgRepo;