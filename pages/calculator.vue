<template>
  <div class="container">
    <h1>必要アイテム計算機</h1>

    <!-- Recipe Selection Card -->
    <div class="form-card">
      <h2>計算するレシピの追加</h2>
      <div class="selection-grid">
        <div class="form-group">
          <label for="recipe-select">レシピ</label>
          <select id="recipe-select" v-model.number="currentSelection.recipeId">
            <option :value="0" disabled>レシピを選択...</option>
            <option v-for="recipe in availableRecipes" :key="recipe.id" :value="recipe.id">
              {{ recipe.name }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label for="quantity">数量</label>
          <input type="number" id="quantity" v-model.number="currentSelection.quantity" min="1" />
        </div>
        
        <div class="form-actions">
          <button @click="addRecipeToSelection" class="add-btn" :disabled="!currentSelection.recipeId || currentSelection.quantity < 1">追加</button>
        </div>
      </div>
    </div>

    <!-- Selected Recipes & Results -->
    <div class="list-card">
      <div v-if="selectedRecipes.length === 0" class="empty-state">
        <p>計算するレシピを追加してください。</p>
      </div>
      <div v-else>
        <h2>計算対象</h2>
        <ul class="selected-recipes-list">
          <li v-for="(item, index) in selectedRecipes" :key="index">
            <div class="item-left">
              <strong>{{ getRecipeName(item.recipeId) }}</strong>
              <div class="meta">数量: {{ item.quantity }}</div>
            </div>
            <div class="item-right">
              <button @click="removeRecipeFromSelection(index)" class="remove-btn">×</button>
            </div>
          </li>
        </ul>
        <div class="calculate-actions">
          <button @click="calculateRequiredMaterials" class="calculate-btn" :disabled="isCalculating || selectedRecipes.length === 0">
            {{ isCalculating ? '計算中...' : '計算する' }}
          </button>
          <button @click="resetCalculation" class="reset-btn">リセット</button>
        </div>

        <div v-if="Object.keys(requiredMaterials).length > 0" class="results">
          <h3>計算結果：必要な原材料</h3>
          <ul class="results-list">
            <li v-for="material in requiredMaterials" :key="material.id">
              {{ material.name }} x {{ material.quantity }}
            </li>
          </ul>
          <div class="total-cost">
            <h4>原価合計: <span>¥{{ totalCost.toLocaleString() }}</span></h4>
          </div>
          <div class="results-actions">
            <button @click="copyResultsToClipboard" class="copy-btn">
              {{ isCopied ? 'コピーしました！' : '合計原価をコピー' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

// --- Types ---
type ItemType = 'MATERIAL' | 'RECIPE';
interface RecipeItem {
  item_id: number;
  item_type: ItemType;
  quantity: number;
}
interface Recipe {
  id: number;
  name: string;
  store_id: number | null;
  price?: number;
  items: RecipeItem[];
}
interface Material {
  id: number;
  name: string;
  price: number;
}
interface SelectedRecipe {
  recipeId: number;
  quantity: number;
}
interface RequiredMaterial {
  id: number;
  name: string;
  quantity: number;
}

// --- Global State ---
const selectedStore = useState<number | null>('selectedStore');

// --- Data Fetching ---
// Fetch all recipes and materials, as we need them for recursive calculations
const { data: allRecipes, pending: recipesPending } = useFetch<Recipe[]>('/api/recipes', { lazy: true, default: () => [] });
const { data: allMaterials, pending: materialsPending } = useFetch<Material[]>('/api/materials', { lazy: true, default: () => [] });

// --- Component State ---
const currentSelection = ref({ recipeId: 0, quantity: 1 });
const selectedRecipes = ref<SelectedRecipe[]>([]);
const requiredMaterials = ref<Record<number, RequiredMaterial>>({});
const isCalculating = ref(false);
const isCopied = ref(false);

// --- Computed ---
const availableRecipes = computed(() => {
  if (!allRecipes.value) return [];
  if (selectedStore.value === null) {
    return allRecipes.value;
  }
  return allRecipes.value.filter(r => r.store_id === selectedStore.value);
});

// Create maps for quick lookups
const recipeMap = computed(() => new Map(allRecipes.value.map(r => [r.id, r])));
const materialMap = computed(() => new Map(allMaterials.value.map(m => [m.id, m])));

const totalCost = computed(() => {
  let cost = 0;
  for (const materialId in requiredMaterials.value) {
    const material = requiredMaterials.value[materialId];
    const materialData = materialMap.value.get(material.id);
    if (materialData) {
      cost += material.quantity * materialData.price;
    }
  }
  return cost;
});

// No billing/pricing in calculator — only material totals are needed

// Compute material totals for a single recipe (recursive)
const computeRecipeMaterialTotals = (recipeId: number, quantity = 1) => {
  const totals = new Map<number, number>();

  const processRecipe = (id: number, qty: number) => {
    const recipe = recipeMap.value.get(id);
    if (!recipe) return;
    for (const item of recipe.items) {
      const reqQty = item.quantity * qty;
      if (item.item_type === 'MATERIAL') {
        totals.set(item.item_id, (totals.get(item.item_id) || 0) + reqQty);
      } else if (item.item_type === 'RECIPE') {
        processRecipe(item.item_id, reqQty);
      }
    }
  };

  processRecipe(recipeId, quantity);
  return totals;
};

const computeRecipeMaterialCost = (recipeId: number) => {
  const totals = computeRecipeMaterialTotals(recipeId, 1);
  let cost = 0;
  for (const [id, qty] of totals.entries()) {
    const mat = materialMap.value.get(id);
    if (mat) cost += mat.price * qty;
  }
  return cost;
};

// --- Watchers ---
// When store changes, reset the selections if the chosen recipes are no longer available
watch(selectedStore, () => {
  resetCalculation();
});


// --- Methods ---
const getRecipeName = (id: number) => recipeMap.value.get(id)?.name || '不明なレシピ';

const addRecipeToSelection = () => {
  if (!currentSelection.value.recipeId || currentSelection.value.quantity < 1) return;

  // Add or update selected recipe (only store recipeId and quantity)
  const existing = selectedRecipes.value.find(r => r.recipeId === currentSelection.value.recipeId);
  if (existing) {
    existing.quantity += currentSelection.value.quantity;
  } else {
    selectedRecipes.value.push({ recipeId: currentSelection.value.recipeId, quantity: currentSelection.value.quantity });
  }

  // Reset form
  currentSelection.value = { recipeId: 0, quantity: 1 };
  requiredMaterials.value = {}; // Reset results
};

const removeRecipeFromSelection = (index: number) => {
  selectedRecipes.value.splice(index, 1);
  requiredMaterials.value = {}; // Reset results
};

const calculateRequiredMaterials = () => {
  isCalculating.value = true;
  requiredMaterials.value = {};
  const totals = new Map<number, number>();

  // Recursive function to process a recipe
  const processRecipe = (recipeId: number, quantity: number) => {
    const recipe = recipeMap.value.get(recipeId);
    if (!recipe) return;

    for (const item of recipe.items) {
      const requiredQuantity = item.quantity * quantity;
      if (item.item_type === 'MATERIAL') {
        totals.set(item.item_id, (totals.get(item.item_id) || 0) + requiredQuantity);
      } else if (item.item_type === 'RECIPE') {
        processRecipe(item.item_id, requiredQuantity);
      }
    }
  };

  // Process all selected recipes
  for (const selection of selectedRecipes.value) {
    processRecipe(selection.recipeId, selection.quantity);
  }

  // Format the results
  const results: Record<number, RequiredMaterial> = {};
  for (const [id, quantity] of totals.entries()) {
    const material = materialMap.value.get(id);
    if (material) {
      results[id] = { id, name: material.name, quantity };
    }
  }
  
  requiredMaterials.value = results;
  isCalculating.value = false;
};

const resetCalculation = () => {
  selectedRecipes.value = [];
  requiredMaterials.value = {};
  currentSelection.value = { recipeId: 0, quantity: 1 };
};

const copyResultsToClipboard = () => {
  if (isCopied.value) return;

  const text = String(totalCost.value);

  navigator.clipboard.writeText(text).then(() => {
    isCopied.value = true;
    setTimeout(() => {
      isCopied.value = false;
    }, 2000); // Reset after 2 seconds
  }).catch(err => {
    console.error('Failed to copy text: ', err);
    alert('クリップボードへのコピーに失敗しました。');
  });
};

// billing copy removed — calculator only handles material totals
</script>

<style scoped>
.selection-grid {
  display: grid;
  grid-template-columns: 3fr 1fr 1fr;
  gap: 1rem;
  align-items: flex-end;
}
.add-btn {
  background-color: #2ecc71;
  width: 100%;
}
.empty-state {
  text-align: center;
  color: #7f8c8d;
  padding: 2rem;
}
.selected-recipes-list {
  list-style: none;
  padding: 0;
  margin-bottom: 1.5rem;
}
.selected-recipes-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: #f9f9f9;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}
.selected-recipes-list .item-left {
  display: flex;
  flex-direction: column;
}
.selected-recipes-list .item-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.subtotal { font-weight: 700; }
.remove-btn {
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  line-height: 1;
  padding: 0;
}
.calculate-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.calculate-actions button {
  padding: 12px 24px;
  font-size: 1.1em;
}
.calculate-btn {
  background-color: #3498db;
}
.reset-btn {
  background-color: #95a5a6;
}
.results {
  border-top: 2px solid #eee;
  padding-top: 1.5rem;
  margin-top: 1.5rem;
}
.results-list {
  list-style-type: '✔️ ';
  padding-left: 20px;
}
.results-list li {
  padding: 8px 0;
  font-size: 1.1em;
}
.total-cost {
  text-align: right;
  margin-top: 1.5rem;
  font-size: 1.2em;
}
.total-cost span {
  color: #e74c3c;
  font-weight: bold;
}
.results-actions {
  text-align: right;
  margin-top: 1rem;
}
.copy-btn {
  background-color: #f39c12;
  font-size: 0.9em;
}
</style>
