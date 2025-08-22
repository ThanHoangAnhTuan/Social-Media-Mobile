import Constants from 'expo-constants'

const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl || '';
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.supabaseAnonKey || '';

export { SUPABASE_ANON_KEY, SUPABASE_URL };
