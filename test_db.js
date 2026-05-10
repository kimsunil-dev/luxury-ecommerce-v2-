require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
async function test() {
    const res = await supabase.from('site_settings').select('settings_data').eq('id', 1).single();
    console.log("TEST RESULT:", res);
}
test();
