import { createClient } from '@/lib/supabase/server';
import { AdminCategoriesClient } from '@/components/admin/AdminCategoriesClient';

export default async function AdminCategoriesPage() {
  const supabase = createClient();

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  // Count prompts per category
  const { data: counts } = await supabase
    .from('prompts')
    .select('category_id');

  const countMap: Record<string, number> = {};
  counts?.forEach((p: any) => {
    if (p.category_id) countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manage Categories</h1>
        <p className="text-muted-foreground mt-1">{categories?.length || 0} categories</p>
      </div>
      <AdminCategoriesClient
        initialCategories={(categories || []).map(c => ({ ...c, prompt_count: countMap[c.id] || 0 }))}
      />
    </div>
  );
}
