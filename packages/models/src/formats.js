export function createFormatQueries(supabase) {
  return {
    async findByUserId(userId) {
      const { data, error } = await supabase
        .from('formats')
        .select('*')
        .eq('user_id', userId)
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
  }
}
