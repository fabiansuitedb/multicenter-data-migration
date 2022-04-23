/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(["N/log", "N/url", "N/https", "N/ui/dialog", "N/ui/message"],

    function (log, url, https, dialog, message) {

        function pageInit(context) {
            return;
        }

        function generarPDF(recordId, recordType) {
            var suiteletURL = url.resolveScript({
                scriptId: 'customscript_sdb_get_feel_pdf',
                deploymentId: 'customdeploy1',
                params: {
                    recordType: recordType,
                    recordId: recordId
                }
            });
            https.get.promise({
                url: suiteletURL,
            }).then(function(response){
                console.log(response)
                var res = JSON.parse(response.body);
                if(res.status === "success"){
                    var myMsg = message.create({
                        title: "Generación de PDF",
                        message: res.message,
                        type: message.Type.CONFIRMATION
                    })
                    myMsg.show();
                } else{
                    var myMsg = message.create({
                        title: "Generación de PDF",
                        message: res.message,
                        type: message.Type.WARNING
                    })
                    myMsg.show();
                }
            }).catch(function(reason){
                var myMsg = message.create({
                    title: "Generación de PDF",
                    message: reason,
                    type: message.Type.WARNING
                })
                myMsg.show();
            });
        }

        function anularCFE(recordId, recordType, anulado) {
            if(anulado){
                var myMsg = message.create({
                    title: "Anulación de comprobante",
                    message: "Este comprobante ya se encuentra anulado.",
                    type: message.Type.WARNING
                })
                myMsg.show({duration: 4000});
            } else{

                var options = {
                    title: 'Anular comprobante',
                    message: 'Seleccione un motivo de anulación',
                    buttons: [
                        { label: 'Factura mal emitida', value: {recordId: recordId, recordType: recordType, reason: 1} },
                        { label: 'Nota de crédito-débito mal emitida', value: {recordId: recordId, recordType: recordType, reason: 2 }},
                        { label: 'Datos de emisión incorrectos', value: {recordId: recordId, recordType: recordType, reason: 3 } },
                        { label: 'Factura o nota de crédito-débito devuelta', value: {recordId: recordId, recordType: recordType, reason: 4} },
                        { label: 'Cancelar', value: "cancel" },
                    ]
                };
                
                dialog.create(options).then(function(result){
                    console.log('result', result)
                    if(result !== "cancel"){
                        var suiteletURL = url.resolveScript({
                            scriptId: 'customscript_sdb_anular_comprobante_su',
                            deploymentId: 'customdeploy1',
                            params: result
                        });
                        https.get.promise({
                            url: suiteletURL,
                        }).then(function(response){
                            console.log(response)
                            var res = JSON.parse(response.body);
                            if(res.status === "success"){
                                var myMsg = message.create({
                                    title: "Anulación de comprobante",
                                    message: res.message,
                                    type: message.Type.CONFIRMATION
                                })
                                myMsg.show();
                            } else{
                                var myMsg = message.create({
                                    title: "Anulación de comprobante",
                                    message: res.message,
                                    type: message.Type.WARNING
                                })
                                myMsg.show();
                            }
                            setTimeout(function(){window.location.reload()}, 7000);
                        }).catch(function(reason){
                            var myMsg = message.create({
                                title: "Anulación de comprobante",
                                message: reason,
                                type: message.Type.WARNING
                            })
                            myMsg.show();
                        });
                    }
                }).catch(function(reason){
                    console.log('reason', reason)
                });
            }
        }

        function confirmarCFE(recordId, recordType) {
            var suiteletURL = url.resolveScript({
                scriptId: 'customscript_sdb_confirmar_cfe_sl',
                deploymentId: 'customdeploy_sdb_confirmar_cfe_sl',
                params: {
                    recordType: recordType,
                    recordId: recordId
                }
            });
            https.get({
                url: suiteletURL,
            });
            window.location.reload();
        }

        return {
            pageInit: pageInit,
            generarPDF: generarPDF,
            anularCFE: anularCFE,
            confirmarCFE: confirmarCFE
        };
    });