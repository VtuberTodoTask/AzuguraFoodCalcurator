// server/api/materials/[id].put.ts
import { materialRepository } from '~/server/repositories/materialRepository';

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'));
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ID' });
  }

  try {
    const body = await readBody(event);
    const { name, price } = body;

    if (!name || typeof price !== 'number') {
      throw createError({ statusCode: 400, statusMessage: 'Invalid input' });
    }

    const updatedMaterial = await materialRepository.update(id, { name, price });

    if (!updatedMaterial) {
      throw createError({ statusCode: 404, statusMessage: 'Material not found' });
    }

    return updatedMaterial;
    
  } catch (err: any) {
    console.error(`Error updating material ${id}:`, err);
    // Re-throw known H3 errors
    if (err.statusCode) {
      throw err;
    }
    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Failed to update material',
    });
  }
});
