// Update year in footer
        document.addEventListener('DOMContentLoaded', function() {
            const currentYear = new Date().getFullYear();
            const copyrightElements = document.querySelectorAll('p');
            copyrightElements.forEach(el => {
                if (el.textContent.includes('Legal Spectrum')) {
                    el.innerHTML = el.innerHTML.replace(/\d{4}\s+Legal Spectrum/, `${currentYear} Legal Spectrum`);
                }
            });
        });

async function loadBlogDetail() {
            try {
                
                const pathSegments = window.location.pathname.split('/');
                const slug = pathSegments[pathSegments.length - 1];
                
                if (!slug || slug === 'blog-detail.html') {
                    document.getElementById('blog-content').innerHTML = 
                    '<p class="not-found">We could not find that insight. Try another article.</p>';
                    return;
                }
                
                
                const response = await fetch(`/api/blogs/${slug}`);
                
                if (!response.ok) {
                    if (response.status === 404) {
                        document.getElementById('blog-content').innerHTML = 
                            '<p class="not-found">Article not found.</p>';
                    } else {
                        throw new Error('Failed to load article');
                    }
                    return;
                }
                
                const blog = await response.json();
                
                
                document.title = `${blog.title} - Legal Spectrum`;

                const siteUrl = document.body.dataset.siteUrl || 'https://chamber.telente.site';
                const canonicalUrl = `${siteUrl.replace(/\/$/, '')}/blog/${blog.slug}`;
                const descriptionText = (blog.excerpt || blog.content || '')
                    .replace(/<[^>]+>/g, '')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .substring(0, 160);
                const imageUrl = blog.image
                    ? `${siteUrl.replace(/\/$/, '')}/${blog.image.replace(/^\/+/, '')}`
                    : `${siteUrl.replace(/\/$/, '')}/uploads/img/Legal-specturm-logo.png`;

                const setMeta = (selector, attr, value) => {
                    const el = document.querySelector(selector);
                    if (el) {
                        el.setAttribute(attr, value);
                    }
                };

                setMeta('meta[name=\"description\"]', 'content', descriptionText);
                setMeta('meta[property=\"og:title\"]', 'content', blog.title);
                setMeta('meta[property=\"og:description\"]', 'content', descriptionText);
                setMeta('meta[property=\"og:image\"]', 'content', imageUrl);
                setMeta('meta[property=\"og:url\"]', 'content', canonicalUrl);
                setMeta('meta[name=\"twitter:title\"]', 'content', blog.title);
                setMeta('meta[name=\"twitter:description\"]', 'content', descriptionText);
                setMeta('meta[name=\"twitter:image\"]', 'content', imageUrl);

                const canonicalLink = document.querySelector('link[rel=\"canonical\"]');
                if (canonicalLink) {
                    canonicalLink.setAttribute('href', canonicalUrl);
                }

                const publishedAt = blog.updated_at || blog.created_at;
                if (publishedAt) {
                    const isoDate = new Date(publishedAt).toISOString();
                    setMeta('meta[property=\"article:published_time\"]', 'content', isoDate);
                    setMeta('meta[property=\"article:modified_time\"]', 'content', isoDate);
                }

                const existingSchema = document.getElementById('blog-structured-data');
                if (existingSchema) {
                    existingSchema.remove();
                }
                const schema = document.createElement('script');
                schema.type = 'application/ld+json';
                schema.id = 'blog-structured-data';
                schema.textContent = JSON.stringify({
                    '@context': 'https://schema.org',
                    '@type': 'BlogPosting',
                    headline: blog.title,
                    description: descriptionText,
                    image: imageUrl,
                    datePublished: blog.created_at,
                    dateModified: blog.updated_at || blog.created_at,
                    author: {
                        '@type': 'Organization',
                        name: 'Legal Spectrum Chambers'
                    },
                    publisher: {
                        '@type': 'Organization',
                        name: 'Legal Spectrum Chambers',
                        logo: {
                            '@type': 'ImageObject',
                            url: `${siteUrl.replace(/\/$/, '')}/uploads/img/Legal-specturm-logo.png`
                        }
                    },
                    mainEntityOfPage: canonicalUrl
                });
                document.head.appendChild(schema);
                
                
                const blogContent = document.getElementById('blog-content');
                blogContent.innerHTML = `
                    <div class="blog-header">
                        <div class="blog-meta">
                            ${new Date(blog.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </div>
                        <h1 class="blog-title">${blog.title}</h1>
                    </div>
                    
                    ${blog.image ? `
                        <div class="featured-image">
                            <img src="/${blog.image}" alt="${blog.title}" loading="lazy" decoding="async">
                        </div>
                    ` : ''}
                    
                    <div class="blog-content">
                        ${blog.content.replace(/\n/g, '</p><p>')}
                    </div>
                `;
                
           
                loadRelatedArticles(blog.id);
                
            } catch (error) {
                console.error('Error loading blog:', error);
                document.getElementById('blog-content').innerHTML = 
                    '<p class="error">Unable to load this insight right now. Please try again later.</p>';
            }
        }
        
        async function loadRelatedArticles(currentBlogId) {
            try {
                const response = await fetch('/api/blogs?limit=3');
                const blogs = await response.json();
                
                
                const relatedBlogs = blogs.filter(blog => blog.id !== currentBlogId).slice(0, 2);
                
                if (relatedBlogs.length > 0) {
                    const relatedSection = document.getElementById('related-articles');
                    const relatedGrid = document.getElementById('related-grid');
                    
                    relatedGrid.innerHTML = relatedBlogs.map(blog => `
                        <div class="related-card">
                            ${blog.image ? `
                                <div class="related-image">
                                    <img src="/${blog.image}" alt="${blog.title}" loading="lazy" decoding="async">
                                </div>
                            ` : ''}
                            <div class="related-content">
                                <h3>${blog.title}</h3>
                                <p>${blog.excerpt || blog.content.substring(0, 120)}...</p>
                                <a href="/blog/${blog.slug}" class="related-link">Read Insight</a>
                            </div>
                        </div>
                    `).join('');
                    
                    relatedSection.style.display = 'block';
                }
            } catch (error) {
                console.error('Error loading related articles:', error);
            }
        }
        
        
        document.addEventListener('DOMContentLoaded', loadBlogDetail);
