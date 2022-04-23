/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define(['N/search'], function (search) {
    function onAction(scriptContext) {
        var newRecord = scriptContext.newRecord;
        let myReturn = 0;
        var customer = newRecord.getValue('entity');

        var invoiceSearchObj = search.create({
            type: "invoice",
            filters:
                [
                    ["type", "anyof", "CustInvc"],
                    "AND",
                    ["customer.internalidnumber", "equalto", customer],
                    "AND",
                    ["mainline", "is", "T"],
                    "AND",
                    ["duedate", "before", "today"],
                    "AND",
                    ["status", "anyof", "CustInvc:A"]
                ],
            columns:
                [
                    search.createColumn({
                        name: "internalid",
                        join: "depositTransaction",
                        label: "Internal ID"
                    }),
                    search.createColumn({ name: "appliedtotransaction", label: "Applied To Transaction" }),
                    search.createColumn({ name: "paidtransaction", label: "Paid Transaction" }),
                    search.createColumn({ name: "statusref", label: "Status" }),
                    search.createColumn({ name: "duedate", label: "Due Date/Receive By" })
                ]
        });
        var searchResultCount = invoiceSearchObj.runPaged().count;
        log.debug("invoiceSearchObj result count", searchResultCount);
        invoiceSearchObj.run().each(function (result) {
            // .run().each has a limit of 4,000 results
            return true;
        });

        if (searchResultCount == 0) {
            myReturn = 1;
        }

        log.debug('myReturn: ', myReturn)
        return myReturn;
    }
    return {
        onAction: onAction
    }
});

