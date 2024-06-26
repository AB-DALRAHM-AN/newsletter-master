import { createBrowserClient } from "@supabase/ssr";

export function createClientBroswer() {
	return createBrowserClient(
		process.env.SUPABASE_URL!,
		process.env.SUPABASE_ANON_KEY!
	);
}
