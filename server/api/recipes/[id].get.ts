// server/api/recipes/[id].get.ts
import { recipeRepository } from '~/server/repositories/recipeRepository';

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'));
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ID' });
  }

  try {
    const recipe = await recipeRepository.getById(id);
    if (!recipe) {
      throw createError({ statusCode: 404, statusMessage: 'Recipe not found' });
    }
    return recipe;
  } catch (err: any) {
    console.error(`Error fetching recipe ${id}:`, err);
    if (err.statusCode) throw err;
    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Failed to fetch recipe',
    });
  }
});
