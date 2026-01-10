// server/api/stores/[id].put.ts
import { storeRepository } from '~/server/repositories/storeRepository';

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'));
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ID' });
  }

  try {
    const body = await readBody(event);
    if (!body.name) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid input' });
    }

    const updatedStore = await storeRepository.update(id, body);

    if (!updatedStore) {
      throw createError({ statusCode: 404, statusMessage: 'Store not found' });
    }

    return updatedStore;
    
  } catch (err: any) {
    console.error(`Error updating store ${id}:`, err);
    if (err.statusCode) throw err;
    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Failed to update store',
    });
  }
});
