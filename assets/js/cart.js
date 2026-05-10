// --- Global Cart Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Only init if there's a cart trigger on the page (front-end)
        const cartTrigger = document.getElementById('cart-trigger');
        if (!cartTrigger) return;

        // Inject Cart Drawer HTML
        const cartHTML = `
        <div class="cart-overlay" id="cart-overlay"></div>
        <div class="cart-drawer" id="cart-drawer">
            <div class="cart-header">
                <h2>Your Cart</h2>
                <button class="cart-close" id="cart-close">&times;</button>
            </div>
            <div class="cart-body" id="cart-body">
            </div>
            <div class="cart-footer">
                <div class="cart-total">
                    <span>Subtotal</span>
                    <span id="cart-total-price">₩0</span>
                </div>
                <button class="btn btn-checkout" onclick="alert('결제 ?�스???�동???�요?�니??')">Checkout</button>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', cartHTML);

        let cart = [];
        try {
            const stored = localStorage.getItem('sir_cart');
            if (stored) cart = JSON.parse(stored);
        } catch(e) {}

        const cartDrawer = document.getElementById('cart-drawer');
        const cartOverlay = document.getElementById('cart-overlay');
        const cartCloseBtn = document.getElementById('cart-close');
        const cartBody = document.getElementById('cart-body');
        const cartTotalEl = document.getElementById('cart-total-price');

        function toggleCart() {
            cartDrawer.classList.toggle('active');
            cartOverlay.classList.toggle('active');
            document.body.style.overflow = cartDrawer.classList.contains('active') ? 'hidden' : '';
        }

        cartTrigger.addEventListener('click', (e) => { e.preventDefault(); toggleCart(); }
});
        if (cartCloseBtn) cartCloseBtn.addEventListener('click', toggleCart);
        if (cartOverlay) cartOverlay.addEventListener('click', toggleCart);

        function saveCart() {
            localStorage.setItem('sir_cart', JSON.stringify(cart));
        }

        window.addToCart = async function(productId) {
            try {
                let products = [];
                products = await getProducts();
                const product = products.find(p => String(p.id) === String(productId));
                if (!product) {
                    cart.push({ id: productId, name: 'Product ' + productId, price: 380000, image: '' }
});
                } else {
                    cart.push(product);
                }
                saveCart();
                updateCartUI();
                toggleCart(); // ?�바구니???�으�??�라?�드 ?�픈
            } catch(e) {
                console.error("Cart Error:", e);
                alert("?�품???�바구니???�는 �??�류가 발생?�습?�다.");
            }
        };

        window.removeFromCart = function(index) {
            cart.splice(index, 1);
            saveCart();
            updateCartUI();
        };

        function updateCartUI() {
            const countEls = document.querySelectorAll('#cart-count');
            countEls.forEach(el => el.textContent = cart.length);
            
            if (!cartBody || !cartTotalEl) return;
            
            if (cart.length === 0) {
                cartBody.innerHTML = '<p class="cart-empty-message">?�바구니가 비어?�습?�다.</p>';
                cartTotalEl.textContent = '₩0';
                return;
            }

            let html = '';
            let total = 0;

            cart.forEach((item, index) => {
                const price = Number(item.price) || 0;
                total += price;
                html += `
                    <div class="cart-item">
                        <img src="${item.image || ''}" alt="${item.name}" class="cart-item-image">
                        <div class="cart-item-info">
                            <div class="cart-item-title">${item.name || '?�름 ?�음'}</div>
                            <div class="cart-item-price">??{price.toLocaleString()}</div>
                            <button class="cart-item-remove" onclick="removeFromCart(${index})">Remove</button>
                        </div>
                    </div>
                `;
            }
});

            cartBody.innerHTML = html;
            cartTotalEl.textContent = \`??${total.toLocaleString()}\`;
        }

        // 초기 UI ?�데?�트
        updateCartUI();
    } catch(err) {
        console.error("Cart Module Initialization Failed:", err);
    }
}
});
