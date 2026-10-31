/**
 * Módulo de precisão matemática e financeira.
 * Elimina completamente desvios de arredondamento de ponto flutuante (IEEE 754)
 * através da notação científica e contabilidade estrita baseada em centavos inteiros (Integer Cents).
 */

/**
 * Converte qualquer valor monetário (Reais) para centavos inteiros (Integer Cents).
 * Utiliza notação científica 'e2' para garantir que dízimas de ponto flutuante como
 * 35.855 não virem 3585.4999999999995 antes do arredondamento.
 * 
 * @param {number|string} amount - Valor em Reais (ex: 10.50 ou "10.50")
 * @returns {number} Valor inteiro em centavos (ex: 1050)
 */
export function toCents(amount) {
    const num = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(',', '.'));
    if (isNaN(num) || !isFinite(num)) return 0;
    return Math.round(Number(num + 'e2'));
}

/**
 * Converte centavos inteiros de volta para Reais com 2 casas decimais seguras.
 * @param {number} cents - Valor em centavos (ex: 1050)
 * @returns {number} Valor em Reais (ex: 10.50)
 */
export function fromCents(cents) {
    if (isNaN(cents) || !isFinite(cents)) return 0;
    return Number(Math.round(cents) + 'e-2');
}

/**
 * Arredonda um valor em ponto flutuante para um número fixo de casas decimais
 * sem os erros comuns de Math.round(val * 100) / 100.
 * @param {number} value
 * @param {number} [decimals=2]
 * @returns {number}
 */
export function roundAccurate(value, decimals = 2) {
    if (isNaN(value) || !isFinite(value)) return 0;
    return Number(Math.round(Number(value + 'e' + decimals)) + 'e-' + decimals);
}

/**
 * Calcula o subtotal de um item com exatidão contábil:
 * Subtotal (Reais) = fromCents(Math.round(quantidade * preco_em_centavos))
 * 
 * @param {number} quantity - Quantidade (ex: 0.333 kg, 2 un, 1.455 kg)
 * @param {number} unitPrice - Preço unitário em Reais (ex: 14.90)
 * @returns {number} Subtotal arredondado para centavos exatos
 */
export function calculateItemTotal(quantity, unitPrice) {
    const q = typeof quantity === 'number' ? quantity : parseFloat(quantity);
    const p = typeof unitPrice === 'number' ? unitPrice : parseFloat(unitPrice);
    if (isNaN(q) || isNaN(p) || q <= 0 || p <= 0) return 0;

    const unitPriceCents = toCents(p);
    const itemCents = Math.round(q * unitPriceCents);
    return fromCents(itemCents);
}

/**
 * Calcula o montante financeiro total de uma coleção de itens somando
 * os centavos inteiros de cada subtotal (garantia de que a soma dos itens
 * exibidos na tela é IDÊNTICA ao total consolidado).
 * 
 * @param {Array<{ itemTotalValue: number }>} items
 * @returns {number} Total geral em Reais
 */
export function calculateGrandTotal(items) {
    if (!Array.isArray(items) || items.length === 0) return 0;
    const totalCents = items.reduce((accumCents, item) => {
        const itemVal = item && typeof item.itemTotalValue === 'number' ? item.itemTotalValue : 0;
        return accumCents + toCents(itemVal);
    }, 0);
    return fromCents(totalCents);
}

/**
 * Formata um número no padrão monetário brasileiro oficial (R$ 0,00).
 * @param {number} value
 * @returns {string}
 */
export function formatCurrencyBRL(value) {
    const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(safeValue);
}
