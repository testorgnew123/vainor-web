import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Upload, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminStore, adminApiCall } from '@/stores/adminStore';
import { useToast } from '@/hooks/use-toast';

interface BlogPostForm {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string;
  category_id: string | null;
  status: 'draft' | 'published';
  meta_title: string;
  meta_description: string;
  meta_keywords: string[];
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

const initialForm: BlogPostForm = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  featured_image: '',
  category_id: null,
  status: 'draft',
  meta_title: '',
  meta_description: '',
  meta_keywords: [],
};

export default function AdminBlogForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAdminStore();
  const { toast } = useToast();

  const isEditing = id && id !== 'new';
  const [form, setForm] = useState<BlogPostForm>(initialForm);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const categoriesData = await adminApiCall('blog/categories', { token: token! });
      setCategories(categoriesData.categories || []);

      if (isEditing) {
        const postsData = await adminApiCall('blog/posts', { token: token! });
        const post = postsData.posts.find((p: any) => p.id === id);
        if (post) {
          setForm({
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt || '',
            content: post.content || '',
            featured_image: post.featured_image || '',
            category_id: post.category_id || null,
            status: post.status,
            meta_title: post.meta_title || '',
            meta_description: post.meta_description || '',
            meta_keywords: post.meta_keywords || [],
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    setForm(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
      meta_title: prev.meta_title || title,
    }));
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !form.meta_keywords.includes(newKeyword.trim())) {
      setForm(prev => ({
        ...prev,
        meta_keywords: [...prev.meta_keywords, newKeyword.trim()],
      }));
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setForm(prev => ({
      ...prev,
      meta_keywords: prev.meta_keywords.filter(k => k !== keyword),
    }));
  };

  const handleSubmit = async (e: React.FormEvent, publish = false) => {
    e.preventDefault();

    if (!form.title || !form.slug) {
      toast({
        title: 'Please fill required fields',
        description: 'Title and slug are required',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      const data = {
        ...form,
        status: publish ? 'published' : form.status,
      };

      if (isEditing) {
        await adminApiCall(`blog/posts/${id}`, {
          method: 'PUT',
          token: token!,
          body: data,
        });
        toast({ title: 'Post updated successfully' });
      } else {
        await adminApiCall('blog/posts', {
          method: 'POST',
          token: token!,
          body: data,
        });
        toast({ title: publish ? 'Post published!' : 'Draft saved' });
      }
      navigate('/admin/blog');
    } catch (error: any) {
      toast({
        title: 'Failed to save post',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <Button
        variant="ghost"
        onClick={() => navigate('/admin/blog')}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Blog
      </Button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display">
          {isEditing ? 'Edit Post' : 'Create New Post'}
        </h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={(e) => handleSubmit(e, false)}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Draft'}
          </Button>
          <Button
            onClick={(e) => handleSubmit(e, true)}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Publish'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="content" className="space-y-6">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Post Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="How to Style Your Summer Wardrobe"
                  className="mt-1 text-lg"
                />
              </div>

              <div>
                <Label htmlFor="slug">URL Slug *</Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-muted-foreground">/blog/</span>
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="how-to-style-summer-wardrobe"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={form.excerpt}
                  onChange={(e) => setForm(prev => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="A brief summary that appears in blog listings..."
                  className="mt-1"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {form.excerpt.length}/160 characters recommended
                </p>
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={form.content}
                  onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your blog post content here... (Supports Markdown)"
                  className="mt-1 min-h-[400px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Supports Markdown formatting
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Featured Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="featured_image">Image URL</Label>
                <Input
                  id="featured_image"
                  value={form.featured_image}
                  onChange={(e) => setForm(prev => ({ ...prev, featured_image: e.target.value }))}
                  placeholder="https://images.unsplash.com/..."
                  className="mt-1"
                />
              </div>

              {form.featured_image && (
                <div className="relative group">
                  <img
                    src={form.featured_image}
                    alt="Featured"
                    className="w-full max-h-64 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, featured_image: '' }))}
                    className="absolute top-2 right-2 p-2 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Search Engine Optimization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input
                  id="meta_title"
                  value={form.meta_title}
                  onChange={(e) => setForm(prev => ({ ...prev, meta_title: e.target.value }))}
                  placeholder="SEO title (leave empty to use post title)"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {form.meta_title.length}/60 characters recommended
                </p>
              </div>

              <div>
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  value={form.meta_description}
                  onChange={(e) => setForm(prev => ({ ...prev, meta_description: e.target.value }))}
                  placeholder="Description that appears in search results..."
                  className="mt-1"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {form.meta_description.length}/160 characters recommended
                </p>
              </div>

              <div>
                <Label>Meta Keywords</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="Add keyword"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  />
                  <Button type="button" variant="outline" onClick={addKeyword}>
                    Add
                  </Button>
                </div>
                {form.meta_keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.meta_keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="flex items-center gap-1 px-3 py-1 bg-secondary rounded-full text-sm"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => removeKeyword(keyword)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* SEO Preview */}
              <div className="mt-6 p-4 bg-secondary rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">Search Preview</p>
                <p className="text-blue-600 text-lg hover:underline cursor-pointer">
                  {form.meta_title || form.title || 'Post Title'}
                </p>
                <p className="text-green-700 text-sm">
                  yoursite.com/blog/{form.slug || 'post-slug'}
                </p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {form.meta_description || form.excerpt || 'Post description will appear here...'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Post Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Category</Label>
                <Select
                  value={form.category_id || 'none'}
                  onValueChange={(value) => setForm(prev => ({
                    ...prev,
                    category_id: value === 'none' ? null : value,
                  }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Category</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between py-4 border-t">
                <div>
                  <p className="font-medium">Status</p>
                  <p className="text-sm text-muted-foreground">
                    {form.status === 'published' ? 'Post is live and visible' : 'Post is saved as draft'}
                  </p>
                </div>
                <Switch
                  checked={form.status === 'published'}
                  onCheckedChange={(checked) => setForm(prev => ({
                    ...prev,
                    status: checked ? 'published' : 'draft',
                  }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex gap-4 mt-6">
        <Button
          onClick={(e) => handleSubmit(e, form.status === 'published')}
          disabled={isSaving}
          size="lg"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            isEditing ? 'Update Post' : 'Save Post'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => navigate('/admin/blog')}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
