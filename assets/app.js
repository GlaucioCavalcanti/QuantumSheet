document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', e => {
    if (e.ctrlKey && ['u', 's', 'Shift'].includes(e.key)) e.preventDefault();
});

document.addEventListener('DOMContentLoaded', () => {
    const productForm = document.getElementById('productForm');
    const downloadExcelButton = document.getElementById('downloadExcel');
    const itemList = document.getElementById('itemList');
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');

    let items = [];
    let totalValue = 0;

    productForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const product = document.getElementById('product').value;
        const quantity = parseFloat(document.getElementById('quantity').value);
        const price = parseFloat(document.getElementById('price').value);

        if (validateInputs(product, quantity, price)) {
            const itemTotalValue = quantity * price;
            totalValue += itemTotalValue;

            const newItem = { product, quantity, price, itemTotalValue };
            items.push(newItem);

            updateListAndTotal();
            productForm.reset();
        } else {
            alert('Por favor, preencha todos os campos corretamente.');
        }
    });

    downloadExcelButton.addEventListener('click', () => {
        const workbook = XLSX.utils.book_new();
        const worksheetData = [['Produto', 'Quantidade', 'Valor Unitário', 'Valor Total'], ...items.map(item => [item.product, item.quantity, item.price, item.itemTotalValue])];
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Produtos');
        XLSX.writeFile(workbook, 'produtos.xlsx');
    });

    searchForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const query = searchInput.value.toLowerCase().trim();
        renderList(query ? items.filter(item => item.product.toLowerCase().includes(query)) : items);
    });

    document.getElementById('resetButton').addEventListener('click', () => {
        searchInput.value = '';
        renderList();
    });

    window.addEventListener('beforeunload', (event) => {
        if (items.length > 0) {
            event.preventDefault();
            event.returnValue = '';
        }
    });

    function validateInputs(product, quantity, price) {
        return product.trim() !== '' && quantity > 0 && price > 0;
    }

    function updateListAndTotal() {
        document.getElementById('totalValue').value = totalValue.toFixed(2);
        renderList();
    }

    function renderList(filteredItems = items) {
        itemList.innerHTML = '';
        filteredItems.forEach((item, index) => addItemToList(item, index));
    }

    function addItemToList(item, index) {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            ${item.product} - Quantidade: ${item.quantity}, Valor Unitário: R$${item.price.toFixed(2)}, Total: R$${item.itemTotalValue.toFixed(2)}
            <button class="edit">Editar</button>
            <button class="delete">Excluir</button>
        `;
        listItem.querySelector('.edit').addEventListener('click', () => editItem(index));
        listItem.querySelector('.delete').addEventListener('click', () => deleteItem(index));
        itemList.appendChild(listItem);
    }

    function editItem(index) {
        const item = items[index];
        document.getElementById('product').value = item.product;
        document.getElementById('quantity').value = item.quantity;
        document.getElementById('price').value = item.price;
        totalValue -= item.itemTotalValue;
        items.splice(index, 1);
        updateListAndTotal();
    }

    function deleteItem(index) {
        const item = items[index];
        totalValue -= item.itemTotalValue;
        items.splice(index, 1);
        updateListAndTotal();
    }
});
