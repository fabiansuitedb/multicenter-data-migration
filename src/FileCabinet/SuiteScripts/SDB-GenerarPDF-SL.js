/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define(['N/file', 'N/http', 'N/log', 'N/record', 'N/search', 'N/runtime'],
    function (file, http, log, record, search, runtime) {
        function onRequest(context) {
            try{
                var parameters = context.request.parameters;
                var recordId = parameters.recordId;
                var recordType = parameters.recordType;

                var thisRecord = record.load({
                    type: recordType,
                    id: recordId,
                });
                var taxid = search.lookupFields({
                    type: "customrecord_sdb_emisor_documento",
                    id: thisRecord.getValue("custbody_sdb_emisor_documento"),
                    columns: ['custrecord_sdb_emisor_nit']
                })['custrecord_sdb_emisor_nit'];
                var clientTaxId = search.lookupFields({
                    type: record.Type.CUSTOMER,
                    id: thisRecord.getValue("entity"),
                    columns: ['custentity_sdb_numero_documento']
                })['custentity_sdb_numero_documento'];
                var objResponse = {};

                var PDFFolder = runtime.getCurrentScript().getParameter({name: "custscript_sdb_find_pdf_folder"});
                var urlRequest = runtime.getCurrentScript().getParameter({name: "custscript_sdb_find_pdf_endpoint"});
                var headerRequest = {
                    "Content-Type": "application/json",
                    "Accept": "*/*",
                    "Accept-Encoding": "gzip,deflate",
                }
                var reqBody ={
                    "nitCliente": clientTaxId,
                    "nitEmisor": taxid,
                    "cuf": thisRecord.getValue("custbody_sdb_cuf")
                 }
                 //*only for testing
                 reqBody = {
   "nitCliente": "5885059",
   "nitEmisor":"376709022",
   "cuf": "19C685AD839EA329635A3A4ECB8363006A127825E8329DD4BB2D56D74"
}

                //HTTP call
                objResponse = http.post({
                    body: JSON.stringify(reqBody),
                    url: urlRequest,
                    headers: headerRequest
                });

                if(objResponse.body){
                    var responseObj = JSON.parse(objResponse.body)
                    if(responseObj.respuesta.codRespuesta == 0){
                        createAndAttachFile(responseObj.docFiscal.archivo, PDFFolder, thisRecord);

                        log.debug('success');
                        context.response.write(JSON.stringify({
                            status: "success",
                            message: "Obtención exitosa del archivo PDF."
                        }));
                    } else{
                        log.debug('error');
                        context.response.write(JSON.stringify({
                            status: "error",
                            message: "Error en la obtención del archivo PDF: " + responseObj.respuesta.txtRespuesta
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
                    message: "Error en el proceso. Inténtelo de nuevo más tarde"
                }))
            }
        }
        //auxiliar functions
        function createAndAttachFile(pdfContents, folder, currentRecord){
            try{
                var fileObj = {
                    name: "representación gráfica del documento: " + currentRecord.getValue("tranid") + " - " + currentRecord.getText("subsidiary"),
                    fileType: file.Type.PDF,
                    contents: pdfContents,
                    folder: folder
                }
                var docPDF = file.create(fileObj);
                var docPDFId = docPDF.save();
                record.attach({
                    record: {
                        type: 'file',
                        id: docPDFId
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