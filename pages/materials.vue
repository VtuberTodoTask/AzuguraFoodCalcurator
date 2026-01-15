<template>
  <div class="container">
    <h1>原材料管理</h1>

    <div class="form-card">
      <h2>{{ isEditing ? '原材料の編集' : '新しい原材料の追加' }}</h2>
      <form @submit.prevent="addOrUpdateMaterial">
        <div class="form-group">
          <label for="name">名前</label>
          <input type="text" id="name" v-model="editableMaterial.name" required :disabled="isSubmitting" />
        </div>
        <div class="form-group">
          <label for="price">価格</label>
          <input type="number" id="price" v-model.number="editableMaterial.price" required :disabled="isSubmitting" />
        </div>
        <div class="form-actions">
          <button type="submit" :disabled="isSubmitting">{{ isEditing ? '更新' : '追加' }}</button>
          <button v-if="isEditing" type="button" @click="cancelEdit" :disabled="isSubmitting">キャンセル</button>
        </div>
        <p v-if="isSubmitting" class="submitting-text">処理中...</p>
      </form>
    </div>

    <div class="list-card">
      <h2>原材料リスト</h2>
      <div v-if="pending" class="loading">データを読み込んでいます...</div>
      <div v-else-if="error" class="error">エラー: {{ error.message }}</div>
      <div class="table-wrapper" v-else>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>名前</th>
              <th>価格</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!materials || materials.length === 0">
              <td colspan="4">原材料はまだありません。</td>
            </tr>
            <tr v-for="material in materials" :key="material.id">
              <td>{{ material.id }}</td>
              <td>{{ material.name }}</td>
              <td>¥{{ material.price.toLocaleString() }}</td>
              <td class="actions">
                <button class="edit-btn" @click="editMaterial(material)" :disabled="isSubmitting">編集</button>
                <button class="delete" @click="handleDeleteMaterial(material.id)" :disabled="isSubmitting">削除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

// --- データ型定義 ---
interface Material {
  id: number;
  name: string;
  price: number;
}

// --- APIデータ取得 ---
const { data: materials, pending, error, refresh } = useFetch<Material[]>('/api/materials', {
  lazy: true, // 初期表示を高速化
});

// --- フォーム関連のリアクティブな状態 ---
const editableMaterial = ref<{ id: number | null; name: string; price: number | null }>({
  id: null,
  name: '',
  price: null,
});

const isSubmitting = ref(false); // APIリクエスト中の二重送信防止フラグ

const isEditing = computed(() => editableMaterial.value.id !== null);

// --- CRUD操作 ---
const addOrUpdateMaterial = async () => {
  if (!editableMaterial.value.name || editableMaterial.value.price === null || editableMaterial.value.price < 0) {
    alert('名前と価格を正しく入力してください。');
    return;
  }

  isSubmitting.value = true;
  const method = isEditing.value ? 'PUT' : 'POST';
  const url = isEditing.value ? `/api/materials/${editableMaterial.value.id}` : '/api/materials';

  try {
    await $fetch(url, {
      method,
      body: {
        name: editableMaterial.value.name,
        price: editableMaterial.value.price,
      },
    });
    cancelEdit();
    await refresh(); // データを再取得してリストを更新
  } catch (err) {
    console.error('Error saving material:', err);
    alert('データの保存に失敗しました。');
  } finally {
    isSubmitting.value = false;
  }
};

const editMaterial = (material: Material) => {
  editableMaterial.value = { ...material };
};

const handleDeleteMaterial = async (id: number) => {
  if (confirm(`ID:${id}の原材料を本当に削除しますか？`)) {
    isSubmitting.value = true;
    try {
      await $fetch(`/api/materials/${id}`, { method: 'DELETE' });
      await refresh(); // データを再取得してリストを更新
    } catch (err) {
      console.error('Error deleting material:', err);
      alert('データの削除に失敗しました。');
    } finally {
      isSubmitting.value = false;
    }
  }
};

const cancelEdit = () => {
  editableMaterial.value = { id: null, name: '', price: null };
};
</script>

<style scoped>
/* Component-specific styles can be added here in the future */
</style>
