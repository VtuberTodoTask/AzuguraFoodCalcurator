// server/repositories/salesRepository.ts

import { query } from '~/server/utils/db';
import { mockDb } from '~/server/utils/mock-db';

interface SalesHistoryRow {
  id: number;
  amount: number;
  customer?: string | null;
  employee_id?: number | null;
}

type CreateSalesData = {
  amount: number;
  customer?: string | null;
  employee_id?: number | null;
}

const useMock = process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL;

console.log(`Data source (sales): ${useMock ? 'In-Memory Mock DB' : 'PostgreSQL'}`);

export const salesRepository = {
  async getAll(employeeId?: number): Promise<SalesHistoryRow[]> {
    if (useMock) {
      return mockDb.salesHistory.getAll(employeeId);
    }
    let sql = 'SELECT * FROM sales_history';
    const params: any[] = [];
    if (employeeId) {
      sql += ' WHERE employee_id = $1';
      params.push(employeeId);
    }
    sql += ' ORDER BY id ASC';
    const { rows } = await query(sql, params);
    return rows;
  },

  async create(data: CreateSalesData): Promise<SalesHistoryRow> {
    if (useMock) {
      return mockDb.salesHistory.create(data);
    }
    const sql = 'INSERT INTO sales_history (amount, customer, employee_id) VALUES ($1, $2, $3) RETURNING *';
    const { rows } = await query(sql, [data.amount, data.customer || null, data.employee_id || null]);
    return rows[0];
  }
};
