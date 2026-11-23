const NUMERO_WHATSAPP = "573242815098";
// const COSTO_DOMICILIO = 0; // definir si el domicilio tiene costo

function toggleMenu(titulo) {
  const seccion = titulo.nextElementSibling;
  if (!seccion) return;
  seccion.style.display = seccion.style.display === "block" ? "none" : "block";
}
function toggleCantidad(checkbox) {
  const item = checkbox.closest(".item");
  if (!item) return;
  const cantidad = item.querySelector(".cantidad");
  if (!cantidad) return;
  if (checkbox.checked) {
    cantidad.disabled = false;
    if (Number(cantidad.value) === 0) cantidad.value = 1;
  } else {
    cantidad.value = 0;
    cantidad.disabled = true;
  }
  calcularTotal();
}
function toggleDescripcion(checkbox) {
  const item = checkbox.closest(".item");
  if (!item) return;
  const desc = item.querySelector(".descripcion");
  if (!desc) return;
  desc.style.display = checkbox.checked ? "block" : "none";
}
function calcularTotal() {
  let subtotal = 0;
  let contadorEmpaque = 0;
  document.querySelectorAll(".check-plato").forEach(cb => {
    if (!cb.checked) return;
    const item = cb.closest(".item");
    if (!item) return;
    const cantidad = Number(item.querySelector(".cantidad")?.value) || 0;
    if (cantidad <= 0) return;
    const sel = item.querySelector(".tamano");
    const precio = sel ? Number(sel.value) : Number(item.querySelector(".item-linea span")?.dataset.precio);
    subtotal += (precio || 0) * cantidad;
    contadorEmpaque += cantidad;
  });
  const tipoEntrega = document.getElementById("tipoEntrega")?.value;
  // [SI EL RESTAURANTE COBRA DOMICILIO: descomentar]
  // if (tipoEntrega === "A domicilio") subtotal += COSTO_DOMICILIO;
  // [SI EL RESTAURANTE COBRA EMPAQUE: descomentar]
  // let empaque = (tipoEntrega === "Comer dentro del local") ? 0 : contadorEmpaque * 1500;
  // subtotal += empaque;
  document.getElementById("total").innerText = "$" + subtotal.toLocaleString("es-CO");
  document.getElementById("totalPedido").value = subtotal;
}

// Copiar dato de pago al portapapeles
function copiarDato(btn, texto) {
  const listo = () => {
    btn.textContent = "✅ Copiado";
    btn.classList.add("ok");
    setTimeout(() => { btn.textContent = "📋 Copiar"; btn.classList.remove("ok"); }, 2000);
  };
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(texto).then(listo).catch(() => copiarAlterno(texto, listo));
  } else {
    copiarAlterno(texto, listo);
  }
}
function copiarAlterno(texto, listo) {
  const ta = document.createElement("textarea");
  ta.value = texto; ta.style.position = "fixed"; ta.style.opacity = "0";
  document.body.appendChild(ta); ta.select();
  try { document.execCommand("copy"); listo(); } catch (e) {}
  document.body.removeChild(ta);
}

// Tipo de entrega
document.getElementById("tipoEntrega").addEventListener("change", function () {
  const dir = document.getElementById("direccionField");
  const mesa = document.getElementById("mesaField");
  const inputDir = document.getElementById("direccion");
  dir.style.display = this.value === "A domicilio" ? "block" : "none";
  document.getElementById("costoDomicilio").style.display = this.value === "A domicilio" ? "block" : "none";
  mesa.style.display = this.value === "Comer dentro del local" ? "block" : "none";
  inputDir.required = this.value === "A domicilio";
  calcularTotal();
});

// Tipo de pago
document.getElementById("tipoPago").addEventListener("change", function () {
  document.getElementById("efectivoField").style.display = this.value === "Efectivo" ? "block" : "none";
  document.getElementById("infoPago").style.display = this.value && this.value !== "Efectivo" ? "block" : "none";
  ["Nequi", "Llave", "Daviplata"].forEach(m => {
    document.getElementById("info" + m).style.display = this.value === m ? "block" : "none";
  });
});

// Envío del pedido
document.getElementById("pedidoForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const lineas = [];
  document.querySelectorAll(".check-plato:checked").forEach(cb => {
    const item = cb.closest(".item");
    const cant = Number(item.querySelector(".cantidad")?.value) || 0;
    if (cant <= 0) return;
    const sel = item.querySelector(".sabor, .tamano");
    const variante = sel ? " (" + sel.options[sel.selectedIndex].text + ")" : "";
    lineas.push("• " + cant + " x " + cb.value + variante);
  });
  if (lineas.length === 0) { alert("Selecciona al menos un plato 🍔"); return; }

  const btn = this.querySelector(".btn");
  btn.disabled = true;
  setTimeout(() => { btn.disabled = false; }, 5000);

  const v = id => document.getElementById(id).value.trim();
  const entrega = v("tipoEntrega"), pago = v("tipoPago");
  let msg = "🍽️ *Nuevo pedido – Q’Paladar*\n\n👤 Nombre: " + v("nombre") + "\n📞 Teléfono: " + v("telefono") + "\n\n*Pedido:*\n" + lineas.join("\n") + "\n\n📦 Entrega: " + entrega;
  if (entrega === "A domicilio") msg += "\n📍 Dirección: " + v("direccion") + "\n🛵 Domicilio: costo según barrio (se confirma por WhatsApp)";
  if (entrega === "Comer dentro del local") msg += "\n🔢 Mesa: " + v("numeroMesa");
  msg += "\n💰 Pago: " + pago;
  if (pago === "Efectivo" && v("efectivoCliente")) msg += "\n💵 Paga con: " + v("efectivoCliente");
  if (v("especificaciones")) msg += "\n📒 Especificaciones: " + v("especificaciones");
  msg += "\n\n💸 *Total: " + document.getElementById("total").innerText + "*";

  // Guardar en Google Sheets (vía Google Forms)
  const FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSegPUOky5Tr1mJ38GKNKbq7_oDS9X3XWW-P_aGoFmN6NTvRMw/formResponse";
  const datos = new FormData();
  datos.append("entry.876534292", v("nombre"));
  datos.append("entry.1244291611", v("telefono"));
  datos.append("entry.363082447", lineas.join(" | "));
  datos.append("entry.2015987117", entrega);
  datos.append("entry.1574001044", entrega === "A domicilio" ? v("direccion") : (entrega === "Comer dentro del local" ? "Mesa " + v("numeroMesa") : ""));
  datos.append("entry.683430980", pago);
  datos.append("entry.1395714883", v("efectivoCliente"));
  datos.append("entry.1362860103", v("especificaciones"));
  datos.append("entry.1612193215", document.getElementById("totalPedido").value);
  fetch(FORM_URL, { method: "POST", mode: "no-cors", body: datos, keepalive: true }).catch(() => {});

  // Pequeña pausa para que el envío a Sheets salga antes de abrir WhatsApp
  setTimeout(() => {
    window.location.href = "https://wa.me/" + NUMERO_WHATSAPP + "?text=" + encodeURIComponent(msg);
  }, 400);
});