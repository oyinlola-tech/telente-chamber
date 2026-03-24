document.addEventListener('DOMContentLoaded', async () => {
            const token = new URLSearchParams(window.location.search).get('token');
            const messageEl = document.getElementById('message');

            if (!token) {
                messageEl.textContent = 'Invalid unsubscribe link. Token is missing.';
                messageEl.classList.add('error');
                return;
            }

            try {
                const response = await fetch(`/api/unsubscribe?token=${token}`);
                const result = await response.json();

                messageEl.textContent = result.message || result.error;
                messageEl.classList.add(response.ok ? 'success' : 'error');
            } catch (error) {
                messageEl.textContent = 'An error occurred. Please try again later.';
                messageEl.classList.add('error');
            }
        });
