import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBIXbhUiVMnhkx9aMAmb7IB-MkFHNQfYiI",
  authDomain: "pimpo-d2fac.firebaseapp.com",
  projectId: "pimpo-d2fac",
  storageBucket: "pimpo-d2fac.firebasestorage.app",
  messagingSenderId: "171636390534",
  appId: "1:171636390534:web:adef506989752fe286af07"
};

const ADMIN_EMAIL = "idclemmeuse@gmail.com";
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


let cart = 0;
let cartItems = [];

async function saveCartToFirebase() {
  try {
    await addDoc(collection(db, "orders"), {
      totalItems: cart,
      items: cartItems,
      createdAt: new Date(),
      user: auth.currentUser ? auth.currentUser.email : "guest"
    });

    console.log("🔥 Cart saved!");
  } catch (error) {
    console.error("❌ Firebase error:", error);
  }
}

async function displayProducts(){
  const container = document.getElementById("productList");
  container.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "products"));

  querySnapshot.forEach(d => {
    const product = d.data();
    console.log(product);
    const id = d.id;

    if (product.type && product.type !== "normal") return;

    const card = document.createElement("div");
    card.classList.add("card");

    card.innerHTML = `
      <img src="${product.img}">
      <h3>${product.name}</h3>
      <p class="price">$${product.price}</p>
      <button class="add-btn">Add to Cart</button>
      <button class="delete-btn">Delete</button>
    `;

    const deleteBtn = card.querySelector(".delete-btn");

    if (auth.currentUser && auth.currentUser.email === ADMIN_EMAIL) {
        deleteBtn.style.display = "block";
    } else {
        deleteBtn.style.display = "none";
    }

    card.querySelector(".add-btn").addEventListener("click", () => {
      addToCart(product);
    });

    card.querySelector(".delete-btn").addEventListener("click", async () => {
      await deleteDoc(doc(db, "products", id));
      card.remove();
    });

    container.appendChild(card);
  });
}

async function displayFeatured(){
  const slider = document.getElementById("slider");
  slider.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "products"));

  querySnapshot.forEach(doc => {
    const product = doc.data();

    if (product.type !== "featured") return;

    const card = document.createElement("div");
    card.classList.add("slider-card");

    card.innerHTML = `
      <img src="${product.img}">
      <h4>${product.name}</h4>
      <p>$${product.price}</p>
      <button class="add-btn">Add to card</button>
    `;

    card.querySelector(".add-btn").addEventListener("click", () => {
      addToCart(product);
    });

    slider.appendChild(card);
  });
}

function addToCart(product){
  cart++;
  cartItems.push(product);

  document.getElementById("cartCount").innerText = cart;

  renderCart();
  saveCartToFirebase();
}

window.removeFromCart = function(index){
  cartItems.splice(index, 1);
  cart--;

  document.getElementById("cartCount").innerText = cart;

  renderCart();
}


function renderCart(){
  const container = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");
  const checkoutBtn = document.getElementById("checkoutBtn");

  container.innerHTML = "";

  let total = 0;

  cartItems.forEach((item, index) => {
    total += item.price;

    const div = document.createElement("div");
    div.classList.add("cart-item");

    div.innerHTML = `
      <img src="${item.img}">
      <div>
        <p>${item.name}</p>
        <small>$${item.price}</small>
      </div>
      <button onclick="removeFromCart(${index})">X</button>
    `;

    container.appendChild(div);
  });

  totalEl.innerText = total;

  if(cartItems.length > 0){
    checkoutBtn.style.display = "block";
  } else {
    checkoutBtn.style.display = "none";
  }
}

document.getElementById("checkoutBtn").addEventListener("click", () => {
  alert("Checkout successful! 🎉");

  cart = 0;
  cartItems = [];

  document.getElementById("cartCount").innerText = 0;

  renderCart();
});

let currentIndex = 0;
let autoScrollInterval;
let autoScrollTimeout;

function updateSlider(){
  const slider = document.getElementById("slider");
  const viewport = document.querySelector(".slider-viewport");
  const cards = slider.querySelectorAll(".slider-card");
  if (cards.length === 0) return;

  const cardWidth = cards[0].getBoundingClientRect().width + 40;
  const maxTranslate = slider.scrollWidth - viewport.offsetWidth;

  let translateX = currentIndex * cardWidth;

  if (translateX > maxTranslate) {
    translateX = maxTranslate;
  }

  slider.style.transform = `translateX(-${translateX}px)`;
}

window.scrollSlider = function(direction){
  const slider = document.getElementById("slider");
  const cards = slider.querySelectorAll(".slider-card");
  if (cards.length === 0) return;

  const visibleCards = Math.floor(slider.offsetWidth / cards[0].offsetWidth);
  const maxIndex = cards.length - visibleCards;

  currentIndex += direction;

  if (currentIndex < 0) {
    currentIndex = maxIndex;
  }

  if (currentIndex > maxIndex) {
    currentIndex = 0;
  }

  updateSlider();
  handleAutoScrollPause();
};

function startAutoScroll(){
  autoScrollInterval = setInterval(() => {
    const slider = document.getElementById("slider");
    const cards = slider.querySelectorAll(".slider-card");
    if (cards.length === 0) return;

    const visibleCards = Math.floor(slider.offsetWidth / cards[0].offsetWidth);
    const maxIndex = cards.length - visibleCards;

    currentIndex++;

    if (currentIndex > maxIndex){
      currentIndex = 0;
    }

    updateSlider();
  }, 3000);
}

function handleAutoScrollPause(){
  clearInterval(autoScrollInterval);
  clearTimeout(autoScrollTimeout);

  autoScrollTimeout = setTimeout(() => {
    startAutoScroll();
  }, 10000);
}


window.addEventListener("load", () => {
  setTimeout(() => {
    startAutoScroll();
  }, 500);
});


window.addEventListener("load", () => {
  displayProducts();
  displayFeatured();
});
window.addEventListener("DOMContentLoaded", () => {
  
  
    const loginBtn = document.getElementById("login-btn");
    const modal = document.getElementById("authModal");
    const cartIcon = document.querySelector(".cart");
    const cartPanel = document.getElementById("cartPanel");
    const closeCart = document.getElementById("closeCart");

    const adminPanel = document.getElementById("adminPanel");

    onAuthStateChanged(auth, (user) => {
      console.log("AUTH STATE:", user);

      if (user) {
        loginBtn.innerText = "Logout";

        if (user.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim()) {
          adminPanel.classList.add("active");
        } else {
          adminPanel.classList.remove("active");
        }

      } else {
        loginBtn.innerText = "Login";
        adminPanel.classList.remove("active");
      }
    });
    
    cartIcon.addEventListener("click", () => {
      cartPanel.classList.add("open");
    });

    closeCart.addEventListener("click", () => {
      cartPanel.classList.remove("open");
    });
    loginBtn.addEventListener("click", () => {
    if (auth.currentUser) {
        signOut(auth);
    } else {
        modal.style.display = "flex";
    }
    });

  
  
    let isLogin = true;

    const authBtn = document.getElementById("authBtn");
    const toggleAuth = document.getElementById("toggleAuth");

    toggleAuth.addEventListener("click", () => {
    isLogin = !isLogin;

    document.getElementById("authTitle").innerText = isLogin ? "Login" : "Sign Up";
    authBtn.innerText = isLogin ? "Login" : "Sign Up";

    toggleAuth.innerHTML = isLogin 
        ? `Don't have an account? <span class="link">Sign up</span>` 
        : `Already have an account? <span class="link">Login</span>`;
    });
  
    authBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        } else {
        await createUserWithEmailAndPassword(auth, email, password);
        }

        modal.style.display = "none";

        document.getElementById("email").value = "";
        document.getElementById("password").value = "";

    } catch (error) {
        alert(error.message);
    }
    });
    
  const addBtn = document.getElementById("addProductBtn");

  addBtn.addEventListener("click", async () => {
    const name = document.getElementById("pName").value;
    const price = Number(document.getElementById("pPrice").value);
    const img = document.getElementById("pImg").value;
    const type = document.getElementById("pType").value;

    try {
      const docRef = await addDoc(collection(db, "products"), {
        name,
        price,
        img,
        type
      });

      const newProduct = { name, price, img, type };

      // 👉 INSTANTLY add to UI (no reload)
      if (type === "featured") {
        addFeaturedCard(newProduct);
      } else {
        addProductCard(newProduct, docRef.id);
      }

    } catch (err) {
      alert(err.message);
    }
  });
  function addProductCard(product, id){
    const container = document.getElementById("productList");

    const card = document.createElement("div");
    card.classList.add("card");

    card.innerHTML = `
      <img src="${product.img}">
      <h3>${product.name}</h3>
      <p class="price">$${product.price}</p>
      <button class="add-btn">Add to Cart</button>
      <button class="delete-btn">Delete</button>
    `;

    card.querySelector(".add-btn").addEventListener("click", () => {
      addToCart(product);
    });

    card.querySelector(".delete-btn").addEventListener("click", async () => {
      await deleteDoc(doc(db, "products", id));
      card.remove(); // 🔥 NO REFRESH
    });

    container.appendChild(card);
  }

  function addFeaturedCard(product){
    const slider = document.getElementById("slider");

    const card = document.createElement("div");
    card.classList.add("slider-card");

    card.innerHTML = `
      <img src="${product.img}">
      <h4>${product.name}</h4>
      <p>$${product.price}</p>
      <button class="add-btn">Add to Cart</button>
    `;

    card.querySelector(".add-btn").addEventListener("click", () => {
      addToCart(product);
    });

    slider.appendChild(card);

          (function (w, d, s, o, f, js, fjs) {
        w["botsonic_widget"] = o;
        w[o] =
          w[o] ||
          function () {
            (w[o].q = w[o].q || []).push(arguments);
          };
        (js = d.createElement(s)), (fjs = d.getElementsByTagName(s)[0]);
        js.id = o;
        js.src = f;
        js.async = 1;
        fjs.parentNode.insertBefore(js, fjs);
      })(window, document, "script", "Botsonic", "https://widget.botsonic.com/CDN/botsonic.min.js");
      Botsonic("init", {
        serviceBaseUrl: "https://api-bot.writesonic.com",
        token: "f8b66dff-b6c9-4188-8545-78e9f651bcbf",
      });



    
  }
});
