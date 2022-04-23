/**
 * @NApiVersion 2.x
 * @NScriptType WorkflowActionScript
 */
define(["N/record", "N/runtime", "N/https", "N/log", "N/search"], function (record, runtime, https, log, search) {
    function ngAction(scriptContext) {
        var motivos = {
            'VENTA DE PRODUCTOS': 785,
            'DESCUENTO POR PLANILLA': 786,
            "PRESTAMO SOLIDARIO/EDUCATIVO": 787
        };
     
        try{

        //Declaracion de variables
        var newRecord = scriptContext.newRecord;

          var envioAsalar=newRecord.getValue({
            fieldId: 'custbody_sdb_se_envio_a_salar'
        });
         log.debug('se envio a salar chekcbox', envioAsalar);
          if(envioAsalar) return;
        var empleadoId = newRecord.getValue({
            fieldId: 'entity'
        });

        var motivoprestamo = newRecord.getValue({
            fieldId: 'custbody_sdb_motivo_prestamo'
        });


        //Busca de valores para motivo prestamo
        var motivos = search.lookupFields({
            type: 'customrecord_sdb_motivo_prestamo',
            id: motivoprestamo,
            columns: ['custrecord_sdb_id_tipo_prestamo', 'name']
        });
        log.debug('motivoprestamo', motivos);

        var empleadoRecord = record.load({
            type: record.Type.EMPLOYEE,
            id: empleadoId,
            isDynamic: false,
        });
        var idSalar = empleadoRecord.getValue({
            fieldId: 'custentity_sdb_id_salar'
        });
        var prestamoMaximo = empleadoRecord.getValue({
            fieldId: 'custentity_sdb_limite_de_prestamo'
        });
        var cantidadDeCuotas = empleadoRecord.getValue({
            fieldId: 'custentity_sdb_cuotas_prestamo'
        });
        var cantidadPorCuota = prestamoMaximo / cantidadDeCuotas;
      //  var fechaSolicitud = changeDateFormat(newRecord.getValue({
     //       fieldId: 'trandate'
      //  }));
      var fechaSolicitud = '2022-03-21';
        log.debug('fechaSolicitud', fechaSolicitud);
          
        var periodoInicioDescuento = changeDateFormat(newRecord.getValue({
            fieldId: 'custbody_sdb_periodo_inicio_descuento'
        }));
        log.debug('periodoInicioDescuento', periodoInicioDescuento);
        var motivo = newRecord.getText({
            fieldId: 'custbody_sdb_motivo_prestamo'
        });

        //Llamada autenticacion (conseguir token)
        var bodyRequest = {
            "IdEmpresa": 123,
            "Cuenta": "usr_api_netsuite",
            "Contrasena": "N3tsu1T2022**"
        };
        var headerRequest = {
            'Content-Type': 'application/json',
            'Accept': '*/*',
            'Host': 'multicentertest.salar11.net',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Content-Length': '96'
        };
        var responseObj = https.post({
            body: JSON.stringify(bodyRequest),
            url: 'https://multicentertest.salar11.net/api/Autenticacion/Autenticar',
            headers: headerRequest
        });
        log.debug('Authentication response', responseObj.body);
        var responseJson = JSON.parse(responseObj.body);

        var token = responseJson.Token;
        log.debug('token', token);
        if (!token) return;
        //Llamada prestamo salar
        var headerRequestPrestamo = {
            "Content-Type": "application/json",
            // "Authorization": token,
            "Authorization": "Bearer " + token,
            'Host': 'multicentertest.salar11.net',
            "Accept": "*/*",
            "Accept-Encoding": "gzip,deflate",
        };
        var bodyRequestPrestamo = [
            {
                "FechaSolicitud": fechaSolicitud,
                "CodigoColaborador": idSalar,
                "Motivo": motivos.name,
                "IdTipoPrestamo": motivos.custrecord_sdb_id_tipo_prestamo,
                "MontoPrestado": prestamoMaximo,
                "MontoDevolver": prestamoMaximo,
                "MontoCuota": cantidadPorCuota,
                "PeriodoInicioDescuento": periodoInicioDescuento,
                "CodigoERP": fechaSolicitud,
                "CantidadMaximaCuota": cantidadDeCuotas
            }
        ];
        log.debug('headerRequestPrestamo', headerRequestPrestamo);
        log.debug('bodyRequestPrestamo', bodyRequestPrestamo);
        var responsePrestamoObj = https.post({
            body: JSON.stringify(bodyRequestPrestamo),
            url: 'https://multicentertest.salar11.net/api/Prestamos/RegistrarPrestamosxLote',
            headers: headerRequestPrestamo
        });
        log.debug('Grabar Prestamo', responsePrestamoObj.body);

        if (responsePrestamoObj.body && JSON.parse(responsePrestamoObj.body).Exito) {
            newRecord.setValue({
                fieldId: 'custbody_sdb_se_envio_a_salar',
                value: true,
                ignoreFieldChange: true
            })
        } else {
            // log.debug('scriptContext', scriptContext);
            // log.debug('scriptContext.form', scriptContext.form);
            // scriptContext.form.addPageInitMessage({ type: message.Type.INFORMATION, message: 'No se pudo enviar informacion a Salar', duration: 7000 });
        }
    }catch(e){
        log.error('error al mandar a Salar', e);
    }
    }

    function changeDateFormat(stringYourDate) {

        try {
            log.debug('changeDateFormat stringYourDate', stringYourDate);
            var yourDate = new Date(stringYourDate);
            log.debug('changeDateFormat yourDate', yourDate);
            var newFormatDAte = yourDate.toISOString().split('T')[0];
        } catch (e) {
            log.error('changeDateFormat --' + stringYourDate, e);
        }
        return newFormatDAte
    }
    return {
        onAction: ngAction
    }
});