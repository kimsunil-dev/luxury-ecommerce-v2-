// assets/js/auth.js
document.addEventListener('DOMContentLoaded', () => {
    // Wait for nav.js to render the footer
    setTimeout(() => {
        const expandBtn = document.getElementById('expand-signup-btn');
        const emailInput = document.getElementById('signup-email');
        
        const newsletterModal = document.getElementById('newsletter-modal');
        const newsletterClose = document.getElementById('newsletter-close');
        const newsletterForm = document.getElementById('newsletter-form');

        if (!expandBtn || !emailInput || !newsletterModal) return;

        function openModal() {
            newsletterModal.classList.add('active');
            // Populate modal's email if the user already typed something
            const modalEmail = newsletterForm.querySelector('input[type="email"]');
            if (modalEmail && emailInput.value) {
                modalEmail.value = emailInput.value;
            }
        }

        emailInput.addEventListener('click', openModal);
        emailInput.addEventListener('focus', openModal);
        expandBtn.addEventListener('click', openModal);

        if (newsletterClose) {
            newsletterClose.addEventListener('click', () => {
                newsletterModal.classList.remove('active');
            });
        }

        newsletterModal.addEventListener('click', (e) => {
            if (e.target === newsletterModal) {
                newsletterModal.classList.remove('active');
            }
        });

        if (newsletterForm) {
            newsletterForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const inputs = newsletterForm.querySelectorAll('input');
                const email = inputs[1].value; // Assuming 2nd input is email based on HTML
                const password = inputs[3].value; // Assuming 4th input is password based on HTML
                const phone = inputs[2].value;

                if (!email || !password) {
                    alert('이메일과 비밀번호를 입력해주세요.');
                    return;
                }

                const submitBtn = newsletterForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerText;
                submitBtn.innerText = '처리 중...';
                submitBtn.disabled = true;

                try {
                    // Determine API URL based on current host (port 3000 if localhost dev)
                    const apiBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:3000' : '';
                    const response = await fetch(`${apiBase}/api/auth/signup`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, phone, password })
                    });
                    
                    const data = await response.json();
                    if (!response.ok) {
                        alert(data.error || '회원가입에 실패했습니다.');
                    } else {
                        alert('SIR. 회원이 되신 것을 환영합니다! (10% 할인 혜택이 적용됩니다.)');
                        newsletterForm.reset();
                        newsletterModal.classList.remove('active');
                    }
                } catch(err) {
                    console.error(err);
                    alert('서버 통신 오류가 발생했습니다. (서버가 켜져 있는지 확인해주세요)');
                } finally {
                    submitBtn.innerText = originalText;
                    submitBtn.disabled = false;
                }
            });
        }
    }, 500); // Give nav.js 500ms to inject the footer HTML
});
