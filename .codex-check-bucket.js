require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;
if (!url || !key) { console.log('MISSING_ENV'); process.exit(1); }
const supabase = createClient(url, key);
(async () => {
  try {
    const { data, error } = await supabase.storage.getBucket('Poseidon-files');
    if (error) throw error;
    console.log(JSON.stringify(data));
  } catch (e) {
    console.error('ERR');
    console.error(e.message || e);
    process.exitCode = 1;
  }
})();
