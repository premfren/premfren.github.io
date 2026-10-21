// Supabase project for syncing trips between devices. Leave empty to run fully offline.
// The anon key is meant to be public: the database only answers through the
// trip_get / trip_put functions, and each trip needs its own secret link.
window.TRIP_CONFIG = {
  supabaseUrl: 'https://fuxhbadzxwssehsmfhus.supabase.co',      // e.g. 'https://abcdefgh.supabase.co'
  supabaseAnonKey: 'sb_publishable_Al_mb6kPpZoeMJ-nK7BW7Q_IdwJ9HdB',  // Project Settings › API Keys › publishable key (sb_publishable_…) or legacy anon key
};
