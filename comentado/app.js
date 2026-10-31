// =============================================================================
// QUANTUMSHEET - CONTROLE DE PRODUTOS E LISTA DE COMPRAS (VERSÃO COMENTADA)
// - Novo item inserido no topo (ordem cronológica decrescente)
// - Precisão matemática em centavos inteiros (Integer Cents)
// - Exportação Excel (.xlsx) formatada com larguras de coluna e máscara monetária
// =============================================================================

// Desabilita o menu de contexto do navegador para manter experiência de app
document.addEventListener('contextmenu', e => e.preventDefault());

// Bloqueia teclas de atalho que possam interferir na sessão
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
    let items = []; // Vetor de armazenamento em memória dos produtos cadastrados
    let editingItemId = null; // Armazena o UUID do item que está sendo editado (null = modo inserção)

    // -------------------------------------------------------------------------
    // 3. MOTOR MATEMÁTICO BASEADO EM CENTAVOS INTEIROS (INTEGER CENTS)
    // -------------------------------------------------------------------------
    
    /**
     * toCents: Converte Reais em centavos inteiros com notação científica.
     * Exemplo: R$ 35,855 vira 3586 centavos com precisão matemática.
     */
    function toCents(amount) {
        const num = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(',', '.'));
        if (isNaN(num) || !isFinite(num)) return 0;
        return Math.round(Number(num + 'e2'));
    }

    /**
     * fromCents: Converte centavos inteiros de volta para Reais com 2 casas fixas.
     */
    function fromCents(cents) {
        if (isNaN(cents) || !isFinite(cents)) return 0;
        return Number(Math.round(cents) + 'e-2');
    }

    /**
     * roundAccurate: Arredonda números fracionários sem os desvios do ponto flutuante padrão.
     */
    function roundAccurate(value, decimals = 2) {
        if (isNaN(value) || !isFinite(value)) return 0;
        return Number(Math.round(Number(value + 'e' + decimals)) + 'e-' + decimals);
    }

    /**
     * calculateItemSubtotal:
     * Calcula o subtotal multiplicando a quantidade pelos centavos do preço unitário.
     */
    function calculateItemSubtotal(quantity, unitPrice) {
        const unitPriceCents = toCents(unitPrice);
        const itemCents = Math.round(quantity * unitPriceCents);
        return fromCents(itemCents);
    }

    /**
     * calculateGrandTotal:
     * Soma os centavos inteiros de cada item. O total geral é sempre rigorosamente
     * idêntico à soma das linhas apresentadas na interface.
     */
    function calculateGrandTotal() {
        const totalCents = items.reduce((accCents, item) => {
            return accCents + toCents(item.itemTotalValue);
        }, 0);
        return fromCents(totalCents);
    }

    /**
     * formatCurrency: Formata o número para exibição monetária brasileira (ex: "1.250,50").
     */
    function formatCurrency(val) {
        return (val || 0).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // -------------------------------------------------------------------------
    // 4. SUBMISSÃO DO FORMULÁRIO DE PRODUTOS
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

        // Sanitização e arredondamento das entradas
        const safeQuantity = roundAccurate(quantity, 3);
        const safePrice = roundAccurate(price, 2);
        const itemTotalValue = calculateItemSubtotal(safeQuantity, safePrice);

        if (editingItemId) {
            // Edição não-destrutiva de item existente buscando por UUID
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
            // Inserção de novo item: ADICIONA NO TOPO (unshift)
            const newItem = {
                id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now() + Math.random()),
                product,
                quantity: safeQuantity,
                price: safePrice,
                itemTotalValue
            };
            items.unshift(newItem); // Mantém o item mais recente no início da lista
        }

        productForm.reset();
        updateListAndTotal();
    });

    // -------------------------------------------------------------------------
    // 5. EXPORTAÇÃO FORMATADA PARA PLANILHA EXCEL (.XLSX)
    // -------------------------------------------------------------------------
    downloadExcelButton.addEventListener('click', () => {
        if (items.length === 0) {
            alert('A lista de produtos está vazia para exportação.');
            return;
        }

        const workbook = XLSX.utils.book_new();
        const grandTotal = calculateGrandTotal();

        // 1. Matriz de dados com valores numéricos para o Excel operar nativamente
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

        // 2. Padronização da largura das colunas (em caracteres)
        worksheet['!cols'] = [
            { wch: 32 }, // Coluna A: Produto (ampla para descrições longas)
            { wch: 14 }, // Coluna B: Quantidade
            { wch: 18 }, // Coluna C: Valor Unitário (R$)
            { wch: 18 }  // Coluna D: Valor Total (R$)
        ];

        // 3. Aplicação de máscara contábil nativa do Excel para as células numéricas
        const currencyFormat = '"R$"\\ #,##0.00;[Red]\\-"R$"\\ #,##0.00;"R$"\\ 0.00';
        const qtyFormat = '#,##0.00';

        const totalRows = items.length + 2; // Cabeçalho + itens + Linha Total
        for (let r = 2; r <= totalRows; r++) {
            // Coluna B: Quantidade
            const cellQty = worksheet[`B${r}`];
            if (cellQty && typeof cellQty.v === 'number') {
                cellQty.z = qtyFormat;
            }

            // Coluna C: Preço Unitário
            const cellPrice = worksheet[`C${r}`];
            if (cellPrice && typeof cellPrice.v === 'number') {
                cellPrice.z = currencyFormat;
            }

            // Coluna D: Total do Item / Total Geral
            const cellTotal = worksheet[`D${r}`];
            if (cellTotal && typeof cellTotal.v === 'number') {
                cellTotal.z = currencyFormat;
            }
        }

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Lista de Compras');
        XLSX.writeFile(workbook, 'produtos.xlsx');
    });

    // -------------------------------------------------------------------------
    // 6. BUSCA E FILTRO DE ITENS
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

    window.addEventListener('beforeunload', (event) => {
        if (items.length > 0) {
            event.preventDefault();
            event.returnValue = '';
        }
    });

    // -------------------------------------------------------------------------
    // 7. FUNÇÕES AUXILIARES E SINCRONIZAÇÃO VISUAL
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
