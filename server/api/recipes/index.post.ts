// server/api/recipes/index.post.ts
import { recipeRepository } from '~/server/repositories/recipeRepository';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    // Basic validation
    if (!body.name || !Array.isArray(body.items)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid input' });
    }

    const newRecipe = await recipeRepository.create(body);
    
    event.node.res.statusCode = 201; // Created
    return newRecipe;

  } catch (err: any) {
    console.error('Error creating recipe:', err);
    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Failed to create recipe',
    });
  }
});
