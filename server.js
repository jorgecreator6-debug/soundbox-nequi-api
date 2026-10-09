const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors()); // Habilitar CORS para que el index.html pueda consultar la API
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

let ultimaTransaccion = { monto: null, pagador: null, id: 0 };

app.get('/api/ultima-transaccion', (req, res) => {
    res.json(ultimaTransaccion);
});

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

        ultimaTransaccion = {
            monto: monto,
            pagador: pagador,
            id: Date.now()
        };

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