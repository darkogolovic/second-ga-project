document.addEventListener("DOMContentLoaded", () => {
  const cartCount = document.getElementById("cartCount");
  const cartIcon = document.getElementById("cartIcon");
  const forms = document.querySelectorAll(".add-to-cart-form");

  //  Add to cart
  forms.forEach(form => {
    form.addEventListener("submit", async e => {
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

  //  Update cart icon count
  async function loadCartCount() {
    const res = await fetch("/cart");
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
        ${cart.length === 0
          ? "<p>Your cart is empty.</p>"
          : `
            <ul class="cart-items">
              ${cart
                .map(
                  item => `
                <li>
                  <span>${item.name}</span>
                  <span>${item.quantity.toFixed(1)}kg * $${item.price} </span>
                  <span>$${(item.price * item.quantity).toFixed(2)}</span>
                </li>`
                )
                .join("")}
            </ul>
            <p class="total">Total: $${cart
              .reduce((sum, i) => sum + i.price * i.quantity, 0)
              .toFixed(2)}</p>
          `}
      </div>
    `;

    document.body.appendChild(modal);

    // Close modal
    modal.querySelector(".close-btn").addEventListener("click", () => modal.remove());
    modal.addEventListener("click", e => {
      if (e.target === modal) modal.remove();
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

