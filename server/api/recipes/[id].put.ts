// server/api/recipes/[id].put.ts
import { recipeRepository } from '~/server/repositories/recipeRepository';

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'));
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ID' });
  }

  try {
    const body = await readBody(event);
    if (!body.name || !Array.isArray(body.items)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid input' });
    }

    const updatedRecipe = await recipeRepository.update(id, body);

    if (!updatedRecipe) {
      throw createError({ statusCode: 404, statusMessage: 'Recipe not found' });
    }

    return updatedRecipe;
    
  } catch (err: any) {
    console.error(`Error updating recipe ${id}:`, err);
    if (err.statusCode) throw err;
    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Failed to update recipe',
    });
  }
});
