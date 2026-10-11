// ===== Elementos =====
const navbar = document.getElementById('navbar');
const menuBtn = document.getElementById('menu-btn');
const searchBtn = document.getElementById('search-btn');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const menuBoxes = document.querySelectorAll('#menu-list .box');
const emptySearch = document.getElementById('empty-search');

const cartBtn = document.getElementById('cart-btn');
const cartPanel = document.getElementById('cart');
const cartClose = document.getElementById('cart-close');
const overlay = document.getElementById('overlay');
const cartItemsList = document.getElementById('cart-items');
const cartEmpty = document.getElementById('cart-empty');
const cartTotal = document.getElementById('cart-total');
const cartCount = document.getElementById('cart-count');
const checkoutBtn = document.getElementById('checkout-btn');
const cartMessage = document.getElementById('cart-message');

const formatPrice = (value) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// ===== Menu hambúrguer (celular) =====
function toggleNavbar(open = !navbar.classList.contains('active')) {
    navbar.classList.toggle('active', open);
    menuBtn.setAttribute('aria-expanded', open);
    if (open) toggleSearch(false);
}

menuBtn.addEventListener('click', () => toggleNavbar());

// Fecha o menu ao clicar em um link
navbar.querySelectorAll('a').forEach((link) =>
    link.addEventListener('click', () => toggleNavbar(false))
);

// ===== Busca no menu =====
function toggleSearch(open = !searchForm.classList.contains('active')) {
    searchForm.classList.toggle('active', open);
    searchBtn.setAttribute('aria-expanded', open);
    if (open) {
        toggleNavbar(false);
        searchInput.focus();
    }
}

searchBtn.addEventListener('click', () => toggleSearch());

// Remove acentos para "medio" encontrar "Médio"
const normalize = (text) =>
    text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

searchInput.addEventListener('input', () => {
    const term = normalize(searchInput.value.trim());
    let found = 0;

    menuBoxes.forEach((box) => {
        const match = normalize(box.dataset.name).includes(term);
        box.hidden = !match;
        if (match) found++;
    });

    emptySearch.hidden = found > 0;

    // Leva até o menu para a pessoa ver o resultado da busca
    if (term) document.getElementById('menu').scrollIntoView();
});

searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    document.getElementById('menu').scrollIntoView();
    toggleSearch(false);
});

// ===== Carrinho =====
// O carrinho guarda só nome e quantidade: { "Café Coado": 2, ... }
// O preço é sempre lido do menu, então mudar um preço no HTML já vale para todo mundo.
const prices = {};
menuBoxes.forEach((box) => {
    prices[box.dataset.name] = Number(box.dataset.price);
});

let cart = loadCart();

// O localStorage pode estar bloqueado (aba anônima, por exemplo), então usamos try/catch
function loadCart() {
    let saved = {};
    try {
        saved = JSON.parse(localStorage.getItem('devclub-cart')) || {};
    } catch {
        return {};
    }

    const clean = {};
    Object.entries(saved).forEach(([name, value]) => {
        // Aceita também o formato antigo { price, qty }
        const qty = typeof value === 'object' ? value.qty : value;
        // Ignora itens que não existem mais no menu
        if (name in prices && qty > 0) clean[name] = qty;
    });
    return clean;
}

function saveCart() {
    try {
        localStorage.setItem('devclub-cart', JSON.stringify(cart));
    } catch {
        // Sem localStorage o carrinho continua funcionando, só não fica salvo
    }
}

function addToCart(name) {
    cart[name] = (cart[name] || 0) + 1;
    updateCart();
}

function changeQty(name, delta) {
    cart[name] += delta;
    if (cart[name] <= 0) delete cart[name];
    updateCart();
}

function updateCart() {
    const entries = Object.entries(cart);
    let total = 0;
    let count = 0;

    cartItemsList.innerHTML = '';

    entries.forEach(([name, qty]) => {
        const subtotal = prices[name] * qty;
        total += subtotal;
        count += qty;

        const li = document.createElement('li');
        li.className = 'cart-item';
        li.innerHTML = `
            <span class="name"></span>
            <div class="qty">
                <button type="button" data-delta="-1" aria-label="Remover um">−</button>
                <span>${qty}</span>
                <button type="button" data-delta="1" aria-label="Adicionar um">+</button>
            </div>
            <span class="subtotal">${formatPrice(subtotal)}</span>
        `;
        // textContent evita que o nome seja interpretado como HTML
        li.querySelector('.name').textContent = name;
        li.querySelectorAll('.qty button').forEach((btn) =>
            btn.addEventListener('click', () => changeQty(name, Number(btn.dataset.delta)))
        );
        cartItemsList.appendChild(li);
    });

    cartEmpty.hidden = entries.length > 0;
    checkoutBtn.disabled = entries.length === 0;
    cartTotal.textContent = formatPrice(total);
    cartCount.textContent = count;
    cartCount.hidden = count === 0;

    saveCart();
}

function toggleCart(open) {
    cartPanel.classList.toggle('active', open);
    cartPanel.setAttribute('aria-hidden', !open);
    overlay.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
        toggleNavbar(false);
        toggleSearch(false);
        cartMessage.textContent = '';
        cartClose.focus();
    }
}

document.querySelectorAll('.add-cart').forEach((btn) => {
    btn.addEventListener('click', () => {
        const box = btn.closest('.box');
        addToCart(box.dataset.name);

        // Feedback visual de 1 segundo no botão
        btn.textContent = 'Adicionado ✓';
        btn.classList.add('added');
        setTimeout(() => {
            btn.textContent = 'Adicione ao carrinho';
            btn.classList.remove('added');
        }, 1000);
    });
});

cartBtn.addEventListener('click', () => toggleCart(true));
cartClose.addEventListener('click', () => toggleCart(false));
overlay.addEventListener('click', () => toggleCart(false));

checkoutBtn.addEventListener('click', () => {
    cart = {};
    updateCart();
    cartMessage.textContent = 'Pedido recebido! (simulação — este é um projeto de estudo)';
});

// Esc fecha qualquer painel aberto
document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    toggleCart(false);
    toggleNavbar(false);
    toggleSearch(false);
});

updateCart();
