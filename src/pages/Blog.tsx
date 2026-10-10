import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, Eye, ArrowRight, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string;
  category_name?: string;
  view_count: number;
  published_at: string;
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  post_count: number;
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/.netlify/functions/get-blog-posts');
      const data = await response.json();
      setPosts(data.posts || []);
      
      // Extract unique categories
      const cats: BlogCategory[] = [];
      const catMap = new Map();
      data.posts?.forEach((post: BlogPost) => {
        if (post.category_name && !catMap.has(post.category_name)) {
          catMap.set(post.category_name, true);
          cats.push({
            id: post.category_name,
            name: post.category_name,
            slug: post.category_name.toLowerCase().replace(/\s+/g, '-'),
            post_count: data.posts.filter((p: BlogPost) => p.category_name === post.category_name).length,
          });
        }
      });
      setCategories(cats);
    } catch (error) {
      console.error('Failed to fetch blog posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || post.category_name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPost = filteredPosts[0];
  const regularPosts = filteredPosts.slice(1);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-secondary py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-display mb-4">The Nuuvelle Journal</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Style guides, fashion tips, and behind-the-scenes stories from Nuuvelle.
            </p>
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-background"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-6 border-b">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center gap-3 justify-center">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  !selectedCategory
                    ? 'bg-foreground text-background'
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === cat.name
                      ? 'bg-foreground text-background'
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  {cat.name} ({cat.post_count})
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Content */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">No articles found</p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-primary underline"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Featured Post */}
              {featuredPost && (
                <Link
                  to={`/blog/${featuredPost.slug}`}
                  className="block group mb-12"
                >
                  <Card className="overflow-hidden border-0 shadow-lg">
                    <div className="grid md:grid-cols-2">
                      <div className="aspect-[4/3] md:aspect-auto">
                        <img
                          src={featuredPost.featured_image || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800'}
                          alt={featuredPost.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <CardContent className="p-8 md:p-12 flex flex-col justify-center">
                        {featuredPost.category_name && (
                          <Badge variant="secondary" className="w-fit mb-4">
                            {featuredPost.category_name}
                          </Badge>
                        )}
                        <h2 className="text-2xl md:text-3xl font-display mb-4 group-hover:underline">
                          {featuredPost.title}
                        </h2>
                        <p className="text-muted-foreground mb-6 line-clamp-3">
                          {featuredPost.excerpt}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(featuredPost.published_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {featuredPost.view_count} views
                          </span>
                        </div>
                        <div className="mt-6 flex items-center text-sm font-medium group-hover:gap-3 gap-2 transition-all">
                          Read Article <ArrowRight className="h-4 w-4" />
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </Link>
              )}

              {/* Regular Posts Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {regularPosts.map((post) => (
                  <Link
                    key={post.id}
                    to={`/blog/${post.slug}`}
                    className="group"
                  >
                    <Card className="overflow-hidden h-full border-0 shadow hover:shadow-lg transition-shadow">
                      <div className="aspect-[16/10] overflow-hidden">
                        <img
                          src={post.featured_image || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600'}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <CardContent className="p-6">
                        {post.category_name && (
                          <Badge variant="secondary" className="mb-3">
                            {post.category_name}
                          </Badge>
                        )}
                        <h3 className="text-lg font-display mb-2 group-hover:underline line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(post.published_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {post.view_count}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="bg-secondary py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-display mb-4">Stay in Style</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Subscribe to our newsletter for the latest style tips, new arrivals, and exclusive offers.
          </p>
          <div className="flex gap-2 max-w-md mx-auto">
            <Input placeholder="Enter your email" className="bg-background" />
            <button className="px-6 py-2 bg-foreground text-background rounded-md font-medium hover:bg-foreground/90 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
