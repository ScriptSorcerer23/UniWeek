import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// INSTRUCTIONS: Create a Supabase project at https://supabase.com
// Then create a file: src/services/supabase-config.ts with:
/*
export const SUPABASE_URL = 'your-project-url';
export const SUPABASE_ANON_KEY = 'your-anon-key';
*/

let SUPABASE_URL = '';
let SUPABASE_ANON_KEY = '';

try {
  const config = require('./supabase-config');
  SUPABASE_URL = config.SUPABASE_URL;
  SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY;
} catch (error) {
  console.warn('Supabase config not found. Please create src/services/supabase-config.ts');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
