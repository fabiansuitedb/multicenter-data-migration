/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define(['N/file', 'N/http', 'N/log', 'N/record', 'N/search', 'N/error', 'N/runtime'],
    function (file, http, log, record, search, error, runtime) {
        function onRequest(context) {
            try{
                var request = context.request;
                var recordId = request.parameters.recordId;
                var recordType = request.parameters.recordType;
                var annulmentReason = request.parameters.reason;
                var annulmentReqFolder = runtime.getCurrentScript().getParameter({name: "custscript_sdb_anular_req_folder"});
                var annulmentResFolder = runtime.getCurrentScript().getParameter({name: "custscript_sdb_anular_res_folder"});
                var thisRecord = record.load({
                    type: recordType,
                    id: recordId,
                });
                var taxid = search.lookupFields({
                    type: "customrecord_sdb_emisor_documento",
                    id: thisRecord.getValue("custbody_sdb_emisor_documento"),
                    columns: ['custrecord_sdb_emisor_nit']
                })['custrecord_sdb_emisor_nit'];
                
                //HTTPS call
                var urlRequest = runtime.getCurrentScript().getParameter({name: "custscript_sdb_anular_endpoint"});
                urlRequest = "http://177.222.41.86:8080/ws-anular-docfiscal/cnl/docfiscal/anularSync";
                var headerRequest = {
                    "Content-Type": "application/json",
                    "Accept": "*/*",
                    "Accept-Encoding": "gzip,deflate",
                }
                var jsonRequest = getRequestBody(thisRecord, taxid, annulmentReason);
                log.debug('jsonRequest', jsonRequest)
                var objResponse = http.post({
                    body: JSON.stringify(jsonRequest),
                    url: urlRequest,
                    headers: headerRequest
                });
                log.debug('response Anular', objResponse);
                if(objResponse.body){
                    createLogFile("responseLog", objResponse.body, annulmentResFolder, thisRecord)
                    
                    var responseObj = JSON.parse(objResponse.body)
                    log.debug(responseObj)
                    if(responseObj.respuesta.codRespuesta == 0){
                        log.debug('success');
                        thisRecord.setValue("custbody_sdb_notas_facturacion", "Documento electrónico anulado con éxito.")
                        thisRecord.setValue("custbody_sdb_documento_anulado", true)
                        thisRecord.save()
                        context.response.write(JSON.stringify({
                            status: "success",
                            message: "Documento electrónico anulado con éxito."
                        }));
                    } else{
                        log.debug('error');
                        thisRecord.setValue("custbody_sdb_notas_facturacion", "Error en la anulación del documento electrónico. " + responseObj.respuesta.txtRespuesta)
                        thisRecord.save()
                        context.response.write(JSON.stringify({
                            status: "error",
                            message: "Error en la anulación del documento electrónico: " + responseObj.respuesta.txtRespuesta
                        }));
                    }
                } else{
                    context.response.write(JSON.stringify({
                        status: "error",
                        message: "Error en la conexión con el servidor. Inténtelo de nuevo más tarde"
                    }));
                }
            } catch(e){
                log.error("error in req", e);
                context.response.write(JSON.stringify({
                    status: "error",
                    message: "Error en el proceso de anulación. Inténtelo de nuevo más tarde"
                }))
            }
        }

        //Auxiliar Functions
        function getRequestBody(docRecord, nit, annulmentReason){
            var reqBody = {
                nitEmisor: nit,
                codigoMotivo: Number(annulmentReason),
                numeroFactura: docRecord.getValue("custbody_sdb_numero_factura"),
                idDocFiscalERP: docRecord.id,
                cuf: ""
            }
            if(docRecord.getValue("custbody_sdb_cuf")){
                reqBody.cuf = docRecord.getValue("custbody_sdb_cuf");
            } 
            return reqBody;
        }
        function createLogFile(logType, responseBody, folder, currentRecord){
            try{
                var fileObj = {
                    fileType: file.Type.JSON,
                    contents: responseBody,
                    folder: folder
                }
                if(logType === "requestLog"){
                    fileObj.name = "Pedido de anulación para documento: " + currentRecord.getValue("tranid") + " - " + currentRecord.getText("subsidiary") 
                } else{
                    fileObj.name = "Respuesta de anulación para documento: " + currentRecord.getValue("tranid") + " - " + currentRecord.getText("subsidiary")
                }
                var responseLog = file.create(fileObj);
                var responseFileId = responseLog.save();
                record.attach({
                    record: {
                        type: 'file',
                        id: responseFileId
                    },
                    to: {
                        type: currentRecord.type,
                        id: currentRecord.id
                    }
                });
            } catch(e){
                log.error("error in create log file", e)
            }
        }
        return {
            onRequest: onRequest
        };
    });