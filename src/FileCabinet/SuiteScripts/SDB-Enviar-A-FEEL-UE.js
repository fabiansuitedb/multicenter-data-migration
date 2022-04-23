/**
 * @NApiVersion 2.1
 * @Version 1.0
 * @NScriptType UserEventScript
  Date                Author                                                 Remarks
26 November     2021 Diego Lemos <diego@suitedb.com>             Makes a http call to FEEL with the invoice/credit memo info
*/

define([
  "N/log",
  "N/http",
  "N/record",
  "N/runtime",
  "N/error",
  "N/search",
  "./listadoSIN.js"
], function (log, http, record, runtime, error, search, listadoSIN) {
  function afterSubmit(context) {
      /* variable declarations */
      const thisRecord = context.newRecord;

      let receptorRecord = record.load({ //Setear el customer
        type: record.Type.CUSTOMER,
        id: thisRecord.getValue("entity")
      });

      let emisorRecord = record.load({ //Setear el emisor
        type: "customrecord_sdb_emisor_documento",
        id: thisRecord.getValue("custbody_sdb_emisor_documento")
      });

      if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
        // Se prepara la llamada http
        let urlRequest = runtime.getCurrentScript().getParameter({ name: "custscript_sdb_url_enviar_feel" });;
        let headerRequest = {
          "Content-Type": "application/json",
          "Accept": "*/*",
          "Accept-Encoding": "gzip,deflate,br",
          "Connection": "Keep-Alive",
        }
        let bodyRequest = getBodyRequest(thisRecord, receptorRecord, emisorRecord);
        log.debug('bodyRequest', bodyRequest);

        //HTTP call
        let objResponseTxt = http.post({
          body: bodyRequest,
          url: urlRequest,
          headers: headerRequest
        });
        log.debug("response", objResponseTxt);
        let objResponse = JSON.parse(objResponseTxt.body);
        log.debug("response", objResponse);


        //Si la respuesta es buena, se le suma uno al ultimo numero utilizado
        if (objResponse.respuesta.txtRespuesta == 'Exito') {
          record.submitFields({
            type: record.Type.INVOICE,
            id: thisRecord.id,
            values: {
              custbody_sdb_cuf: objResponse.facturaCompraVentaBon.cabecera.cuf,
              custbody_sdb_cufd: objResponse.proceso.cufd,
              custbody_sdb_id_documento_erp: getPrefix(thisRecord.type)+thisRecord.id
            },
            options: {
              enableSourcing: false,
              ignoreMandatoryFields: true
            }
          });
          record.submitFields({
            type: 'customrecord_sdb_emisor_documento',
            id: emisorRecord.id,
            values: {
              custrecord_sdb_ultimo_numero_factura: +emisorRecord.getValue({fieldId: "custrecord_sdb_ultimo_numero_factura"}) + 1
            },
            options: {
              enableSourcing: false,
              ignoreMandatoryFields: true
            }
          });
        }
        else {
          throw error.create({
            "name": "ERROR_ENVIANDO_FACTURA",
            "message": objResponse.respuesta.txtRespuesta,
            "notifyOff": true
          });
        };
      }
    
  };



  /* Auxiliar Functions */

  function getBodyRequest(thisRecord, receptorRecord, emisorRecord) {
    try {
      /* //Get values del recor tipoCFE
      let codigoTipoFactura = tipoCFERecord.getValue({ fieldId: "id que guarda el codigo del tipo de factura" }); */

      //Get values del emisor
      let codigoSistemaOrigen = emisorRecord.getValue({ fieldId: "custrecord_sdb_emisor_sistema_origen" });
      let nitEmisor = +emisorRecord.getValue({ fieldId: "custrecord_sdb_emisor_nit" });
      let razonSocialEmisor = emisorRecord.getValue({ fieldId: "custrecord_sdb_emisor_razon_social" });
      let municipio = emisorRecord.getValue({ fieldId: "custrecord_sdb_emisor_municipio" });
      let direccion = emisorRecord.getValue({ fieldId: "custrecord_sdb_emisor_dir" });
      let codigoPuntoVenta = emisorRecord.getValue({ fieldId: "custrecord_sdb_emisor_codigo_punto_venta" });
      let codigoSucursal = emisorRecord.getValue({ fieldId: "custrecord_sdb_emisor_codigo_sucursal" });
      let numeroFactura = +emisorRecord.getValue({ fieldId: "custrecord_sdb_ultimo_numero_factura" }) + 1;

      //Get values del receptor (cliente)
      let emailCliente = receptorRecord.getValue({ fieldId: "email" });
      if (!emailCliente) { emailCliente = runtime.getCurrentScript().getParameter({ name: "custscript_sdb_default_email" }); }
      let nombreRazonSocial = receptorRecord.getValue({ fieldId: "firstname" }) + ' ' + receptorRecord.getValue({ fieldId: "lastname" });
      let codigoCliente = receptorRecord.getValue({ fieldId: "id" });
      let telefonoCliente = receptorRecord.getValue({ fieldId: "phone" });
      let tipoDeDocumento = listadoSIN.mapper.codigoTipoDocumentoIdentidad[receptorRecord.getValue({ fieldId: "custentity_sdb_tipo_documento" })];
      let numeroDeDocumento = receptorRecord.getValue({ fieldId: "custentity_sdb_numero_documento" });

      //Get values del record transanccion
      let idDocFiscalERP = getPrefix(thisRecord.type) + thisRecord.id;
      let contingencia = thisRecord.getValue({ fieldId: "custbody_sdb_contingencia" });
      let esLote = thisRecord.getValue({ fieldId: "custbody_sdb_es_lote" });
      let idLoteERP = thisRecord.getValue({ fieldId: "custbody_sdb_lote_id" });
      let ultFacturaLote = thisRecord.getValue({ fieldId: "custbody_sdb_lote_ultima_factura" });
      let montoTotal = thisRecord.getValue({ fieldId: "subtotal" });
      let eventoId = thisRecord.getValue({ fieldId: "Código que corresponde a la contingencia registrada manualmente en FEEL y que se debe asociar a cada registro de factura por contingencia en el ERP" });
      let fueraLinea = false;
      let codigoMoneda = listadoSIN.mapper.codigoMoneda[thisRecord.getValue({ fieldId: "currency" })];
      let tipoCambio = thisRecord.getValue({ fieldId: "exchangerate" });
      let montoTotalMoneda = montoTotal * tipoCambio;
      let montoGiftCard = thisRecord.getValue({ fieldId: "giftcertapplied" });
      let montoTotalSujetoIva = thisRecord.getValue({ fieldId: "subtotal" });


      //Setear el body (excepto el detalle)
      let requestBody = {
        "facturaCompraVentaBon": {
          "detalle": [],
          "cabecera": {
            "codigoMoneda": codigoMoneda,
            "numeroTarjeta": 1000000000939505,
            "montoGiftCard": montoGiftCard,
            "cafc": null,
            "montoTotal": montoTotal,
            "montoTotalMoneda": montoTotalMoneda,
            "descuentoAdicional": 0,
            "montoTotalSujetoIva": montoTotalSujetoIva,
            "tipoCambio": tipoCambio,
            "codigoMetodoPago": 2,
            "numeroFactura": numeroFactura,
            "direccion": direccion,
            "fechaEmision": null,
            "codigoTipoDocumentoIdentidad": tipoDeDocumento,
            "cuf": null,
            "numeroDocumento": numeroDeDocumento,
            "complemento": null,
            "codigoSucursal": codigoSucursal,
            "codigoPuntoVenta": codigoPuntoVenta,
            "nombreRazonSocial": nombreRazonSocial,
            "codigoCliente": codigoCliente,
            "codigoExcepcion": null,
            "codigoDocumentoSector": 35,
            "nitEmisor": nitEmisor,
            "razonSocialEmisor": razonSocialEmisor,
            "municipio": municipio,
            "telefono": telefonoCliente,
            "leyenda": "Ley N? 453: Est? prohibido importar, distribuir o comercializar productos expirados o prontos a expirar.",
            "usuario": "admin",
          }
        },
        "idDocFiscalERP": idDocFiscalERP,
        "codigoTipoFactura": 1,
        "emailCliente": emailCliente,
        "contingencia": contingencia,
        "esLote": esLote,
        "idLoteERP": idLoteERP,
        "ultFacturaLote": ultFacturaLote,
        "codigoSistemaOrigen": codigoSistemaOrigen,
        "fueraLinea": fueraLinea,
        "eventoId": eventoId
      };

      //Setear el detalle de la request
      let detalleLinea = {};
      let lineCount = thisRecord.getLineCount({
        sublistId: 'item'
      });
      //iterar sobre la cantidad de lineas de la transaccion
      for (let i = 0; i < lineCount; i++) {
        //Si es un item de descuento, solo se setea el field descuento del objeto a pushear
        if (thisRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i }) == 'Discount') {
          let descuento = thisRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i });
          detalleLinea.montoDescuento = descuento;
          let subTotalSinDescuento = detalleLinea.subTotal;
          detalleLinea.subTotal = subTotalSinDescuento - descuento;
        }
        //Si es un item normal, primero se vacía el objeto y luego se setea con los valores de la linea
        else {
          detalleLinea = {};
          let cantidad = thisRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
          let precioUnitario = thisRecord.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i });                                 
          let codigoProducto = thisRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
          let descripcion = thisRecord.getSublistValue({ sublistId: 'item', fieldId: 'item_display', line: i });
          let subTotal = thisRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i });
          let unidadMedida = listadoSIN.mapper.unidadMedida[thisRecord.getSublistValue({ sublistId: 'item', fieldId: 'units', line: i })];        
          let searchItemObj = search.lookupFields({
            type: search.Type.ITEM,
            id: thisRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i }),
            columns: ['custitem_sdb_actividad_economica', 'custitem_sdb_codigo_sin']
          });
          let codigoProductoSin = searchItemObj.custitem_sdb_codigo_sin;
          let searchActEconomica = search.lookupFields({
            type: 'customrecord_sdb_actividad_economica',
            id: searchItemObj.custitem_sdb_actividad_economica[0].value,
            columns: ['custrecord_sdb_codigo']
          });
          let actividadEconomica = searchActEconomica.custrecord_sdb_codigo;

          detalleLinea = {
            "numeroSerie": null,
            "cantidad": cantidad,
            "precioUnitario": precioUnitario,
            "numeroImei": 0.0,
            "actividadEconomica": actividadEconomica,
            "codigoProductoSin": codigoProductoSin,
            "codigoProducto": codigoProducto,
            "descripcion": descripcion,
            "subTotal": subTotal,
            "montoDescuento": 0.0,
            "unidadMedida": unidadMedida,
          }
        }
        if (i == lineCount - 1 || !(thisRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i + 1 }) == 'Discount')) {
          requestBody.facturaCompraVentaBon.detalle.push(detalleLinea);
        }
      }
      return JSON.stringify(requestBody);
    } catch (error) {
      log.debug('error in getRequestBody', error);
    }
  }

  function getPrefix(type) {
    let prefijo = '';
    switch (type) {
      case record.Type.INVOICE:
        prefijo = 'INV-'
        break;
      case record.Type.CASH_SALE:
        prefijo = 'CSH-'
        break;
      case record.Type.CREDIT_MEMO:
        prefijo = 'NCR-'
        break;

      default:
        break;
    }
    return prefijo;
  }
  return {
    afterSubmit: afterSubmit
  }
});
