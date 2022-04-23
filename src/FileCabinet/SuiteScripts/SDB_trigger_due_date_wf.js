/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 * @description Trigger Due Date assignment Wf.
 */
 define(["N/log", "N/runtime", "N/task"], (log, runtime,task) => {
    function onAction(context) {
        try {
            if(context.newRecord.type === "customrecord_sdb_doc_compra"){
                let billId = context.newRecord.getValue("custrecord_sdb_factura_compra");
                log.debug("Vendor Bill id", billId);
                triggerBillWorkflow(billId);
            } else if(context.newRecord.type === "vendorpayment" || context.newRecord.type === "vendorprepaymentapplication"){
                for (let x=0; x<context.newRecord.getLineCount("apply"); x++){
                    if(context.newRecord.getSublistValue({
                        sublistId: "apply",
                        fieldId: "apply",
                        line: x
                    })){
                        let billId = context.newRecord.getSublistValue({
                            sublistId: "apply",
                            fieldId: "internalid",
                            line: x
                        });
                        log.debug("Vendor Bill id", billId)
                        triggerBillWorkflow(billId);
                    }
                }
            }
        } catch(e) {
            log.error('WF action failed' ,  e.message || 'Unexpected error!');
        }
    }

    //auxiliar functions
    function triggerBillWorkflow(vendorBillId){
        let scriptObj = runtime.getCurrentScript();
        let WFID = scriptObj.getParameter({name: "custscript_sdb_wf_id"});
        let workflowTask = task.create({taskType: task.TaskType.WORKFLOW_TRIGGER});
        workflowTask.recordType = 'vendorbill';
        workflowTask.recordId = vendorBillId;
        workflowTask.workflowId = WFID;
        let taskId = workflowTask.submit();
        log.debug('task id', taskId);
    }

    return {
        onAction: onAction
    }
});