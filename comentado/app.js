// O evento 'DOMContentLoaded' é disparado quando o DOM é completamente carregado.
// Isso garante que o script só seja executado após todos os elementos HTML estarem disponíveis.
document.addEventListener('DOMContentLoaded', () => {

    // Referências aos elementos do formulário e lista de produtos na página
    const productForm = document.getElementById('productForm');
    const downloadExcelButton = document.getElementById('downloadExcel');
    const itemList = document.getElementById('itemList');
    const searchForm = document.getElementById('searchForm'); // Novo: referência ao formulário de busca
    const searchInput = document.getElementById('searchInput'); // Novo: referência ao campo de entrada da busca

    // Criação de uma nova planilha (workbook) usando a biblioteca XLSX
    let workbook = XLSX.utils.book_new();

    // Dados iniciais da planilha (cabeçalhos das colunas)
    let worksheetData = [['Produto', 'Quantidade', 'Valor Unitário', 'Valor Total']];

    // Variável para armazenar o valor total de todos os produtos
    let totalValue = 0;

    // Lista de itens para armazenar os produtos adicionados
    let items = [];

    // Adiciona um evento 'submit' ao formulário de produtos
    productForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Impede o comportamento padrão de envio do formulário (recarregar a página)

        // Obtém os valores dos campos de produto, quantidade e preço
        const product = document.getElementById('product').value;
        const quantity = parseFloat(document.getElementById('quantity').value);
        const price = parseFloat(document.getElementById('price').value);

        // Verifica se os valores inseridos são válidos
        if (validateInputs(product, quantity, price)) {
            // Calcula o valor total do item (quantidade * preço unitário)
            const itemTotalValue = quantity * price;

            // Atualiza o valor total da lista de produtos
            totalValue += itemTotalValue;

            // Cria um novo objeto de item com os dados do produto
            const newItem = { product, quantity, price, itemTotalValue };
            
            // Adiciona o novo item à lista de itens
            items.push(newItem);

            // Adiciona os dados do produto à planilha de Excel
            addRowToExcel(product, quantity, price, itemTotalValue);

            // Atualiza o valor total exibido na página
            updateTotalValueOnPage();

            // Adiciona o item à lista visível na página
            addItemToList(newItem, items.length - 1); // 'items.length - 1' refere-se ao índice do último item adicionado
            
            // Limpa os campos do formulário após a adição
            productForm.reset();
        } else {
            // Exibe um alerta se algum dos campos estiver inválido
            alert('Por favor, preencha todos os campos corretamente.');
        }
    });

    // Evento para fazer o download do arquivo Excel ao clicar no botão
    downloadExcelButton.addEventListener('click', () => {
        // Cria uma planilha (worksheet) a partir dos dados da matriz 'worksheetData'
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

        // Adiciona a planilha ao workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Produtos');

        // Gera o arquivo Excel e força o download com o nome 'produtos.xlsx'
        XLSX.writeFile(workbook, 'produtos.xlsx');
    });

    // Função que valida os campos de entrada
    function validateInputs(product, quantity, price) {
        // Verifica se o nome do produto não está vazio e se quantidade e preço são maiores que zero
        return product.trim() !== '' && quantity > 0 && price > 0;
    }

    // Função que adiciona uma linha à planilha de Excel com os dados do produto
    function addRowToExcel(product, quantity, price, totalValue) {
        worksheetData.push([product, quantity, price, totalValue]); // Adiciona os dados como uma nova linha
    }

    // Função que atualiza o valor total na página
    function updateTotalValueOnPage() {
        document.getElementById('totalValue').value = totalValue.toFixed(2); // Exibe o valor total com 2 casas decimais
    }

    // Função que adiciona o item à lista visível na página
    function addItemToList(item, index) {
        const listItem = document.createElement('li'); // Cria um novo elemento <li>
        listItem.innerHTML = `
            ${item.product} - Quantidade: ${item.quantity}, Valor Unitário: R$${item.price.toFixed(2)}, Total: R$${item.itemTotalValue.toFixed(2)}
            <button class="edit">Editar</button>
            <button class="delete">Excluir</button>
        `;

        // Adiciona os eventos de edição e exclusão aos botões
        listItem.querySelector('.edit').addEventListener('click', () => editItem(index));
        listItem.querySelector('.delete').addEventListener('click', () => deleteItem(index));

        // Adiciona o item à lista visível na página
        itemList.appendChild(listItem);
    }

    // Função que permite editar um item existente
    function editItem(index) {
        const item = items[index]; // Obtém o item da lista pelo índice

        // Preenche os campos do formulário com os valores do item a ser editado
        document.getElementById('product').value = item.product;
        document.getElementById('quantity').value = item.quantity;
        document.getElementById('price').value = item.price;

        // Remove o valor total do item da soma geral
        totalValue -= item.itemTotalValue;

        // Remove o item da lista
        items.splice(index, 1);

        // Atualiza o valor total na página
        updateTotalValueOnPage();

        // Re-renderiza a lista de itens
        renderList();
    }

    // Função que exclui um item da lista
    function deleteItem(index) {
        const item = items[index]; // Obtém o item da lista pelo índice

        // Remove o valor total do item da soma geral
        totalValue -= item.itemTotalValue;

        // Remove o item da lista
        items.splice(index, 1);

        // Atualiza o valor total na página
        updateTotalValueOnPage();

        // Re-renderiza a lista de itens
        renderList();
    }

    // Função que renderiza a lista de itens (atualiza a exibição)
    function renderList(filteredItems = items) {
        itemList.innerHTML = ''; // Limpa a lista atual
        filteredItems.forEach((item, index) => {
            addItemToList(item, index); // Adiciona cada item da lista
        });
    }

    // Função para buscar itens na lista
    searchForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Impede o comportamento padrão do formulário de busca

        // Obtém o termo de busca e converte para minúsculas
        const query = searchInput.value.toLowerCase().trim();

        if (query) {
            // Filtra a lista de itens com base no termo de busca
            const filteredItems = items.filter(item => item.product.toLowerCase().includes(query));
            renderList(filteredItems); // Renderiza apenas os itens filtrados
        } else {
            renderList(); // Se a busca estiver vazia, renderiza toda a lista
        }
    });

    /* Entre as linhas 172 - 180, está a implementação obsoleta do objeto 'returValue', a versão atualizada 
    do objeto esta à partir da linha 182. 
    
    Adiciona um evento para exibir um pop-up de confirmação ao tentar recarregar ou sair da página
    window.addEventListener('beforeunload', (event) => {
        // Verifica se há itens na lista; se sim, exibe o pop-up de confirmação
        if (items.length > 0) {
            event.preventDefault(); // Impede a ação padrão
            event.returnValue = ''; // Exibe uma mensagem de confirmação padrão do navegador
        }
    });*/

    window.addEventListener('beforeunload', (event) => {
        // Verifica se há itens antes de exibir a mensagem de confirmação
        if (items.length > 0) {
            const confirmationMessage = 'Você tem certeza que deseja sair? As alterações feitas serão perdidas.';
            
            event.preventDefault(); // Para compatibilidade
            event.returnValue = confirmationMessage; // Compatibilidade com navegadores antigos
            return confirmationMessage; // Para navegadores modernos
        }
    });
    
});
