// Supabase project for syncing trips between devices. Leave empty to run fully offline.
// The anon key is meant to be public: the database only answers through the
// trip_get / trip_put functions, and each trip needs its own secret link.
window.TRIP_CONFIG = {
  supabaseUrl: '',      // e.g. 'https://abcdefgh.supabase.co'
  supabaseAnonKey: '',  // Project Settings › API › anon public key
};
