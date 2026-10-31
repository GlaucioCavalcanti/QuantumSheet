// =============================================================================
// QUANTUMSHEET - CONTROLE DE PRODUTOS E LISTA DE COMPRAS
// - Itens recentes sempre no topo da listagem
// - Precisão matemática em centavos inteiros (Integer Cents)
// - Exportação Excel (.xlsx) com largura padronizada de colunas e formato de moeda
// =============================================================================

// Prevenção de menu de contexto e atalhos padrão
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', e => {
    if (e.ctrlKey && ['u', 's', 'Shift'].includes(e.key)) e.preventDefault();
});

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------------------
    // 1. MAPEAMENTO DE ELEMENTOS DO DOM
    // -------------------------------------------------------------------------
    const productForm = document.getElementById('productForm');
    const downloadExcelButton = document.getElementById('downloadExcel');
    const itemList = document.getElementById('itemList');
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const totalValueInput = document.getElementById('totalValue');
    const submitButton = productForm.querySelector('button[type="submit"]');

    // -------------------------------------------------------------------------
    // 2. ESTADO DA APLICAÇÃO (STATE)
    // -------------------------------------------------------------------------
    let items = [];
    let editingItemId = null; // ID único do item em edição (null = inserção)

    // -------------------------------------------------------------------------
    // 3. NÚCLEO DE PRECISÃO MATEMÁTICA E FINANCEIRA
    // -------------------------------------------------------------------------
    
    function toCents(amount) {
        const num = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(',', '.'));
        if (isNaN(num) || !isFinite(num)) return 0;
        return Math.round(Number(num + 'e2'));
    }

    function fromCents(cents) {
        if (isNaN(cents) || !isFinite(cents)) return 0;
        return Number(Math.round(cents) + 'e-2');
    }

    function roundAccurate(value, decimals = 2) {
        if (isNaN(value) || !isFinite(value)) return 0;
        return Number(Math.round(Number(value + 'e' + decimals)) + 'e-' + decimals);
    }

    function calculateItemSubtotal(quantity, unitPrice) {
        const unitPriceCents = toCents(unitPrice);
        const itemCents = Math.round(quantity * unitPriceCents);
        return fromCents(itemCents);
    }

    function calculateGrandTotal() {
        const totalCents = items.reduce((accCents, item) => {
            return accCents + toCents(item.itemTotalValue);
        }, 0);
        return fromCents(totalCents);
    }

    function formatCurrency(val) {
        return (val || 0).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // -------------------------------------------------------------------------
    // 4. SUBMISSÃO DO FORMULÁRIO (ADICIONAR OU SALVAR EDIÇÃO)
    // -------------------------------------------------------------------------
    productForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const product = document.getElementById('product').value.trim();
        const quantity = parseFloat(document.getElementById('quantity').value);
        const price = parseFloat(document.getElementById('price').value);

        if (!validateInputs(product, quantity, price)) {
            alert('Por favor, preencha todos os campos com valores válidos e maiores que zero.');
            return;
        }

        const safeQuantity = roundAccurate(quantity, 3);
        const safePrice = roundAccurate(price, 2);
        const itemTotalValue = calculateItemSubtotal(safeQuantity, safePrice);

        if (editingItemId) {
            // Edição de item existente identificado pelo ID único
            const itemIndex = items.findIndex(item => item.id === editingItemId);
            if (itemIndex !== -1) {
                items[itemIndex] = {
                    ...items[itemIndex],
                    product,
                    quantity: safeQuantity,
                    price: safePrice,
                    itemTotalValue
                };
            }
            editingItemId = null;
            submitButton.textContent = 'Adicionar';
            removeCancelEditButton();
        } else {
            // Inserção de novo item: SEMPRE NO TOPO (unshift)
            const newItem = {
                id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now() + Math.random()),
                product,
                quantity: safeQuantity,
                price: safePrice,
                itemTotalValue
            };
            items.unshift(newItem); // Coloca o item mais recente no início da lista
        }

        productForm.reset();
        updateListAndTotal();
    });

    // -------------------------------------------------------------------------
    // 5. EXPORTAÇÃO ESTRUTURADA PARA EXCEL (.XLSX) COM FORMATAÇÃO
    // -------------------------------------------------------------------------
    downloadExcelButton.addEventListener('click', () => {
        if (items.length === 0) {
            alert('A lista de produtos está vazia para exportação.');
            return;
        }

        const workbook = XLSX.utils.book_new();
        const grandTotal = calculateGrandTotal();

        // 1. Dados em formato matriz (AOA)
        // Linhas de dados mantêm o tipo numérico para o Excel reconhecer nativamente
        const rows = [
            ['Produto', 'Quantidade', 'Valor Unitário', 'Valor Total'],
            ...items.map(item => [
                item.product,
                item.quantity,
                item.price,
                item.itemTotalValue
            ]),
            ['TOTAL GERAL', '', '', grandTotal]
        ];

        const worksheet = XLSX.utils.aoa_to_sheet(rows);

        // 2. Padronização da largura das colunas (largura em caracteres)
        worksheet['!cols'] = [
            { wch: 32 }, // Coluna A: Produto
            { wch: 14 }, // Coluna B: Quantidade
            { wch: 18 }, // Coluna C: Valor Unitário (R$)
            { wch: 18 }  // Coluna D: Valor Total (R$)
        ];

        // 3. Aplicação da máscara monetária nativa do Excel para as colunas de valor
        // Formato contábil brasileiro: R$ #,##0.00
        const currencyFormat = '"R$"\\ #,##0.00;[Red]\\-"R$"\\ #,##0.00;"R$"\\ 0.00';
        const qtyFormat = '#,##0.00';

        const totalRows = items.length + 2; // Cabeçalho (1) + itens (N) + Total (1)
        for (let r = 2; r <= totalRows; r++) {
            // Coluna B (Quantidade): linha r
            const cellQty = worksheet[`B${r}`];
            if (cellQty && typeof cellQty.v === 'number') {
                cellQty.z = qtyFormat;
            }

            // Coluna C (Valor Unitário): linha r
            const cellPrice = worksheet[`C${r}`];
            if (cellPrice && typeof cellPrice.v === 'number') {
                cellPrice.z = currencyFormat;
            }

            // Coluna D (Valor Total): linha r
            const cellTotal = worksheet[`D${r}`];
            if (cellTotal && typeof cellTotal.v === 'number') {
                cellTotal.z = currencyFormat;
            }
        }

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Lista de Compras');
        XLSX.writeFile(workbook, 'produtos.xlsx');
    });

    // -------------------------------------------------------------------------
    // 6. BUSCA E FILTRAGEM
    // -------------------------------------------------------------------------
    searchForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const query = searchInput.value.toLowerCase().trim();
        renderList(query ? items.filter(item => item.product.toLowerCase().includes(query)) : items);
    });

    document.getElementById('resetButton').addEventListener('click', () => {
        searchInput.value = '';
        renderList(items);
    });

    // Proteção contra saída acidental com lista preenchida
    window.addEventListener('beforeunload', (event) => {
        if (items.length > 0) {
            event.preventDefault();
            event.returnValue = '';
        }
    });

    // -------------------------------------------------------------------------
    // 7. FUNÇÕES AUXILIARES E ATUALIZAÇÃO DA INTERFACE
    // -------------------------------------------------------------------------
    function validateInputs(product, quantity, price) {
        return product !== '' && !isNaN(quantity) && quantity > 0 && !isNaN(price) && price > 0;
    }

    function updateListAndTotal() {
        const total = calculateGrandTotal();
        totalValueInput.value = formatCurrency(total);

        const activeQuery = searchInput.value.toLowerCase().trim();
        if (activeQuery) {
            renderList(items.filter(item => item.product.toLowerCase().includes(activeQuery)));
        } else {
            renderList(items);
        }
    }

    function renderList(listToRender = items) {
        itemList.innerHTML = '';
        listToRender.forEach(item => addItemToList(item));
    }

    function addItemToList(item) {
        const listItem = document.createElement('li');
        listItem.setAttribute('data-id', item.id);
        listItem.innerHTML = `
            <span><strong>${escapeHTML(item.product)}</strong> - Quantidade: ${item.quantity}, Valor Unitário: R$ ${formatCurrency(item.price)}, Total: R$ ${formatCurrency(item.itemTotalValue)}</span>
            <div>
                <button type="button" class="edit">Editar</button>
                <button type="button" class="delete">Excluir</button>
            </div>
        `;

        listItem.querySelector('.edit').addEventListener('click', () => editItem(item.id));
        listItem.querySelector('.delete').addEventListener('click', () => deleteItem(item.id));
        itemList.appendChild(listItem);
    }

    function editItem(id) {
        const item = items.find(i => i.id === id);
        if (!item) return;

        document.getElementById('product').value = item.product;
        document.getElementById('quantity').value = item.quantity;
        document.getElementById('price').value = item.price;

        editingItemId = id;
        submitButton.textContent = 'Salvar Edição';
        addCancelEditButton();
    }

    function addCancelEditButton() {
        if (document.getElementById('cancelEditButton')) return;
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.id = 'cancelEditButton';
        cancelBtn.textContent = 'Cancelar';
        cancelBtn.style.backgroundColor = '#6c757d';
        cancelBtn.addEventListener('click', () => {
            editingItemId = null;
            productForm.reset();
            submitButton.textContent = 'Adicionar';
            removeCancelEditButton();
        });
        submitButton.parentNode.insertBefore(cancelBtn, submitButton.nextSibling);
    }

    function removeCancelEditButton() {
        const cancelBtn = document.getElementById('cancelEditButton');
        if (cancelBtn) cancelBtn.remove();
    }

    function deleteItem(id) {
        const itemIndex = items.findIndex(i => i.id === id);
        if (itemIndex !== -1) {
            if (editingItemId === id) {
                editingItemId = null;
                productForm.reset();
                submitButton.textContent = 'Adicionar';
                removeCancelEditButton();
            }
            items.splice(itemIndex, 1);
            updateListAndTotal();
        }
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }
});
