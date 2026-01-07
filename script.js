document.addEventListener("DOMContentLoaded", () => {
  /* =========================
     DOM ELEMENTS
  ========================= */
  const grid = document.getElementById("grid");
  const brandFilter = document.getElementById("brandFilter");
  const sortFilter = document.getElementById("sortFilter");
  const cartModal = document.getElementById("cartModal");
  const cartItems = document.getElementById("cartItems");
  const userInfoModal = document.getElementById("userInfoModal");
  const userInfoForm = document.getElementById("userInfoForm");
  const userCancelBtn = document.getElementById("userCancelBtn");

  /* =========================
     INITIALIZE CART
  ========================= */
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  const updateCartCount = () => {
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    const el = document.getElementById("cartCount");
    if (el) el.textContent = count;
  };

  /* =========================
     POPULATE BRAND FILTER
  ========================= */
  [...new Set(products.map((p) => p.brand))].forEach((brand) => {
    const option = document.createElement("option");
    option.value = brand;
    option.textContent = brand;
    brandFilter.appendChild(option);
  });

  /* =========================
     RENDER PRODUCTS
  ========================= */
  const renderProducts = (list) => {
    grid.innerHTML = list
      .map(
        (p, idx) => `
        <div class="card">
          <img src="${p.image || "https://via.placeholder.com/300"}" alt="${
          p.brand
        } ${p.model}">
          <strong>${p.brand} – ${p.model}</strong>
          <ul>
            <li>${p.puffs} puffs</li>
            <li>${p.nic}% nicotine</li>
          </ul>
          <select id="flavour-${idx}">
  <option value="" disabled selected>Flavour</option>
  ${p.flavours.map((f) => `<option value="${f}">${f}</option>`).join("")}
</select>

          <button onclick="addToCart(${idx})">Add to Basket</button>
          <div class="price">₹${p.price}</div>
        </div>
      `
      )
      .join("");
  };

  /* =========================
     FILTER & SORT
  ========================= */
  const applyFilters = () => {
    let list = [...products];

    if (brandFilter.value) {
      list = list.filter((p) => p.brand === brandFilter.value);
    }

    if (sortFilter.value) {
      const [field, order] = sortFilter.value.split("-");
      list.sort((a, b) =>
        order === "asc" ? a[field] - b[field] : b[field] - a[field]
      );
    }

    renderProducts(list);
  };

  brandFilter.onchange = applyFilters;
  sortFilter.onchange = applyFilters;

  /* =========================
     CART FUNCTIONS
  ========================= */
  window.addToCart = (productIndex) => {
    const product = products[productIndex];
    const flavourSelect = document.getElementById(`flavour-${productIndex}`);
    const flavour = flavourSelect.value;

    if (!flavour) {
      alert("Please select a flavour before adding to basket.");
      flavourSelect.focus();
      return;
    }

    const existing = cart.find(
      (i) =>
        i.brand === product.brand &&
        i.model === product.model &&
        i.flavour === flavour
    );

    if (existing) existing.qty += 1;
    else
      cart.push({
        brand: product.brand,
        model: product.model,
        flavour,
        price: product.price,
        qty: 1,
      });

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();

    if (cartModal.style.display === "block") {
      renderCart();
    }
  };

  const renderCart = () => {
    let total = 0;
    cartItems.innerHTML = "";

    cart.forEach((item, i) => {
      const itemTotal = item.price * item.qty;
      total += itemTotal;

      cartItems.insertAdjacentHTML(
        "beforeend",
        `
      <tr>
        <td class="cart-product">
          <strong>${item.brand} – ${item.model}</strong><br>
          <small>${item.flavour}</small>
        </td>

        <td>
          <div class="cart-qty">
            <button onclick="changeQty(${i}, -1)">−</button>
            <span>${item.qty}</span>
            <button onclick="changeQty(${i}, 1)">+</button>
          </div>
        </td>

        <td>₹${itemTotal}</td>
      </tr>
    `
      );
    });

    document.getElementById("cartTotal").textContent = `Total: ₹${total}`;
  };

  window.changeQty = (index, delta) => {
    cart[index].qty += delta;
    if (cart[index].qty <= 0) cart.splice(index, 1);

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    renderCart();
  };

  document.getElementById("cartBtn").onclick = () => {
    renderCart();
    cartModal.style.display = "block";
  };

  window.closeCart = () => (cartModal.style.display = "none");

  /* =========================
     DISCLAIMER
  ========================= */
  const showOrderDisclaimer = () =>
    confirm(
      "DISCLAIMER\n\n" +
        "You are responsible for the products you order.\n" +
        "Orders placed are FINAL and cannot be cancelled.\n\n" +
        "IMPORTANT:\nPAYMENT METHOD IS CASH ON DELIVERY.\n\n" +
        "Do you accept these terms?"
    );

  /* =========================
     USER INFO MODAL
  ========================= */
  const openUserInfoModal = (callback) => {
    userInfoModal.style.display = "flex";
    userInfoForm.onsubmit = (e) => {
      e.preventDefault();
      const data = {
        name: document.getElementById("userName").value.trim(),
        phone: document.getElementById("userPhone").value.trim(),
        address: document.getElementById("userAddress").value.trim(),
        landmark: document.getElementById("userLandmark").value.trim(),
      };
      userInfoModal.style.display = "none";
      callback(data);
      userInfoForm.reset();
    };
  };

  const closeUserInfoModal = () =>
    userInfoForm.reset() && (userInfoModal.style.display = "none");
  userCancelBtn.addEventListener("click", closeUserInfoModal);

  /* =========================
     EXPORT / SEND TO WHATSAPP
  ========================= */
  window.exportCart = () => {
    if (!cart.length) return alert("Your cart is empty.");
    if (!showOrderDisclaimer()) return;

    openUserInfoModal((userData) => {
      let total = 0;
      let message = `🧾 ORDER DETAILS\n----------------------------\n`;
      message += `Name     : ${userData.name}\n`;
      message += `Phone    : ${userData.phone}\n`;
      message += `Address  : ${userData.address}\n`;
      if (userData.landmark) message += `Landmark : ${userData.landmark}\n`;
      message +=
        "----------------------------\nITEMS\n----------------------------\n";

      cart.forEach((item) => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        message += `${item.brand} ${item.model}\n• ${item.flavour}\nQty: ${item.qty} | Price: ₹${itemTotal}\n----------------------------\n`;
      });

      message += `TOTAL AMOUNT: ₹${total}\nPAYMENT: CASH ON DELIVERY\n----------------------------`;

      alert(
        "Your order has been placed successfully.\n\n" +
          "You will now be redirected to WhatsApp to forward your order.\n" +
          "Please press SEND in WhatsApp to complete the process."
      );

      window.open(
        "https://api.whatsapp.com/send?phone=918019385440&text=" +
          encodeURIComponent(message),
        "_blank"
      );

      cart = [];
      localStorage.removeItem("cart");
      updateCartCount();
      cartItems.innerHTML = "";
      cartModal.style.display = "none";
    });
  };

  /* =========================
     INITIAL LOAD
  ========================= */
  renderProducts(products);
  updateCartCount();
});
