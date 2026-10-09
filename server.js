const express = require('express');
const app = express();

// Middlewares para procesar JSON, formularios URL-encoded y texto plano de CloudMailin
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

app.post('/api/nequi-webhook', (req, res) => {
    console.log("==========================================");
    console.log("📩 [NUEVO CORREO RECIBIDO]");
    console.log("Timestamp:", new Date().toISOString());

    // Imprimir todo el contenido que envía CloudMailin
    console.log("=== BODY COMPLETO ===", JSON.stringify(req.body, null, 2));

    // Capturar el contenido de texto (sea de CloudMailin o directo)
    const contenidoTexto = req.body?.plain || req.body?.html || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
    console.log("=== CONTENIDO TEXTO ===", contenidoTexto);

    // Intentar extraer patrones de pago de Nequi
    const montoMatch = contenidoTexto.match(/\$(\d+[\d.,]*)\s*COP/i) || contenidoTexto.match(/\$(\d+[\d.,]*)/);
    const pagadorMatch = contenidoTexto.match(/por\s+([A-Z\s]+)\s+a\s+tu/i) || contenidoTexto.match(/de\s+([A-Z\s]+)\b/i);
    const refMatch = contenidoTexto.match(/M\d+/i) || contenidoTexto.match(/referencia:\s*(\w+)/i);

    if (montoMatch) {
        console.log("✅ [PAGO VALIDADO CORRECTAMENTE]");
        console.log(`💵 Monto: $${montoMatch[1]} COP`);
        if (pagadorMatch) console.log(`👤 Pagador: ${pagadorMatch[1].trim()}`);
        if (refMatch) console.log(`🔢 Referencia: ${refMatch[0]}`);
    } else {
        console.log("⚠️ No se identificaron patrones de pago en el contenido recibido.");
    }

    console.log("==========================================");

    // Responder siempre con 200 OK a CloudMailin
    res.status(200).send("OK");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en el puerto ${PORT}`);
});