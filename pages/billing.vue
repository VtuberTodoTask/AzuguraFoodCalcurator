<template>
  <div class="container">
    <h1>レシピ合計請求金額</h1>

    <div class="form-card">
      <h2>レシピを追加</h2>
      <div class="selection-grid">
        <div class="form-group">
          <label for="recipe-select">レシピ</label>
          <select id="recipe-select" v-model.number="current.recipeId">
            <option :value="0" disabled>レシピを選択...</option>
            <option v-for="recipe in availableRecipes" :key="recipe.id" :value="recipe.id">{{ recipe.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label for="quantity">数量</label>
          <input id="quantity" type="number" v-model.number="current.quantity" min="1" />
        </div>
        <div class="form-actions">
          <button class="add-btn" @click="addRecipe" :disabled="!current.recipeId || current.quantity < 1">追加</button>
        </div>
      </div>
    </div>

    <div class="list-card">
      <h2>選択レシピ</h2>
      <div v-if="selected.length === 0" class="empty-state">レシピを追加してください。</div>
      <div v-else>
        <ul class="selected-list">
          <li v-for="(s, i) in selected" :key="s.recipeId">
            <div class="left">
              <strong>{{ recipeName(s.recipeId) }}</strong>
              <div class="meta">数量: {{ s.quantity }}</div>
            </div>
            <div class="right">
              <div class="subtotal">単価: ¥{{ unitPrice(s.recipeId).toLocaleString() }} / 小計: ¥{{ (unitPrice(s.recipeId) * s.quantity).toLocaleString() }}</div>
              <button class="remove-btn" @click="remove(i)">×</button>
            </div>
          </li>
        </ul>

        <div class="total">
          <h3>合計請求金額: ¥{{ totalBilling.toLocaleString() }}</h3>
        </div>

        <div class="save-history">
          <label for="customer">販売相手（任意）</label>
          <input id="customer" v-model="customer" placeholder="顧客名やメモを入力" />
          <button @click="saveHistory" :disabled="totalBilling === 0" class="save-btn">履歴を保存</button>
        </div>

        <div class="actions">
          <button @click="copyTotal" class="copy-btn">合計をコピー</button>
          <button @click="resetAll" class="reset-btn">リセット</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

type Recipe = { id: number; name: string; store_id: number | null; price?: number };
type Selected = { recipeId: number; quantity: number };

const selectedStore = useState<number | null>('selectedStore');

const { data: recipes, pending, refresh } = useFetch<Recipe[]>(() => {
  const storeId = selectedStore.value;
  return storeId ? `/api/recipes?store_id=${storeId}` : '/api/recipes';
}, { lazy: true });

watch(selectedStore, () => refresh());

const current = ref<Selected>({ recipeId: 0, quantity: 1 });
const selected = ref<Selected[]>([]);

const availableRecipes = computed(() => recipes.value || []);

const recipeMap = computed(() => new Map((recipes.value || []).map(r => [r.id, r])));

const recipeName = (id: number) => recipeMap.value.get(id)?.name || '不明なレシピ';

const unitPrice = (id: number) => {
  const r = recipeMap.value.get(id);
  return (r && r.price) ? r.price : 0;
};

const addRecipe = () => {
  if (!current.value.recipeId || current.value.quantity < 1) return;
  const exist = selected.value.find(s => s.recipeId === current.value.recipeId);
  if (exist) {
    exist.quantity += current.value.quantity;
  } else {
    selected.value.push({ ...current.value });
  }
  current.value = { recipeId: 0, quantity: 1 };
};

const remove = (index: number) => selected.value.splice(index, 1);

const totalBilling = computed(() => {
  return selected.value.reduce((sum, s) => {
    return sum + (unitPrice(s.recipeId) * (s.quantity || 0));
  }, 0);
});

const selectedEmployeeId = useState<number | null>('selectedEmployeeId');

const customer = ref('');

const copyTotal = async () => {
  try {
    await navigator.clipboard.writeText(String(totalBilling.value));
    alert('合計をコピーしました: ¥' + Number(totalBilling.value).toLocaleString());
  } catch (e) {
    console.error(e);
    alert('コピーに失敗しました。');
  }
};

const resetAll = () => {
  selected.value = [];
  current.value = { recipeId: 0, quantity: 1 };
};

const saveHistory = async () => {
  if (!selectedEmployeeId.value) {
    alert('履歴は店員を選択した状態で保存してください。');
    return;
  }
  if (totalBilling.value === 0) {
    alert('合計が0の履歴は保存できません。');
    return;
  }

  try {
    const payload = {
      amount: totalBilling.value,
      customer: customer.value || null,
      employee_id: selectedEmployeeId.value
    };
    const res = await $fetch('/api/sales', { method: 'POST', body: payload });
    alert('売上履歴を保存しました。ID: ' + (res && res.id));
    customer.value = '';
  } catch (err) {
    console.error(err);
    alert('履歴の保存に失敗しました。');
  }
};
</script>

<style scoped>
.selection-grid { display: grid; grid-template-columns: 3fr 1fr 1fr; gap: 1rem; align-items: end; }
.add-btn { background: #2ecc71; }
.selected-list { list-style: none; padding: 0; }
.selected-list li { display:flex; justify-content:space-between; align-items:center; padding:8px; background:#f9f9f9; border-radius:4px; margin-bottom:8px; }
.selected-list .left { display:flex; flex-direction:column; }
.selected-list .right { display:flex; align-items:center; gap:1rem; }
.remove-btn { background:#e74c3c; color:white; border:none; border-radius:50%; width:28px; height:28px; }
.total { text-align:right; margin-top:1rem; font-size:1.2rem; }
.copy-btn { background:#f39c12; }
.reset-btn { background:#95a5a6; }
.empty-state { color:#7f8c8d; padding:1rem; }
</style>
