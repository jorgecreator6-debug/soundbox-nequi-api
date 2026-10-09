const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

// Lista de clientes conectados (navegadores abiertos)
let clientesSSE = [];

// Ruta para que el navegador se conecte y escuche en tiempo real
app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    clientesSSE.push(res);

    req.on('close', () => {
        clientesSSE = clientesSSE.filter(client => client !== res);
    });
});

// Webhook que recibe los correos de CloudMailin
app.post('/api/nequi-webhook', (req, res) => {
    console.log("==========================================");
    console.log("📩 [NUEVO CORREO RECIBIDO DE NEQUI]");
    console.log("Timestamp:", new Date().toISOString());

    const contenidoHtml = req.body?.html || req.body?.plain || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

    const montoMatch = contenidoHtml.match(/Monto:<\/th>\s*<td[^>]*>\s*\$?\s*([\d.,]+)/i) || contenidoHtml.match(/Venta exitosa por\s*\$\s*([\d.,]+)/i);
    const estadoMatch = contenidoHtml.match(/Estado:<\/th>\s*<td[^>]*>([^<]+)/i);
    const pagadorMatch = contenidoHtml.match(/Pagador:<\/th>\s*<td[^>]*>([^<]+)/i);
    const refMatch = contenidoHtml.match(/Referencia:<\/th>\s*<td[^>]*>([^<]+)/i);

    if (montoMatch) {
        const monto = montoMatch[1].trim();
        const pagador = pagadorMatch ? pagadorMatch[1].trim() : "Cliente";
        
        console.log("✅ [PAGO VALIDADO CORRECTAMENTE]");
        console.log(`💵 Monto: $${monto} COP`);
        console.log(`👤 Pagador: ${pagador}`);

        // Enviar la alerta en tiempo real a todas las pestañas del navegador conectadas
        const datosAlerta = JSON.stringify({ monto, pagador });
        clientesSSE.forEach(client => {
            client.write(`data: ${datosAlerta}\n\n`);
        });

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