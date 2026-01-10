// server/api/recipes/[id].delete.ts
import { recipeRepository } from '~/server/repositories/recipeRepository';

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'));
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ID' });
  }

  try {
    const removedRecipe = await recipeRepository.remove(id);

    if (!removedRecipe) {
      throw createError({ statusCode: 404, statusMessage: 'Recipe not found' });
    }

    event.node.res.statusCode = 204; // No Content
    return;

  } catch (err: any) {
    console.error(`Error deleting recipe ${id}:`, err);
    if (err.statusCode) throw err;
    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Failed to delete recipe',
    });
  }
});
