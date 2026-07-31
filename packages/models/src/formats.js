export function createFormatQueries(supabase) {
  return {
    async findByUserId(userId) {
      const { data, error } = await supabase
        .from('formats')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) return []
      return data
    },

    async findByUserIdAndMode(userId, mode) {
      const { data, error } = await supabase
        .from('formats')
        .select('*')
        .eq('user_id', userId)
        .eq('mode', mode)
        .single()
      if (error) return null
      return data
    },

    async findById(id, userId) {
      const { data, error } = await supabase
        .from('formats')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single()
      if (error) return null
      return data
    },

    async create(format) {
      const { data, error } = await supabase
        .from('formats')
        .insert(format)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async update(id, userId, changes) {
      const { data, error } = await supabase
        .from('formats')
        .update(changes)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()
      if (error) return null
      return data
    },

    async remove(id, userId) {
      const { error } = await supabase
        .from('formats')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
      if (error) return false
      return true
    },
  }
}
