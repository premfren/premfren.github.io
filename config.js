// Supabase project for syncing trips between the two phones. Leave empty to run fully offline.
// The publishable key is meant to be public: the database only answers through the
// trip_get / trip_put functions, and only with the secret derived from the app password.
window.TRIP_CONFIG = {
  supabaseUrl: 'https://fuxhbadzxwssehsmfhus.supabase.co',
  supabaseAnonKey: 'sb_publishable_Al_mb6kPpZoeMJ-nK7BW7Q_IdwJ9HdB',  // Project Settings › API Keys › publishable key
  // App password check (PBKDF2, never the password itself). Empty = no password screen.
  // To change the password, regenerate both with:
  //   node -e 'const c=require("crypto"),s=c.randomBytes(16).toString("base64url");console.log(s,c.pbkdf2Sync(process.argv[1],s,300000,64,"sha256").subarray(0,32).toString("base64url"))' NEWPASSWORD
  passwordSalt: '_1r4D0OCN_yWiXgl4UxLHg',
  passwordCheck: 'Uco5fJYL2f0oPdWlRdMe3azcV7lfb6XfGblPAGiXPEY',
};
