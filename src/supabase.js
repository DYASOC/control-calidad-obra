import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://igimmjnbjsnkglbfqljj.supabase.co'
const SUPABASE_KEY = 'sb_publishable_gs2ZZCPwpohHFIgqTovQSw_wHfWG48u'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
