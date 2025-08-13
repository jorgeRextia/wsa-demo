// ================== Estado global ==================
let datosGlobales = [];
let datosFiltrados = [];
let paginaActual = 1;
const registrosPorPagina = 20;

// ================== Utilidades ==================
function formatearDatosParaTabla(datos) {
  return datos.map((item) => ({
    id: item.id || "N/A",
    etaRequerida: item.requiredETA || "N/A",
    estado: item.estado || "N/A",
    ubicacion: item.ubicacion || "N/A",
    fechaLlegada: item.date || "N/A",
    fecha: item.date || "N/A",
    hora: item.hour || "N/A",
    diasRetraso:
      item.actualAgingDays !== undefined ? item.actualAgingDays : "0",
  }));
}

function getEl(id) {
  return document.getElementById(id);
}

function mostrarContenedorResultados(mostrar) {
  const cont = getEl("tablaResultados");
  if (!cont) return;
  // Mejor usar el atributo 'hidden' para evitar flashes
  cont.hidden = !mostrar;
}

// ================== Búsquedas ==================
async function buscarTracking() {
  const trackingId = getEl("trackingId").value.trim();

  if (!trackingId) {
    alert("Por favor ingresa uno o más IDs de tracking (separados por coma)");
    return;
  }

  // Dividir los IDs por coma y eliminar espacios en blanco
  // Convertir a mayúsculas para estandarizar
  const trackingIds = trackingId.split(",").map((id) => id.trim().toUpperCase());

  try {
    const response = await fetch("datos.json");

    if (!response.ok) {
      alert("No se pudo cargar el archivo de datos");
      return;
    }

    const allData = await response.json();

    // Filtrar por uno o más IDs
    const data = allData.filter((item) =>
      trackingIds.includes(item.id.toUpperCase())
    );

    if (data.length > 0) {
      llenarTabla(data);
    } else {
      alert("No se encontraron resultados para este/estos ID(s)");
      limpiarTablaYContador();
    }
  } catch (error) {
    console.error("Error al buscar:", error);
    alert("Ocurrió un error al buscar el/los envío(s)");
  }
}

// Función para buscar por fechas
async function buscarPorFecha() {
  const fechaInicio = getEl("startDate").value;
  const fechaFin = getEl("endDate").value;

  if (!fechaInicio || !fechaFin) {
    alert("Por favor ingresa ambas fechas");
    return;
  }

  try {
    const response = await fetch("datos.json");

    if (!response.ok) throw new Error("Respuesta no OK del servidor");

    const allData = await response.json();
    
    // Convertir las fechas a objetos Date para comparación
    const startDate = new Date(fechaInicio);
    const endDate = new Date(fechaFin);
    const data = allData.filter((item) => {
      const [day, month, year] = item.date.split("-").map(Number);
      const itemDate = new Date(year, month - 1, day); // Meses en JS son 0-indexados
      return itemDate >= startDate && itemDate <= endDate;
    });

    if (data.length > 0) {
      llenarTabla(data);
    } else {
      alert("No se encontraron resultados para ese rango de fechas");
      limpiarTablaYContador();
    }
  } catch (error) {
    console.error("Error al buscar por fechas:", error);
    alert("Ocurrió un error al buscar por fechas");
  }
}

// ================== Render/Tabla ==================
function llenarTabla(datos) {
  datosGlobales = Array.isArray(datos) ? datos : [];
  poblarFiltroEstados(datosGlobales);
  paginaActual = 1; // resetea al mostrar nuevos datos
  mostrarDatos(datosGlobales);
}

function poblarFiltroEstados(datos) {
  const select = getEl("filtroEstado");
  if (!select) return;

  const estadosUnicos = [...new Set(datos.map((item) => item.estado || "N/A"))];

  select.innerHTML = '<option value="all">All</option>';
  estadosUnicos.forEach((estado) => {
    const option = document.createElement("option");
    option.value = estado;
    option.textContent = estado;
    select.appendChild(option);
  });
}

function mostrarDatos(datos) {
  const filtroElem = getEl("filtroEstado");
  const filtro = filtroElem ? filtroElem.value : "all";

  datosFiltrados =
    filtro !== "all"
      ? datos.filter((d) => (d.estado || "N/A") === filtro)
      : datos;

  // Asegura página válida
  const totalPaginas = Math.max(
    1,
    Math.ceil(datosFiltrados.length / registrosPorPagina)
  );
  if (paginaActual > totalPaginas) paginaActual = 1;

  const inicio = (paginaActual - 1) * registrosPorPagina;
  const fin = inicio + registrosPorPagina;
  const datosPagina = datosFiltrados.slice(inicio, fin);

  const cuerpoTabla = getEl("cuerpoTabla");
  if (!cuerpoTabla) return;
  cuerpoTabla.innerHTML = "";

  const datosFormateados = formatearDatosParaTabla(datosPagina);
  for (const item of datosFormateados) {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${item.id}</td>
      <td>${item.etaRequerida}</td>
      <td>${item.estado}</td>
      <td>${item.ubicacion}</td>
      <td>${item.fechaLlegada}</td>
      <td>${item.fecha}</td>
      <td>${item.hora}</td>
      <td>${item.diasRetraso}</td>
    `;
    cuerpoTabla.appendChild(fila);
  }

  // Mostrar/ocultar contenedor correctamente (es un DIV, no una tabla)
  mostrarContenedorResultados(datosFormateados.length > 0);

  // Contador de resultados
  const contador = getEl("contadorResultados");
  if (contador) {
    if (datosFiltrados.length > 0) {
      contador.textContent = `Results: ${datosFiltrados.length}`;
      contador.style.display = "block";
    } else {
      contador.style.display = "none";
    }
  }

  crearPaginacion();
}

function crearPaginacion() {
  const contenedor = getEl("paginacion");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  const totalPaginas = Math.max(
    1,
    Math.ceil(datosFiltrados.length / registrosPorPagina)
  );

  // « Previous
  const btnAnterior = document.createElement("button");
  btnAnterior.textContent = "« Previous";
  btnAnterior.disabled = paginaActual === 1;
  btnAnterior.addEventListener("click", () => {
    if (paginaActual > 1) {
      paginaActual--;
      mostrarDatos(datosGlobales);
    }
  });
  contenedor.appendChild(btnAnterior);

  // Info "Página X de Y"
  const infoPagina = document.createElement("span");
  infoPagina.textContent = ` Página ${paginaActual} de ${totalPaginas} `;
  contenedor.appendChild(infoPagina);

  // Next »
  const btnSiguiente = document.createElement("button");
  btnSiguiente.textContent = "Next »";
  btnSiguiente.disabled = paginaActual >= totalPaginas;
  btnSiguiente.addEventListener("click", () => {
    if (paginaActual < totalPaginas) {
      paginaActual++;
      mostrarDatos(datosGlobales);
    }
  });
  contenedor.appendChild(btnSiguiente);
}

function limpiarTablaYContador() {
  const cuerpo = getEl("cuerpoTabla");
  if (cuerpo) cuerpo.innerHTML = "";

  mostrarContenedorResultados(false);

  const contador = getEl("contadorResultados");
  if (contador) contador.style.display = "none";
}

// ================== Exportar a Excel ==================
function exportarExcel() {
  const tablaEl = document.querySelector("#tablaResultados table"); // ← usa la <table> real
  if (!tablaEl) {
    alert("No se encontró la tabla para exportar.");
    return;
  }

  const wb = XLSX.utils.table_to_book(tablaEl, { sheet: "Datos" });
  const ws = wb.Sheets["Datos"];

  // Ajuste de anchos
  const range = XLSX.utils.decode_range(ws["!ref"]);
  const colWidths = [];

  for (let C = range.s.c; C <= range.e.c; ++C) {
    let maxWidth = 10;
    for (let R = range.s.r; R <= range.e.r; ++R) {
      const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
      const cell = ws[cellRef];
      if (cell && cell.v != null) {
        const cellValue = String(cell.v);
        maxWidth = Math.max(maxWidth, cellValue.length + 2);
      }
    }
    colWidths.push({ wch: maxWidth });
  }
  ws["!cols"] = colWidths;

  XLSX.writeFile(wb, "UPS Canada File.xlsx");
}

// ================== Init ==================
document.addEventListener("DOMContentLoaded", function () {
  // Si en el HTML añadiste: <div id="tablaResultados" hidden> no habrá parpadeo.
  // Aun así, por seguridad, oculta al iniciar:
  mostrarContenedorResultados(false);

  const botonExportar = getEl("btnExportarExcel");
  if (botonExportar) botonExportar.addEventListener("click", exportarExcel);

  const filtroEstado = getEl("filtroEstado");
  if (filtroEstado) {
    filtroEstado.addEventListener("change", () => {
      paginaActual = 1;
      mostrarDatos(datosGlobales);
    });
  }

  const btnBuscarID = getEl("btnBuscarID");
  if (btnBuscarID) btnBuscarID.addEventListener("click", buscarTracking);

  const btnBuscarFechas = getEl("btnBuscarFechas");
  if (btnBuscarFechas)
    btnBuscarFechas.addEventListener("click", buscarPorFecha);
});

// Flatpickr
document.addEventListener("DOMContentLoaded", function () {
  // Fuerza inglés globalmente
  flatpickr.localize(flatpickr.l10ns.en);

  const opcionesFecha = {
    dateFormat: "Y-m-d",
    locale: flatpickr.l10ns.en, // fuerza textos (meses, días) en inglés
    disableMobile: true, // evita picker nativo de iOS/Android
  };

  flatpickr("#startDate", opcionesFecha);
  flatpickr("#endDate", opcionesFecha);
});