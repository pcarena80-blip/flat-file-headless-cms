const jwt = require('jsonwebtoken');
const GitHubAPI = require('./github-api');
const slugify = require('slugify');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Verify JWT token
function verifyToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    
    const token = authHeader.substring(7);
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}

// Get blog statistics
async function getBlogStats() {
    const githubAPI = new GitHubAPI();
    
    try {
        const result = await githubAPI.listFiles('blogs');
        
        if (!result.success) {
            return { total: 0, published: 0, draft: 0, views: 0 };
        }

        const mdFiles = result.files.filter(file => file.name.endsWith('.md'));
        let total = 0;
        let published = 0;
        let draft = 0;
        let views = 0;

        // Count blog statuses
        for (const file of mdFiles) {
            const blogResult = await githubAPI.getFile(`blogs/${file.name}`);
            if (blogResult.success) {
                const blog = parseBlogFromMarkdown(blogResult.content, file.name.replace('.md', ''));
                if (blog) {
                    total++;
                    if (blog.status === 'published') {
                        published++;
                    } else if (blog.status === 'draft') {
                        draft++;
                    }
                    // Mock views for demo (in real app, this would come from analytics)
                    views += Math.floor(Math.random() * 100) + 10;
                }
            }
        }

        return { total, published, draft, views };
    } catch (error) {
        console.error('Error getting blog stats:', error);
        return { total: 0, published: 0, draft: 0, views: 0 };
    }
}

// Get all blog posts with lazy loading support
async function getBlogs(page = 1, limit = 10) {
    const githubAPI = new GitHubAPI();
    
    try {
        const result = await githubAPI.listFiles('blogs');
        
        if (!result.success) {
            return { blogs: [], pagination: { page, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };
        }

        const mdFiles = result.files.filter(file => file.name.endsWith('.md'));
        const blogs = [];

        // Get blog content for each file
        for (const file of mdFiles) {
            const blogResult = await githubAPI.getFile(`blogs/${file.name}`);
            if (blogResult.success) {
                const blog = parseBlogFromMarkdown(blogResult.content, file.name.replace('.md', ''));
                if (blog) {
                    blogs.push(blog);
                }
            }
        }

        // Sort by published date (newest first)
        blogs.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedBlogs = blogs.slice(startIndex, endIndex);

        return {
            blogs: paginatedBlogs,
            pagination: {
                page,
                limit,
                total: blogs.length,
                totalPages: Math.ceil(blogs.length / limit),
                hasNext: endIndex < blogs.length,
                hasPrev: page > 1
            }
        };
    } catch (error) {
        console.error('Error reading blogs:', error);
        return { blogs: [], pagination: { page, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };
    }
}

// Get single blog post
async function getBlog(slug) {
    const githubAPI = new GitHubAPI();
    
    try {
        const result = await githubAPI.getFile(`blogs/${slug}.md`);
        if (!result.success) {
            return null;
        }
        
        return parseBlogFromMarkdown(result.content, slug);
    } catch (error) {
        return null;
    }
}

// Create or update blog post
async function saveBlog(blogData, user) {
    const githubAPI = new GitHubAPI();
    
    const slug = blogData.slug || slugify(blogData.title, { lower: true, strict: true });
    const filePath = `blogs/${slug}.md`;

    const frontMatter = {
        title: blogData.title,
        excerpt: blogData.excerpt,
        author: user.email,
        publishedAt: blogData.publishedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: blogData.tags || [],
        featured: blogData.featured || false,
        status: blogData.status || 'published',
        slug: slug
    };

    const content = createBlogMarkdown(blogData.content, frontMatter);
    
    const result = await githubAPI.createOrUpdateFile(
        filePath,
        content,
        blogData.slug ? `Update blog: ${blogData.title}` : `Add new blog: ${blogData.title}`
    );

    if (!result.success) {
        throw new Error('Failed to save blog to GitHub');
    }

    return { slug, success: true };
}

// Delete blog post
async function deleteBlog(slug, user) {
    const githubAPI = new GitHubAPI();
    
    const result = await githubAPI.deleteFile(
        `blogs/${slug}.md`,
        `Delete blog: ${slug}`
    );

    return { success: result.success };
}

// Parse blog from markdown
function parseBlogFromMarkdown(content, slug) {
    try {
        const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (!frontMatterMatch) return null;

        const frontMatter = frontMatterMatch[1];
        const blogData = {};

        frontMatter.split('\n').forEach(line => {
            const [key, value] = line.split(': ');
            if (key && value) {
                let cleanValue = value.replace(/"/g, '');
                
                // Handle arrays (tags)
                if (key.trim() === 'tags' && cleanValue.startsWith('[') && cleanValue.endsWith(']')) {
                    cleanValue = JSON.parse(cleanValue);
                }
                
                // Handle booleans
                if (cleanValue === 'true') cleanValue = true;
                if (cleanValue === 'false') cleanValue = false;
                
                blogData[key.trim()] = cleanValue;
            }
        });

        // Get content after front matter
        const bodyMatch = content.match(/---\n[\s\S]*?\n---\n([\s\S]*)/);
        const body = bodyMatch ? bodyMatch[1].trim() : '';

        return {
            id: slug,
            slug: slug,
            title: blogData.title || 'Untitled',
            excerpt: blogData.excerpt || body.substring(0, 150) + '...',
            content: body,
            author: blogData.author || 'Unknown',
            publishedAt: blogData.publishedAt || new Date().toISOString(),
            updatedAt: blogData.updatedAt || new Date().toISOString(),
            tags: blogData.tags || [],
            featured: blogData.featured || false,
            status: blogData.status || 'published'
        };
    } catch (error) {
        console.error('Error parsing blog markdown:', error);
        return null;
    }
}

// Create blog markdown content
function createBlogMarkdown(content, frontMatter) {
    const tagsString = Array.isArray(frontMatter.tags) ? JSON.stringify(frontMatter.tags) : '[]';
    
    const frontMatterContent = `---
title: "${frontMatter.title}"
excerpt: "${frontMatter.excerpt}"
author: "${frontMatter.author}"
publishedAt: "${frontMatter.publishedAt}"
updatedAt: "${frontMatter.updatedAt}"
tags: ${tagsString}
featured: ${frontMatter.featured}
status: "${frontMatter.status}"
slug: "${frontMatter.slug}"
---

# ${frontMatter.title}

${content}

---

*This blog post was created using the flat-file headless CMS system. All content is stored directly on GitHub as markdown files.*`;

    return frontMatterContent;
}

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        const { page, limit } = event.queryStringParameters || {};
        const parsedPage = parseInt(page) || 1;
        const parsedLimit = parseInt(limit) || 10;

        // GET - List blogs, get single blog, or get stats
        if (event.httpMethod === 'GET') {
            const pathSegments = event.path.split('/');
            const slug = pathSegments[pathSegments.length - 1];
            
            // Check if requesting stats
            if (event.queryStringParameters && event.queryStringParameters.action === 'stats') {
                const stats = await getBlogStats();
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ success: true, stats })
                };
            }
            
            if (slug && slug !== 'blogs') {
                // Get single blog
                const blog = await getBlog(slug);
                if (!blog) {
                    return {
                        statusCode: 404,
                        headers,
                        body: JSON.stringify({ error: 'Blog not found' })
                    };
                }
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify(blog)
                };
            } else {
                // List blogs with pagination
                const result = await getBlogs(parsedPage, parsedLimit);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify(result)
                };
            }
        }

        // POST, PUT, DELETE - Require authentication
        const user = verifyToken(event.headers.authorization);
        if (!user) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Unauthorized' })
            };
        }

        // POST - Create new blog
        if (event.httpMethod === 'POST') {
            const blogData = JSON.parse(event.body || '{}');
            const result = await saveBlog(blogData, user);
            return {
                statusCode: 201,
                headers,
                body: JSON.stringify(result)
            };
        }

        // PUT - Update blog
        if (event.httpMethod === 'PUT') {
            const pathSegments = event.path.split('/');
            const slug = pathSegments[pathSegments.length - 1];
            const blogData = JSON.parse(event.body || '{}');
            blogData.slug = slug;
            
            const result = await saveBlog(blogData, user);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(result)
            };
        }

        // DELETE - Delete blog
        if (event.httpMethod === 'DELETE') {
            const pathSegments = event.path.split('/');
            const slug = pathSegments[pathSegments.length - 1];
            
            const result = await deleteBlog(slug, user);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(result)
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };

    } catch (error) {
        console.error('Blogs API error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
}; 
