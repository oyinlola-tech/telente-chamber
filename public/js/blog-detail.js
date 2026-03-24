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
                            <img src="/${blog.image}" alt="${blog.title}">
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
                                    <img src="/${blog.image}" alt="${blog.title}">
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
