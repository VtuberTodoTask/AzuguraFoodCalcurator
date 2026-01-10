// server/repositories/storeRepository.ts

import { query } from '~/server/utils/db';
import { mockDb } from '~/server/utils/mock-db';

interface Store {
  id: number;
  name: string;
}

// Use mock DB if in development and DATABASE_URL is not set.
const useMock = process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL;

console.log(`Data source: ${useMock ? 'In-Memory Mock DB' : 'PostgreSQL'}`);

export const storeRepository = {
  async getAll(): Promise<Store[]> {
    if (useMock) {
      return mockDb.stores.getAll();
    }
    const { rows } = await query('SELECT * FROM stores ORDER BY id ASC');
    return rows;
  },

  async create(data: { name: string }): Promise<Store> {
    if (useMock) {
      return mockDb.stores.create(data);
    }
    const sql = 'INSERT INTO stores (name) VALUES ($1) RETURNING *';
    const { rows } = await query(sql, [data.name]);
    return rows[0];
  },

  async getById(id: number): Promise<Store | null> {
    if (useMock) {
      const all = await mockDb.stores.getAll();
      return all.find(s => s.id === id) || null;
    }
    const sql = 'SELECT * FROM stores WHERE id = $1';
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  },
  
  async update(id: number, data: { name: string }): Promise<Store | null> {
    if (useMock) {
      return mockDb.stores.update(id, data);
    }
    const sql = 'UPDATE stores SET name = $1 WHERE id = $2 RETURNING *';
    const { rows } = await query(sql, [data.name, id]);
    return rows[0] || null;
  },

  async remove(id: number): Promise<Store | null> {
    if (useMock) {
      return mockDb.stores.remove(id);
    }
    const sql = 'DELETE FROM stores WHERE id = $1 RETURNING *';
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  }
};
