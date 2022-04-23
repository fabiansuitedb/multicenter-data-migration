/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
 define(['N/search'], function (search) {
    function onRequest(context) {

        const object = {};
        try {
            const params = context.request.parameters;
          log.debug("info received", context.request)
            const body = JSON.parse(context.request.body);
            // const nitEmisor = params.nitEmisor;
            // const idDocFiscalFEEL = params.idDocFiscalFEEL;
            // const fechaRecepcion = params.fechaRecepcion;
            log.debug("params", params)
            log.debug("body", context.request.body)
            const transactionType = getTransactionType(params.tipoDocumento);
            if(transactionType){
                search.create({
                    type: search.type.TRANSACTION,
                    filters: [
                        ["type", "anyof", transactionType], "AND",
                        ["custbody_sdb_cuf", "contains", body.cuf], "AND",
                        ["internalid", "is", body.idDocFiscalERP]
                    ],
                    columns: [],
                }).run().each(function(result){
                        log.debug('transaction found in ERP', result);
                        return true;
                })
            }
            // const tipoFactura = params.tipoFactura;
            // const operacion = params.operacion;
            // /**
            //  * Confirmación según operación:
            //     0 = Presentación de factura
            //     1 = Anulación de factura
            //  */
            // const modalidad = params.modalidad;
            // /**
            //  * Modalidad de presentación:
            //     1 = Electrónica
            //     2 = Computarizada
            //  */
            // const forma = params.forma;
            // /**
            //  * Forma de presentación:
            //     0 = individual
            //     1 = paquete/lote
            //  */
            // const codigo = params.codigo;
            // const codigoRecepcion = params.codigoRecepcion;
            // const descripcion = params.descripcion;
            // const listaMensajes = params.listaMensajes;
            // const listaMensajes.codigo = params.listaMensajes.codigo;
            // const listaMensajes.descripcion = params.listaMensajes.descripcion;
            
            object.respuesta = {codRespuesta: "0", txtRepuesta: "todo ok", estadoERP: "gracias Heber"}
        } catch (e) {
            log.error("ERROR: ", e.message)
            object.respuesta = {codRespuesta: "0", txtRepuesta: "error", estadoERP: "bad bad"}
        }
        context.response.write(JSON.stringify(object));
    }

    //auxiliar functions
    function getTransactionType(docCode){
            /**
             * tipoDocumento puede ser:
             *  1 = factura
                2 = nota de credito/debito
                3 = nota fiscal
                4 = boleta contingencia
                5 = documento equivalente
             */
            let tranType = ""
            switch(docCode){
                case 1:
                    tranType =  "invoice, cashsale";
                    break;
                case 2:
                    tranType = "creditmemo";
                    break;
                case 4:
                    tranType = "invoice, cashsale";
                    break;
                default:
                    tranType = "";
                    break;
            }
            return tranType;
    }
    return {
        onRequest: onRequest,
    };
});
