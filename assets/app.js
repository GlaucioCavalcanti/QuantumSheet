document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && (e.key === 'u' || e.key === 's' || e.key === 'Shift')) {
        e.preventDefault();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const productForm = document.getElementById('productForm');
    const downloadExcelButton = document.getElementById('downloadExcel');
    const itemList = document.getElementById('itemList');
    const searchForm = document.getElementById('searchForm'); 
    const searchInput = document.getElementById('searchInput'); 
    
    let workbook = XLSX.utils.book_new();
    let worksheetData = [['Produto', 'Quantidade', 'Valor Unitário', 'Valor Total']];
    let totalValue = 0;
    let items = []; 
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

            addRowToExcel(product, quantity, price, itemTotalValue);
            updateTotalValueOnPage();
            addItemToList(newItem, items.length - 1); 
            productForm.reset();
        } else {
            alert('Por favor, preencha todos os campos corretamente.');
        }
    });

    downloadExcelButton.addEventListener('click', () => {
        const newWorkbook = XLSX.utils.book_new();
        const newWorksheetData = [['Produto', 'Quantidade', 'Valor Unitário', 'Valor Total']];
    
        items.forEach(item => {
            newWorksheetData.push([item.product, item.quantity, item.price, item.itemTotalValue]);
        });
    
        const newWorksheet = XLSX.utils.aoa_to_sheet(newWorksheetData);
        XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'Produtos');
    
        XLSX.writeFile(newWorkbook, 'produtos.xlsx');
    });
    

    function validateInputs(product, quantity, price) {
        return product.trim() !== '' && quantity > 0 && price > 0;
    }

    function addRowToExcel(product, quantity, price, totalValue) {
        worksheetData.push([product, quantity, price, totalValue]);
    }

    function updateWorksheetData() {
        // Reinicialize com o cabeçalho
        worksheetData = [['Produto', 'Quantidade', 'Valor Unitário', 'Valor Total']];
        
        // Reinsira os dados atuais da lista
        items.forEach(item => {
            worksheetData.push([item.product, item.quantity, item.price, item.itemTotalValue]);
        });
    }
    
    // Chame updateWorksheetData após edição e exclusão
    
    function editItem(index) {
        const item = items[index];
    
        // Atualize o formulário com os dados do item para edição
        document.getElementById('product').value = item.product;
        document.getElementById('quantity').value = item.quantity;
        document.getElementById('price').value = item.price;
    
        // Remova o item atual da lista e dos valores totais
        totalValue -= item.itemTotalValue;
        items.splice(index, 1);
    
        // Atualize os dados do Excel
        updateWorksheetData();
    
        // Renderize a lista novamente
        updateTotalValueOnPage();
        renderList();
    }
    
    function deleteItem(index) {
        const item = items[index];
    
        // Atualize o valor total e remova o item da lista
        totalValue -= item.itemTotalValue;
        items.splice(index, 1);
    
        // Atualize os dados do Excel
        updateWorksheetData();
    
        // Renderize a lista novamente
        updateTotalValueOnPage();
        renderList();
    } 
   
    function updateTotalValueOnPage() {
        document.getElementById('totalValue').value = totalValue.toFixed(2);
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
        updateTotalValueOnPage();
        renderList();
    }

    function deleteItem(index) {
        const item = items[index];
        totalValue -= item.itemTotalValue;
        items.splice(index, 1);
        updateTotalValueOnPage();
        renderList();
    }

    function renderList(filteredItems = items) {
        itemList.innerHTML = '';
        filteredItems.forEach((item, index) => {
            addItemToList(item, index);
        });
    }

    
    searchForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const query = searchInput.value.toLowerCase().trim();

        if (query) {
            const filteredItems = items.filter(item => item.product.toLowerCase().includes(query));
            renderList(filteredItems); 
        } else {
            renderList(); 
        }
    });

    const resetButton = document.getElementById('resetButton');
    resetButton.addEventListener('click', () => {
        searchInput.value = ''; 
        renderList(); 
    });
    
    function renderList(filteredItems = items) {
        itemList.innerHTML = '';
        filteredItems.forEach((item, index) => {
            addItemToList(item, index);
        });
    }

        window.addEventListener('beforeunload', (event) => {
        
        if (items.length > 0) {
            event.preventDefault(); 
            event.returnValue = ''; 
        }
    });

});
