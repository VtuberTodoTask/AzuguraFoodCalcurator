// server/repositories/materialRepository.ts

import { query } from '~/server/utils/db';
import { mockDb } from '~/server/utils/mock-db';

interface Material {
  id: number;
  name: string;
  price: number;
}

// Use mock DB if in development and DATABASE_URL is not set.
const useMock = process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL;

console.log(`Data source: ${useMock ? 'In-Memory Mock DB' : 'PostgreSQL'}`);

export const materialRepository = {
  async getAll(): Promise<Material[]> {
    if (useMock) {
      return mockDb.materials.getAll();
    }
    const { rows } = await query('SELECT * FROM materials ORDER BY id ASC');
    return rows;
  },

  async create(data: { name: string; price: number }): Promise<Material> {
    if (useMock) {
      return mockDb.materials.create(data);
    }
    const sql = 'INSERT INTO materials (name, price) VALUES ($1, $2) RETURNING *';
    const { rows } = await query(sql, [data.name, data.price]);
    return rows[0];
  },

  async getById(id: number): Promise<Material | null> {
    // This function is not strictly needed by the APIs but is good practice.
    if (useMock) {
      const all = await mockDb.materials.getAll();
      return all.find(m => m.id === id) || null;
    }
    const sql = 'SELECT * FROM materials WHERE id = $1';
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  },
  
  async update(id: number, data: { name: string; price: number }): Promise<Material | null> {
    if (useMock) {
      return mockDb.materials.update(id, data);
    }
    const sql = 'UPDATE materials SET name = $1, price = $2 WHERE id = $3 RETURNING *';
    const { rows } = await query(sql, [data.name, data.price, id]);
    return rows[0] || null;
  },

  async remove(id: number): Promise<Material | null> {
    if (useMock) {
      return mockDb.materials.remove(id);
    }
    const sql = 'DELETE FROM materials WHERE id = $1 RETURNING *';
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  }
};