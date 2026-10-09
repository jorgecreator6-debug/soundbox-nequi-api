const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de salud para que Render sepa que el servicio está activo
app.get('/', (req, res) => {
  res.send('Servidor SoundBox Nequi funcionando correctamente.');
});

// Endpoint principal para recibir las notificaciones de correo
app.post('/api/nequi-webhook', (req, res) => {
  console.log("=== EMAIL COMPLETO ===", JSON.stringify(req.body));
  try {
    // Acepta 'rawEmail', 'body', 'text' o el cuerpo completo enviado por el servicio de correo
    const emailText = req.body.rawEmail || req.body.text || req.body.body || JSON.stringify(req.body);

    console.log('\n==========================================');
    console.log('📩 [NUEVO CORREO RECIBIDO DE NEQUI]');
    console.log('Timestamp:', new Date().toISOString());

    let monto = null;
    let pagador = 'Desconocido';
    let referencia = 'N/A';

    // 1. Patrón para Negocios / QR Bre-B (Ejemplo: "Venta exitosa por $100 ... Monto:$ 100 ... Pagador:VALENTINA RIVERO")
    const montoNegocioMatch = emailText.match(/Monto:\s*\$?\s*([\d\.,]+)/i) || emailText.match(/Venta exitosa por\s*\$?\s*([\d\.,]+)/i);
    const pagadorNegocioMatch = emailText.match(/Pagador:\s*([^B\n\r]+)/i);
    const refNegocioMatch = emailText.match(/Referencia:\s*([A-Z0-9]+)/i);

    // 2. Patrón para transferencias personales (Ejemplo: "JUAN PEREZ te envió \$ 10.000")
    const transferMatch = emailText.match(/(.+?)\s+te envi[oó]\s+\$?\s*([\d\.,]+)/i);

    if (montoNegocioMatch) {
      monto = parseFloat(montoNegocioMatch[1].replace(/\./g, '').replace(',', '.'));
      if (pagadorNegocioMatch) pagador = pagadorNegocioMatch[1].trim();
      if (refNegocioMatch) referencia = refNegocioMatch[1].trim();
    } else if (transferMatch) {
      pagador = transferMatch[1].trim();
      monto = parseFloat(transferMatch[2].replace(/\./g, '').replace(',', '.'));
    }

    if (monto) {
      console.log('✅ [PAGO VALIDADO CORRECTAMENTE]');
      console.log(`💵 Monto: $${monto} COP`);
      console.log(`👤 Pagador: ${pagador}`);
      console.log(`🔢 Referencia: ${referencia}`);

      // TODO: Aquí se emitirá el evento MQTT hacia el SoundBox físico

      return res.status(200).json({
        success: true,
        message: 'Notificación procesada con éxito',
        data: { monto, pagador, referencia }
      });
    } else {
      console.log('⚠️ No se identificaron patrones de pago en el contenido recibido.');
      return res.status(200).json({
        success: false,
        message: 'El correo no contiene una estructura de pago reconocida'
      });
    }
  } catch (error) {
    console.error('❌ Error procesando el correo:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en el puerto ${PORT}`);
});