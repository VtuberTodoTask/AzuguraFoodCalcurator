// server/api/recipes/index.get.ts
import { recipeRepository } from '~/server/repositories/recipeRepository';
import { getQuery } from 'h3';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const storeId = query.store_id ? Number(query.store_id) : undefined;
    const recipes = await recipeRepository.getAll(storeId);
    return recipes;
  } catch (err: any) {
    console.error('Error fetching recipes:', err);
    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Failed to fetch recipes',
    });
  }
});