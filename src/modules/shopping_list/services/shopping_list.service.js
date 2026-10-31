import { toCents, fromCents, roundAccurate, calculateItemTotal, calculateGrandTotal, formatCurrencyBRL } from '../../../core/utils/currency.js';

/**
 * Serviço de gerenciamento do estado dos itens da lista de compras.
 * Mantém os itens mais recentes sempre no topo da lista.
 */
export class ShoppingListService {
    constructor() {
        /** @type {Array<import('../types/item.types.js').ShoppingItem>} */
        this.items = [];
    }

    /**
     * Adiciona um novo item sempre no início (topo) da lista.
     * @param {string} product
     * @param {number} quantity
     * @param {number} price
     * @returns {import('../types/item.types.js').ShoppingItem}
     */
    addItem(product, quantity, price) {
        const safeQtd = roundAccurate(parseFloat(quantity) || 0, 3);
        const safePrice = roundAccurate(parseFloat(price) || 0, 2);
        const itemTotalValue = calculateItemTotal(safeQtd, safePrice);

        const newItem = {
            id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now() + Math.random()),
            product: String(product || '').trim(),
            quantity: safeQtd,
            price: safePrice,
            itemTotalValue,
            createdAt: new Date().toISOString()
        };

        this.items.unshift(newItem); // Insere no topo
        return newItem;
    }

    /**
     * Atualiza um item existente pelo seu ID único.
     * @param {string} id
     * @param {string} product
     * @param {number} quantity
     * @param {number} price
     * @returns {boolean}
     */
    updateItem(id, product, quantity, price) {
        const index = this.items.findIndex(item => item.id === id);
        if (index === -1) return false;

        const safeQtd = roundAccurate(parseFloat(quantity) || 0, 3);
        const safePrice = roundAccurate(parseFloat(price) || 0, 2);
        const itemTotalValue = calculateItemTotal(safeQtd, safePrice);

        this.items[index] = {
            ...this.items[index],
            product: String(product || '').trim(),
            quantity: safeQtd,
            price: safePrice,
            itemTotalValue
        };
        return true;
    }

    /**
     * Remove um item da lista buscando por seu ID único.
     * @param {string} id
     * @returns {boolean}
     */
    removeItem(id) {
        const index = this.items.findIndex(item => item.id === id);
        if (index === -1) return false;
        this.items.splice(index, 1);
        return true;
    }

    getItemById(id) {
        return this.items.find(item => item.id === id) || null;
    }

    getAllItems() {
        return [...this.items];
    }

    getTotal() {
        return calculateGrandTotal(this.items);
    }

    getFormattedTotal() {
        return formatCurrencyBRL(this.getTotal());
    }

    filterItems(query) {
        const normalized = (query || '').toLowerCase().trim();
        if (!normalized) return this.getAllItems();
        return this.items.filter(item => item.product.toLowerCase().includes(normalized));
    }
}
