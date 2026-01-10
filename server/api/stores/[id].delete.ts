// server/api/stores/[id].delete.ts
import { storeRepository } from '~/server/repositories/storeRepository';

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'));
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ID' });
  }

  try {
    const removedStore = await storeRepository.remove(id);

    if (!removedStore) {
      throw createError({ statusCode: 404, statusMessage: 'Store not found' });
    }

    return { success: true };
    
  } catch (err: any) {
    console.error(`Error deleting store ${id}:`, err);
    if (err.statusCode) throw err;
    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Failed to delete store',
    });
  }
});
