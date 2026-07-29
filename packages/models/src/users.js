export function createUserQueries(supabase) {
  return {
    async findByEmail(email) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()
      if (error) return null
      return data
    },

    async findById(id) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()
      if (error) return null
      return data
    },
  }
}
