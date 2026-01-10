// server/utils/mock-db.ts

/**
 * This is a mock in-memory database for local development when a PostgreSQL
 * connection is not available.
 */

// --- Common ---
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Materials ---
interface Material {
  id: number;
  name: string;
  price: number;
}

const materials: Material[] = [
  { id: 1, name: '小麦粉 (Mock)', price: 550 },
  { id: 2, name: '砂糖 (Mock)', price: 330 },
  { id: 3, name: '卵 (Mock)', price: 275 },
];
let nextMaterialId = 4;

// --- Stores ---
interface Store {
  id: number;
  name: string;
}

const stores: Store[] = [
  { id: 1, name: '店舗A (Mock)' },
  { id: 2, name: '店舗B (Mock)' },
];
let nextStoreId = 3;

// --- Employees ---
interface Employee {
  id: number;
  name: string;
  store_id: number;
  is_manager: boolean;
}

const employees: Employee[] = [
  { id: 1, name: '店長A (Mock)', store_id: 1, is_manager: true },
  { id: 2, name: '店員B (Mock)', store_id: 1, is_manager: false },
  { id: 3, name: '店長C (Mock)', store_id: 2, is_manager: true },
  { id: 4, name: '店員D (Mock)', store_id: 2, is_manager: false },
];
let nextEmployeeId = 5;


// --- Recipes ---
type ItemType = 'MATERIAL' | 'RECIPE';

interface RecipeItem {
  id: number;
  recipe_id: number;
  item_id: number;
  item_type: ItemType;
  quantity: number;
}

interface Recipe {
  id: number;
  name: string;
  store_id: number | null;
  price: number;
  items: Omit<RecipeItem, 'id' | 'recipe_id'>[];
}

const recipes: {id: number, name: string, store_id: number | null, price: number}[] = [
    { id: 1, name: 'パンケーキ (Mock)', store_id: 1, price: 1200},
    { id: 2, name: 'クレープ (Mock)', store_id: 2, price: 900},
];
let nextRecipeId = 3;

const recipeItems: RecipeItem[] = [
    { id: 1, recipe_id: 1, item_id: 1, item_type: 'MATERIAL', quantity: 1 }, // Flour
    { id: 2, recipe_id: 1, item_id: 3, item_type: 'MATERIAL', quantity: 2 }, // Egg
    { id: 3, recipe_id: 2, item_id: 1, item_type: 'MATERIAL', quantity: 1 }, // Flour
    { id: 4, recipe_id: 2, item_id: 2, item_type: 'MATERIAL', quantity: 1 }, // Sugar
];
let nextRecipeItemId = 5;

// --- Sales History ---
interface SalesHistory {
  id: number;
  amount: number;
  customer?: string | null;
  employee_id?: number | null;
}

const salesHistory: SalesHistory[] = [];
let nextSalesId = 1;


// --- Mock DB Export ---
export const mockDb = {
  materials: {
    async getAll() {
      await sleep(50);
      return materials.sort((a, b) => a.id - b.id);
    },
    async create(data: { name: string; price: number }) {
      await sleep(50);
      const newMaterial = { id: nextMaterialId++, ...data };
      materials.push(newMaterial);
      return newMaterial;
    },
    async update(id: number, data: { name: string; price: number }) {
      await sleep(50);
      const index = materials.findIndex(m => m.id === id);
      if (index === -1) return null;
      materials[index] = { ...materials[index], ...data };
      return materials[index];
    },
    async remove(id: number) {
      await sleep(50);
      const index = materials.findIndex(m => m.id === id);
      if (index === -1) return null;
      const [removed] = materials.splice(index, 1);
      return removed;
    },
  },

  stores: {
    async getAll() {
      await sleep(50);
      return stores.sort((a, b) => a.id - b.id);
    },
    async create(data: { name: string }) {
      await sleep(50);
      const newStore = { id: nextStoreId++, ...data };
      stores.push(newStore);
      return newStore;
    },
    async update(id: number, data: { name: string }) {
      await sleep(50);
      const index = stores.findIndex(s => s.id === id);
      if (index === -1) return null;
      stores[index] = { ...stores[index], ...data };
      return stores[index];
    },
    async remove(id: number) {
      await sleep(50);
      const index = stores.findIndex(s => s.id === id);
      if (index === -1) return null;
      const [removed] = stores.splice(index, 1);
      return removed;
    },
  },

  employees: {
    async getAll(storeId?: number) {
      await sleep(50);
      let filteredEmployees = employees;
      if (storeId) {
        filteredEmployees = employees.filter(e => e.store_id === storeId);
      }
      return filteredEmployees.sort((a, b) => a.id - b.id);
    },
    async create(data: { name: string; store_id: number; is_manager: boolean; }) {
      await sleep(50);
      const newEmployee = { id: nextEmployeeId++, ...data };
      employees.push(newEmployee);
      return newEmployee;
    },
    async update(id: number, data: { name: string; store_id: number; is_manager: boolean; }) {
      await sleep(50);
      const index = employees.findIndex(e => e.id === id);
      if (index === -1) return null;
      employees[index] = { ...employees[index], ...data };
      return employees[index];
    },
    async remove(id: number) {
      await sleep(50);
      const index = employees.findIndex(e => e.id === id);
      if (index === -1) return null;
      const [removed] = employees.splice(index, 1);
      return removed;
    },
  },

  recipes: {
    async getAll(storeId?: number): Promise<Recipe[]> {
      await sleep(50);
      let filteredRecipes = recipes;
      if (storeId) {
        filteredRecipes = recipes.filter(r => r.store_id === storeId);
      }
      return filteredRecipes.map(r => ({
        ...r,
        items: recipeItems
          .filter(item => item.recipe_id === r.id)
          .map(({id, recipe_id, ...item}) => item),
      })).sort((a, b) => a.id - b.id);
    },
    async getById(id: number): Promise<Recipe | null> {
        await sleep(50);
        const recipe = recipes.find(r => r.id === id);
        if (!recipe) return null;
        
        return {
            ...recipe,
            items: recipeItems
                .filter(item => item.recipe_id === id)
                .map(({id, recipe_id, ...item}) => item),
        };
    },
    async create(data: { name: string; store_id: number | null; price?: number; items: Omit<RecipeItem, 'id' | 'recipe_id'>[] }): Promise<Recipe> {
      await sleep(50);
      const newRecipe = { id: nextRecipeId++, name: data.name, store_id: data.store_id, price: data.price || 0 };
      recipes.push(newRecipe);
      
      const newItems = data.items.map(item => {
          const newRecipeItem: RecipeItem = {
              id: nextRecipeItemId++,
              recipe_id: newRecipe.id,
              ...item
          };
          recipeItems.push(newRecipeItem);
          return item;
      });

      return { ...newRecipe, items: newItems };
    },
    async update(id: number, data: { name: string; store_id: number | null; price?: number; items: Omit<RecipeItem, 'id' | 'recipe_id'>[] }): Promise<Recipe | null> {
      await sleep(50);
      const recipeIndex = recipes.findIndex(r => r.id === id);
      if (recipeIndex === -1) return null;

      // Update name and store_id
      recipes[recipeIndex].name = data.name;
      recipes[recipeIndex].store_id = data.store_id;
      recipes[recipeIndex].price = data.price || 0;

      // Remove old items
      const remainingItems = recipeItems.filter(item => item.recipe_id !== id);
      
      // Add new items
      const newItems = data.items.map(item => ({
        id: nextRecipeItemId++,
        recipe_id: id,
        ...item
      }));

      recipeItems.splice(0, recipeItems.length, ...remainingItems, ...newItems);
      
      return this.getById(id);
    },
    async remove(id: number): Promise<{id: number, name: string, store_id: number | null} | null> {
        await sleep(50);
        const recipeIndex = recipes.findIndex(r => r.id === id);
        if (recipeIndex === -1) return null;

        const [removed] = recipes.splice(recipeIndex, 1);
        
        // Also remove associated items
        const remainingItems = recipeItems.filter(item => item.recipe_id !== id);
        recipeItems.splice(0, recipeItems.length, ...remainingItems);

        return removed;
    }
  }
  ,
  salesHistory: {
    async getAll(employeeId?: number) {
      await sleep(50);
      let rows = salesHistory.slice();
      if (employeeId) {
        rows = rows.filter(r => r.employee_id === employeeId);
      }
      return rows.sort((a, b) => a.id - b.id);
    },
    async create(data: { amount: number; customer?: string | null; employee_id?: number | null }) {
      await sleep(50);
      const newRow = { id: nextSalesId++, amount: data.amount, customer: data.customer || null, employee_id: data.employee_id || null };
      salesHistory.push(newRow);
      return newRow;
    }
  }
};
