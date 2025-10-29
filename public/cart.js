document.addEventListener("DOMContentLoaded", () => {
  const cartCount = document.getElementById("cartCount");
  const cartIcon = document.getElementById("cartIcon");
  const forms = document.querySelectorAll(".add-to-cart-form");

  forms.forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      const res = await fetch("/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (result.success) {
        showToast(`${data.quantity}kg added to cart`);
        updateCartCount(result.totalItems);
      }
    });
  });

  async function loadCartCount() {
    const res = await fetch("/cart",{
      credentials:"include"
    });
    if (!res.ok) return;
    const data = await res.json();
    updateCartCount(data.cart.length);
  }

  function updateCartCount(count) {
    if (cartCount) cartCount.textContent = count;
  }

  loadCartCount();

  if (cartIcon) {
    cartIcon.addEventListener("click", async () => {
      const res = await fetch("/cart");
      const data = await res.json();
      openCartModal(data.cart);
    });
  }

  function openCartModal(cart) {
  const modal = document.createElement("div");
  modal.className = "cart-modal";

  modal.innerHTML = `
    <div class="cart-content">
      <span class="close-btn">&times;</span>
      <h2>Your Cart</h2>

      ${
        cart.length === 0
          ? "<p>Your cart is empty.</p>"
          : `
            <ul class="cart-items">
              ${cart.map(
                (item) => `
                <li>
                  <div class="item-info">
                    <span class="item-name">${item.name}</span>
                    <span class="item-details">${item.quantity.toFixed(1)}kg × $${item.price}</span>
                  </div>
                  <span class="item-total">$${(item.price * item.quantity).toFixed(2)}</span>
                </li>`
              ).join("")}
            </ul>

            <p class="total"><strong>Total:</strong> $${cart.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2)}</p>

            <div class="cart-actions">
              <button id="checkout-btn" class="cart-btn checkout">Checkout</button>
              <button id="clear-cart-btn" class="cart-btn clear">Clear Cart</button>
            </div>
          `
      }
    </div>
  `;

  document.body.appendChild(modal);

 
  modal.querySelector(".close-btn").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });

  
  modal.querySelector("#clear-cart-btn")?.addEventListener("click", async () => {
    const res = await fetch("/cart/remove-all", {
      method: "POST",
      credentials: "include"
    });
    if (res.ok) {
      const data = await res.json();
      updateCartCount(data.cart.length);
      showToast("Cart cleared");
      modal.remove();
    } else {
      showToast("Failed to clear cart");
    }
  });

  modal.querySelector("#checkout-btn")?.addEventListener("click", async () => {
  const res = await fetch("/cart/checkout", {
    method: "POST",
    credentials: "include"
  });
  if (res.status === 401) {
      updateCartCount(0);
      return;
    }

  if (res.ok) {
    const data = await res.json();
    updateCartCount(data.cart.length);
    showToast(`Checkout complete! Total: $${data.total.toFixed(2)}`);
    modal.remove();
  } else {
    showToast("Checkout failed");
  }
});
}

  

  function showToast(msg) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }
});
