// server/api/materials/[id].delete.ts
import { materialRepository } from '~/server/repositories/materialRepository';

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'));
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ID' });
  }

  try {
    const removedMaterial = await materialRepository.remove(id);

    if (!removedMaterial) {
      throw createError({ statusCode: 404, statusMessage: 'Material not found' });
    }

    event.node.res.statusCode = 204; // No Content
    return;

  } catch (err: any) {
    console.error(`Error deleting material ${id}:`, err);
    if (err.statusCode) {
      throw err;
    }
    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Failed to delete material',
    });
  }
});
