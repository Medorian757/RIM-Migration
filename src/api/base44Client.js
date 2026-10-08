import { supabase } from './supabaseClient';

const tableMap = {
  InventoryItem: 'inventory_items',
  Category: 'categories',
  Recipe: 'recipes',
  ChangeHistory: 'change_history',
};

function createEntity(entityName) {
  const table = tableMap[entityName];

  return {
    async list(sort = '-created_at', limit) {
      const descending = String(sort).startsWith('-');
      const column = String(sort).replace(/^-/, '');

      let query = supabase
        .from(table)
        .select('*')
        .order(column, { ascending: !descending });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },

    async create(values) {
      const { data, error } = await supabase
        .from(table)
        .insert(values)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async update(id, values) {
      const { data, error } = await supabase
        .from(table)
        .update(values)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    },
  };
}

export const base44 = {
  entities: {
    InventoryItem: createEntity('InventoryItem'),
    Category: createEntity('Category'),
    Recipe: createEntity('Recipe'),
    ChangeHistory: createEntity('ChangeHistory'),
  },

  auth: {
    async me() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) throw error;
      return user;
    },
  },
};
