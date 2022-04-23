/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 * @description Assign due date conditioned by special terms.
 */
 define(["N/log", "N/runtime", "N/search", "N/format", "N/record"], (log, runtime,search, format, record) => {
    function onAction(context) {
        let scriptObj = runtime.getCurrentScript();
        try {
            if(context.newRecord.type === "invoice"){
                let terms = context.newRecord.getValue('terms');
                let orgillTerms = scriptObj.getParameter({name: "custscript_sdb_orgill_terms"});
                if(terms == orgillTerms) setOrgillTerms(context.newRecord);
            } else {
                let vendorBillRcd = context.newRecord;
                let vendorBillId = scriptObj.getParameter({name: "custscript_sdb_bill_id"});
                //let vendorBillId = scriptObj.getParameter({name: "custscript_sdb_vendor_terms"});
                let vendorTermsMapper = {
                    14: "100% BL",
                    15: "100% CRT",
                    12: "100% Confirmación",
                    13: "100% Producción",
                    28: "120 Días BL",
                    48: "20% Confirmacion 80% 60 Dias BL",
                    43: "30 Días BL",
                    42: "30 Días CRT",
                    25: "30% Confirm 70% 10 Días BL",
                    24: "30% Confirm 70% 30 Días BL",
                    23: "30% Confirm 70% 60 Días BL",
                    22: "30% Confirm 70% 60 Días Factura",
                    26: "30% Confirmación 70% BL",
                    38: "45 Días BL",
                    39: "45 Días CRT",
                    20: "50% Confirm 50% 30 Días BL",
                    19: "50% Confirm 50% 60 Días CRT",
                    18: "50% Confirm 50% 60 Días Factura",
                    21: "50% Confirmación 50% BL",
                    35: "60 Días BL",
                    36: "60 Días CRT",
                    33: "70 Días BL",
                    31: "90 Días BL",
                    29: "90 Días CRT"
                };
                if(vendorBillId){
                    vendorBillRcd = record.load({
                        type: "vendorbill",
                        id: vendorBillId
                    });
                }
                assignDateMethod(vendorTermsMapper, vendorBillRcd);
            } 
        } catch(e) {
            log.error('WF action failed' ,  e.message || 'Unexpected error!');
        }
    }

    //auxiliar functions
    function setOrgillTerms(currentRecord){
        let tranDate = new Date(currentRecord.getValue('trandate'));
        if(tranDate.getDate()<=25){
            log.debug('previous date', tranDate);
            tranDate.setMonth(tranDate.getMonth() + 3)
            tranDate.setDate(15)
            let dueDate = new Date(tranDate);
            log.debug('new date', dueDate);
            currentRecord.setValue('duedate', dueDate);
        } else {
            log.debug('previous date', tranDate);
            tranDate.setMonth(tranDate.getMonth() + 4)
            tranDate.setDate(15)
            let dueDate = new Date(tranDate);
            log.debug('new date', dueDate);
            currentRecord.setValue('duedate', dueDate);
        }
    }
    function assignDateMethod(vendorTermsMapper, vendorBillRcd){
        let partialPaymentOptions = {};
        if (vendorTermsMapper.hasOwnProperty(vendorBillRcd.getValue("terms"))){
            switch(vendorTermsMapper[vendorBillRcd.getValue("terms")]){
                case "100% BL":
                    setDocDate(vendorBillRcd, "BL", 0);
                    break;
                case "100% CRT":
                    setDocDate(vendorBillRcd, "CRT", 0);
                    break;
                case "100% Confirmación":
                    setDocDate(vendorBillRcd, "CONFIRMACION", 0);
                    break;
                case "100% Producción":
                    setDocDate(vendorBillRcd, "PRODUCCION", 0);
                    break;
                case "120 Días BL":
                    setDocDate(vendorBillRcd, "BL", 120);
                    break;
                case "20% Confirmacion 80% 60 Dias BL":
                    partialPaymentOptions = {
                        first: {
                            percentage: 20, 
                            docType: "CONFIRMACION",
                        },
                        second: {
                            percentage: 80,
                            docType: "BL",
                            delay: 60
                        }
                    }
                    setPartialDocDate(vendorBillRcd, partialPaymentOptions);
                    break;
                case "30 Días BL":
                    setDocDate(vendorBillRcd, "BL", 30);
                    break;
                case "30 Días CRT":
                    setDocDate(vendorBillRcd, "CRT", 30);
                    break;
                case "30% Confirm 70% 10 Días BL":
                    partialPaymentOptions = {
                        first: {
                            percentage: 30, 
                            docType: "CONFIRMACION",
                        },
                        second: {
                            percentage: 70,
                            docType: "BL",
                            delay: 10
                        }
                    }
                    setPartialDocDate(vendorBillRcd, partialPaymentOptions);
                    break;
                case "30% Confirm 70% 30 Días BL":
                    partialPaymentOptions = {
                        first: {
                            percentage: 30, 
                            docType: "CONFIRMACION",
                        },
                        second: {
                            percentage: 70,
                            docType: "BL",
                            delay: 30
                        }
                    }
                    setPartialDocDate(vendorBillRcd, partialPaymentOptions);
                    break;
                case "30% Confirm 70% 60 Días BL":
                    partialPaymentOptions = {
                        first: {
                            percentage: 30, 
                            docType: "CONFIRMACION",
                        },
                        second: {
                            percentage: 70,
                            docType: "BL",
                            delay: 60
                        }
                    }
                    setPartialDocDate(vendorBillRcd, partialPaymentOptions);
                    break;
                case "30% Confirm 70% 60 Días Factura":
                    partialPaymentOptions = {
                        first: {
                            percentage: 30, 
                            docType: "CONFIRMACION",
                        },
                        second: {
                            percentage: 70,
                            docType: "FACTURA",
                            delay: 60
                        }
                    }
                    setPartialDocDate(vendorBillRcd, partialPaymentOptions);
                    break;
                case "30% Confirmación 70% BL":
                    partialPaymentOptions = {
                        first: {
                            percentage: 30, 
                            docType: "CONFIRMACION",
                        },
                        second: {
                            percentage: 70,
                            docType: "BL",
                            delay: 0
                        }
                    }
                    setPartialDocDate(vendorBillRcd, partialPaymentOptions);
                    break;
                case "45 Días BL":
                    setDocDate(vendorBillRcd, "BL", 45);
                    break;
                case "45 Días CRT":
                    setDocDate(vendorBillRcd, "CRT", 45);
                    break;
                case "50% Confirm 50% 30 Días BL":
                    partialPaymentOptions = {
                        first: {
                            percentage: 50, 
                            docType: "CONFIRMACION",
                        },
                        second: {
                            percentage: 50,
                            docType: "BL",
                            delay: 30
                        }
                    }
                    setPartialDocDate(vendorBillRcd, partialPaymentOptions);
                    break;
                case "50% Confirm 50% 60 Días CRT":
                    partialPaymentOptions = {
                        first: {
                            percentage: 50, 
                            docType: "CONFIRMACION",
                        },
                        second: {
                            percentage: 50,
                            docType: "CRT",
                            delay: 60
                        }
                    }
                    setPartialDocDate(vendorBillRcd, partialPaymentOptions);
                    break;
                case "50% Confirm 50% 60 Días Factura":
                    partialPaymentOptions = {
                        first: {
                            percentage: 50, 
                            docType: "CONFIRMACION",
                        },
                        second: {
                            percentage: 50,
                            docType: "FACTURA",
                            delay: 60
                        }
                    }
                    setPartialDocDate(vendorBillRcd, partialPaymentOptions);
                    break;
                case "50% Confirmación 50% BL":
                    partialPaymentOptions = {
                        first: {
                            percentage: 50, 
                            docType: "CONFIRMACION",
                        },
                        second: {
                            percentage: 50,
                            docType: "BL",
                            delay: 0
                        }
                    }
                    setPartialDocDate(vendorBillRcd, partialPaymentOptions);
                    break;
                case "60 Días BL":
                    setDocDate(vendorBillRcd, "BL", 60);
                    break;
                case "60 Días CRT":
                    setDocDate(vendorBillRcd, "CRT", 60);
                    break;
                case "70 Días BL":
                    setDocDate(vendorBillRcd, "BL", 70);
                    break;
                case "90 Días BL":
                    setDocDate(vendorBillRcd, "BL", 90);
                    break;
                case "90 Días CRT":
                    setDocDate(vendorBillRcd, "CRT", 90);
                    break;
            }
        }
    }
    function setDocDate(currentRecord, docType, delay){
        let docDate;
        if(docType === "FACTURA"){
            docDate = new Date(currentRecord.getValue('trandate'));
        } else{
            docDate = getCustomDocDate(docType, currentRecord.id);
        }
        if(docDate){
            if(delay){
                docDate.setDate(docDate.getDate() + delay);
                log.debug('new date', docDate);
                docDate = new Date(docDate);
            }
            currentRecord.setValue("duedate", docDate);
        } else {
            currentRecord.setValue("duedate", "");
        }
    }
    function setPartialDocDate(currentRecord, partialPaymentOptions){
        if(currentRecord.getLineCount("links")){
            log.debug("payment found", currentRecord.getLineCount("links"))
            let amountPaid = 0;
            for(let i=0; i<(currentRecord.getLineCount("links")-1); i++){
                let paymentId = currentRecord.getSublistValue({
                    sublistId: "links",
                    fieldId: "id",
                    line: i
                });
                amountPaid+= Math.abs(Number(search.lookupFields({
                    type: "vendorpayment",
                    id: paymentId,
                    columns: ["amount"]
                })["amount"]));
            }
            log.debug('amount paid', amountPaid)
            let amountPaidPercentage = amountPaid / Number(currentRecord.getValue('total')) * 100;
            if(amountPaidPercentage < partialPaymentOptions.first.percentage){
                log.debug('in first condition', amountPaidPercentage)
                setDocDate(currentRecord, partialPaymentOptions.first.docType, 0)
            } else {
                log.debug('in sec condition', amountPaidPercentage)
                setDocDate(currentRecord, partialPaymentOptions.second.docType, partialPaymentOptions.second.delay)
            }
        } else {
            log.debug('no payments')
            setDocDate(currentRecord, partialPaymentOptions.first.docType, 0)
        }
        
    }
    function getCustomDocDate(docType, currentRecordId){
        let docDate;
        let docTypes = {
            "CONFIRMACION": 2,
            "PRODUCCION": 3,
            "BL": 4,
            "CRT": 5
        }
        try{
            search.create({
                type: "customrecord_sdb_doc_compra",
                filters: [
                    ["custrecord_sdb_tipo_doc_compra", "anyof", docTypes[docType]],
                    "AND",
                    ["custrecord_sdb_factura_compra", "anyof", currentRecordId]
                ],
                columns: ["custrecord_sdb_fecha_recepcion"]
            }).run().each(function(result){
                log.debug("result date", result)
                docDate = result.getValue("custrecord_sdb_fecha_recepcion");
                docDate = format.parse({
                    value: result.getValue("custrecord_sdb_fecha_recepcion"),
                    type: format.Type.DATE
                })
                return true;
            });
            return docDate;
        } catch(e){
            log.error("error creating document search", e);
            return "";
        }
    }

    return {
        onAction: onAction
    }
});