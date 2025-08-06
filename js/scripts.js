// Variable global para guardar los datos actuales
let datosGlobales = [];

// Función para formatear datos para la tabla
function formatearDatosParaTabla(datos) {
  return datos.map((item) => {
    return {
      id: item.id || "N/A",
      etaRequerida: item.requiredETA || "N/A",
      estado: item.estado || "N/A",
      ubicacion: item.ubicacion || "N/A",
      fechaLlegada: item.arrivalDate || "N/A",
      fecha: item.date || "N/A",
      hora: item.hour || "N/A",
      diasRetraso:
        item.actualAgingDays !== undefined ? item.actualAgingDays : "0",
    };
  });
}

// Función para buscar por ID
async function buscarTracking() {
  const trackingIdInput = document.getElementById("trackingId").value.trim();

  if (!trackingIdInput) {
    alert("Por favor ingresa uno o más IDs de tracking (separados por coma)");
    return;
  }

  // Dividir los IDs por coma y eliminar espacios en blanco
  // Convertir a mayúsculas para estandarizar
  const trackingIds = trackingIdInput.split(",").map((id) => id.trim().toUpperCase());

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
  const fechaInicio = document.getElementById("startDate").value;
  const fechaFin = document.getElementById("endDate").value;

  if (!fechaInicio || !fechaFin) {
    alert("Por favor ingresa ambas fechas");
    return;
  }

  try {
    const response = await fetch("datos.json");

    if (!response.ok) {
      alert("No se pudo cargar el archivo de datos");
      return;
    }

    const allData = await response.json();

    // Convertir las fechas a objetos Date para comparación
    const startDate = new Date(fechaInicio);
    const endDate = new Date(fechaFin);
    const data = allData.filter((item) => new Date(item.date) >= startDate && new Date(item.date) <= endDate);

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

// Función para llenar la tabla y guardar datos globales
function llenarTabla(datos) {
  datosGlobales = datos;
  poblarFiltroEstados(datosGlobales); // 👈 generar opciones dinámicamente
  mostrarDatos(datosGlobales);
}

// Función para llenar dinámicamente el filtro de estado
function poblarFiltroEstados(datos) {
  const select = document.getElementById("filtroEstado");
  if (!select) return;

  const estadosUnicos = [...new Set(datos.map((item) => item.estado))];

  // Limpiar y volver a llenar
  select.innerHTML = '<option value="all">Todos</option>';

  estadosUnicos.forEach((estado) => {
    const option = document.createElement("option");
    option.value = estado;
    option.textContent = estado;
    select.appendChild(option);
  });
}

// Función que muestra los datos dados (aplica filtro y contador)
function mostrarDatos(datos) {
  const filtroElem = document.getElementById("filtroEstado");
  const filtro = filtroElem ? filtroElem.value : "all";

  let datosFiltrados = datos;

  if (filtro !== "all") {
    datosFiltrados = datos.filter((d) => d.estado === filtro);
  }

  const cuerpoTabla = document.getElementById("cuerpoTabla");
  cuerpoTabla.innerHTML = "";

  const datosFormateados = formatearDatosParaTabla(datosFiltrados);

  datosFormateados.forEach((item) => {
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
  });

  const tabla = document.getElementById("tablaResultados");
  if (tabla)
    tabla.style.display = datosFormateados.length > 0 ? "table" : "none";

  const contador = document.getElementById("contadorResultados");
  if (contador) {
    if (datosFormateados.length > 0) {
      contador.textContent = `Resultados: ${datosFormateados.length}`;
      contador.style.display = "block";
    } else {
      contador.style.display = "none";
    }
  }
}

// Función para limpiar tabla y contador
function limpiarTablaYContador() {
  document.getElementById("cuerpoTabla").innerHTML = "";
  document.getElementById("tablaResultados").style.display = "none";
  const contador = document.getElementById("contadorResultados");
  if (contador) contador.style.display = "none";
}

// Exportar a Excel con ajuste automático de ancho de columnas
function exportarExcel() {
  const tabla = document.getElementById("tablaResultados");
  if (!tabla) {
    alert("No se encontró la tabla para exportar.");
    return;
  }

  const wb = XLSX.utils.table_to_book(tabla, { sheet: "Datos" });
  const ws = wb.Sheets["Datos"];

  // Ajustar ancho de columnas automáticamente
  const range = XLSX.utils.decode_range(ws["!ref"]);
  const colWidths = [];

  for (let C = range.s.c; C <= range.e.c; ++C) {
    let maxWidth = 10; // Ancho mínimo
    for (let R = range.s.r; R <= range.e.r; ++R) {
      const cellAddress = { c: C, r: R };
      const cellRef = XLSX.utils.encode_cell(cellAddress);
      const cell = ws[cellRef];
      if (cell && cell.v != null) {
        const cellValue = String(cell.v);
        maxWidth = Math.max(maxWidth, cellValue.length + 2); // +2 de margen
      }
    }
    colWidths.push({ wch: maxWidth });
  }

  ws["!cols"] = colWidths;

  XLSX.writeFile(wb, "UPS Canada File.xlsx");
}

// Al cargar el DOM
document.addEventListener("DOMContentLoaded", function () {
  limpiarTablaYContador();

  const botonExportar = document.getElementById("btnExportarExcel");
  if (botonExportar) {
    botonExportar.addEventListener("click", exportarExcel);
  }

  const filtroEstado = document.getElementById("filtroEstado");
  if (filtroEstado) {
    filtroEstado.addEventListener("change", () => {
      mostrarDatos(datosGlobales);
    });
  }

  const btnBuscarID = document.getElementById("btnBuscarID");
  if (btnBuscarID) {
    btnBuscarID.addEventListener("click", buscarTracking);
  }

  const btnBuscarFechas = document.getElementById("btnBuscarFechas");
  if (btnBuscarFechas) {
    btnBuscarFechas.addEventListener("click", buscarPorFecha);
  }
});
