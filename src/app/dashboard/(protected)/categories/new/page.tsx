import { BackLink } from "@/components/dashboard/page-header";
import { saveCategoryAction } from "@/app/dashboard/actions";
import { CategoryForm } from "@/app/dashboard/(protected)/categories/category-form";

export default function NewCategoryPage() {
  const action = saveCategoryAction.bind(null, null);

  return (
    <div>
      <BackLink href="/dashboard/categories" />
      <h2 className="mb-6 text-xl font-bold text-zinc-900 sm:text-2xl">Nueva categoría</h2>
      <CategoryForm action={action} submitLabel="Crear categoría" />
    </div>
  );
}
