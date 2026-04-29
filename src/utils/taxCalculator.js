/**
 * Calculadora de impuestos IVA + IEPS
 * 
 * Esta función calcula el precio final de un producto considerando
 * los impuestos IEPS (Impuesto Especial sobre Producción y Servicios)
 * e IVA (Impuesto al Valor Agregado).
 * 
 * @param {Object} producto - Objeto del producto con precio e impuestos
 * @param {number} producto.precioLista - Precio base del producto
 * @param {number} [producto.porcentajeIVA=0] - Porcentaje de IVA (ej: 16 para 16%)
 * @param {number} [producto.porcentajeIEPS=0] - Porcentaje de IEPS (ej: 8 para 8%)
 * @returns {Object} Objeto con desglose de precios e impuestos
 */
function calcularPrecioConImpuestos(producto) {
  // Validar entrada
  if (!producto || typeof producto.precioLista !== 'number') {
    throw new Error('Producto inválido: se requiere precioLista como número');
  }

  // Obtener valores con defaults
  const precioBase = producto.precioLista;
  const ivaPorcentaje = producto.porcentajeIVA || 0;
  const iepsPorcentaje = producto.porcentajeIEPS || 0;

  // Convertir porcentajes a decimales
  const ivaDecimal = ivaPorcentaje / 100;
  const iepsDecimal = iepsPorcentaje / 100;

  // Calcular IEPS (se aplica sobre el precio base)
  const montoIEPS = precioBase * iepsDecimal;

  // Subtotal después de IEPS (base + IEPS)
  const subtotal = precioBase + montoIEPS;

  // Calcular IVA (se aplica sobre el subtotal: base + IEPS)
  const montoIVA = subtotal * ivaDecimal;

  // Precio final (subtotal + IVA)
  const precioFinal = subtotal + montoIVA;

  return {
    precioBase: parseFloat(precioBase.toFixed(4)),
    porcentajeIVA: ivaPorcentaje,
    porcentajeIEPS: iepsPorcentaje,
    montoIEPS: parseFloat(montoIEPS.toFixed(4)),
    montoIVA: parseFloat(montoIVA.toFixed(4)),
    subtotal: parseFloat(subtotal.toFixed(4)),
    precioFinal: parseFloat(precioFinal.toFixed(4)),
    desglose: {
      base: parseFloat(precioBase.toFixed(4)),
      ieps: {
        porcentaje: iepsPorcentaje,
        monto: parseFloat(montoIEPS.toFixed(4))
      },
      iva: {
        porcentaje: ivaPorcentaje,
        monto: parseFloat(montoIVA.toFixed(4))
      },
      total: parseFloat(precioFinal.toFixed(4))
    }
  };
}

/**
 * Calcula el precio final para múltiples productos (carrito de compras)
 * 
 * @param {Array} productos - Array de objetos producto con cantidad
 * @param {Object} productos[].producto - Objeto del producto
 * @param {number} productos[].cantidad - Cantidad del producto
 * @returns {Object} Total del carrito con desglose
 */
function calcularCarritoConImpuestos(productos) {
  if (!Array.isArray(productos)) {
    throw new Error('Se requiere un array de productos');
  }

  let totalBase = 0;
  let totalIEPS = 0;
  let totalIVA = 0;
  let totalFinal = 0;
  const items = [];

  productos.forEach((item, index) => {
    if (!item.producto || typeof item.cantidad !== 'number' || item.cantidad <= 0) {
      throw new Error(`Item ${index} inválido: se requiere producto y cantidad > 0`);
    }

    const calculo = calcularPrecioConImpuestos(item.producto);
    
    // Multiplicar por cantidad
    const cantidad = item.cantidad;
    const itemBase = calculo.precioBase * cantidad;
    const itemIEPS = calculo.montoIEPS * cantidad;
    const itemIVA = calculo.montoIVA * cantidad;
    const itemTotal = calculo.precioFinal * cantidad;

    totalBase += itemBase;
    totalIEPS += itemIEPS;
    totalIVA += itemIVA;
    totalFinal += itemTotal;

    items.push({
      sku: item.producto.sku || `item-${index}`,
      descripcion: item.producto.descripcion || item.producto.description || '',
      cantidad,
      precioUnitario: calculo.precioBase,
      precioUnitarioConImpuestos: calculo.precioFinal,
      subtotal: itemBase,
      subtotalConImpuestos: itemTotal,
      impuestos: {
        ieps: itemIEPS,
        iva: itemIVA,
        totalImpuestos: itemIEPS + itemIVA
      },
      desgloseUnitario: calculo.desglose
    });
  });

  return {
    totalBase: parseFloat(totalBase.toFixed(4)),
    totalIEPS: parseFloat(totalIEPS.toFixed(4)),
    totalIVA: parseFloat(totalIVA.toFixed(4)),
    totalImpuestos: parseFloat((totalIEPS + totalIVA).toFixed(4)),
    totalFinal: parseFloat(totalFinal.toFixed(4)),
    cantidadItems: productos.length,
    items,
    resumen: {
      base: parseFloat(totalBase.toFixed(2)),
      ieps: parseFloat(totalIEPS.toFixed(2)),
      iva: parseFloat(totalIVA.toFixed(2)),
      total: parseFloat(totalFinal.toFixed(2))
    }
  };
}

/**
 * Valida si un producto tiene impuestos aplicables
 * 
 * @param {Object} producto - Objeto del producto
 * @returns {boolean} True si tiene IVA o IEPS > 0
 */
function tieneImpuestos(producto) {
  if (!producto) return false;
  const iva = producto.porcentajeIVA || 0;
  const ieps = producto.porcentajeIEPS || 0;
  return iva > 0 || ieps > 0;
}

/**
 * Formatea montos de impuestos para display
 * 
 * @param {number} monto - Monto a formatear
 * @param {string} moneda - Símbolo de moneda (default: '$')
 * @returns {string} Monto formateado
 */
function formatearMonto(monto, moneda = '$') {
  return `${moneda}${monto.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

module.exports = {
  calcularPrecioConImpuestos,
  calcularCarritoConImpuestos,
  tieneImpuestos,
  formatearMonto
};