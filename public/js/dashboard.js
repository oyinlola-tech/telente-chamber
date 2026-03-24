// Authentication and initialization
        let currentUser = null;
        let authToken = localStorage.getItem('admin_token');
        let editingBlogId = null;

        const resetBlogFormState = () => {
            editingBlogId = null;
            const submitBtn = document.getElementById('blog-submit');
            if (submitBtn) {
                submitBtn.textContent = 'Publish Post';
            }
        };
        
        // Check authentication
        async function checkAuth() {
            if (!authToken) {
                window.location.href = '/admin/login';
                return false;
            }
            
            try {
                const response = await fetch('/api/admin/check-auth', {
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                });
                
                if (!response.ok) {
                    throw new Error('Not authenticated');
                }
                
                const data = await response.json();
                currentUser = data.user;
                updateLastLogin();
                return true;
            } catch (error) {
                console.error('Auth check failed:', error);
                localStorage.removeItem('admin_token');
                window.location.href = '/admin/login';
                return false;
            }
        }
        
        // Update last login time
        function updateLastLogin() {
            const lastLoginEl = document.getElementById('last-login');
            const now = new Date();
            lastLoginEl.textContent = `Last login: ${now.toLocaleString()}`;
        }
        
        // Load dashboard stats
        async function loadDashboardStats() {
            try {
                const [contactsRes, testimonialsRes, blogsRes] = await Promise.all([
                    fetch('/api/contacts', {
                        headers: { 'Authorization': `Bearer ${authToken}` }
                    }),
                    fetch('/api/testimonials?approved=false', {
                        headers: { 'Authorization': `Bearer ${authToken}` }
                    }),
                    fetch('/api/blogs', {
                        headers: { 'Authorization': `Bearer ${authToken}` }
                    })
                ]);
                
                const contacts = await contactsRes.json();
                const testimonials = await testimonialsRes.json();
                const blogs = await blogsRes.json();
                
                // Update stats
                document.getElementById('total-contacts').textContent = contacts.length;
                document.getElementById('total-testimonials').textContent = testimonials.length;
                document.getElementById('total-blogs').textContent = blogs.length;
                
                const unreplied = contacts.filter(c => !c.replied).length;
                document.getElementById('unreplied-contacts').textContent = unreplied;
                
                // Update dashboard content
                const dashboardContent = document.getElementById('dashboard-content');
                const recentContacts = contacts.slice(0, 5);
                const pendingTestimonials = testimonials.filter(t => !t.approved).slice(0, 5);
                
                dashboardContent.innerHTML = `
                    <div class="form-row">
                        <div class="summary-card">
                            <h3 class="summary-title">Recent Contact Messages</h3>
                            ${recentContacts.length > 0 ? `
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Subject</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${recentContacts.map(contact => `
                                            <tr>
                                                <td>${contact.name}</td>
                                                <td>${contact.email}</td>
                                                <td>${contact.subject || 'No subject'}</td>
                                                <td>${new Date(contact.created_at).toLocaleDateString()}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            ` : '<p>No recent contact messages.</p>'}
                        </div>
                        
                        <div class="summary-card">
                            <h3 class="summary-title">Pending Testimonials</h3>
                            ${pendingTestimonials.length > 0 ? `
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Rating</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${pendingTestimonials.map(testimonial => `
                                            <tr>
                                                <td>${testimonial.name}</td>
                                                <td>${'★'.repeat(testimonial.rating)}${'☆'.repeat(5 - testimonial.rating)}</td>
                                                <td>${new Date(testimonial.created_at).toLocaleDateString()}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            ` : '<p>No pending testimonials.</p>'}
                        </div>
                    </div>
                `;
                
            } catch (error) {
                console.error('Error loading dashboard stats:', error);
            }
        }
        
        async function loadContacts() {
            try {
                const response = await fetch('/api/contacts', {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                const contacts = await response.json();
                
                const contactsContent = document.getElementById('contacts-content');
                
                if (contacts.length === 0) {
                    contactsContent.innerHTML = '<p>No contact messages found.</p>';
                    return;
                }
                
                contactsContent.innerHTML = `
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Subject</th>
                                <th>Message</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${contacts.map(contact => `
                                <tr>
                                    <td>${new Date(contact.created_at).toLocaleDateString()}</td>
                                    <td>${contact.name}</td>
                                    <td>${contact.email}</td>
                                    <td>${contact.phone || '-'}</td>
                                    <td>${contact.subject || 'No subject'}</td>
                                    <td class="truncate">${contact.message}</td>
                                    <td>
                                        ${contact.replied ? 
                                            '<span class="status-approved">Replied</span>' : 
                                            '<span class="status-pending">Pending</span>'
                                        }
                                    </td>
                                    <td class="actions">
                                        <button class="btn btn-small" onclick="deleteContact(${contact.id})">Delete</button>
                                        <button class="btn btn-small btn-replied" onclick="openEmailModal('contact', ${contact.id}, '${contact.email.replace(/'/g, "\\'")}')">
                                            ${contact.replied ? 'Email Again' : 'Reply'}
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            } catch (error) {
                console.error('Error loading contacts:', error);
                document.getElementById('contacts-content').innerHTML = 
                    '<p class="error">Failed to load contacts. Please try again.</p>';
            }
        }
        
        // Load testimonials
        async function loadTestimonials() {
            try {
                const response = await fetch('/api/testimonials?approved=false', {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                const testimonials = await response.json();
                
                const testimonialsContent = document.getElementById('testimonials-content');
                
                if (testimonials.length === 0) {
                    testimonialsContent.innerHTML = '<p>No testimonials found.</p>';
                    return;
                }
                
                testimonialsContent.innerHTML = `
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Rating</th>
                                <th>Message</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${testimonials.map(testimonial => `
                                <tr>
                                    <td>${new Date(testimonial.created_at).toLocaleDateString()}</td>
                                    <td>${testimonial.name}</td>
                                    <td>${testimonial.email || '-'}</td>
                                    <td>${'★'.repeat(testimonial.rating)}${'☆'.repeat(5 - testimonial.rating)}</td>
                                    <td class="truncate">${testimonial.message}</td>
                                    <td>
                                        ${testimonial.approved ? 
                                            '<span class="status-approved">Approved</span>' : 
                                            '<span class="status-pending">Pending</span>'
                                        }
                                    </td>
                                    <td class="actions">
                                        <button class="btn btn-small" onclick="viewTestimonial(${testimonial.id})">View</button>
                                        <button class="btn btn-small btn-approve" onclick="toggleApproval(${testimonial.id}, ${!testimonial.approved})">
                                            ${testimonial.approved ? 'Unapprove' : 'Approve'}
                                        </button>
                                        ${testimonial.email ? `
                                            <button class="btn btn-small btn-replied" onclick="openEmailModal('testimonial', ${testimonial.id}, '${testimonial.email.replace(/'/g, "\\'")}')">
                                                ${testimonial.replied ? 'Email Again' : 'Reply'}
                                            </button>
                                        ` : ''}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            } catch (error) {
                console.error('Error loading testimonials:', error);
                document.getElementById('testimonials-content').innerHTML = 
                    '<p class="error">Failed to load testimonials. Please try again.</p>';
            }
        }
        
        // Load blogs
        async function loadBlogs() {
            try {
                const response = await fetch('/api/blogs?status=all', {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                const blogs = await response.json();
                
                const blogsContent = document.getElementById('blogs-content');
                
                if (blogs.length === 0) {
                    blogsContent.innerHTML = '<p>No blog posts found.</p>';
                    return;
                }
                
                blogsContent.innerHTML = `
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Title</th>
                                <th>Status</th>
                                <th>Excerpt</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${blogs.map(blog => `
                                <tr>
                                    <td>${new Date(blog.created_at).toLocaleDateString()}</td>
                                    <td>${blog.title}</td>
                                    <td>
                                        <span class="${blog.status === 'published' ? 'status-published' : 'status-draft'}">
                                            ${blog.status.charAt(0).toUpperCase() + blog.status.slice(1)}
                                        </span>
                                    </td>
                                    <td class="truncate">${blog.excerpt || blog.content.substring(0, 100)}...</td>
                                    <td class="actions">
                                        <button class="btn btn-small" onclick="editBlog(${blog.id})">Edit</button>
                                        <button class="btn btn-small" onclick="deleteBlog(${blog.id})">Delete</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            } catch (error) {
                console.error('Error loading blogs:', error);
                document.getElementById('blogs-content').innerHTML = 
                    '<p class="error">Failed to load blog posts. Please try again.</p>';
            }
        }
        
        // Tab switching
        function setupTabs() {
            const tabBtns = document.querySelectorAll('.tab-btn');
            const navLinks = document.querySelectorAll('.nav-links a');
            
            tabBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const tabId = btn.getAttribute('data-tab');
                    
                    tabBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    navLinks.forEach(link => {
                        if (link.getAttribute('data-tab') === tabId) {
                            link.classList.add('active');
                        } else {
                            link.classList.remove('active');
                        }
                    });
                    
                    document.getElementById('page-title').textContent = 
                        btn.textContent + (tabId === 'dashboard' ? ' Overview' : '');
                    
                    document.querySelectorAll('.tab-content').forEach(content => {
                        content.classList.remove('active');
                    });
                    document.getElementById(`${tabId}-tab`).classList.add('active');
                    
                    switch(tabId) {
                        case 'contacts':
                            loadContacts();
                            break;
                        case 'testimonials':
                            loadTestimonials();
                            break;
                        case 'blogs':
                            loadBlogs();
                            break;
                        case 'dashboard':
                            loadDashboardStats();
                            break;
                    }
                });
            });
            
            navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const tabId = link.getAttribute('data-tab');
                    const tabBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
                    if (tabBtn) {
                        tabBtn.click();
                    }
                });
            });
        }
        
        // Blog form submission
        document.getElementById('blog-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = document.getElementById('blog-submit');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = editingBlogId ? 'Updating...' : 'Publishing...';
            submitBtn.disabled = true;
            
            const formData = new FormData();
            formData.append('title', document.getElementById('blog-title').value);
            formData.append('content', document.getElementById('blog-content').value);
            formData.append('excerpt', document.getElementById('blog-excerpt').value);
            formData.append('status', document.getElementById('blog-status').value);
            
            const imageFile = document.getElementById('blog-image').files[0];
            if (imageFile) {
                formData.append('image', imageFile);
            }
            
            try {
                const response = await fetch(editingBlogId ? `/api/blogs/${editingBlogId}` : '/api/blogs', {
                    method: editingBlogId ? 'PUT' : 'POST',
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: formData
                });
                
                const result = await response.json();
                
                const messageDiv = document.getElementById('blog-message');
                
                if (response.ok) {
                    messageDiv.textContent = editingBlogId ? 'Blog post updated successfully!' : 'Blog post published successfully!';
                    messageDiv.className = 'message success';
                    
                    // Reset form
                    document.getElementById('blog-form').reset();
                    document.getElementById('image-preview').innerHTML = '';
                    resetBlogFormState();
                    
                    // Load blogs tab
                    loadBlogs();
                } else {
                    messageDiv.textContent = result.error || 'Failed to publish blog post.';
                    messageDiv.className = 'message error';
                }
            } catch (error) {
                const messageDiv = document.getElementById('blog-message');
                messageDiv.textContent = 'Network error. Please try again.';
                messageDiv.className = 'message error';
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
        
        // File upload preview
        document.getElementById('file-upload').addEventListener('click', () => {
            document.getElementById('blog-image').click();
        });
        
        document.getElementById('blog-image').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const preview = document.getElementById('image-preview');
                    preview.innerHTML = `<img src="${e.target.result}" class="preview-image" alt="Preview">`;
                };
                reader.readAsDataURL(file);
            }
        });
        
        // Email modal
        window.openEmailModal = function(type, recordId, email) {
            document.getElementById('email-to').value = email;
            document.getElementById('email-type').value = type;
            document.getElementById('email-record-id').value = recordId;
            
            let subjectPrefix = '';
            if (type === 'contact') {
                subjectPrefix = 'Re: Your inquiry to Legal Spectrum';
            } else if (type === 'testimonial') {
                subjectPrefix = 'Re: Your testimonial for Legal Spectrum';
            }
            
            document.getElementById('email-subject').value = subjectPrefix;
            document.getElementById('email-modal').style.display = 'flex';
        };
        
        document.getElementById('close-email-modal').addEventListener('click', () => {
            document.getElementById('email-modal').style.display = 'none';
        });
        
        // Email form submission
        document.getElementById('email-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = document.getElementById('email-submit');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
            
            const formData = {
                to: document.getElementById('email-to').value,
                subject: document.getElementById('email-subject').value,
                message: document.getElementById('email-body').value,
                type: document.getElementById('email-type').value,
                recordId: document.getElementById('email-record-id').value
            };
            
            try {
                const response = await fetch('/api/send-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                
                const messageDiv = document.getElementById('email-status');
                
                if (response.ok) {
                    messageDiv.textContent = 'Email sent successfully!';
                    messageDiv.className = 'message success';
                    
                    // Close modal after 2 seconds
                    setTimeout(() => {
                        document.getElementById('email-modal').style.display = 'none';
                        document.getElementById('email-form').reset();
                        messageDiv.className = 'message';
                        
                        // Reload data
                        if (formData.type === 'contact') {
                            loadContacts();
                        } else if (formData.type === 'testimonial') {
                            loadTestimonials();
                        }
                    }, 2000);
                } else {
                    messageDiv.textContent = result.error || 'Failed to send email.';
                    messageDiv.className = 'message error';
                }
            } catch (error) {
                const messageDiv = document.getElementById('email-status');
                messageDiv.textContent = 'Network error. Please try again.';
                messageDiv.className = 'message error';
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
        
        // Logout
        document.getElementById('logout-btn').addEventListener('click', async () => {
            try {
                await fetch('/api/admin/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                });
            } catch (error) {
                // Ignore errors on logout
            }
            
            localStorage.removeItem('admin_token');
            window.location.href = '/admin/login';
        });
        
        // Helper functions
        window.deleteContact = async function(id) {
            if (confirm('Are you sure you want to delete this contact message?')) {
                try {
                    console.log('Attempting to delete contact:', id);
                    console.log('Auth token:', authToken ? 'Present' : 'Missing');
                    
                    const response = await fetch(`/api/contacts/${id}`, {
                        method: 'DELETE',
                        headers: { 
                            'Authorization': `Bearer ${authToken}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    console.log('Response status:', response.status);
                    
                    const result = await response.json();
                    console.log('Response result:', result);
                    
                    if (response.ok) {
                        alert('Contact message deleted successfully!');
                        loadContacts();
                        loadDashboardStats();
                    } else {
                        console.error('Delete error:', result);
                        alert(result.error || 'Failed to delete contact message.');
                    }
                } catch (error) {
                    console.error('Error deleting contact:', error);
                    alert('Error deleting contact message. Please check the console for details.');
                }
            }
        };
        
        window.viewTestimonial = function(id) {
            alert('View testimonial details for ID: ' + id);
        };
        
        window.toggleApproval = async function(id, approve) {
            try {
                const response = await fetch(`/api/testimonials/${id}/approve`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({ approved: approve })
                });
                
                if (response.ok) {
                    loadTestimonials();
                    loadDashboardStats();
                }
            } catch (error) {
                console.error('Error updating approval:', error);
            }
        };
        
        window.editBlog = async function(id) {
            try {
                const response = await fetch(`/api/blogs/${id}`, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });

                if (!response.ok) {
                    throw new Error('Failed to load blog post');
                }

                const blog = await response.json();

                const tabBtn = document.querySelector('.tab-btn[data-tab="new-blog"]');
                if (tabBtn) tabBtn.click();

                document.getElementById('blog-title').value = blog.title || '';
                document.getElementById('blog-status').value = blog.status || 'published';
                document.getElementById('blog-excerpt').value = blog.excerpt || '';
                document.getElementById('blog-content').value = blog.content || '';
                document.getElementById('image-preview').innerHTML = blog.image
                    ? `<img src="/${blog.image}" class="preview-image" alt="Current image">`
                    : '';

                editingBlogId = blog.id;
                const submitBtn = document.getElementById('blog-submit');
                submitBtn.textContent = 'Update Post';
            } catch (error) {
                console.error('Error loading blog post:', error);
                alert('Unable to load blog post for editing.');
            }
        };
        
        window.deleteBlog = async function(id) {
            if (confirm('Are you sure you want to delete this blog post?')) {
                try {
                    // Note: You'll need to add a DELETE endpoint in your backend
                     const response = await fetch(`/api/blogs/${id}`, {
                        method: 'DELETE',
                         headers: { 'Authorization': `Bearer ${authToken}` }
                     });
                     
                     if (response.ok) {
                         loadBlogs();
                     }
                    alert('Blog is deleted successfully!');
                } catch (error) {
                    console.error('Error deleting blog:', error);
                }
            }
        };
        
        // Initialize dashboard immediately (onReady already fired)
        (async () => {
            setupTabs();
            const isAuthenticated = await checkAuth();
            if (isAuthenticated) {
                loadDashboardStats();
                
                // Setup file upload
                const fileUpload = document.getElementById('file-upload');
                if (fileUpload) {
                    fileUpload.addEventListener('dragover', (e) => {
                        e.preventDefault();
                        fileUpload.classList.add('is-dragging');
                    });
                    
                    fileUpload.addEventListener('dragleave', () => {
                        fileUpload.classList.remove('is-dragging');
                    });
                    
                    fileUpload.addEventListener('drop', (e) => {
                        e.preventDefault();
                        fileUpload.classList.remove('is-dragging');
                        
                        const file = e.dataTransfer.files[0];
                        if (file && file.type.startsWith('image/')) {
                            const input = document.getElementById('blog-image');
                            // Use DataTransfer to set files on the input if supported
                            if (typeof DataTransfer !== 'undefined') {
                                const dt = new DataTransfer();
                                dt.items.add(file);
                                input.files = dt.files;
                            } else {
                                input.files = e.dataTransfer.files;
                            }
                            
                            const reader = new FileReader();
                            reader.onload = function(e) {
                                const preview = document.getElementById('image-preview');
                                preview.innerHTML = `<img src="${e.target.result}" class="preview-image" alt="Preview">`;
                            };
                            reader.readAsDataURL(file);
                        }
                    });
                }
            }
        })();
