'use client'
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";

export default function AddCategory() {
  const { getToken } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'ACTIVE',
    metaTitle: '',
    metaDescription: '',
    sortOrder: 0,
    parentCategoryId: null,
    slug: ''
  });

  const [imagePreview, setImagePreview] = useState(null);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'sortOrder' ? Number(value) : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = await getToken();
      const formDataToSend = new FormData();
      
      // Add all form data
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formDataToSend.append(key, value);
        }
      });

      // Add image file
      const imageInput = document.getElementById('image');
      if (imageInput.files[0]) {
        formDataToSend.append('image', imageInput.files[0]);
      }

      const { data } = await axios.post('/api/categories', formDataToSend, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('Category created successfully');
      router.push('/admin/categories');
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="text-slate-500 max-w-3xl">
      <h1 className="text-2xl">Add <span className="text-slate-800 font-medium">Category</span></h1>

      {loading ? (
        <div className="flex items-center justify-center h-60">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-slate-700"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full p-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="Category Name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Slug</label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                className="w-full p-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="Category Slug (auto-generated from name if empty)"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full p-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Parent Category</label>
              <select
                name="parentCategoryId"
                value={formData.parentCategoryId || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  parentCategoryId: e.target.value ? Number(e.target.value) : null
                }))}
                className="w-full p-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value="">No Parent Category</option>
                {categories
                  .filter(cat => cat.id !== formData.id) // Exclude self to prevent circular reference
                  .map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sort Order</label>
              <input
                type="number"
                name="sortOrder"
                value={formData.sortOrder}
                onChange={handleChange}
                min="0"
                className="w-full p-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="Sort Order"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Image</label>
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full p-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
              {imagePreview && (
                <div className="mt-2">
                  <p className="text-xs text-slate-500 mb-1">Preview:</p>
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-24 h-24 object-cover border border-slate-200 rounded-md"
                  />
                </div>
              )}
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Meta Title</label>
              <input
                type="text"
                name="metaTitle"
                value={formData.metaTitle}
                onChange={handleChange}
                className="w-full p-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="Meta Title"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Meta Description</label>
              <textarea
                name="metaDescription"
                value={formData.metaDescription}
                onChange={handleChange}
                rows="3"
                className="w-full p-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="Meta Description"
              ></textarea>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full p-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="Description"
            ></textarea>
          </div>
          
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submitting ? 'Creating...' : 'Create Category'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/categories')}
              className="px-6 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}