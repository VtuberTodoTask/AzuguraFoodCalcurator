<template>
  <div class="container">
    <h1>レシピ管理</h1>

    <!-- Form Card -->
    <div class="form-card">
      <h2>{{ isEditing ? 'レシピの編集' : '新しいレシピの作成' }}</h2>
      <form @submit.prevent="saveRecipe">
        <!-- Recipe Name -->
        <div class="form-group">
          <label for="name">レシピ名</label>
          <input type="text" id="name" v-model="editableRecipe.name" required :disabled="isSubmitting" />
        </div>

        <!-- Store Selector -->
        <div class="form-group">
          <label for="store">店舗</label>
          <select id="store" v-model="editableRecipe.store_id" :disabled="isSubmitting">
            <option :value="null">店舗なし</option>
            <option v-for="store in stores" :key="store.id" :value="store.id">{{ store.name }}</option>
          </select>
        </div>

        <!-- Price -->
        <div class="form-group">
          <label for="price">料金 (¥)</label>
          <input type="number" id="price" v-model.number="editableRecipe.price" min="0" :disabled="isSubmitting" />
        </div>

        <!-- Current Items -->
        <h3>材料リスト</h3>
        <div v-if="editableRecipe.items.length === 0" class="empty-items">まだ材料がありません。</div>
        <ul v-else class="item-list">
          <li v-for="(item, index) in editableRecipe.items" :key="index">
            <span>{{ getItemName(item) }} x {{ item.quantity }}</span>
            <button type="button" class="remove-item-btn" @click="removeRecipeItem(index)" :disabled="isSubmitting">×</button>
          </li>
        </ul>

        <!-- Add Item Form -->
        <fieldset class="add-item-group">
          <legend>材料の追加</legend>
          <div class="form-row">
            <div class="form-group">
              <label for="item-type">種類</label>
              <select id="item-type" v-model="newItem.item_type">
                <option value="MATERIAL">原材料</option>
                <option value="RECIPE">レシピ</option>
              </select>
            </div>
            <div class="form-group">
              <label for="item-id">材料</label>
              <select id="item-id" v-model.number="newItem.item_id">
                <option v-if="newItem.item_type === 'MATERIAL'" v-for="material in materials" :key="material.id" :value="material.id">{{ material.name }}</option>
                <option v-if="newItem.item_type === 'RECIPE'" v-for="recipe in availableRecipes" :key="recipe.id" :value="recipe.id">{{ recipe.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label for="item-quantity">数量</label>
              <input type="number" id="item-quantity" v-model.number="newItem.quantity" min="1" />
            </div>
          </div>
          <button type="button" @click="addRecipeItem" class="add-item-btn">＋ 材料を追加</button>
        </fieldset>

        <!-- Form Actions -->
        <div class="form-actions">
          <button type="submit" :disabled="isSubmitting">{{ isEditing ? '更新' : '作成' }}</button>
          <button v-if="isEditing" type="button" @click="cancelEdit" :disabled="isSubmitting">キャンセル</button>
        </div>
        <p v-if="isSubmitting" class="submitting-text">処理中...</p>
      </form>
    </div>

    <!-- List Card -->
    <div class="list-card">
      <h2>レシピ一覧</h2>
      <div v-if="recipesPending" class="loading">データを読み込んでいます...</div>
      <div v-else-if="recipesError" class="error">エラー: {{ recipesError.message }}</div>
      <table v-else>
        <thead>
          <tr>
            <th>ID</th>
            <th>名前</th>
            <th>店舗</th>
            <th>料金</th>
            <th>材料数</th>
            <th>詳細</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!recipes || recipes.length === 0"><td colspan="7">レシピはまだありません。</td></tr>
          <template v-for="recipe in recipes" :key="recipe.id">
            <tr>
              <td>{{ recipe.id }}</td>
              <td>{{ recipe.name }}</td>
              <td>{{ getStoreName(recipe.store_id) }}</td>
              <td>¥{{ (recipe.price || 0).toLocaleString() }}</td>
              <td>{{ recipe.items.length }}</td>
              <td>
                <button @click="toggleRecipeDetails(recipe.id)" class="details-btn">
                  {{ isExpanded(recipe.id) ? '隠す' : '表示' }}
                </button>
              </td>
              <td class="actions">
                <button @click="editRecipe(recipe)" :disabled="isSubmitting">編集</button>
                <button class="delete" @click="deleteRecipe(recipe.id)" :disabled="isSubmitting">削除</button>
              </td>
            </tr>
            <tr v-if="isExpanded(recipe.id)" class="details-row">
              <td colspan="6">
                <div class="details-content">
                  <h4>必要な材料</h4>
                  <ul>
                    <li v-for="(item, index) in recipe.items" :key="index">
                      {{ getItemName(item) }} x {{ item.quantity }}
                    </li>
                  </ul>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
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
interface Store {
  id: number;
  name: string;
}

// --- Global State ---
const selectedStore = useState<number | null>('selectedStore');

// --- Data Fetching ---
const { data: materials } = useFetch<Material[]>('/api/materials', { lazy: true });
const { data: stores } = useFetch<Store[]>('/api/stores', { lazy: true });

const { data: recipes, pending: recipesPending, error: recipesError, refresh: refreshRecipes } = useFetch<Recipe[]>(() => {
  const storeId = selectedStore.value;
  return storeId ? `/api/recipes?store_id=${storeId}` : '/api/recipes';
}, { lazy: true });

// Refetch recipes when selected store changes
watch(selectedStore, () => {
  refreshRecipes();
});


// --- Form State ---
const isSubmitting = ref(false);
const getInitialEditableRecipe = (): Omit<Recipe, 'id'> & { id: null | number } => ({ 
  id: null, 
  name: '', 
  store_id: selectedStore.value, 
  price: 0,
  items: [] 
});
const editableRecipe = ref(getInitialEditableRecipe());

const getInitialNewItem = (): RecipeItem => ({ item_id: 0, item_type: 'MATERIAL', quantity: 1 });
const newItem = ref(getInitialNewItem());

const isEditing = computed(() => editableRecipe.value.id !== null);

// --- Details Toggle State ---
const expandedRecipeIds = ref(new Set<number>());

// --- Computed ---
// Recipes available for selection as an ingredient (cannot be the recipe itself)
const availableRecipes = computed(() => {
  if (!recipes.value) return [];
  return recipes.value.filter(r => r.id !== editableRecipe.value.id);
});

// --- Watchers ---
// Reset item selection when type changes
watch(() => newItem.value.item_type, () => {
  newItem.value.item_id = 0;
});
// Sync form with selected store
watch(selectedStore, (newStoreId) => {
  if (!isEditing.value) {
    editableRecipe.value.store_id = newStoreId;
  }
});


// --- Methods ---
const getItemName = (item: RecipeItem): string => {
  const source = item.item_type === 'MATERIAL' ? materials.value : recipes.value;
  const found = source?.find(s => s.id === item.item_id);
  return found ? `${found.name} (${item.item_type === 'MATERIAL' ? '原材料' : 'レシピ'})` : '不明な材料';
};

const getStoreName = (storeId: number | null): string => {
  if (!storeId) return '店舗なし';
  const store = stores.value?.find(s => s.id === storeId);
  return store ? store.name : '不明な店舗';
}

const addRecipeItem = () => {
  if (!newItem.value.item_id || !newItem.value.quantity) {
    alert('材料と数量を選択してください。');
    return;
  }
  // Prevent adding the same item multiple times
  const exists = editableRecipe.value.items.some(i => i.item_id === newItem.value.item_id && i.item_type === newItem.value.item_type);
  if(exists) {
    alert('この材料は既に追加されています。');
    return;
  }

  editableRecipe.value.items.push({ ...newItem.value });
  newItem.value = getInitialNewItem();
};

const removeRecipeItem = (index: number) => {
  editableRecipe.value.items.splice(index, 1);
};

const cancelEdit = () => {
  editableRecipe.value = getInitialEditableRecipe();
};

const saveRecipe = async () => {
  if (!editableRecipe.value.name) {
    alert('レシピ名を入力してください。');
    return;
  }
  isSubmitting.value = true;
  const method = isEditing.value ? 'PUT' : 'POST';
  const url = isEditing.value ? `/api/recipes/${editableRecipe.value.id}` : '/api/recipes';

  try {
    await $fetch(url, {
      method,
      body: {
        name: editableRecipe.value.name,
        store_id: editableRecipe.value.store_id,
        price: editableRecipe.value.price || 0,
        items: editableRecipe.value.items.map(({ item_id, item_type, quantity }) => ({ item_id, item_type, quantity })),
      },
    });
    cancelEdit();
    await refreshRecipes();
  } catch (err) {
    console.error('Error saving recipe:', err);
    alert('レシピの保存に失敗しました。');
  } finally {
    isSubmitting.value = false;
  }
};

const editRecipe = (recipe: Recipe) => {
  // Deep copy to avoid reactive mutations on the main list
  editableRecipe.value = JSON.parse(JSON.stringify(recipe));
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const deleteRecipe = async (id: number) => {
  if (confirm(`ID:${id}のレシピを本当に削除しますか？`)) {
    isSubmitting.value = true;
    try {
      await $fetch(`/api/recipes/${id}`, { method: 'DELETE' });
      await refreshRecipes();
    } catch (err) {
      console.error('Error deleting recipe:', err);
      alert('レシピの削除に失敗しました。');
    } finally {
      isSubmitting.value = false;
    }
  }
};

const toggleRecipeDetails = (id: number) => {
  if (expandedRecipeIds.value.has(id)) {
    expandedRecipeIds.value.delete(id);
  } else {
    expandedRecipeIds.value.add(id);
  }
};

const isExpanded = (id: number) => {
  return expandedRecipeIds.value.has(id);
};
</script>

<style scoped>
/* Recipe specific styles */
.item-list { list-style: none; padding: 0; margin-top: 1rem; }
.item-list li { display: flex; justify-content: space-between; align-items: center; background: #f9f9f9; padding: 8px; border-radius: 4px; margin-bottom: 5px; }
.remove-item-btn { background: #e74c3c; color: white; border: none; border-radius: 50%; width: 22px; height: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; line-height: 1; padding: 0; }
.empty-items { color: #7f8c8d; font-style: italic; }

.add-item-group { border: 1px solid #ddd; padding: 1rem; border-radius: 5px; margin-top: 1.5rem; }
.add-item-group legend { font-weight: bold; padding: 0 10px; }
.form-row { display: grid; grid-template-columns: 1fr 2fr 1fr; gap: 1rem; align-items: flex-end; }
.add-item-btn { background: #2ecc71; margin-top: 1rem; }

/* Details view styles */
.details-btn {
  background-color: #3498db;
  padding: 5px 10px;
  font-size: 0.9em;
}
.details-row td {
  padding: 0;
  background-color: #f9f9f9;
}
.details-content {
  padding: 1rem;
  border-top: 1px solid #eee;
}
.details-content h4 {
  margin-top: 0;
  color: #2c3e50;
}
.details-content ul {
  padding-left: 20px;
  margin: 0;
}
</style>