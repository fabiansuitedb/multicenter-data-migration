/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/log'],

    function (log) {

        function beforeLoad(context) {
            var recordId = context.newRecord.id;
            var recordType = context.newRecord.type;
            var docAnulado = context.newRecord.getValue('custbody_sdb_documento_anulado');
            log.debug('context!', context)
            context.form.clientScriptModulePath = "SuiteScripts/SDB-Button-Scripts-CS.js";
            context.form.addButton({
                id: "custpage_generarpdf",
                label: "Generar PDF",
                functionName: "generarPDF("+recordId+","+JSON.stringify(recordType)+")"
            });
            context.form.addButton({
                id: "custpage_anularcfe",
                label: "Anular documento fiscal",
                functionName: "anularCFE("+recordId+","+JSON.stringify(recordType)+","+docAnulado+")"
            });
            // context.form.addButton({
            //     id: "custpage_confirmarcfe",
            //     label: "Confirmar envío",
            //     functionName: "confirmarCFE("+recordId+","+JSON.stringify(recordType)+")"
            // });
            return;
        }

        return {
            beforeLoad: beforeLoad
        }



    })