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

        let currentPage = 1;
        const blogsPerPage = 6;
        let allBlogs = [];

        async function loadAllBlogs() {
            try {
                const response = await fetch('/api/blogs');
                allBlogs = await response.json();
                displayBlogs();
                setupPagination();
            } catch (error) {
                console.error('Error loading blogs:', error);
                document.getElementById('blogs-grid').innerHTML = 
                    '<p class="error">Unable to load insights right now. Please try again shortly.</p>';
            }
        }

        function displayBlogs() {
            const start = (currentPage - 1) * blogsPerPage;
            const end = start + blogsPerPage;
            const paginatedBlogs = allBlogs.slice(start, end);
            const container = document.getElementById('blogs-grid');

            if (paginatedBlogs.length === 0) {
                container.innerHTML = '<p class="no-blogs">No insights yet. Check back soon for new guidance.</p>';
                return;
            }

            container.innerHTML = paginatedBlogs.map(blog => `
                <div class="blog-card">
                    ${blog.image ? `
                        <div class="blog-image">
                            <img src="/${blog.image}" alt="${blog.title}" loading="lazy" decoding="async">
                        </div>
                    ` : ''}
                    <div class="blog-content">
                        <div class="blog-meta">
                            ${new Date(blog.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </div>
                        <h3>${blog.title}</h3>
                        <p>${blog.excerpt || blog.content.substring(0, 150)}...</p>
                        <a href="/blog/${blog.slug}" class="read-more">Read Insight</a>
                    </div>
                </div>
            `).join('');
        }

        function setupPagination() {
            const totalPages = Math.ceil(allBlogs.length / blogsPerPage);
            const paginationDiv = document.getElementById('pagination');
            
            if (totalPages <= 1) {
                paginationDiv.style.display = 'none';
                return;
            }
            
            paginationDiv.style.display = 'block';
            document.getElementById('current-page').textContent = currentPage;
            document.getElementById('prev-btn').disabled = currentPage === 1;
            document.getElementById('next-btn').disabled = currentPage === totalPages;
        }

        document.getElementById('prev-btn').addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                displayBlogs();
                setupPagination();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });

        document.getElementById('next-btn').addEventListener('click', () => {
            const totalPages = Math.ceil(allBlogs.length / blogsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                displayBlogs();
                setupPagination();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });

        // Load blogs on page load
        document.addEventListener('DOMContentLoaded', loadAllBlogs);
