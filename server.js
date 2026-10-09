const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

app.post('/api/nequi-webhook', (req, res) => {
    console.log("==========================================");
    console.log("📩 [NUEVO CORREO RECIBIDO DE NEQUI]");
    console.log("Timestamp:", new Date().toISOString());

    const contenidoHtml = req.body?.html || req.body?.plain || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

    // Extracción limpia usando patrones basados en la estructura visual de Nequi
    const montoMatch = contenidoHtml.match(/Monto:<\/th>\s*<td[^>]*>\s*\$?\s*([\d.,]+)/i) || contenidoHtml.match(/Venta exitosa por\s*\$\s*([\d.,]+)/i);
    const estadoMatch = contenidoHtml.match(/Estado:<\/th>\s*<td[^>]*>([^<]+)/i);
    const pagadorMatch = contenidoHtml.match(/Pagador:<\/th>\s*<td[^>]*>([^<]+)/i);
    const refMatch = contenidoHtml.match(/Referencia:<\/th>\s*<td[^>]*>([^<]+)/i);

    if (montoMatch) {
        console.log("✅ [PAGO VALIDADO CORRECTAMENTE]");
        console.log(`💵 Monto: $${montoMatch[1].trim()} COP`);
        if (estadoMatch) console.log(`📌 Estado: ${estadoMatch[1].trim()}`);
        if (pagadorMatch) console.log(`👤 Pagador: ${pagadorMatch[1].trim()}`);
        if (refMatch) console.log(`🔢 Referencia: ${refMatch[1].trim()}`);
    } else {
        console.log("⚠️ No se identificaron patrones de pago en el contenido recibido.");
    }

    console.log("==========================================");
    res.status(200).send("OK");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en el puerto ${PORT}`);
});