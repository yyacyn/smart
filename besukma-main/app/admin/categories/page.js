'use client'
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Edit3, Trash2, Plus } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import Link from "next/link";

export default function AdminCategories() {
  const { getToken } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get('/api/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(data.data);
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    }
    setLoading(false);
  };

  const deleteCategory = async (id) => {
    try {
      const confirm = window.confirm("Are you sure you want to delete this category?");
      if (!confirm) return;

      const token = await getToken();
      await axios.delete(`/api/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchCategories();
      toast.success("Category deleted successfully");
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="text-slate-500 mb-28">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl">Manage <span className="text-slate-800 font-medium">Categories</span></h1>
        <Link href="/admin/categories/add" className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-md hover:bg-slate-800 transition">
          <Plus size={18} />
          <span>Add Category</span>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-80">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-slate-700"></div>
        </div>
      ) : categories.length ? (
        <div className="mt-4">
          <div className="overflow-x-auto rounded-lg border border-slate-200 max-w-6xl">
            <table className="min-w-full bg-white text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="py-3 px-4 text-left font-semibold text-slate-600">Name</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-600">Slug</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-600">Status</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-600">Subcategories</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-600">Created At</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-800">{category.name}</td>
                    <td className="py-3 px-4 text-slate-800">{category.slug}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        category.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {category.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-800">{category.subcategories?.length || 0}</td>
                    <td className="py-3 px-4 text-slate-800">
                      {new Date(category.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </td>
                    <td className="py-3 px-4 flex gap-2">
                      <Link 
                        href={`/admin/categories/${category.id}/edit`} 
                        className="p-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition"
                      >
                        <Edit3 size={16} />
                      </Link>
                      <button 
                        onClick={() => toast.promise(deleteCategory(category.id), { loading: "Deleting category..." })}
                        className="p-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-80">
          <div className="text-center">
            <h1 className="text-3xl text-slate-400 font-medium">No categories available</h1>
            <p className="mt-2 text-slate-500">Add your first category to get started</p>
            <Link href="/admin/categories/add" className="inline-block mt-4 bg-slate-700 text-white px-4 py-2 rounded-md hover:bg-slate-800 transition">
              Add Category
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}