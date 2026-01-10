// server/api/materials/index.post.ts
import { materialRepository } from '~/server/repositories/materialRepository';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { name, price } = body;

    if (!name || typeof price !== 'number') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid input: name and price are required.',
      });
    }

    const newMaterial = await materialRepository.create({ name, price });
    
    event.node.res.statusCode = 201; // Created
    return newMaterial;

  } catch (err: any) {
    console.error('Error creating material:', err);
    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Failed to create material',
    });
  }
});
